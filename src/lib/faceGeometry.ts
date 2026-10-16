import { poseFromAxes } from './headPose';
import * as THREE from 'three';
// MediaPipe Face Landmarker geometry helpers.
// The renderer intentionally works from the 3D landmark cloud rather than
// requiring a GLTF/OBJ asset. All measurements remain in source-video pixels.

export const LM = {
  FOREHEAD: 10,
  CHIN: 152,
  LEFT_CHEEK: 234,
  RIGHT_CHEEK: 454,
  LEFT_JAW: 58,
  RIGHT_JAW: 288,
  LEFT_FOREHEAD_EDGE: 71,
  RIGHT_FOREHEAD_EDGE: 301,
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  RIGHT_EYE_OUTER: 263,
  RIGHT_EYE_INNER: 362,
  NOSE_BRIDGE: 168,
  NOSE_BRIDGE_LOW: 6,
  NOSE_TIP: 1,
  LEFT_IRIS_CENTER: 468,
  RIGHT_IRIS_CENTER: 473,
  // Stable side-of-head anchors. These are used as ear/temple targets rather
  // than pretending the 2D product image contains real 3D temple geometry.
  LEFT_EAR: 127,
  RIGHT_EAR: 356,
} as const;

export interface Point2D { x: number; y: number; }
export interface Point3D extends Point2D { z: number; }

export interface FaceMetrics {
  /** Face skin vertices in source pixel coordinates (z away from the camera). */
  faceSurface?: Point3D[];
  bridgeDepth?: number;
  eyeCenter: Point2D;
  noseBridge: Point2D;
  noseTip: Point3D;
  leftEye: Point3D;
  rightEye: Point3D;
  leftOuterEye: Point2D;
  rightOuterEye: Point2D;
  leftEar: Point2D;
  rightEar: Point2D;
  eyeDistancePx: number;
  faceWidthPx: number;
  faceHeightPx: number;
  jawWidthPx: number;
  foreheadWidthPx: number;
  rollDeg: number;
  yawRatio: number;
  pitchRatio: number;
  /** Camera-space head pitch in degrees, estimated from the 3D landmark cloud. */
  pitchDeg: number;
  /** Approximate real-world PD. Without a physical reference this is an estimate. */
  estimatedPdMm: number;
  /** Glasses bridge target: midpoint of landmarks #168 and #6 (top / base of the nose bridge). */
  bridge?: Point2D;
  /** Pupil distance measured in 3D (x,y,z) so it does NOT shrink when the head turns. */
  pdPx3D?: number;
  /** Cheekbone/temple width (#234 <-> #454) measured in 3D, yaw-invariant. */
  templeWidthPx3D?: number;
  /** Recommended front-frame width in the same pixel space (median of 3 yaw-invariant estimates). */
  frameWidthPx?: number;
  /** Outer-eye-corner distance (#33 <-> #263) in 3D. */
  outerEyeDistPx3D?: number;
  /**
   * Head pose in radians, baseline-free. yaw > 0 => the image-RIGHT side of the face is farther
   * from the camera; pitch > 0 => looking down (chin farther). Prefers MediaPipe's fitted
   * facial-transformation matrix, falls back to 3D landmark axes.
   */
  yawRad?: number;
  pitchRad?: number;
  poseSource?: 'matrix' | 'landmarks';
  /** Canonical-face rotation in the same right-handed camera space as Three.js. */
  headQuaternion?: [number, number, number, number];
}

function p3(landmarks: { x: number; y: number; z?: number }[], index: number, width: number, height: number): Point3D {
  const lm = landmarks[index];
  return { x: lm.x * width, y: lm.y * height, z: (lm.z ?? 0) * width };
}
function distance(a: Point2D, b: Point2D) { return Math.hypot(b.x - a.x, b.y - a.y); }
function distance3(a: Point3D, b: Point3D) { return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z); }

type V3 = { x: number; y: number; z: number };
const vsub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const vnorm = (a: V3): V3 => { const l = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / l, y: a.y / l, z: a.z / l }; };
const median3 = (a: number, b: number, c: number) => a + b + c - Math.min(a, b, c) - Math.max(a, b, c);

const mix2 = (a: Point2D, b: Point2D, t: number): Point2D => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Converts MediaPipe's 478-point face mesh into stable render metrics.
 *
 * Important: yaw/pitch are not inferred from the CSS/video element. They are
 * estimated from the actual 3D landmark cloud, so the same pose can be
 * rendered consistently at different camera resolutions.
 */
