# Virtual Try-On 2D AI renderer

The current VTO path is intentionally **model-free**: it does not require a
`.gltf`, `.glb` or `.obj` file for each frame.

### Runtime pipeline

1. MediaPipe Face Landmarker detects the 478-point face mesh on the camera's
   native video frame.
2. `faceGeometry.ts` derives:
   - eye/IPD pixel distance
   - roll
   - 3D-landmark yaw
   - 3D-landmark pitch
   - ear anchors
   - estimated PD in mm (optical estimate, not a clinical measurement)
3. The live renderer keeps the latest metrics in a mutable ref so the
   animation loop does not wait for React state updates.
4. `virtualTryOnEngine.ts` projects the transparent product PNG into a
   perspective quadrilateral and subdivides it into small affine triangles.
   This provides a practical 2D approximation of perspective warp.
5. The product image is prepared once per selection: border background is
   removed, the visible pixels are cropped, and the result is cached for the
   render loop.
6. Temple arms are extended toward MediaPipe ear anchors. A head-volume
   even-odd clip hides the inner/behind-ear part, while yaw shortens the far
   temple.
7. A low-opacity blurred shadow is composited before the frame to reduce the
   pasted-on appearance.

### Calibration

`eyeDistancePx` is the primary scale source. `estimatedPdMm` is displayed as an
approximation using an assumed 140 mm average face width. For a true physical
PD measurement, add a calibration step using a known-size reference object or
the user's measured PD; a webcam alone cannot guarantee clinical millimetre
accuracy.

### Product fields

Existing `overlayImage` remains the preferred asset. The renderer falls back
to `images[0]`.

Optional front-frame calibration:

```ts
tryOnFitMultiplier?: number;
tryOnVerticalOffset?: number;
tryOnTempleLength?: number;
```

No 3D eyewear model is required by this renderer.
