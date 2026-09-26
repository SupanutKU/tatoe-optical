import React, { useEffect, useRef, useState } from 'react';
import type { Product } from '../../types';
import type { FaceMetrics } from '../../lib/faceGeometry';

/**
 * Lightweight 3D glasses renderer.
 * Babylon.js is loaded from its official CDN at runtime so the existing app
 * does not need a large new npm dependency. The component builds a small
 * parametric glasses model (frame, lenses, bridge and temples) and keeps it
 * aligned to MediaPipe face metrics.
 */
interface BabylonGlassesOverlayProps {
  metrics: FaceMetrics | null;
  product: Product;
  mirrored?: boolean;
  videoSize: { width: number; height: number };
}

type BabylonApi = any;

declare global {
  interface Window {
    BABYLON?: BabylonApi;
    __tatoeBabylonPromise?: Promise<BabylonApi>;
  }
}

function loadBabylon(): Promise<BabylonApi> {
  if (window.BABYLON) return Promise.resolve(window.BABYLON);
  if (window.__tatoeBabylonPromise) return window.__tatoeBabylonPromise;

  window.__tatoeBabylonPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-tatoe-babylon]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(window.BABYLON));
      existing.addEventListener('error', () => reject(new Error('Babylon.js failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.babylonjs.com/babylon.js';
    script.async = true;
    script.dataset.tatoeBabylon = 'true';
    script.onload = () => window.BABYLON ? resolve(window.BABYLON) : reject(new Error('Babylon.js unavailable'));
    script.onerror = () => reject(new Error('Babylon.js failed to load'));
    document.head.appendChild(script);
  });

  return window.__tatoeBabylonPromise;
}

function colorForProduct(product: Product) {
  const name = `${product.colorName} ${product.name}`.toLowerCase();
  if (name.includes('gold') || name.includes('ทอง')) return '#b98a32';
  if (name.includes('silver') || name.includes('เงิน')) return '#aeb6bd';
  if (name.includes('brown') || name.includes('น้ำตาล')) return '#5b3b2d';
  if (name.includes('red') || name.includes('แดง')) return '#7f2f2f';
  if (name.includes('blue') || name.includes('ฟ้า') || name.includes('น้ำเงิน')) return '#263f63';
  return '#1d2024';
}

function hexToColor3(B: BabylonApi, hex: string) {
  return B.Color3.FromHexString(hex);
}

