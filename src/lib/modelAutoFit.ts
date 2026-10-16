import * as THREE from 'three';
import type { FaceMetrics } from './faceGeometry';

export interface ModelFit {
  root: THREE.Group;
  lensSpan: number;
  bridge: THREE.Vector3 | null;
  source: 'lenses' | 'front-geometry';
}

/** GLB convention: X across the lenses, Y up, +Z toward the camera.
 * Preserve authored transforms; measure in world space before wrapping the scene.
 * Named lens/rim parts provide optical centres. A merged mesh uses its front slice.
 */
export function prepareModelFit(model: THREE.Group): ModelFit {
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  if (![size.x, size.y, size.z].every(Number.isFinite) || size.x <= 1e-8) {
    throw new Error('โมเดลไม่มีรูปทรงแว่นที่ใช้งานได้');
  }
  const lenses: THREE.Box3[] = [], rims: THREE.Box3[] = [];
  const bridges: THREE.Vector3[] = [];
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const box = new THREE.Box3().setFromObject(object);
    const name = `${object.name} ${Array.isArray(object.material) ? object.material.map(m => m.name).join(' ') : object.material.name}`.toLowerCase();
    if (/lens|lenses|เลนส์/.test(name)) lenses.push(box);
    else if (/rim/.test(name)) rims.push(box);
    if (/bridge/.test(object.name.toLowerCase())) bridges.push(box.getCenter(new THREE.Vector3()));
  });
  const parts = lenses.length >= 2 ? lenses : rims;
  let centres = parts.map(b => b.getCenter(new THREE.Vector3())).sort((a,b) => a.x-b.x);
  let source: ModelFit['source'] = 'lenses';
  if (centres.length < 2 || centres.at(-1)!.x-centres[0].x < size.x*.2) {
    source = 'front-geometry';
    const left = new THREE.Box3(), right = new THREE.Box3(), point = new THREE.Vector3();
    const middle = (bounds.min.x+bounds.max.x)/2;
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const positions = object.geometry.getAttribute('position');
      if (!positions) return;
      for (let i=0;i<positions.count;i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
        if (point.z < bounds.max.z-Math.max(size.z*.18, size.x*.025)) continue;
        if (Math.abs(point.x-middle) < size.x*.08) continue;
        (point.x < middle ? left : right).expandByPoint(point);
      }
    });
    if (left.isEmpty() || right.isEmpty()) throw new Error('ไม่พบกรอบด้านหน้าของโมเดล (ต้องใช้ X แนวนอน Y ขึ้น และ +Z ด้านหน้า)');
    centres = [left.getCenter(new THREE.Vector3()), right.getCenter(new THREE.Vector3())];
  }
  const a = centres[0], b = centres.at(-1)!;
  const opticalCentre = a.clone().add(b).multiplyScalar(.5);
  const span = Math.abs(b.x-a.x)/size.x;
  // Wrappers avoid destroying GLB root scale, translation or rotation.
  const translation = new THREE.Group(); translation.position.copy(opticalCentre).negate(); translation.add(model);
  const root = new THREE.Group(); root.scale.setScalar(1/size.x); root.add(translation);
  return { root, lensSpan: span, bridge: bridges.length ? bridges[0].clone().sub(opticalCentre).divideScalar(size.x) : null, source };
}

/** Optical alignment with a modest nose-bridge constraint; uniform scale preserves shape. */
export function computeModelFit(m: FaceMetrics, fit: ModelFit) {
  const pd = m.pdPx3D || m.eyeDistancePx;
  const faceWidth = m.templeWidthPx3D || m.faceWidthPx;
  let width = pd/fit.lensSpan;
  const yaw = THREE.MathUtils.clamp(m.yawRad ?? m.yawRatio*.78, -1.2, 1.2);
  const pitch = THREE.MathUtils.clamp(m.pitchRad ?? m.pitchRatio*.56, -.8, .8);
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, -m.rollDeg*Math.PI/180, 'ZYX'));
  // Fit projected lens-centre separation to the actual pupils. This avoids
  // mixing a cheek-derived yaw with an iris-derived scale at oblique angles.
  const opticalAxis = new THREE.Vector3(1,0,0).applyQuaternion(quaternion);
  const projectedSpan = Math.hypot(opticalAxis.x, opticalAxis.y)*fit.lensSpan;
  if (projectedSpan > .1) width = m.eyeDistancePx/projectedSpan;
  width = THREE.MathUtils.clamp(width, faceWidth*.65, faceWidth*1.3);
  const eyeDepth = m.leftEye && m.rightEye ? (m.leftEye.z+m.rightEye.z)/2 : 0;
  const seatDepth = m.bridgeDepth !== undefined ? -(m.bridgeDepth-eyeDepth) : 0;
  const eye = new THREE.Vector3(m.eyeCenter.x, -m.eyeCenter.y, seatDepth+width*.02);
  if (fit.bridge) {
    const projectedBridge = fit.bridge.clone().multiplyScalar(width).applyQuaternion(quaternion).add(eye);
    const target = m.bridge || m.noseBridge;
    // Eye alignment dominates: nose landmarks are skin surface, not a measured pad contact.
    eye.x += (target.x-projectedBridge.x)*.15;
    eye.y += (-target.y-projectedBridge.y)*.15;
  }
  return { width, position: eye, quaternion, faceWidth };
}
