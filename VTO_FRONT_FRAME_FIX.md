# VTO Front Frame Fix

This revision fixes the Virtual Try-On path where only temple/side arms were visible or the front frame disappeared.

## What changed

- Product candidates are loaded from `images[]` and `overlayImage` and scored by visible central/front-frame coverage.
- A legacy temple-only asset no longer wins simply because it appears first in the array.
- `PreparedEyewearAsset` reports `frontCoverage` and `needsFrontFrameFallback`.
- The renderer draws the actual product PNG first.
- When the selected asset is side/temple-only, a front-frame fallback is rendered from the live eye landmarks and nose bridge. This guarantees visible lens rims and bridge without a GLTF/OBJ model.
- The fallback uses the product shape when available and uses the real product color.
- Eye centers are ordered by screen X so mirrored camera mode cannot invert the bridge geometry.
- The main PNG anchor now uses both the eye line and MediaPipe landmark #168 (`NOSE_BRIDGE`) to keep the front frame on the nose/eyes.
- PD/IPD remains the scale reference.

## Important

This is intentionally a 2D/Computer-Vision fallback. It does not replace the product's texture when a valid full-frame PNG exists; it only guarantees a front frame when the supplied asset is incomplete.