export const BabylonGlassesOverlay: React.FC<BabylonGlassesOverlayProps> = ({ metrics, product, mirrored = true, videoSize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const engineRef = useRef<any>(null);
  const groupRef = useRef<any>(null);
  const productIdRef = useRef<string | null>(null);
  const [babylonReady, setBabylonReady] = useState(false);
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    const init = async () => {
      try {
        const B = await loadBabylon();
        if (disposed || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const engine = new B.Engine(canvas, true, {
          preserveDrawingBuffer: true,
          stencil: true,
          premultipliedAlpha: true,
        });
        engine.setHardwareScalingLevel(Math.min(1.5, window.devicePixelRatio || 1));
        engineRef.current = engine;

        const scene = new B.Scene(engine);
        scene.clearColor = new B.Color4(0, 0, 0, 0);
        scene.autoClear = true;
        sceneRef.current = scene;

        const camera = new B.FreeCamera('tryOnCamera', new B.Vector3(0, 0, 100), scene);
        camera.mode = B.Camera.ORTHOGRAPHIC_CAMERA;
        camera.setTarget(B.Vector3.Zero());
        camera.minZ = 0.1;
        camera.maxZ = 500;
        scene.activeCamera = camera;

        const light = new B.HemisphericLight('tryOnLight', new B.Vector3(0, 0, 1), scene);
        light.intensity = 1.0;

        const root = new B.TransformNode('glassesRoot', scene);
        groupRef.current = root;

        resizeObserver = new ResizeObserver(() => {
          if (!canvas.parentElement) return;
          const rect = canvas.parentElement.getBoundingClientRect();
          sizeRef.current = { width: rect.width, height: rect.height };
          engine.resize();
          camera.orthoLeft = -rect.width / 2;
          camera.orthoRight = rect.width / 2;
          camera.orthoTop = rect.height / 2;
          camera.orthoBottom = -rect.height / 2;
        });
        resizeObserver.observe(canvas.parentElement);
        const initialRect = canvas.parentElement.getBoundingClientRect();
        sizeRef.current = { width: initialRect.width, height: initialRect.height };
        engine.resize();
        camera.orthoLeft = -initialRect.width / 2;
        camera.orthoRight = initialRect.width / 2;
        camera.orthoTop = initialRect.height / 2;
        camera.orthoBottom = -initialRect.height / 2;

        engine.runRenderLoop(() => scene.render());
        setBabylonReady(true);
      } catch (error) {
        console.warn('3D try-on renderer unavailable', error);
      }
    };

    init();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      try { engineRef.current?.stopRenderLoop(); } catch { /* noop */ }
      try { sceneRef.current?.dispose(); } catch { /* noop */ }
      try { engineRef.current?.dispose(); } catch { /* noop */ }
      sceneRef.current = null;
      engineRef.current = null;
      groupRef.current = null;
    };
  }, []);

  // Rebuild the small parametric model only when the selected product changes.
  useEffect(() => {
    const B = window.BABYLON;
    const scene = sceneRef.current;
    const root = groupRef.current;
    if (!B || !scene || !root || productIdRef.current === product.id) return;

    root.getChildMeshes().forEach((mesh: any) => mesh.dispose());
    productIdRef.current = product.id;

    const material = new B.StandardMaterial(`frame-${product.id}`, scene);
    material.diffuseColor = hexToColor3(B, colorForProduct(product));
    material.specularColor = new B.Color3(0.35, 0.35, 0.35);
    material.roughness = 0.28;

    const lensMaterial = new B.StandardMaterial(`lens-${product.id}`, scene);
    lensMaterial.diffuseColor = new B.Color3(0.35, 0.65, 0.9);
    lensMaterial.alpha = 0.16;
    lensMaterial.specularColor = new B.Color3(0.9, 0.95, 1);
    lensMaterial.backFaceCulling = false;

    const shape = product.shape;
    const round = shape === 'round';
    const drop = shape === 'drop';
    const catEye = shape === 'cat-eye';

    const lensWidth = drop ? 25 : 27;
    const lensHeight = round ? 25 : catEye ? 20 : 20;
    const centerGap = 7;
    const frameThickness = round ? 2.2 : 1.8;

    const makeLens = (x: number, index: number) => {
      if (round) {
        const frame = B.MeshBuilder.CreateTorus(`round-frame-${index}`, {
          diameter: lensWidth,
          thickness: frameThickness,
          tessellation: 48,
        }, scene);
        frame.position.x = x;
        frame.material = material;
        frame.parent = root;

        const lens = B.MeshBuilder.CreateDisc(`round-lens-${index}`, {
          radius: lensWidth / 2 - frameThickness,
          tessellation: 48,
          sideOrientation: B.Mesh.DOUBLESIDE,
        }, scene);
        lens.position.x = x;
        lens.position.z = -0.7;
        lens.material = lensMaterial;
        lens.parent = root;
        return;
      }

      const points: any[] = [];
      const segments = 24;
      const rx = lensWidth / 2;
      const ry = lensHeight / 2;
      for (let i = 0; i <= segments; i++) {
        const a = (Math.PI * 2 * i) / segments;
        let px = Math.cos(a) * rx;
        let py = Math.sin(a) * ry;
        if (catEye) px += Math.max(0, -py) * 0.16;
        points.push(new B.Vector3(x + px, py, 0));
      }
      const frame = B.MeshBuilder.CreateLines(`frame-${index}`, { points, updatable: false }, scene);
      frame.color = hexToColor3(B, colorForProduct(product));
      frame.parent = root;

      const lens = B.MeshBuilder.CreateDisc(`lens-${index}`, {
        radius: 1,
        tessellation: 32,
        sideOrientation: B.Mesh.DOUBLESIDE,
      }, scene);
      lens.scaling.x = rx * 0.98;
      lens.scaling.y = ry * 0.98;
      lens.position.x = x;
      lens.position.z = -0.7;
      lens.material = lensMaterial;
      lens.parent = root;
    };

    makeLens(-(centerGap + lensWidth) / 2, 0);
    makeLens((centerGap + lensWidth) / 2, 1);

    const bridge = B.MeshBuilder.CreateCylinder('bridge', {
      height: centerGap,
      diameter: frameThickness * 1.05,
      tessellation: 16,
    }, scene);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.y = 1.5;
    bridge.material = material;
    bridge.parent = root;

    const templeLength = 42;
    [-1, 1].forEach((side, i) => {
      const temple = B.MeshBuilder.CreateBox(`temple-${i}`, {
        width: templeLength,
        height: frameThickness * 1.15,
        depth: frameThickness * 1.25,
      }, scene);
      temple.position.x = side * (lensWidth / 2 + centerGap / 2 + templeLength / 2 - 1);
      temple.position.y = 1;
      temple.position.z = -1;
      temple.rotation.z = side * 0.01;
      temple.material = material;
      temple.parent = root;
    });
  }, [product, babylonReady]);

  useEffect(() => {
    const root = groupRef.current;
    const size = sizeRef.current;
    if (!root || !metrics || !size.width || !size.height || !videoSize.width || !videoSize.height) return;

    // MediaPipe reports coordinates in the raw video bitmap. Convert them to
    // the displayed object-cover rectangle first, including the crop offsets.
    const scaleToCover = Math.max(size.width / videoSize.width, size.height / videoSize.height);
    const renderedWidth = videoSize.width * scaleToCover;
    const renderedHeight = videoSize.height * scaleToCover;
    const cropX = (size.width - renderedWidth) / 2;
    const cropY = (size.height - renderedHeight) / 2;
    let xPx = metrics.eyeCenter.x * scaleToCover + cropX;
    const yPx = metrics.eyeCenter.y * scaleToCover + cropY;
    if (mirrored) xPx = size.width - xPx;
    const x = xPx - size.width / 2;
    const y = size.height / 2 - yPx;

    // The parametric model is ~60px wide at scale 1. Match its width to the
    // measured inter-eye distance and add a small fit factor for frame rims.
    const scale = Math.max(0.55, Math.min(2.25, metrics.eyeDistancePx / 42)) * (product.tryOnScale ?? 1);
    root.scaling.x = scale;
    root.scaling.y = scale;
    root.scaling.z = scale;
    root.position.x = x + (product.tryOnOffsetX ?? 0) * scale;
    root.position.y = y + Math.max(-8, Math.min(8, metrics.noseBridge.y - metrics.eyeCenter.y) * 0.06) + (product.tryOnOffsetY ?? 0) * scale;
    root.position.z = product.tryOnOffsetZ ?? 0;

    const yaw = Math.max(-0.75, Math.min(0.75, (mirrored ? -metrics.yawRatio : metrics.yawRatio)));
    root.rotation.y = yaw * 0.9;
    root.rotation.z = (mirrored ? -metrics.rollDeg : metrics.rollDeg) * Math.PI / 180;
    root.rotation.x = yaw * 0.12;
  }, [metrics, mirrored, videoSize]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[4]"
      aria-label="3D virtual glasses"
    />
  );
};
