# Virtual Try-On fix — 2026-09-29

## Fixed issue visible in live camera
The temple/side arm was being mapped from source-video coordinates to display coordinates twice.
That second mapping multiplied the position by the `object-cover` scale again, so the arm appeared around the neck while the actual glasses frame was not aligned with the face.

### Correct pipeline
1. MediaPipe landmarks are measured in video pixels.
2. `mapMetricsToDisplay()` converts landmarks exactly once to CSS/display pixels.
3. `computeGlassesTransform()` and `drawGlasses()` consume those display-space metrics directly.
4. Canvas DPR is handled by the canvas context transform, not by remapping landmark coordinates.

## Files changed
- `src/lib/virtualTryOnEngine.ts`

## Notes
The renderer still uses MediaPipe 3D face landmarks, IPD-based scaling, yaw/pitch/roll perspective approximation, temple/ear anchors and occlusion clipping. No GLTF/OBJ model is required.

Run locally after extracting:

```bash
npm install
npm start
```

---
# Fix 3 — front frame not drawn (2026-09-29)

**Root cause:** `affineTriangle()` in `src/lib/virtualTryOnEngine.ts` called `ctx.setTransform(a,b,c,d,e,f)`.
`setTransform` REPLACES the current matrix, discarding the canvas DPR scale set in `GlassesAROverlay`.
The clip triangle was built in DPR space but the image was drawn in raw canvas pixels, so on any screen with
`devicePixelRatio != 1` (e.g. Windows 125%) they did not overlap and the front frame vanished
(only tiny slivers/dots were left). Fixed by using `ctx.transform(...)` (multiplies onto the current matrix).

**Also:**
- `computeGlassesTransform`: guards against NaN / zero size (min 40px) and falls back to a plain rotated rect.
- `drawSoftShadow`: removed per-triangle `blur()` filter (very slow at 128 triangles/frame); translate now works.

---
# Fix 4 — scale, temple arms, pivot (2026-09-29)

**Scale** (`faceGeometry.ts`, `virtualTryOnEngine.ts`, `GlassesAROverlay.tsx`)
- Old width = 2D iris distance x 2.12. 2D distance shrinks by cos(yaw) AND the quad applied cos(yaw) again (double shrink),
  and a `height <= 1.12*PD` cap shrank tall frames (aviator/round) => "balloon / sliver" between products/frames.
