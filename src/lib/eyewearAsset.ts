export interface PreparedEyewearAsset {
  source: string;
  dataUrl: string;
  width: number;
  height: number;
  image: HTMLImageElement;
}

export interface EyewearAssetOptions {
  maxDimension?: number;
  backgroundThreshold?: number;
  feather?: number;
}

function loadImage(source: string, useCors = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (useCors) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('ไม่สามารถโหลดรูปแว่นได้ — ถ้าเป็น URL ต้องเปิด CORS จากต้นทาง'));
    image.src = source;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('อ่านไฟล์รูปแว่นไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}

function colorDistance(a: [number, number, number], b: [number, number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * Browser-only background removal for product photos.
 *
 * Studio/phone photos rarely have a perfectly flat backdrop: they carry soft
 * gradients and cast shadows, so comparing every pixel to ONE sampled corner
 * colour leaves a faint box (or, when the corners differ, skips removal
 * entirely). Instead this flood-fills from the image border and lets the fill
 * travel across pixels that are similar to the pixel it came from (smooth
 * shading / soft shadows), while still requiring them to stay within a wider
 * tolerance of the border colours. Sharp frame edges stop the fill. Finally,
 * enclosed pixels that match the removed backdrop colour (the backdrop seen
 * through the lenses) are cleared too. White lenses / highlights on the frame
 * survive because they must match the backdrop colour AND, for the interior
 * pass, be nearly identical to it.
 */
export function removeBorderBackground(canvas: HTMLCanvasElement, threshold: number, feather: number) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  const { width, height } = canvas;
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  // A PNG cutout already has an alpha background. Its transparent RGB values
  // are often black; treating those as a backdrop erases black frame rims.
  let borderPixels = 0, transparentBorder = 0;
  for (let x=0;x<width;x++) for (const y of [0,height-1]) {
    borderPixels++; if(data[(y*width+x)*4+3]<20) transparentBorder++;
  }
  for(let y=1;y<height-1;y++) for(const x of [0,width-1]) {
    borderPixels++; if(data[(y*width+x)*4+3]<20) transparentBorder++;
  }
  if (transparentBorder > borderPixels * 0.75) return;
  const px = (i: number): [number, number, number] => [data[i], data[i + 1], data[i + 2]];

  // Border colour model: mean colour of the outer ring of pixels.
  let sr = 0, sg = 0, sb = 0, sn = 0;
  const addBorder = (x: number, y: number) => { const i = (y * width + x) * 4; sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; sn++; };
  for (let x = 0; x < width; x++) { addBorder(x, 0); addBorder(x, height - 1); }
  for (let y = 1; y < height - 1; y++) { addBorder(0, y); addBorder(width - 1, y); }
  const bg: [number, number, number] = [sr / sn, sg / sn, sb / sn];

  const stepTol = Math.max(8, threshold * 0.32);   // neighbour-to-neighbour change allowed (soft gradients)
  const wideTol = threshold * 1.9;                  // how far from the reference colour the fill may drift

  const total = width * height;
  const removed = new Uint8Array(total);
  const seen = new Uint8Array(total);
  const queue = new Int32Array(total);

  // Gradient-tolerant flood fill. Marks reached pixels in `removed` and
  // returns their mean colour and count.
  const flood = (seeds: number[], ref: [number, number, number]) => {
    seen.set(removed);
    let head = 0, tail = 0;
    for (const idx of seeds) { if (!seen[idx]) { seen[idx] = 1; queue[tail++] = idx; } }
    let rr = 0, rg = 0, rb = 0;
    while (head < tail) {
      const idx = queue[head++];
      const x = idx % width, y = (idx - x) / width;
      const here = px(idx * 4);
      removed[idx] = 1;
      rr += here[0]; rg += here[1]; rb += here[2];
      const tryPush = (nx: number, ny: number) => {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
        const nidx = ny * width + nx;
        if (seen[nidx]) return;
        const nrgb = px(nidx * 4);
        if (colorDistance(nrgb, here) <= stepTol && colorDistance(nrgb, ref) <= wideTol) {
          seen[nidx] = 1; queue[tail++] = nidx;
        }
      };
      tryPush(x + 1, y); tryPush(x - 1, y); tryPush(x, y + 1); tryPush(x, y - 1);
    }
    const n = Math.max(1, tail);
    return { mean: [rr / n, rg / n, rb / n] as [number, number, number], count: tail };
  };

  // Pass 1: from the image border.
  const borderSeeds: number[] = [];
  const consider = (x: number, y: number) => {
    const idx = y * width + x;
    if (colorDistance(px(idx * 4), bg) <= wideTol) borderSeeds.push(idx); // skip border pixels that are clearly frame
  };
  for (let x = 0; x < width; x++) { consider(x, 0); consider(x, height - 1); }
  for (let y = 1; y < height - 1; y++) { consider(0, y); consider(width - 1, y); }
  const first = flood(borderSeeds, bg);
  if (first.count < total * 0.05) return; // barely moved: not a plain backdrop, leave the image alone

  // Pass 2: enclosed backdrop (seen through the lenses, possibly shadowed).
  const avg = first.mean;
  const tight = Math.max(10, threshold * 0.55);
  const interiorSeeds: number[] = [];
  for (let idx = 0; idx < total; idx++) {
    if (!removed[idx] && colorDistance(px(idx * 4), avg) <= tight) interiorSeeds.push(idx);
  }
  if (interiorSeeds.length) flood(interiorSeeds, avg);

  // Alpha: removed -> transparent; soft halo for near-backdrop leftovers.
  for (let idx = 0; idx < total; idx++) {
    const i = idx * 4;
    if (removed[idx]) { data[i + 3] = 0; continue; }
    const d = colorDistance(px(i), avg);
    if (d <= tight + feather) data[i + 3] = Math.round(data[i + 3] * Math.max(0, (d - tight) / Math.max(1, feather)));
  }
  ctx.putImageData(image, 0, 0);
}

/**
 * Cleans a product photo after background removal:
 *  1. drops small detached blobs (mirror reflections / shadows under the lenses, specks);
 *  2. makes big, compact, light-grey blobs see-through — that is the "film" of a clear lens.
 *     A frame ring is thin/elongated so it never passes the compactness test, which keeps
 *     white or silver frames intact.
 */
export function cleanEyewearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const total = w * h;
  const OPAQUE = 40;

  const label = new Int32Array(total);
  const queue = new Int32Array(total);
  const labelComponents = (inMask: (idx: number) => boolean) => {
    label.fill(0);
    const areas: number[] = [0];
    for (let start = 0; start < total; start++) {
      if (label[start] || !inMask(start)) continue;
      const id = areas.length;
      let head = 0, tail = 0, area = 0;
      label[start] = id; queue[tail++] = start;
      while (head < tail) {
        const idx = queue[head++]; area++;
        const x = idx % w;
        if (x > 0 && !label[idx - 1] && inMask(idx - 1)) { label[idx - 1] = id; queue[tail++] = idx - 1; }
        if (x < w - 1 && !label[idx + 1] && inMask(idx + 1)) { label[idx + 1] = id; queue[tail++] = idx + 1; }
        if (idx >= w && !label[idx - w] && inMask(idx - w)) { label[idx - w] = id; queue[tail++] = idx - w; }
        if (idx < total - w && !label[idx + w] && inMask(idx + w)) { label[idx + w] = id; queue[tail++] = idx + w; }
      }
      areas.push(area);
    }
    return areas;
  };

  // 1) detached blobs
  const areas = labelComponents((i) => d[i * 4 + 3] > OPAQUE);
  const largest = Math.max(0, ...areas);
  if (largest === 0) return;
  const minKeep = Math.max(largest * 0.06, total * 0.0008);
  for (let i = 0; i < total; i++) {
    const id = label[i];
    if (id && areas[id] < minKeep) d[i * 4 + 3] = 0;
  }

  // 1b) reflections / cast shadows under the frame: light, neutral pixels that sit below the
  //     lowest dark-or-coloured (= frame/tinted lens) pixel of their own column are not part of the glasses.
  {
    const isCore = (o: number) => {
      const r = d[o], g = d[o + 1], b = d[o + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.35 || (mx ? (mx - mn) / mx : 0) > 0.25;
    };
    const lowestCore = new Int32Array(w).fill(-1);
    let coreCount = 0, opaqueCount = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (d[o + 3] <= OPAQUE) continue;
      opaqueCount++;
      if (isCore(o)) { coreCount++; lowestCore[x] = y; }
    }
    if (opaqueCount > 0 && coreCount >= opaqueCount * 0.015) { // skip silver/white frames that have no dark core
      const margin = Math.max(2, Math.round(h * 0.006));
      for (let x = 0; x < w; x++) {
        const cut = lowestCore[x];
        if (cut < 0) continue;
        for (let y = cut + margin; y < h; y++) {
          const o = (y * w + x) * 4;
          if (d[o + 3] <= 0) continue;
          const r = d[o], g = d[o + 1], b = d[o + 2];
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          if ((0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.45 && (mx ? (mx - mn) / mx : 0) < 0.2) d[o + 3] = 0;
        }
      }
    }
  }

  // 2) clear-lens film: large, compact, light and neutral
  const isLightNeutral = (i: number) => {
    const o = i * 4;
    if (d[o + 3] <= OPAQUE) return false;
    const r = d[o], g = d[o + 1], b = d[o + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.5 && (mx === 0 ? 0 : (mx - mn) / mx) < 0.18;
  };
  const blobAreas = labelComponents(isLightNeutral);
  const perimeter = new Int32Array(blobAreas.length);
  for (let i = 0; i < total; i++) {
    const id = label[i];
    if (!id) continue;
    const x = i % w;
    if (x === 0 || x === w - 1 || i < w || i >= total - w || label[i - 1] !== id || label[i + 1] !== id || label[i - w] !== id || label[i + w] !== id) perimeter[id]++;
  }
  const isLens = blobAreas.map((a, id) => id > 0 && a >= total * 0.015 && a / Math.max(1, perimeter[id]) ** 2 > 0.03);
  for (let i = 0; i < total; i++) {
    const id = label[i];
    if (id && isLens[id]) d[i * 4 + 3] = Math.round(d[i * 4 + 3] * 0.1);
  }
  ctx.putImageData(img, 0, 0);
}

export function cropToAlphaWithOffset(canvas: HTMLCanvasElement): { canvas: HTMLCanvasElement; offsetX: number; offsetY: number } {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { canvas, offsetX: 0, offsetY: 0 };
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = image.data;
  let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (d[(y * canvas.width + x) * 4 + 3] > 40) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0) return { canvas, offsetX: 0, offsetY: 0 };
  const pad = Math.max(2, Math.round(Math.min(canvas.width, canvas.height) * 0.015));
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(canvas.width - 1, maxX + pad); maxY = Math.min(canvas.height - 1, maxY + pad);
  const out = document.createElement('canvas');
  out.width = maxX - minX + 1; out.height = maxY - minY + 1;
  out.getContext('2d')?.drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return { canvas: out, offsetX: minX, offsetY: minY };
}

export function cropToAlpha(canvas: HTMLCanvasElement): HTMLCanvasElement {
  return cropToAlphaWithOffset(canvas).canvas;
}

function canvasToDataUrl(canvas: HTMLCanvasElement) {
  return canvas.toDataURL('image/png');
}

export async function prepareEyewearAsset(source: string, options: EyewearAssetOptions = {}): Promise<PreparedEyewearAsset> {
  let image: HTMLImageElement;
  try {
    image = await loadImage(source, true);
  } catch {
    // Some product/CDN URLs intentionally omit CORS. The browser can still
    // display and draw that image; only canvas readback is restricted.
    image = await loadImage(source, false);
  }
  const maxDimension = options.maxDimension ?? 1400;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Product images can come from a merchant CDN. The <img> itself may load
  // correctly while the CDN still blocks canvas readback (CORS). In that case
  // do NOT discard the asset: a Canvas can draw a cross-origin image without
  // reading it back. We use the original image as a safe rendering fallback.
  if (!ctx) {
    return { source, dataUrl: source, width: image.naturalWidth, height: image.naturalHeight, image };
  }

  try {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    removeBorderBackground(canvas, options.backgroundThreshold ?? 42, options.feather ?? 24);
    const cropped = cropToAlpha(canvas);

    // A broken/over-aggressive background pass can produce an empty canvas.
    // Never let that make the AR frame disappear; fall back to the source.
    const alpha = cropped.getContext('2d', { willReadFrequently: true })?.getImageData(0, 0, cropped.width, cropped.height).data;
    let opaquePixels = 0;
    if (alpha) {
      for (let i = 3; i < alpha.length; i += 4) {
        if (alpha[i] > 24) opaquePixels++;
      }
    }
    if (opaquePixels < Math.max(24, cropped.width * cropped.height * 0.002)) {
      return { source, dataUrl: source, width: image.naturalWidth, height: image.naturalHeight, image };
    }

    const dataUrl = canvasToDataUrl(cropped);
    const processedImage = await loadImage(dataUrl);
    return { source, dataUrl, width: cropped.width, height: cropped.height, image: processedImage };
  } catch {
    // Most commonly this is a SecurityError caused by a remote image without
    // Access-Control-Allow-Origin. Rendering the original image is still valid
    // and is preferable to showing no glasses at all.
    return { source, dataUrl: source, width: image.naturalWidth, height: image.naturalHeight, image };
  }
}

export async function prepareEyewearFile(file: File, options?: EyewearAssetOptions) {
  if (!file.type.startsWith('image/')) throw new Error('กรุณาเลือกไฟล์รูปภาพของแว่นเท่านั้น');
  const dataUrl = await fileToDataUrl(file);
  return prepareEyewearAsset(dataUrl, options);
}
