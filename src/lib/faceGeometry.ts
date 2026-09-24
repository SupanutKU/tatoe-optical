// MediaPipe FaceLandmarker returns 478 normalized (0..1) landmarks per face.
// These indices follow the canonical MediaPipe Face Mesh topology.
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
  NOSE_TIP: 1,
} as const;

export interface Point2D {
  x: number;
  y: number;
}

export interface FaceMetrics {
  /** Pixel-space center point between the eyes (glasses anchor point). */
  eyeCenter: Point2D;
  /** Pixel-space nose bridge point, used to seat the glasses bridge. */
  noseBridge: Point2D;
  eyeDistancePx: number;
  faceWidthPx: number;
  faceHeightPx: number;
  jawWidthPx: number;
  foreheadWidthPx: number;
  /** In-plane roll angle (head tilt), degrees. */
  rollDeg: number;
  /** Approximate left/right turn (yaw) in the range [-1, 1]. */
  yawRatio: number;
  /** Estimated real-world pupillary distance in millimeters (rough approximation). */
  estimatedPdMm: number;
}

function toPoint(landmarks: { x: number; y: number }[], index: number, width: number, height: number): Point2D {
  const lm = landmarks[index];
  return { x: lm.x * width, y: lm.y * height };
}

function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Converts a single face's raw normalized landmarks into pixel-space metrics
 * that the rest of the app (overlay engine + face-shape classifier) can use.
 */
export function computeFaceMetrics(
  landmarks: { x: number; y: number; z?: number }[],
  frameWidth: number,
  frameHeight: number
): FaceMetrics | null {
  if (!landmarks || landmarks.length < 470) return null;

  const p = (i: number) => toPoint(landmarks, i, frameWidth, frameHeight);

  const leftEyeOuter = p(LM.LEFT_EYE_OUTER);
  const rightEyeOuter = p(LM.RIGHT_EYE_OUTER);
  const leftEyeInner = p(LM.LEFT_EYE_INNER);
  const rightEyeInner = p(LM.RIGHT_EYE_INNER);
  const forehead = p(LM.FOREHEAD);
  const chin = p(LM.CHIN);
  const leftCheek = p(LM.LEFT_CHEEK);
  const rightCheek = p(LM.RIGHT_CHEEK);
  const leftJaw = p(LM.LEFT_JAW);
  const rightJaw = p(LM.RIGHT_JAW);
  const leftForeheadEdge = p(LM.LEFT_FOREHEAD_EDGE);
  const rightForeheadEdge = p(LM.RIGHT_FOREHEAD_EDGE);
  const noseBridge = p(LM.NOSE_BRIDGE);

  const eyeCenter: Point2D = {
    x: (leftEyeOuter.x + rightEyeOuter.x) / 2,
    y: (leftEyeOuter.y + rightEyeOuter.y) / 2,
  };

  const eyeDistancePx = distance(leftEyeOuter, rightEyeOuter);
  const faceWidthPx = distance(leftCheek, rightCheek);
  const faceHeightPx = distance(forehead, chin);
  const jawWidthPx = distance(leftJaw, rightJaw);
  const foreheadWidthPx = distance(leftForeheadEdge, rightForeheadEdge);

  const rollDeg =
    (Math.atan2(rightEyeOuter.y - leftEyeOuter.y, rightEyeOuter.x - leftEyeOuter.x) * 180) /
    Math.PI;

  // Rough yaw estimate: compare how centered the nose bridge is between the
  // two cheek landmarks. 0 = facing camera, +/-1 = turned fully to a side.
  const cheekMidX = (leftCheek.x + rightCheek.x) / 2;
  const halfFaceWidth = faceWidthPx / 2 || 1;
  const yawRatio = Math.max(-1, Math.min(1, (noseBridge.x - cheekMidX) / halfFaceWidth));

  // Average adult face (cheek-to-cheek) width is ~135-145mm; use it to turn
  // pixel measurements into an approximate real-world PD. This is a stylistic
  // estimate, not a clinical measurement.
  const ASSUMED_FACE_WIDTH_MM = 140;
  const mmPerPx = faceWidthPx > 0 ? ASSUMED_FACE_WIDTH_MM / faceWidthPx : 0;
  const estimatedPdMm = Math.round(eyeDistancePx * mmPerPx);

  return {
    eyeCenter,
    noseBridge,
    eyeDistancePx,
    faceWidthPx,
    faceHeightPx,
    jawWidthPx,
    foreheadWidthPx,
    rollDeg,
    yawRatio,
    estimatedPdMm,
  };
}

/**
 * Mirrors face metrics horizontally around a frame of the given width.
 * Used when freezing a snapshot of a mirrored (selfie-view) front camera
 * feed, since detection runs on the raw, un-mirrored video frame.
 */
export function mirrorFaceMetrics(metrics: FaceMetrics, frameWidth: number): FaceMetrics {
  return {
    ...metrics,
    eyeCenter: { x: frameWidth - metrics.eyeCenter.x, y: metrics.eyeCenter.y },
    noseBridge: { x: frameWidth - metrics.noseBridge.x, y: metrics.noseBridge.y },
    rollDeg: -metrics.rollDeg,
    yawRatio: -metrics.yawRatio,
  };
}
