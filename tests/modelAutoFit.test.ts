import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { prepareModelFit, computeModelFit } from '../src/lib/modelAutoFit';
const bytes = fs.readFileSync('public/models/round-black-glasses.glb');
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset+bytes.byteLength), '');
const fit = prepareModelFit(gltf.scene);
assert.equal(fit.source, 'lenses'); assert.ok(fit.lensSpan > .35 && fit.lensSpan < .7);
const m: any = { eyeCenter:{x:300,y:250}, noseBridge:{x:300,y:250}, pdPx3D:64, eyeDistancePx:64, faceWidthPx:140, faceHeightPx:190, rollDeg:0, yawRad:0, pitchRad:0 };
const frontal = computeModelFit(m, fit);
assert.ok(Math.abs(frontal.width*fit.lensSpan-64) < .001);
const turned = computeModelFit({...m, yawRad:.55, eyeDistancePx:64*Math.cos(.55)},fit);
assert.ok(Math.abs(turned.width-frontal.width)<1e-6); // yaw must not shrink the frame
const near = computeModelFit({...m, pdPx3D:128, eyeDistancePx:128, faceWidthPx:280, eyeCenter:{x:600,y:500}, noseBridge:{x:600,y:500}},fit);
assert.equal(near.width, frontal.width*2);
// Authored root scale/offset must not alter normalized optical alignment.
const shifted = gltf.scene.clone(true); shifted.position.set(23, -9, 4); shifted.scale.setScalar(7);
const other = prepareModelFit(shifted); assert.ok(Math.abs(other.lensSpan-fit.lensSpan)<1e-6);
const merged = new THREE.Group(); const geo = new THREE.BoxGeometry(2,.8,.1); merged.add(new THREE.Mesh(geo));
assert.equal(prepareModelFit(merged).source, 'front-geometry');
console.log('Passed: bundled GLB lens anchors, yaw stability, distance scaling, authored transforms, merged mesh fallback.');

// Regression: roll must not change yaw/pitch, scale, or relative lens sizes.
const { poseFromAxes } = await import('../src/lib/headPose');
for (const yaw of [0, .25, -.55]) for (const pitch of [0, .2, -.35]) {
  for (const roll of [-.8, -.4, 0, .4, .8]) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,-roll,'ZYX'));
    const r = new THREE.Vector3(1,0,0).applyQuaternion(q);
    const d = new THREE.Vector3(0,-1,0).applyQuaternion(q);
    const pose = poseFromAxes({x:r.x,y:-r.y,z:-r.z},{x:d.x,y:-d.y,z:-d.z});
    assert.ok(Math.abs(pose.yaw-yaw)<1e-6, `yaw drift at roll ${roll}`);
    assert.ok(Math.abs(pose.pitch-pitch)<1e-6, `pitch drift at roll ${roll}`);
    const t = computeModelFit({...m,yawRad:pose.yaw,pitchRad:pose.pitch,eyeDistancePx:64*Math.cos(pose.yaw),rollDeg:roll*180/Math.PI},fit);
    assert.ok(Math.abs(t.width-frontal.width)<1e-6);
    const lensX = new THREE.Vector3(1,0,0).applyQuaternion(t.quaternion);
    assert.ok(Math.abs(Math.hypot(lensX.x,lensX.y)-Math.cos(yaw))<1e-6);
  }
}
console.log('Passed: 45 combinations of roll/yaw/pitch without tilt-induced shrinking.');
const { computeFaceMetrics, LM } = await import('../src/lib/faceGeometry');
const base = Array.from({length:478},()=>({x:256,y:256,z:0}));
const set = (id:number,x:number,y:number,z=0)=>{base[id]={x,y,z};};
set(LM.LEFT_IRIS_CENTER,224,250); set(LM.RIGHT_IRIS_CENTER,288,250);
set(LM.LEFT_EYE_OUTER,213,250); set(LM.RIGHT_EYE_OUTER,299,250);
set(LM.LEFT_CHEEK,186,260,-15); set(LM.RIGHT_CHEEK,326,260,15);
set(LM.FOREHEAD,256,180,-6); set(LM.CHIN,256,360,6);
set(LM.NOSE_BRIDGE,256,245,-5); set(LM.NOSE_BRIDGE_LOW,256,260,-5);
const metricsAt = (roll:number)=>computeFaceMetrics(base.map(p=>({
 x:(256+(p.x-256)*Math.cos(roll)-(p.y-256)*Math.sin(roll))/512,
 y:(256+(p.x-256)*Math.sin(roll)+(p.y-256)*Math.cos(roll))/512,z:p.z/512
})),512,512)!;
const baseline = metricsAt(0);
for(const roll of [-.7,-.35,.35,.7]) {
 const tilted=metricsAt(roll);
 assert.ok(Math.abs(tilted.yawRad!-baseline.yawRad!)<1e-6);
 assert.ok(Math.abs(tilted.pitchRad!-baseline.pitchRad!)<1e-6);
 assert.ok(Math.abs(tilted.pdPx3D!-baseline.pdPx3D!)<1e-6);
}
console.log('Passed: face landmark pipeline keeps depth pose and PD stable during screen tilt.');

// Integration: model lens centres coincide with detected pupil pixels on both
// sides, including mirrored previews and object-cover cropping.
const { mapMetricsToDisplay } = await import('../src/lib/virtualTryOnEngine');
for (const mirrored of [false,true]) for (const roll of [-.5,0,.5]) {
  const source = metricsAt(roll);
  const mapped = mapMetricsToDisplay(source,512,512,900,600,mirrored);
  const target = computeModelFit(mapped, {...fit,bridge:null});
  const endpoints = [-1,1].map(sign=>new THREE.Vector3(sign*fit.lensSpan/2,0,0).multiplyScalar(target.width).applyQuaternion(target.quaternion).add(target.position)).sort((a,b)=>a.x-b.x);
  const pupils = [mapped.leftEye,mapped.rightEye].sort((a,b)=>a.x-b.x);
  for(let i=0;i<2;i++) {
    assert.ok(Math.abs(endpoints[i].x-pupils[i].x)<1e-5);
    assert.ok(Math.abs(-endpoints[i].y-pupils[i].y)<1e-5);
  }
  assert.equal(mapped.faceSurface?.length,468);
  assert.ok(Math.abs(mapped.leftEye.z-source.leftEye.z*(900/512))<1e-6);
}
console.log('Passed: both projected lens centres align with pupils across tilt, mirroring and crop.');
