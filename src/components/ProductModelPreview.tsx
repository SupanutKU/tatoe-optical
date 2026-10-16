import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createModelPreview, disposeModel } from '../lib/modelPreview';

export function ProductModelPreview({ modelUrl, name, fallbackSrc }: { modelUrl: string; name: string; fallbackSrc?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('กำลังโหลดโมเดล 3D…');
  const [preview, setPreview] = useState('');
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let model: THREE.Group | undefined;
    let view: ReturnType<typeof createModelPreview> | undefined;
    setStatus('กำลังโหลดโมเดล 3D…');
    setPreview('');
    const draw = () => {
      if (!renderer || !model) return;
      const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      if (view) view.scene.clear();
      view = createModelPreview(model, width, height);
      renderer.render(view.scene, view.camera);
      setPreview(renderer.domElement.toDataURL('image/png'));
      // Catalog cards show a rendered snapshot, so scrolling through models
      // does not exhaust the browser's limited number of WebGL contexts.
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
      renderer = undefined;
      disposeModel(model); model = undefined;
      view.scene.clear(); view = undefined;
    };
    const load = () => {
      if (renderer || cancelled) return;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0xffffff, 0);
        renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
        host.appendChild(renderer.domElement);
      } catch { setStatus('อุปกรณ์นี้แสดงโมเดล 3D ไม่ได้'); return; }
      new GLTFLoader().load(modelUrl, gltf => {
        if (cancelled) { disposeModel(gltf.scene); return; }
        model = gltf.scene;
        try { draw(); setStatus(''); }
        catch { setStatus('โมเดลไม่มีรูปทรงที่แสดงได้'); }
      }, undefined, () => { if (!cancelled) setStatus('โหลดโมเดล 3D ไม่สำเร็จ กรุณาตรวจสอบไฟล์หรือ URL'); });
    };
    // Only allocate a WebGL context for a visible product; draw once, no animation loop.
    const visibility = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { load(); visibility.disconnect(); }
    });
    visibility.observe(host);
    const resize = new ResizeObserver(draw);
    resize.observe(host);
    return () => {
      cancelled = true;
      visibility.disconnect(); resize.disconnect();
      if (model) disposeModel(model);
      view?.scene.clear();
      renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
    };
  }, [modelUrl]);
  return <div role="img" aria-label={`โมเดล 3D ${name}`} className="relative w-full h-full min-h-10">
    <div ref={hostRef} className="absolute inset-0" />
    {(preview || fallbackSrc) && <img src={preview || fallbackSrc} alt="" className="absolute inset-0 w-full h-full object-contain" />}
    {status && <span role="status" className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs text-on-surface-variant">{status}</span>}
  </div>;
}
