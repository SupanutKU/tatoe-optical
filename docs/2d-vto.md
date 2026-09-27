# 2D Eyewear Virtual Try-On

This build uses MediaPipe Face Landmarker for real-time face landmarks and a transparent Canvas overlay for the eyewear asset.

## Flow

1. Product image can come from the SQL product (`tryOnAssets.front` / `overlayImage` / `images[0]`) or from the new VTO asset picker.
2. The asset picker accepts a local image file or a public image URL.
3. `prepareEyewearAsset()` performs conservative border-background removal and crops to the non-transparent eyewear pixels.
4. Face landmarks provide iris centers, nose bridge, roll, approximate yaw and pitch, plus estimated ear targets.
5. The renderer scales from eye distance (IPD), anchors to the eye/nose bridge, applies roll/yaw/pitch perspective, and adds a temple-to-ear assist.
6. If the product has `tryOnAssets.left` / `right`, those are selected when the head turns; otherwise the front asset is perspective-compressed.

## Cross-origin URLs

A remote image URL must allow CORS for browser-side canvas processing. If the image server blocks CORS, use a local upload or proxy the asset through your own backend.

## Product data

Optional fields:

```ts
tryOnAssets?: { front?: string; left?: string; right?: string; back?: string };
tryOnFitMultiplier?: number;
tryOnVerticalOffset?: number;
tryOnTempleLength?: number;
```

`tryOnAssets` is intentionally optional so existing SQL products continue to work. The front asset falls back to `overlayImage`, then `images[0]`.
