import * as THREE from 'three';
import type { FaceMetrics, Point3D } from './faceGeometry';
import { computeModelFit, type ModelFit } from './modelAutoFit';

export interface ViewCamera { width: number; height: number; focal: number }

export function projectPoint(point: THREE.Vector3, view: ViewCamera) {
  const k = view.focal / Math.max(view.focal * .1, view.focal - point.z);
  return new THREE.Vector2(point.x * k, point.y * k);
}

/** Solve uniform size and translation against the actual pupil projections.
 * Pose comes from the face matrix; a small screen-roll correction seats both lenses. */
export function computePerspectiveFit(metrics: FaceMetrics, fit: ModelFit, view: ViewCamera) {
  const base = computeModelFit(metrics, fit);
  const quaternion = base.quaternion.clone();
  const k = Math.max(.4, (view.focal - base.position.z) / view.focal);
  const position = new THREE.Vector3((metrics.eyeCenter.x - view.width/2)*k, (view.height/2-metrics.eyeCenter.y)*k, base.position.z);
  let width = base.width * k;
  const eyes = [metrics.leftEye, metrics.rightEye].sort((a,b)=>a.x-b.x)
    .map(p=>new THREE.Vector2(p.x-view.width/2, view.height/2-p.y));
  const desiredCenter = eyes[0].clone().add(eyes[1]).multiplyScalar(.5);
  const desiredSpan = eyes[0].distanceTo(eyes[1]);
  const centers = fit.lensCenters ?? [new THREE.Vector3(-fit.lensSpan/2,0,0),new THREE.Vector3(fit.lensSpan/2,0,0)];
  for (let iteration=0;iteration<8;iteration++) {
    const projected = centers.map(p=>projectPoint(p.clone().multiplyScalar(width).applyQuaternion(quaternion).add(position),view)).sort((a,b)=>a.x-b.x);
    const currentCenter = projected[0].clone().add(projected[1]).multiplyScalar(.5);
    const currentSpan = projected[0].distanceTo(projected[1]);
    if (currentSpan < 1) break;
    width *= THREE.MathUtils.clamp(desiredSpan/currentSpan,.8,1.2);
    width = THREE.MathUtils.clamp(width,base.width*k*.65,base.width*k*1.35);
    position.x += (desiredCenter.x-currentCenter.x)*k;
    position.y += (desiredCenter.y-currentCenter.y)*k;
    const targetAngle = Math.atan2(eyes[1].y-eyes[0].y,eyes[1].x-eyes[0].x);
    const angle = Math.atan2(projected[1].y-projected[0].y,projected[1].x-projected[0].x);
    const correction = THREE.MathUtils.clamp(targetAngle-angle,-.12,.12);
    quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),correction));
  }
  return { position, width, quaternion, apparentWidth: base.width };
}

/** Keep screen landmark positions while reconstructing camera-space depth. */
export function reconstructSkinPoint(point: Point3D, eyeDepth: number, view: ViewCamera, pose: ReturnType<typeof computePerspectiveFit>, metrics: FaceMetrics) {
  const sx = point.x-view.width/2, sy = view.height/2-point.y;
  let z = -(point.z-eyeDepth);
  const normal = new THREE.Vector3(0,0,1).applyQuaternion(pose.quaternion);
  // Relative landmark depth is noisy around eyelids. Keep these vertices just
  // behind the fitted lens plane; the central nose can still occlude the bridge.
  const inLens = [metrics.leftEye,metrics.rightEye].some(eye=>
    ((point.x-eye.x)/(pose.apparentWidth*.23))**2 + ((point.y-eye.y)/(pose.apparentWidth*.19))**2 < 1.2);
  const denominator = normal.z-(normal.x*sx+normal.y*sy)/view.focal;
  if (inLens && Math.abs(point.x-metrics.eyeCenter.x)>pose.apparentWidth*.035 && Math.abs(denominator)>.15) {
    const planeDepth = (normal.dot(pose.position)-normal.x*sx-normal.y*sy)/denominator;
    z = Math.min(z,planeDepth-pose.width*.035);
  }
  const k = (view.focal-z)/view.focal;
  return new THREE.Vector3(sx*k,sy*k,z);
}