- New `frameWidthPx` = 0.55 x (cheek/temple width #234-#454, 3D, x0.98) + 0.45 x (3D PD x 2.2). Falls back to temple width if the two disagree >25%.
- Height cap relaxed to 1.9 x PD (only guards bad crops). `tryOnFitMultiplier` is now a trim relative to 2.12.
- Overlay: NaN frames rejected, adaptive (1-Euro style) smoothing, and a per-frame rate limit (-11%/+12%) on scale.

**Temple arms**
- Start at the projected frame hinge corner (quad u=0.03/0.97, v=0.30) instead of the eye corner; end at the ear anchor (#127/#234 blend).
- Removed the head-ellipse even-odd clip that erased the arm and left a stub.
- Minimum outward run (0.16 x frame width) and slope clamp so the arm is visible frontally; far arm shortens with yaw, near arm lengthens; pitch bends the curve.
- Arm colour is sampled from the frame image (fallback: name-based colour).

**Pivot**
- Bridge point = midpoint of #168 and #6. Image bridge (centre-x, 40% height) is pinned to it; X = 75% bridge + 25% eye centre,
  Y = 70% bridge + 30% pupil-aligned. Rotation (roll/yaw/pitch) is around this pivot.
- `tryOnVerticalOffset` now = extra downward shift in PD units relative to the old 0.16 default (0.16 => no shift).

---
# Fix 5 — frame + arms as ONE rigid object (2026-09-29)

Symptoms: arms detached from the frame, floating on the eyebrow/forehead, pointing up.

- **One pose for everything** (`computeGlassesTransform`): frame corners AND hinges are projected through the same
  roll / yaw / pitch / perspective, pivoting on the nose bridge. `transform.hinges` is what the arms start from,
  so arms cannot separate from the frame.
- **Frame image analysis** (`analyzeFrameImage`, cached per image): reads the alpha mask to find the real bridge, lens centres
  and outer hinge corners. Old code assumed hinge = 30% from top and bridge = 40%, which put hinges on the brow for frames
  with tall/margined PNGs.
- **Vertical anchor**: pupil line = 60% iris centres + 40% outer eye corners (#33/#263); bridge landmark (#168/#6) only
  nudges it and is clamped to <= 0.30 PD above the pupil line, so a mislocated landmark can't lift the frame onto the eyebrow.
- **Arm direction** is expressed in the glasses' own rolled frame: outward + downward toward the ear anchor
  (#127/#234 blend), drop clamped to >= -0.10 x run (never climbs), far arm hidden when the head turns.
- **Pose** (`faceGeometry.ts`): yaw/pitch in radians from the 3D landmark axes, refined by MediaPipe's
  `facialTransformationMatrixes` (already enabled in `faceLandmarkerLoader.ts`, now passed from `useFaceTracking`). Matrix axis
  convention is auto-detected against the landmark axes; falls back to landmarks if they disagree.
- **Scale**: median of PD x2.2, cheek width x0.98, outer-eye-corner distance x1.55 (all 3D).

---
# Fix 5 — AI lens-centre fit on the real product photo (2026-09-29)

**Goal:** draw the REAL product photo (never a regenerated image) and pin it exactly to the face.

- `virtualTryOnEngine.ts`: `FrameAnchors` now carries `lensL/lensR` (lens centres of the product photo).
  `computeGlassesTransform` pins the lens-centre midpoint to the pupil midpoint and sets
  scale = 3D pupil distance / lens-centre span (clamped to 0.7-1.35x of the old face-width estimate).
  Roll = average of pupil-line roll and outer-canthus roll (paired by screen x, clamped +-40 deg).
- Lens centres come from (1) Gemini reading of the product photo (`setAiFrameAnchors`), else
  (2) enclosed transparent lens openings found in the alpha mask, else (3) 27%/73% defaults.
- New `src/lib/frameAiAnchors.ts`: one Gemini call per product, cached in localStorage
  (`vto-ai:v1:...`), validated (confidence, front-facing, lens span/levelness) before use. Failure => pixel anchors.
- `GlassesAROverlay.tsx` triggers it after the asset is prepared.
- Added missing `VtoAssetAnalysis` type (types.ts) and `fetchImageViaBackend` (productApi.ts);
  `geminiVtoClient.ts` did not compile without them.

Note: temple arms are still drawn from hinge -> ear in the frame's sampled colour (a front photo has no arm pixels).

---
# Fix 6 — tilted / arm-spread catalog photos (2026-09-29)
Some product photos are tilted and show the temple arms spread out; both were pasted onto the face
(tilted frame + long arm lines floating above the forehead). `frameAiAnchors.planNormalization` uses the
AI reading to de-rotate the photo until the lenses are level and crop to the FRONT of the frame only
(rotate + crop of the real pixels; nothing is regenerated). Console shows `[VTO] AI analysis for ...`.
Requires VITE_GEMINI_API_KEY; without AI the old alpha-mask anchors are used (no de-rotation).

---
# Fix 7 — AI tilt error on level photos (2026-09-29)
Regression: an AI lens box a few % off in height was turned into a ~10 deg photo tilt and applied to an already
level product photo ("test"). Now (a) lens openings measured from the alpha mask (`holes`) override the AI boxes for
position/tilt when available, (b) `computeGlassesTransform` levels any remaining photo tilt at draw time from the
lens line (no canvas work, |tilt| < 35 deg), and lens span uses the true centre-to-centre distance.

---
# Fix 8 — uploaded-photo path uses the same AI fit as the live camera (2026-09-29)
`FrozenPhotoView` (Upload tab / frozen photo) only used alpha-mask anchors: it never ran `loadAiAnchors`, and ignored
the product's `tryOnFitMultiplier` / `tryOnVerticalOffset`. It now draws immediately with pixel anchors, then redraws when
the AI anchors / normalized asset arrive. `product` is passed VirtualTryOnModal -> UploadView -> FrozenPhotoView.
Files: FrozenPhotoView.tsx, UploadView.tsx, VirtualTryOnModal.tsx (applied on top of Fix 7).

---
# Fix 9 — frame centre follows the nose bridge (2026-09-29)
`computeGlassesTransform`: anchor X = pupil midpoint nudged 35% toward the bridge landmark (max 0.12 x PD), so the
frame's bridge sits on the nose when the head is slightly turned. Frontal faces are essentially unchanged.

---
# Fix 10 — stray arm remnants floating above the forehead (2026-09-29)
Screenshot: thin tan lines from the catalog photo (leftover temple-arm pixels) drawn on the forehead / beside the frame.
`frontOnlyImage()` (virtualTryOnEngine.ts): from the two lens openings in the alpha mask, keep only the frame FRONT
(lens boxes + 32% width / 30% height margin) and clear everything else before drawing. Real pixels only; cached per image;
falls back to the original when the lenses cannot be measured. Used by drawGlasses for both shadow and frame.

---
# Fix 11 — floating remnants removed even when lenses can't be measured (2026-09-29)
`frontOnlyImage` now first runs a connected-component filter on the alpha mask: the main frame body is kept, and opaque
fragments disconnected from it and outside its bounding box (floating arm remnants) are erased (dilated 2px). The lens-box
clip from Fix 10 is applied on top when both lens openings are found. Tested in headless Chromium on a synthetic frame:
2 floating lines fully removed, frame pixels unchanged.
Known limit: arms that are CONNECTED to the frame or cross the lenses in the catalog photo (angled product photo) stay;
that product needs a front-facing transparent PNG.

---
# Fix 12 — commercial-looking 2D finish (2026-09-29)
Goal: look like other 2D/3D try-on sites (Essilor) without 3D models.
- Temple arms: only the first 42% toward the ear is drawn and it fades to transparent, so the arm reads as tucking behind
  the cheek/hair instead of a long line crossing headphones/hair.
- Contact shadow scales with frame width (was fixed 3px) and is softer.
- Faint lens glare (10% white radial, top-left of each lens). Disable with drawGlasses(..., { lensGlare: false }).
Verified with a synthetic face render in headless Chromium (frame level/symmetric, floating remnants gone).

---
# Fix 13 — tilted product photo levelled without needing the AI (2026-09-29)
Screenshot (product "test"): frame drawn tilted because the catalog photo is tilted. The lens-line tilt (Fix 7) is 0 when
lens holes can't be measured (default anchors) and the AI reading needs VITE_GEMINI_API_KEY, so nothing levelled the photo.
- `symmetryTilt(image)` (virtualTryOnEngine.ts): finds the rotation that makes the frame's alpha mask most left/right
  symmetric (works on the front-only mask). No key, no lens holes needed. Console: `[VTO] product photo tilt (symmetry)`.
- `computeGlassesTransform` uses it when score > 0.50, and it overrides the lens-line tilt if lens position is unknown
  (default anchors) or the two disagree by > ~3 deg. AI-normalized photos are already level, so the estimate is ~0 there.
- The existing AI path (Fix 6/7) is unchanged and still preferred when it works: set VITE_GEMINI_API_KEY in .env.
Tested in headless Chromium: photos rotated 0 / +12 / -15 deg all draw level on a level face (estimator error < 0.75 deg
on 5 angles between -20 and +15 deg).
