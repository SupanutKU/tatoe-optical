import type { FaceMetrics } from './faceGeometry';

export interface GlassesTransform {
  /** Center X of the glasses image in canvas pixels. */
  x: number;
  /** Center Y of the glasses image in canvas pixels. */
  y: number;
  /** Rendered width in canvas pixels. */
  width: number;
  /** Rendered height in canvas pixels. */
  height: number;
  /** Rotation to apply, in degrees. */
  rotationDeg: number;
  /** Horizontal squeeze (1 = none) applied to fake perspective as the head turns. */
  perspectiveScaleX: number;
  opacity: number;
}

export interface VirtualTryOnEngineInput {
  metrics: FaceMetrics;
  /** Natural pixel size of the glasses asset, used to preserve its aspect ratio. */
  glassesNaturalWidth: number;
  glassesNaturalHeight: number;
  /**
   * How much wider than the measured eye-to-eye distance the glasses should
   * render, since real frames extend past the outer corners of the eyes.
   * ~1.9-2.3 looks right for most frame styles.
   */
  fitMultiplier?: number;
  /** Nudges the vertical seat of the frame relative to the eye line (in eye-distance units). */
  verticalOffsetRatio?: number;
  /**
   * Upper bound on rendered height, as a multiple of eye distance. Product
   * photos are rarely cropped tight to the frame the way a real cutout would
   * be, so without this a near-square source photo would render as an
   * oversized block spanning eyebrows to chin. Aspect ratio is preserved —
   * this only scales the whole image down, never stretches it.
   */
  maxHeightToEyeDistanceRatio?: number;
}

/**
 * Central, framework-agnostic engine that turns detected face geometry into
 * a 2D draw transform for the currently selected glasses image. Kept as a
 * pure function so it can be unit-tested and reused by both the live camera
 * overlay and the static "uploaded photo" overlay.
 */
export function computeGlassesTransform({
  metrics,
  glassesNaturalWidth,
  glassesNaturalHeight,
  fitMultiplier = 1.9,
  verticalOffsetRatio = 0.12,
  maxHeightToEyeDistanceRatio = 1.05,
}: VirtualTryOnEngineInput): GlassesTransform {
  const aspect = glassesNaturalHeight / Math.max(1, glassesNaturalWidth);

  let width = metrics.eyeDistancePx * fitMultiplier;
  let height = width * aspect;

  // Keep the whole image proportionally scaled down (never stretched) if the
  // source photo's aspect ratio would otherwise make it render too tall.
  const maxHeight = metrics.eyeDistancePx * maxHeightToEyeDistanceRatio;
  if (height > maxHeight) {
    const shrink = maxHeight / height;
    width *= shrink;
    height *= shrink;
  }

  // Seat the frame slightly below the eye line, biased toward the nose
  // bridge landmark so the bridge of the glasses lines up with the nose.
  const x = metrics.eyeCenter.x * 0.5 + metrics.noseBridge.x * 0.5;
  const y =
    metrics.eyeCenter.y * (1 - verticalOffsetRatio) +
    metrics.noseBridge.y * verticalOffsetRatio;

  // Subtle perspective cue: as the head turns (yaw), compress the far side
  // slightly by squeezing horizontal scale a little — cheap but effective
  // stand-in for true 3D perspective without a full 3D model.
  const perspectiveScaleX = 1 - Math.min(0.18, Math.abs(metrics.yawRatio) * 0.22);

  return {
    x,
    y,
    width,
    height,
    rotationDeg: metrics.rollDeg,
    perspectiveScaleX,
    opacity: 1,
  };
}

/** Draws the glasses image onto a 2D canvas context using the computed transform. */
export function drawGlasses(
  ctx: CanvasRenderingContext2D,
  image: CanvasDrawable,
  transform: GlassesTransform
): void {
  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.rotate((transform.rotationDeg * Math.PI) / 180);
  ctx.scale(transform.perspectiveScaleX, 1);
  ctx.globalAlpha = transform.opacity;
  // "multiply" is a practical stand-in for a real alpha cutout: white/light
  // photo backgrounds multiply out to (almost) nothing against the video
  // frame behind them, while the darker frame lines stay visible. Falls back
  // to normal compositing automatically if a browser ever ignores the mode.
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(
    image,
    -transform.width / 2,
    -transform.height / 2,
    transform.width,
    transform.height
  );
  ctx.restore();
}

// Anything drawImage() accepts.
type CanvasDrawable = CanvasImageSource;
