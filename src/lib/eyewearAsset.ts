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

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
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
 * Conservative browser-only background removal. It flood-fills pixels connected
 * to the image border when their color is close to the sampled corner background.
 * This is intentionally safer than deleting every white pixel because white
 * lenses and frame highlights must remain intact.
 */
function removeBorderBackground(canvas: HTMLCanvasElement, threshold: number, feather: number) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  const { width, height } = canvas;
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const sample = (x: number, y: number): [number, number, number] => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const corners = [sample(0, 0), sample(width - 1, 0), sample(0, height - 1), sample(width - 1, height - 1)];
  const bg: [number, number, number] = [
    corners.reduce((s, c) => s + c[0], 0) / corners.length,
    corners.reduce((s, c) => s + c[1], 0) / corners.length,
    corners.reduce((s, c) => s + c[2], 0) / corners.length,
  ];

  // Only attempt removal when the corners look like a fairly uniform backdrop.
  const cornerSpread = Math.max(...corners.map(c => colorDistance(c, bg)));
  if (cornerSpread > threshold * 1.25) return;

  const seen = new Uint8Array(width * height);
  const queueX = new Int32Array(width * height);
  const queueY = new Int32Array(width * height);
  let head = 0, tail = 0;
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (seen[idx]) return;
    seen[idx] = 1;
    queueX[tail] = x; queueY[tail] = y; tail++;
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 1; y < height - 1; y++) { push(0, y); push(width - 1, y); }

  while (head < tail) {
    const x = queueX[head];
    const y = queueY[head++];
    const i = (y * width + x) * 4;
    const rgb: [number, number, number] = [data[i], data[i + 1], data[i + 2]];
    const d = colorDistance(rgb, bg);
    if (d <= threshold) {
      data[i + 3] = 0;
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    } else if (d <= threshold + feather) {
      data[i + 3] = Math.min(data[i + 3], Math.round(((d - threshold) / Math.max(1, feather)) * data[i + 3]));
    }
  }
  ctx.putImageData(image, 0, 0);
}

function cropToAlpha(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = image.data;
  let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (d[(y * canvas.width + x) * 4 + 3] > 18) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0) return canvas;
  const pad = Math.max(2, Math.round(Math.min(canvas.width, canvas.height) * 0.015));
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(canvas.width - 1, maxX + pad); maxY = Math.min(canvas.height - 1, maxY + pad);
  const out = document.createElement('canvas');
  out.width = maxX - minX + 1; out.height = maxY - minY + 1;
  out.getContext('2d')?.drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

function canvasToDataUrl(canvas: HTMLCanvasElement) {
  return canvas.toDataURL('image/png');
}

export async function prepareEyewearAsset(source: string, options: EyewearAssetOptions = {}): Promise<PreparedEyewearAsset> {
  const image = await loadImage(source);
  const maxDimension = options.maxDimension ?? 1400;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('ไม่สามารถเตรียม canvas สำหรับรูปแว่นได้');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  removeBorderBackground(canvas, options.backgroundThreshold ?? 42, options.feather ?? 24);
  const cropped = cropToAlpha(canvas);
  const dataUrl = canvasToDataUrl(cropped);
  const processedImage = await loadImage(dataUrl);
  return { source, dataUrl, width: cropped.width, height: cropped.height, image: processedImage };
}

export async function prepareEyewearFile(file: File, options?: EyewearAssetOptions) {
  if (!file.type.startsWith('image/')) throw new Error('กรุณาเลือกไฟล์รูปภาพของแว่นเท่านั้น');
  const dataUrl = await fileToDataUrl(file);
  return prepareEyewearAsset(dataUrl, options);
}
