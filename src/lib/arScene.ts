import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { FaceMetrics } from './faceGeometry';
import type { GlassesCutout } from './imageCache';

/**
 * True 3D AR try-on renderer.
 *
 * Replaces the old "draw a flat image onto a 2D canvas" approach with a
 * real WebGL scene:
 *  - A perspective camera matched to MediaPipe's documented default face
 *    effect FOV (63° vertical), so a point in the scene at a given depth
 *    projects to the same screen pixel MediaPipe measured it at.
 *  - `facePivot`: a Group positioned from the detected eye/nose anchor and
 *    rotated from plain landmark-derived roll/yaw/pitch (see
 *    `faceGeometry.ts` and the comment in `updatePose` below for why this
 *    is computed directly rather than from MediaPipe's raw transform matrix).
 *  - `occluder`: an invisible (colorWrite: false, depthWrite: true)
 *    head-shaped proxy mesh, child of `facePivot`. It writes real depth
 *    into the scene but draws no pixels, so anything behind it (e.g. a
 *    glasses temple arm swinging toward the far ear as the head turns)
 *    is naturally hidden by the WebGL depth test — no per-pixel face mesh
 *    segmentation needed.
 *  - `glassesGroup`: either a loaded GLTF frame model (real geometry, so
 *    its arms are properly occluded going around the head) or, as a
 *    fallback when no 3D model is available for a product yet, a flat
 *    textured plane using the alpha-cutout produced by `loadGlassesCutout`
 *    (see `imageCache.ts`) — positioned and depth-tested the same way, so
 *    it still disappears correctly past the point a real pair of glasses
 *    would be hidden by the head, instead of floating in front of the ear.
 */

// MediaPipe's face-effect renderer default (effect_renderer_calculator.proto:
// perspective_camera_fov_degrees). Using the same value here is what makes
// the transformation matrix map correctly onto this camera.
const CAMERA_VERTICAL_FOV_DEGREES = 63;
const CAMERA_NEAR = 1;
const CAMERA_FAR = 5000;

// Arbitrary fixed "distance" (in our own scene units) we place the face
// pivot at. Because both position AND scale are derived from the SAME
// depth via simple perspective math, the on-screen result is depth
// invariant for a pinhole camera — only the *relative* depth between the
// glasses and the occluder matters, and both are children of the same
// pivot, so this constant never needs tuning.
const FACE_DEPTH_UNITS = 60;

// Mirrors the 2D engine's tuned constants (see `virtualTryOnEngine.ts`) so
// the fit/seat looks the same as before, now computed in 3D.
// A product cutout usually includes a little transparent padding around the
// frame. Fit it to the measured outer-eye corners with a modest allowance,
// and keep it seated just above the nose bridge like real frames.
const FIT_MULTIPLIER = 2.15;
const VERTICAL_OFFSET_RATIO = 0.2;
const MAX_HEIGHT_TO_EYE_DISTANCE_RATIO = 1.15;

export interface ArGlassesModelSpec {
  kind: 'model';
  url: string;
}
export interface ArGlassesCutoutSpec {
  kind: 'cutout';
  cutout: GlassesCutout;
}
export type ArGlassesSpec = ArGlassesModelSpec | ArGlassesCutoutSpec | null;

