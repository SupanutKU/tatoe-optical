import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { FaceMetrics } from '../../lib/faceGeometry';

interface ThreeGlassesOverlayProps {
  modelUrl: string;
  metrics: FaceMetrics | null;
  frameWidth: number;
  frameHeight: number;
  mirrored: boolean;
}

export const ThreeGlassesOverlay: React.FC<ThreeGlassesOverlayProps> = ({
  modelUrl,
  metrics,
  frameWidth,
  frameHeight,
  mirrored,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const targetRef = useRef({ x: 0, y: 0, scale: 0, roll: 0, yaw: 0 });
  const currentRef = useRef({ x: 0, y: 0, scale: 0, roll: 0, yaw: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'absolute inset-0 w-full h-full pointer-events-none';
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x667080, 1.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(-2, 3, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x9ecbff, 0.8);
    fillLight.position.set(3, 1, 2);
    scene.add(fillLight);
    sceneRef.current = scene;

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let animationFrame = 0;
    const render = () => {
      animationFrame = requestAnimationFrame(render);
      const target = targetRef.current;
      const current = currentRef.current;
      current.x = THREE.MathUtils.lerp(current.x, target.x, 0.24);
      current.y = THREE.MathUtils.lerp(current.y, target.y, 0.24);
      current.scale = THREE.MathUtils.lerp(current.scale, target.scale, 0.24);
      current.roll = THREE.MathUtils.lerp(current.roll, target.roll, 0.24);
      current.yaw = THREE.MathUtils.lerp(current.yaw, target.yaw, 0.24);
      const model = modelRef.current;
      if (model) {
        model.position.set(current.x, current.y, 0);
        model.scale.setScalar(current.scale);
        model.rotation.set(0, current.yaw, current.roll);
        model.visible = current.scale > 0;
      }
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      renderer.dispose();
      scene.clear();
      renderer.domElement.remove();
      sceneRef.current = null;
      modelRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let cancelled = false;
    new GLTFLoader().load(
      modelUrl,
      (gltf) => {
        if (cancelled) return;
        if (modelRef.current) scene.remove(modelRef.current);
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        model.position.sub(center);
        model.scale.setScalar(1 / Math.max(size.x, size.y, size.z, 0.001));
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = true;
          object.receiveShadow = true;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (!(material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial)) return;
            const name = `${material.name} ${object.name}`.toLowerCase();
            material.envMapIntensity = 0.8;
            material.roughness = name.includes('lens') ? 0.16 : 0.28;
            material.metalness = name.includes('lens') ? 0.08 : 0.62;
            if (name.includes('lens')) {
              material.transparent = true;
              material.opacity = 0.42;
              material.depthWrite = false;
            }
          });
        });
        scene.add(model);
        modelRef.current = model;
      },
      undefined,
      () => {
        targetRef.current.scale = 0;
      }
    );
    return () => {
      cancelled = true;
    };
  }, [modelUrl]);

  useEffect(() => {
    if (!metrics || !frameWidth || !frameHeight) {
      targetRef.current.scale = 0;
      return;
    }
    const mirrorX = mirrored ? -1 : 1;
    const target = targetRef.current;
    target.x = ((metrics.eyeCenter.x / frameWidth) * 2 - 1) * mirrorX;
    target.y = 1 - (metrics.eyeCenter.y / frameHeight) * 2 - (metrics.eyeDistancePx / frameHeight) * 0.16;
    target.scale = (metrics.eyeDistancePx / frameWidth) * 2 * 2.05;
    target.roll = (-metrics.rollDeg * Math.PI) / 180;
    target.yaw = metrics.yawRatio * 0.58 * mirrorX;
  }, [metrics, frameWidth, frameHeight, mirrored]);

  return <div ref={hostRef} className="absolute inset-0 pointer-events-none z-[2]" aria-hidden="true" />;
};
