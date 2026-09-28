# TATOE Optical — 2D AI Eyewear Virtual Try-On

This VTO path does not create or render a 3D glasses model.

## Pipeline

1. Admin uploads a real product image or supplies a public image URL.
2. Admin can click `AI วิเคราะห์รูปแว่น` once. The backend sends only that product image to Gemini and receives normalized geometry for the actual frame (bounding box, bridge, lens regions, temple points, confidence).
3. The geometry is stored in `group_products.vto_asset_json` together with the product. The product image remains the source image; the renderer does not generate a substitute frame.
4. If `GEMINI_API_KEY` is not configured or the AI request fails, the admin UI falls back to a local image analysis so the product can still be used.
5. During live camera use, MediaPipe Face Landmarker runs locally in the browser. It tracks iris/eye center, nose bridge, roll, yaw and pitch. The live video is not sent to the AI endpoint.
6. Canvas 2D places the exact product image using IPD-based scaling, bridge anchoring, smoothing and 2D perspective compression. No GLB/GLTF model is rendered.

## AI configuration

Set this in `backend/.env`:

```env
GEMINI_API_KEY=your_key_here
```

The AI endpoint is admin-protected at `POST /api/vto/analyze-glasses`.

## SQL

Existing databases are auto-migrated with `vto_asset_json`. New products can save the AI geometry directly in the same SQL row as the catalog image.

## Important limitation

A single front product image cannot reveal the hidden side of a temple perfectly. The 2D engine therefore preserves the exact uploaded model and applies a controlled 2D perspective approximation for yaw/pitch. For higher fidelity at large head turns, provide additional product views (left/right/back) and store separate 2D assets per view.
