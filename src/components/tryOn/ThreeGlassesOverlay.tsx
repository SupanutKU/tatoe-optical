import React, { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FACE_SURFACE_INDICES } from '../../lib/faceSurfaceIndices';
import type { FaceMetrics } from '../../lib/faceGeometry';
import { prepareModelFit, computeModelFit, type ModelFit } from '../../lib/modelAutoFit';
import { mapMetricsToDisplay } from '../../lib/virtualTryOnEngine';
interface Props {
  modelUrl: string; metrics: FaceMetrics | null;
  metricsRef?: MutableRefObject<FaceMetrics | null>;
  videoSize: { width: number; height: number }; mirrored?: boolean;
  fitMultiplier?: number; verticalOffset?: number;
}
function dispose(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    o.geometry.dispose();
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value);
      m.dispose();
    }
  }); textures.forEach(t => t.dispose());
}
export const ThreeGlassesOverlay: React.FC<Props> = props => {
  const hostRef = useRef<HTMLDivElement>(null);
  const latest = useRef(props); latest.current = props;
  const [status, setStatus] = useState('กำลังโหลดแว่น 3D…');
  useEffect(() => {
    const host = hostRef.current; if (!host) return;
    let cancelled = false, raf = 0;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setStatus('อุปกรณ์นี้เปิดแว่น 3D ไม่ได้'); return; }
    setStatus('กำลังโหลดแว่น 3D…');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0, 0);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block'; host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10000); camera.position.z = 3000;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8090a0, 2.4));
    const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(-100, 300, 1000); scene.add(light);
    const head = new THREE.Group(); head.visible = false; scene.add(head);
    // Actual detected skin surface writes depth before any opaque/transparent eyewear.
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(468*3),3));
    geometry.setIndex(FACE_SURFACE_INDICES);
    const mask = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ colorWrite:false, depthWrite:true, side:THREE.DoubleSide }));
    mask.frustumCulled = false; mask.renderOrder = -1; mask.visible = false; scene.add(mask);
    let w = 1, h = 1;
    const resize = () => {
      w = Math.max(host.clientWidth, 1); h = Math.max(host.clientHeight, 1);
      camera.left = -w / 2; camera.right = w / 2; camera.top = h / 2; camera.bottom = -h / 2;
      camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
    };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    let loaded = false; let fit: ModelFit | null = null;
    new GLTFLoader().load(props.modelUrl, gltf => {
      if (cancelled) { dispose(gltf.scene); return; }
      const model = gltf.scene;
      try { fit = prepareModelFit(model); }
      catch (error) { dispose(model); setStatus(error instanceof Error ? error.message : 'อ่านรูปทรงแว่นไม่ได้'); return; }
      model.traverse(o => {
        if (!(o instanceof THREE.Mesh)) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m.transparent) m.depthWrite = false;
      }); head.add(fit.root); loaded = true; setStatus('');
    }, undefined, () => { if (!cancelled) setStatus('โหลดโมเดลแว่นของสินค้าไม่สำเร็จ กรุณาติดต่อร้าน'); });
    let initialized = false, lastTime = performance.now();
    const render = () => {
      if (cancelled) return; raf = requestAnimationFrame(render);
      const p = latest.current, source = p.metricsRef ? p.metricsRef.current : p.metrics;
      head.visible = loaded && !!source;
      if (source && p.videoSize.width && p.videoSize.height) {
        const m = mapMetricsToDisplay(source, p.videoSize.width, p.videoSize.height, w, h, !!p.mirrored);
        if (!fit) return;
        const target = computeModelFit(m, fit);
        const { width, faceWidth } = target;
        const x = target.position.x-w/2, y = target.position.y+h/2, z = target.position.z;
        if (![width, x, y, z, ...target.quaternion.toArray()].every(Number.isFinite) || width <= 0) {
          head.visible = false; initialized = false;
        } else {
          // Static uploads snap to their exact pose. Live tracking uses time-based smoothing.
          const now = performance.now();
          const alpha = initialized && p.metricsRef ? 1-Math.exp(-Math.min(now-lastTime, 100)/65) : 1;
          lastTime = now;
          head.position.lerp(new THREE.Vector3(x, y, z), alpha);
          head.scale.lerp(new THREE.Vector3(width, width, width), alpha);
          head.quaternion.slerp(target.quaternion, alpha); initialized = true;
          mask.visible = !!m.faceSurface && m.faceSurface.length === 468;
          if (mask.visible) {
            const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
            const eyeDepth = (m.leftEye.z+m.rightEye.z)/2;
            for (let i=0;i<468;i++) {
              const v = m.faceSurface![i];
              positions.setXYZ(i,
                THREE.MathUtils.lerp(positions.getX(i),v.x-w/2,alpha),
                THREE.MathUtils.lerp(positions.getY(i),h/2-v.y,alpha),
                THREE.MathUtils.lerp(positions.getZ(i),-(v.z-eyeDepth)-width*.005,alpha));
            }
            positions.needsUpdate = true;
          }
        }
      } else { head.visible = false; initialized = false; }
      if (!head.visible) mask.visible = false;
      renderer.render(scene, camera);
    }; render();
    return () => {
      cancelled = true; cancelAnimationFrame(raf); observer.disconnect();
      dispose(head); dispose(mask); scene.clear(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [props.modelUrl]);
  return <>
    <div ref={hostRef} className="absolute inset-0 pointer-events-none z-[2]" aria-hidden="true" />
    {status && <div role="status" className="absolute top-32 left-1/2 -translate-x-1/2 z-30 bg-black/70 text-white text-xs rounded-xl px-4 py-2 max-w-[90%]">{status}</div>}
  </>;
};