export function computeFaceMetrics(
  landmarks: { x: number; y: number; z?: number }[],
  frameWidth: number,
  frameHeight: number,
  /** Optional MediaPipe `facialTransformationMatrixes[0].data` (4x4, column-major). */
  transformMatrix?: ArrayLike<number>
): FaceMetrics | null {
  if (!landmarks || landmarks.length < 470 || !frameWidth || !frameHeight) return null;
  const p = (i: number) => p3(landmarks, i, frameWidth, frameHeight);

  const leftEye = p(LM.LEFT_IRIS_CENTER);
  const rightEye = p(LM.RIGHT_IRIS_CENTER);
  const leftOuter = p(LM.LEFT_EYE_OUTER);
  const rightOuter = p(LM.RIGHT_EYE_OUTER);
  const leftInner = p(LM.LEFT_EYE_INNER);
  const rightInner = p(LM.RIGHT_EYE_INNER);
  const forehead = p(LM.FOREHEAD);
  const chin = p(LM.CHIN);
  const leftCheek = p(LM.LEFT_CHEEK);
  const rightCheek = p(LM.RIGHT_CHEEK);
  const leftJaw = p(LM.LEFT_JAW);
  const rightJaw = p(LM.RIGHT_JAW);
  const leftForehead = p(LM.LEFT_FOREHEAD_EDGE);
  const rightForehead = p(LM.RIGHT_FOREHEAD_EDGE);
  const noseBridge = p(LM.NOSE_BRIDGE);
  const noseTip = p(LM.NOSE_TIP);
  // MediaPipe has no ear landmark. #127/#356 sit on the temple (a bit forward/high)
  // and #234/#454 on the cheek edge in front of the ear; the midpoint is the best
  // stand-in for where the temple arm rests on the ear.
  const leftEar = mix2(p(LM.LEFT_EAR), leftCheek, 0.5);
  const rightEar = mix2(p(LM.RIGHT_EAR), rightCheek, 0.5);
  const bridge = mix2(noseBridge, p(LM.NOSE_BRIDGE_LOW), 0.5);

  const eyeDistancePx = distance(leftEye, rightEye);
  if (eyeDistancePx < 4) return null;

  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
  };

  // Orient the optical axis toward screen-right even when landmark labels are reversed.
  const opticalRight = vsub(rightEye, leftEye);
  if (opticalRight.x < 0) { opticalRight.x *= -1; opticalRight.y *= -1; opticalRight.z *= -1; }
  const rollDeg = Math.atan2(opticalRight.y, opticalRight.x) * 180 / Math.PI;

  // Landmark-z based yaw is more stable than relying only on 2D cheek symmetry.
  // MediaPipe's z is camera-relative; normalize it by IPD so the signal is
  // resolution-independent. Blend it with the old 2D nose asymmetry.
  const cheekMidX = (leftCheek.x + rightCheek.x) / 2;
  const halfFace = Math.max(1, distance(leftCheek, rightCheek) / 2);
  const yaw2D = clamp((noseBridge.x - cheekMidX) / halfFace, -1, 1);
  const zSpan = Math.max(1, Math.abs(leftCheek.z - rightCheek.z) + eyeDistancePx * 0.12);
  const yaw3D = clamp((rightEye.z - leftEye.z) / zSpan, -1, 1);
  const yawRatio = clamp(yaw2D * 0.72 + yaw3D * 0.28, -1, 1);

  // Pitch: compare the nose/eye vertical geometry with its 3D depth. The
  // signal is deliberately conservative to avoid making the glasses "nod"
  // excessively from detector noise.
  const eyeMidZ = (leftEye.z + rightEye.z) / 2;
  const faceVertical = Math.max(1, distance(forehead, chin));
  const depthSignal = clamp((noseTip.z - eyeMidZ) / (eyeDistancePx * 1.25), -1, 1);
  const verticalSignal = clamp(
    ((noseTip.y - eyeCenter.y) / faceVertical - 0.085) * 5.5,
    -1,
    1
  );
  const pitchRatio = clamp(depthSignal * 0.68 + verticalSignal * 0.32, -1, 1);
  const pitchDeg = pitchRatio * 32;

  const faceWidthPx = distance(leftCheek, rightCheek);
  const faceHeightPx = distance(forehead, chin);
  const jawWidthPx = distance(leftJaw, rightJaw);
  const foreheadWidthPx = distance(leftForehead, rightForehead);

  // This is an optical estimate, not a clinical PD measurement. A true mm
  // value needs a known physical reference/calibration card.
  const ASSUMED_FACE_WIDTH_MM = 140;
  const estimatedPdMm = Math.round(eyeDistancePx * ASSUMED_FACE_WIDTH_MM / Math.max(1, faceWidthPx));

  // ---- Auto-scale: 3D measurements are immune to yaw (2D distances shrink by
  // cos(yaw) when the head turns, which used to make the frame tiny). ----
  // Real frame width (~138 mm) is ~2.2 x PD (63 mm) and ~0.98 x cheek width (~141 mm).
  const pdPx3D = distance3(leftEye, rightEye);
  const templeWidthPx3D = distance3(leftCheek, rightCheek);
  const outerEyeDistPx3D = distance3(leftOuter, rightOuter);
  // Real frame width (~138 mm) ~ 2.2 x PD (63 mm) ~ 0.98 x cheek width (~141 mm)
  // ~ 1.55 x outer-eye-corner distance (~90 mm). The MEDIAN of the three rejects
  // one bad landmark group (blink / glare on the iris, hair over the temple, ...).
  const frameWidthPx = median3(pdPx3D * 2.2, templeWidthPx3D * 0.98, outerEyeDistPx3D * 1.55);

  // ---- Head pose (no 3D model): axes of the 3D landmark cloud, refined by the
  // fitted transformation matrix when MediaPipe provides it. ----
  const dLM = vnorm(vsub(chin, forehead));          // head "down" axis
  const axesPose = poseFromAxes(vnorm(opticalRight), dLM);
  let yawRad = clamp(axesPose.yaw, -0.9, 0.9);
  let pitchRad = clamp(axesPose.pitch, -0.7, 0.7);
  let poseSource: 'matrix' | 'landmarks' = 'landmarks';
  let headQuaternion: FaceMetrics['headQuaternion'];
  if (transformMatrix?.length === 16 && Array.from(transformMatrix).every(Number.isFinite)) {
    const matrix = new THREE.Matrix4().fromArray(Array.from(transformMatrix));
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    matrix.decompose(new THREE.Vector3(), rotation, scale);
    if (scale.x > .5 && scale.x < 2 && scale.y > .5 && scale.y < 2 && scale.z > .5 && scale.z < 2) {
      rotation.normalize();
      const euler = new THREE.Euler().setFromQuaternion(rotation, 'ZYX');
      headQuaternion = rotation.toArray();
      yawRad = euler.y; pitchRad = euler.x; poseSource = 'matrix';
    }
  }

  return {
    faceSurface: landmarks.slice(0, 468).map((_, i) => p(i)),
    bridgeDepth: (noseBridge.z + p(LM.NOSE_BRIDGE_LOW).z) / 2,
    eyeCenter,
    noseBridge: { x: noseBridge.x, y: noseBridge.y },
    noseTip,
    leftEye,
    rightEye,
    leftOuterEye: { x: leftOuter.x, y: leftOuter.y },
    rightOuterEye: { x: rightOuter.x, y: rightOuter.y },
    leftEar: { x: leftEar.x, y: leftEar.y },
    rightEar: { x: rightEar.x, y: rightEar.y },
    eyeDistancePx,
    faceWidthPx,
    faceHeightPx,
    jawWidthPx,
    foreheadWidthPx,
    rollDeg,
    yawRatio,
    pitchRatio,
    pitchDeg,
    estimatedPdMm,
    bridge,
    pdPx3D,
    templeWidthPx3D,
    frameWidthPx,
    outerEyeDistPx3D,
    yawRad,
    pitchRad,
    poseSource,
    headQuaternion,
  };
}