export class ArTryOnScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private facePivot: THREE.Group;
  private occluder: THREE.Mesh;
  private glassesGroup: THREE.Group;
  private ambientLight: THREE.AmbientLight;
  private keyLight: THREE.DirectionalLight;
  private gltfLoader = new GLTFLoader();
  private currentSpecKey: string | null = null;
  private lastLightSampleAt = 0;
  private lightingCanvas: HTMLCanvasElement;
  private lightingCtx: CanvasRenderingContext2D | null;
  private hasPose = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      CAMERA_VERTICAL_FOV_DEGREES,
      1,
      CAMERA_NEAR,
      CAMERA_FAR
    );
    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(0, 0, -1);

    // Lighting: ambient/hemisphere base + one directional "key" light. The
    // key light's intensity is nudged from the live video's average
    // brightness (see `sampleVideoLighting`) so the glasses don't look
    // pasted-on when the room is dim or backlit — a lightweight, honest
    // stand-in for full environment-map lighting estimation.
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(this.ambientLight);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x6b7280, 0.5);
    this.scene.add(hemi);
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    this.keyLight.position.set(-1, 1.4, 1.2);
    this.scene.add(this.keyLight);

    // facePivot carries ONLY position + rotation (scale stays 1) so its
    // children's local coordinates are plain scene units, not compounded
    // by an extra scale factor.
    this.facePivot = new THREE.Group();
    this.facePivot.visible = false;
    this.scene.add(this.facePivot);

    // Invisible head-shaped occlusion proxy. An ellipsoid is a deliberate
    // simplification of a full per-vertex face mesh occluder: it needs no
    // bundled triangulation data, is cheap, and is enough to correctly
    // hide a temple arm once the head has turned far enough to cover it.
    const occluderGeometry = new THREE.SphereGeometry(1, 24, 18);
    const occluderMaterial = new THREE.MeshBasicMaterial({ colorWrite: false });
    this.occluder = new THREE.Mesh(occluderGeometry, occluderMaterial);
    this.occluder.renderOrder = 0;
    this.facePivot.add(this.occluder);

    this.glassesGroup = new THREE.Group();
    this.glassesGroup.renderOrder = 1;
    this.facePivot.add(this.glassesGroup);

    this.lightingCanvas = document.createElement('canvas');
    this.lightingCanvas.width = 16;
    this.lightingCanvas.height = 16;
    this.lightingCtx = this.lightingCanvas.getContext('2d', { willReadFrequently: true });
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.renderer.setSize(width, height, false);
  }

  /** Loads/attaches the given glasses source, replacing whatever was shown before. Safe to call every time the selected product changes. */
  setGlasses(spec: ArGlassesSpec): void {
    const key = !spec ? 'none' : spec.kind === 'model' ? `model:${spec.url}` : `cutout:${spec.cutout.naturalWidth}x${spec.cutout.naturalHeight}:${spec.cutout.isCutout}`;
    if (key === this.currentSpecKey) return;
    this.currentSpecKey = key;

    while (this.glassesGroup.children.length) {
      const child = this.glassesGroup.children.pop()!;
      disposeObject(child);
    }

    if (!spec) return;

    if (spec.kind === 'model') {
      this.gltfLoader.load(
        spec.url,
        (gltf) => {
          // A newer setGlasses() call may have superseded this load.
          if (this.currentSpecKey !== key) return;
          const model = gltf.scene;
          const bounds = new THREE.Box3().setFromObject(model);
          const size = bounds.getSize(new THREE.Vector3());
          // Normalize so the model's own width is 1 local unit — the same
          // convention the plane fallback uses — so `updatePose`'s scale
          // math (driven by the wearer's measured PD) works identically
          // for either source.
          const normalizeScale = 1 / Math.max(size.x, 0.001);
          model.scale.setScalar(normalizeScale);
          model.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;
            object.castShadow = false;
            object.receiveShadow = false;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
              if (
                material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhysicalMaterial
              ) {
                const name = `${material.name} ${object.name}`.toLowerCase();
                material.envMapIntensity = 0.8;
                material.roughness = name.includes('lens') ? 0.16 : 0.32;
                material.metalness = name.includes('lens') ? 0.05 : 0.55;
                if (name.includes('lens')) {
                  material.transparent = true;
                  material.opacity = 0.35;
                  material.depthWrite = false;
                }
              }
            });
          });
          this.glassesGroup.add(model);
        },
        undefined,
        () => {
          // Model failed to load — leave the group empty rather than
          // throwing, so the rest of the scene (occluder, lighting) still
          // renders and a future setGlasses() call can recover.
        }
      );
    } else {
      const cutout = spec.cutout;
      if (!cutout.isCutout) {
        // Background removal didn't run (e.g. the source image couldn't be
        // read back from canvas). Rendering the untouched rectangular photo
        // here is exactly what previously showed up as a flat, out-of-place
        // slab on the face — skip it rather than show a broken result.
        console.warn(
          '[ARGlassesOverlay] glasses cutout has no real transparency (background removal failed) — hiding overlay for this product instead of rendering the full rectangular photo.'
        );
        return;
      }
      const aspect = cutout.naturalHeight / Math.max(1, cutout.naturalWidth);
      const geometry = new THREE.PlaneGeometry(1, aspect);
      const texture = new THREE.CanvasTexture(cutout.source);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        // Cuts fully-transparent pixels out of the depth buffer too, so the
        // plane's invisible corners don't block the occluder's own depth
        // test against later-drawn geometry.
        alphaTest: 0.35,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const plane = new THREE.Mesh(geometry, material);
      plane.userData.planeAspect = aspect;
      this.glassesGroup.add(plane);
    }
  }

  /**
   * Positions everything from the latest detected face metrics. Pass `null`
   * to hide the overlay (no face / tracking lost). `smoothing` is how far
   * (0..1) to move toward the new target this call — 1 snaps instantly
   * (used for a single still photo), a smaller value (used for the live
   * camera) eases frame-to-frame detector jitter.
   */
  updatePose(
    metrics: FaceMetrics | null,
    frameWidth: number,
    frameHeight: number,
    smoothing = 1
  ): void {
    if (!metrics || !frameWidth || !frameHeight) {
      this.facePivot.visible = false;
      this.hasPose = false;
      return;
    }
    this.facePivot.visible = true;
    // Snap instantly the first time a face reappears — smoothing toward a
    // stale pose from before tracking was lost would look like the glasses
    // sliding in from the wrong place.
    const t = this.hasPose ? smoothing : 1;
    this.hasPose = true;

    this.camera.aspect = frameWidth / frameHeight;
    this.camera.updateProjectionMatrix();

    const vFovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const heightAtDepth = 2 * Math.tan(vFovRad / 2) * FACE_DEPTH_UNITS;
    const widthAtDepth = heightAtDepth * this.camera.aspect;
    const unitsPerPixel = widthAtDepth / frameWidth;

    const pixelToWorld = (px: number, py: number): THREE.Vector3 => {
      const ndcX = (px / frameWidth) * 2 - 1;
      const ndcY = 1 - (py / frameHeight) * 2;
      return new THREE.Vector3(
        (ndcX * widthAtDepth) / 2,
        (ndcY * heightAtDepth) / 2,
        -FACE_DEPTH_UNITS
      );
    };

    // Same weighted anchor as the old 2D engine: seated slightly below the
    // eye line, biased toward the nose bridge.
    const anchorPx = {
      x: metrics.noseBridge.x,
      y: metrics.eyeCenter.y * (1 - VERTICAL_OFFSET_RATIO) + metrics.noseBridge.y * VERTICAL_OFFSET_RATIO,
    };
    const anchorWorld = pixelToWorld(anchorPx.x, anchorPx.y);
    this.facePivot.position.lerp(anchorWorld, t);

    // Rotation: built entirely from plain landmark math this file controls
    // end to end — roll from the eye-line angle, yaw from nose-bridge
    // asymmetry, pitch from a small clamped depth (z) signal (see
    // `faceGeometry.ts`). Deliberately NOT using MediaPipe's raw
    // `transformMatrix` here: its exact axis/handedness convention isn't
    // independently verifiable in this project, and a wrong assumption
    // there is what previously rendered the glasses as a skewed,
    // disconnected slab instead of sitting flat on the face. This path has
    // no such risk — every angle is a value we compute and can reason
    // about directly.
    const targetQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        metrics.pitchRatio * 0.5,
      metrics.yawRatio * 0.28,
        THREE.MathUtils.degToRad(-metrics.rollDeg)
      )
    );
    this.facePivot.quaternion.slerp(targetQuat, t);

    // Scale the glasses so the measured eye distance matches the rendered
    // frame width, same fit/cap logic as the old 2D `computeGlassesTransform`.
    const eyeDistanceWorld = metrics.eyeDistancePx * unitsPerPixel;
    let glassesWidthWorld = eyeDistanceWorld * FIT_MULTIPLIER;
    const plane = this.glassesGroup.children[0];
    const planeAspect = (plane?.userData?.planeAspect as number | undefined) ?? 0.42;
    const maxHeightWorld = eyeDistanceWorld * MAX_HEIGHT_TO_EYE_DISTANCE_RATIO;
    const projectedHeight = glassesWidthWorld * planeAspect;
    if (projectedHeight > maxHeightWorld) {
      glassesWidthWorld *= maxHeightWorld / projectedHeight;
    }
    // Safety clamp: whatever the source of a future bug, never let a single
    // bad frame's scale run away to something that reads as a giant slab
    // rather than a pair of glasses.
    glassesWidthWorld = THREE.MathUtils.clamp(
      glassesWidthWorld,
      eyeDistanceWorld * 0.8,
      eyeDistanceWorld * 2.2
    );
    this.glassesGroup.scale.setScalar(
      THREE.MathUtils.lerp(this.glassesGroup.scale.x || glassesWidthWorld, glassesWidthWorld, t)
    );

    // Occluder: an ellipsoid approximating the head volume, offset down
    // and back (into the screen) from the eye/nose anchor point. These
    // ratios are an approximation (FaceMetrics doesn't carry the head's
    // true centroid) tuned to comfortably cover the head without eating
    // into the glasses' own depth.
    const faceWidthWorld = metrics.faceWidthPx * unitsPerPixel;
    const faceHeightWorld = metrics.faceHeightPx * unitsPerPixel;
    this.occluder.scale.set(faceWidthWorld * 0.5, faceHeightWorld * 0.58, faceWidthWorld * 0.52);
    this.occluder.position.set(0, -faceHeightWorld * 0.12, -faceWidthWorld * 0.38);
  }

  /** Cheap ambient-brightness sample from the live video, throttled internally. Call once per frame; it no-ops most calls. */
  sampleVideoLighting(video: HTMLVideoElement, timestampMs: number): void {
    if (timestampMs - this.lastLightSampleAt < 400) return;
    this.lastLightSampleAt = timestampMs;
    const ctx = this.lightingCtx;
    if (!ctx || video.readyState < 2) return;
    try {
      ctx.drawImage(video, 0, 0, this.lightingCanvas.width, this.lightingCanvas.height);
      const { data } = ctx.getImageData(0, 0, this.lightingCanvas.width, this.lightingCanvas.height);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avg = sum / (data.length / 4) / 255; // 0..1
      this.ambientLight.intensity = THREE.MathUtils.lerp(0.55, 1.1, avg);
      this.keyLight.intensity = THREE.MathUtils.lerp(0.7, 1.4, avg);
    } catch {
      // Cross-origin video source (shouldn't happen for getUserMedia) — skip.
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    while (this.glassesGroup.children.length) {
      disposeObject(this.glassesGroup.children.pop()!);
    }
    this.occluder.geometry.dispose();
    (this.occluder.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        const map = (material as THREE.MeshBasicMaterial).map;
        map?.dispose();
        material.dispose();
      });
    }
  });
}
