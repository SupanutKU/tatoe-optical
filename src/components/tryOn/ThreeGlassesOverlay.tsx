import React, { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FACE_SURFACE_INDICES } from '../../lib/faceSurfaceIndices';
import type { FaceMetrics } from '../../lib/faceGeometry';
import { prepareModelFit, type ModelFit } from '../../lib/modelAutoFit';
import { computePerspectiveFit, reconstructSkinPoint, type ViewCamera } from '../../lib/perspectiveFit';
import { mapMetricsToDisplay } from '../../lib/virtualTryOnEngine';
import { prepareModelOcclusion } from '../../lib/modelOcclusion';
import { disposeModel } from '../../lib/modelPreview';
interface Props {
  modelUrl: string; metrics: FaceMetrics | null;
  metricsRef?: MutableRefObject<FaceMetrics | null>;
  videoSize: { width: number; height: number }; mirrored?: boolean;
  fitMultiplier?: number; verticalOffset?: number;
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setClearColor(0, 0);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    const environment = generator.fromScene(room, .05);
    scene.environment = environment.texture; scene.environmentIntensity = .7;
    room.dispose(); generator.dispose();
    const camera = new THREE.PerspectiveCamera(63, 1, .1, 10000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x607080, 1.4));
    const light = new THREE.DirectionalLight(0xffffff, 1.8);
    light.position.set(-100, 300, 1000); scene.add(light);
    const head = new THREE.Group(); head.visible = false; scene.add(head);
    const depthMaterial = new THREE.MeshBasicMaterial({ colorWrite:false, depthWrite:true, side:THREE.DoubleSide });
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), depthMaterial.clone());
    skull.position.set(0, -.10, -.58); skull.renderOrder = -2; head.add(skull);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(468*3),3));
    geometry.setIndex(FACE_SURFACE_INDICES);
    const mask = new THREE.Mesh(geometry, depthMaterial);
    mask.frustumCulled = false; mask.renderOrder = -1; mask.visible = false; scene.add(mask);
    let w = 1, h = 1, focal = 1;
    const resize = () => {
      w = Math.max(host.clientWidth, 1); h = Math.max(host.clientHeight, 1);
      renderer.setSize(w, h, false);
    };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    let loaded = false, fit: ModelFit | null = null;
    new GLTFLoader().load(props.modelUrl, gltf => {
      if (cancelled) { disposeModel(gltf.scene); return; }
      try {
        fit = prepareModelFit(gltf.scene);
        prepareModelOcclusion(fit.root);
        head.add(fit.root); loaded = true; setStatus('');
      } catch (error) {
        disposeModel(fit?.root || gltf.scene);
        fit = null;
        setStatus(error instanceof Error ? error.message : 'อ่านรูปทรงแว่นไม่ได้');
      }
    }, undefined, () => { if (!cancelled) setStatus('โหลดโมเดลแว่นของสินค้าไม่สำเร็จ กรุณาติดต่อร้าน'); });
    let initialized = false, lastTime = performance.now(), lastSeen = 0;
    let lastValid: FaceMetrics | null = null;
    const render = () => {
      if (cancelled) return;
      raf = requestAnimationFrame(render);
      const now = performance.now(), dt = Math.min(Math.max(now-lastTime, 1), 100);
      lastTime = now;
      const p = latest.current;
      const raw = p.metricsRef ? p.metricsRef.current : p.metrics;
      if (raw) { lastValid = raw; lastSeen = now; }
      const source = raw || (p.metricsRef && now-lastSeen < 160 ? lastValid : null);
      head.visible = loaded && !!source;
      if (source && fit && p.videoSize.width && p.videoSize.height) {
        const scale = Math.max(w/p.videoSize.width,h/p.videoSize.height);
        const nextFocal = p.videoSize.height/(2*Math.tan(63*Math.PI/360))*scale;
        if (Math.abs(focal-nextFocal)>.01 || camera.aspect!==w/h) {
          focal = nextFocal;
          camera.fov = 2*Math.atan(h/(2*focal))*180/Math.PI;
          camera.aspect = w/h; camera.position.z = focal; camera.updateProjectionMatrix();
        }
        const view: ViewCamera = { width:w,height:h,focal };
        const m = mapMetricsToDisplay(source,p.videoSize.width,p.videoSize.height,w,h,!!p.mirrored);
        const target = computePerspectiveFit(m,fit,view);
        const {width,position,quaternion} = target;
        if (![width,...position.toArray(),...quaternion.toArray()].every(Number.isFinite) || width<=0) {
          head.visible = false; initialized = false;
        } else {
          const motion = Math.min(1,head.position.distanceTo(position)/Math.max(1,width*.08) + head.quaternion.angleTo(quaternion)/.12);
          const alpha = initialized && p.metricsRef ? 1-Math.exp(-dt/(70-52*motion)) : 1;
          const relativeScaleChange = Math.abs(head.scale.x-width)/width;
          const scaleAlpha = initialized && p.metricsRef ? 1-Math.exp(-dt/(relativeScaleChange>.03 ? 28 : 90)) : 1;
          head.position.lerp(position,alpha);
          head.scale.lerp(new THREE.Vector3(width,width,width),scaleAlpha);
          head.quaternion.slerp(quaternion,alpha); initialized = true;
          const skinScale = (focal-head.position.z)/focal;
          skull.scale.set(m.faceWidthPx*skinScale/head.scale.x*.55,m.faceHeightPx*skinScale/head.scale.x*.60,.46);
          mask.visible = !!m.faceSurface && m.faceSurface.length===468;
          if (mask.visible) {
            const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
            const eyeDepth = (m.leftEye.z+m.rightEye.z)/2;
            const actualPose = {...target,position:head.position,quaternion:head.quaternion,width:head.scale.x};
            for(let i=0;i<468;i++) {
              const point = reconstructSkinPoint(m.faceSurface![i],eyeDepth,view,actualPose,m);
              positions.setXYZ(i,point.x,point.y,point.z);
            }
            positions.needsUpdate = true;
          }
        }
      } else { head.visible = false; initialized = false; }
      if (!head.visible) mask.visible = false;
      renderer.render(scene,camera);
    };
    render();
    return () => {
      cancelled = true; cancelAnimationFrame(raf); observer.disconnect();
      disposeModel(head); disposeModel(mask); environment.dispose(); scene.clear();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [props.modelUrl]);
  return <>
    <div ref={hostRef} data-tryon-layer="model" data-model-ready={status === '' ? 'true' : 'false'} className="absolute inset-0 pointer-events-none z-[2]" aria-hidden="true" />
    {status && <div role="status" className="absolute top-32 left-1/2 -translate-x-1/2 z-30 bg-black/70 text-white text-xs rounded-xl px-4 py-2 max-w-[90%]">{status}</div>}
  </>;
};