export function mirrorFaceMetrics(metrics: FaceMetrics, frameWidth: number): FaceMetrics {
  return {
    ...metrics,
    faceSurface: metrics.faceSurface?.map(point => ({ ...point, x: frameWidth-point.x })),
    eyeCenter: { x: frameWidth - metrics.eyeCenter.x, y: metrics.eyeCenter.y },
    noseBridge: { x: frameWidth - metrics.noseBridge.x, y: metrics.noseBridge.y },
    bridge: metrics.bridge ? { x: frameWidth - metrics.bridge.x, y: metrics.bridge.y } : undefined,
    leftOuterEye: { x: frameWidth - metrics.leftOuterEye.x, y: metrics.leftOuterEye.y },
    rightOuterEye: { x: frameWidth - metrics.rightOuterEye.x, y: metrics.rightOuterEye.y },
    leftEar: { x: frameWidth - metrics.leftEar.x, y: metrics.leftEar.y },
    rightEar: { x: frameWidth - metrics.rightEar.x, y: metrics.rightEar.y },
    noseTip: { ...metrics.noseTip, x: frameWidth - metrics.noseTip.x },
    leftEye: { ...metrics.leftEye, x: frameWidth - metrics.leftEye.x },
    rightEye: { ...metrics.rightEye, x: frameWidth - metrics.rightEye.x },
    rollDeg: -metrics.rollDeg,
    yawRatio: -metrics.yawRatio,
    yawRad: metrics.yawRad !== undefined ? -metrics.yawRad : undefined,
    headQuaternion: metrics.headQuaternion ? [metrics.headQuaternion[0], -metrics.headQuaternion[1], -metrics.headQuaternion[2], metrics.headQuaternion[3]] : undefined,
  };
}
