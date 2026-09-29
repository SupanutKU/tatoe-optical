import type { VtoAssetAnalysis } from '../types';
import { fetchImageViaBackend } from './productApi';

/**
 * Calls the Gemini API directly from the browser instead of routing through
 * our own backend. The backend's outbound network (e.g. a course/university
 * server) may be firewalled off from Google's IP ranges even though the
 * server can reach other hosts fine (confirmed via curl: storage.owndays.com
 * reachable, generativelanguage.googleapis.com times out on every address).
 * The admin's own browser has no such restriction, so running the call here
 * sidesteps the server's network policy entirely.
 *
 * Trade-off: the API key ships to the browser bundle and is visible to
 * anyone who opens devtools on this admin page. Acceptable for a
 * single-admin course project; for a multi-admin/production deployment,
 * prefer proxying this through a backend that has real internet access.
 */

// gemini-2.5-flash is closed to new users; override with VITE_GEMINI_MODEL if Google retires this one too.
const GEMINI_MODEL = String((import.meta as any).env?.VITE_GEMINI_MODEL || 'gemini-3.8-flash').trim();

function getBrowserGeminiApiKey(): string {
  return String((import.meta as any).env?.VITE_GEMINI_API_KEY || '').trim();
}

export function hasBrowserGeminiApiKey(): boolean {
  return getBrowserGeminiApiKey().length > 0;
}

/** Loads any image src (data: URL or http(s) URL) into a base64 payload via
 * canvas, exactly like the existing try-on asset pipeline does — this reuses
 * a path already proven to work with the owndays storage CDN in this app,
 * rather than a raw fetch() that could hit stricter CORS rules. */
function imageSrcToBase64(src: string): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    if (src.startsWith('data:image/')) {
      const m = src.match(/^data:(image\/[\w.+-]+);base64,(.+)$/s);
      if (!m) { reject(new Error('รูปสินค้าแบบ data URL ไม่ถูกต้อง')); return; }
      resolve({ mimeType: m[1], data: m[2] });
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas ไม่พร้อมใช้งาน')); return; }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const m = dataUrl.match(/^data:(image\/[\w.+-]+);base64,(.+)$/s);
        if (!m) { reject(new Error('แปลงรูปเป็น base64 ไม่สำเร็จ')); return; }
        resolve({ mimeType: m[1], data: m[2] });
      } catch (e) {
        // Most likely a tainted canvas from a CORS-restrictive image host.
        reject(new Error('อ่านข้อมูลรูปไม่สำเร็จ (อาจเป็นเพราะต้นทางรูปไม่อนุญาต CORS)'));
      }
    };
    img.onerror = () => reject(new Error('โหลดรูปสินค้าจาก URL ไม่สำเร็จ'));
    img.src = src;
  });
}

const clamp01 = (n: unknown) => Math.max(0, Math.min(1, Number(n) || 0));
const point = (p: any) => ({ x: clamp01(p?.x), y: clamp01(p?.y) });
const rect = (r: any) => ({ x: clamp01(r?.x), y: clamp01(r?.y), w: clamp01(r?.w), h: clamp01(r?.h) });

/** Marks an error that came back from Google itself (so the browser can reach Gemini; the server route wouldn't help). */
export class GeminiApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = 'GeminiApiError'; this.status = status; }
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const endpoint = (model: string, apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

async function callModel(model: string, apiKey: string, body: unknown) {
  let r: Response;
  try {
    r = await fetch(endpoint(model, apiKey), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch (err) {
    throw new Error(`เชื่อมต่อ Gemini API จากเบราว์เซอร์ไม่สำเร็จ: ${err instanceof Error ? err.message : 'ไม่ทราบสาเหตุ'}`);
  }
  const payload = await r.json().catch(() => ({}));
  if (!r.ok) throw new GeminiApiError(payload?.error?.message || `AI request failed (${r.status})`, r.status);
  return payload;
}

/** Stable flash-class models this key can call (skips odd variants like omni/image/tts/live that often have no quota). */
async function listFallbackModels(apiKey: string, exclude: string): Promise<string[]> {
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(apiKey)}`);
    if (!r.ok) return [];
    const j = await r.json();
    const version = (n: string) => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || '0');
    return (j?.models || [])
      .filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m: any) => String(m.name || '').replace(/^models\//, ''))
      .filter((n: string) => /^gemini-\d+(\.\d+)?-flash(-lite)?$/.test(n) && n !== exclude)
      .sort((x: string, y: string) => version(y) - version(x))
      .slice(0, 3);
  } catch { return []; }
}

const short = (m: string) => (m.length > 150 ? m.slice(0, 150) + '…' : m);

async function generateWithRetryAndFallback(apiKey: string, body: unknown) {
  const attempts: string[] = [];
  let primaryErr: unknown;
  // 1) primary model: retry with backoff only for transient server-side errors (5xx).
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await callModel(GEMINI_MODEL, apiKey, body); }
    catch (err) {
      primaryErr = err;
      if (!(err instanceof GeminiApiError)) throw err;             // network problem: no point trying other models
      if (err.status >= 500 && attempt < 2) { await sleep(1500 * (attempt + 1)); continue; }
      break;                                                        // quota (429), auth, bad request...: retrying the same model won't help
    }
  }
  attempts.push(`${GEMINI_MODEL}: ${short(primaryErr instanceof Error ? primaryErr.message : String(primaryErr))}`);
  const status = primaryErr instanceof GeminiApiError ? primaryErr.status : 0;
  // Auth/bad-request errors would fail on any model too.
  if ([400, 401, 403].includes(status)) throw primaryErr;

  // 2) other stable flash models available to this key
  for (const model of await listFallbackModels(apiKey, GEMINI_MODEL)) {
    try { return await callModel(model, apiKey, body); }
    catch (err) { attempts.push(`${model}: ${short(err instanceof Error ? err.message : String(err))}`); }
  }
  throw new GeminiApiError(attempts.join(' | '), status);
}

export async function analyzeVtoGlassesImageInBrowser(
  imageSrc: string,
  productName = '',
  colorName = ''
): Promise<VtoAssetAnalysis> {
  const apiKey = getBrowserGeminiApiKey();
  if (!apiKey) throw new Error('ยังไม่ได้ตั้งค่า VITE_GEMINI_API_KEY ใน .env ของ frontend');

  let input: { mimeType: string; data: string };
  try {
    input = await imageSrcToBase64(imageSrc);
  } catch (directErr) {
    // Browser can't read the image (e.g. host without CORS headers): let the
    // backend download it (it can reach the image host) and send the bytes.
    try {
      const viaBackend = await fetchImageViaBackend(imageSrc);
      input = { mimeType: viaBackend.mimeType, data: viaBackend.data };
    } catch (backendErr) {
      const a = directErr instanceof Error ? directErr.message : String(directErr);
      const b = backendErr instanceof Error ? backendErr.message : String(backendErr);
      throw new Error(`ดึงรูปสินค้าไม่สำเร็จ (โดยตรง: ${a} | ผ่านเซิร์ฟเวอร์: ${b})`);
    }
  }

  const prompt = `Analyze this eyewear product image for a 2D virtual try-on system. Identify ONLY the FRONT FACE of the visible eyeglasses/sunglasses. Do NOT include temple arms/side arms in bbox or lens geometry; the virtual try-on overlay must contain only the front frame, bridge and lenses. Ignore the face, person, packaging, shadows, and background. Return JSON only with normalized coordinates (0..1, origin top-left): bbox {x,y,w,h} for the complete visible glasses; bridge {x,y}; leftLens {x,y,w,h}; rightLens {x,y,w,h}; leftTemple {x,y} and rightTemple {x,y} where the arms leave the frame; lensOpacity between 0.15 and 1; frontFacing between 0 and 1 (1 = photographed straight-on from the front with both lenses level and symmetric; low if angled, top-down, or the temple arms are folded/lying across the frame or lenses); confidence between 0 and 1. If a coordinate is not visible, estimate from the frame geometry. Product name: ${String(productName).slice(0, 160)}. Color: ${String(colorName).slice(0, 100)}.`;

  const body = {
    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: input.mimeType, data: input.data } }] }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
  };

  const payload = await generateWithRetryAndFallback(apiKey, body);

  const text = payload?.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || '';
  let parsed: any;
  try {
    parsed = JSON.parse(text.replace(/^```json\s*/i, '').replace(/\s*```$/, ''));
  } catch {
    throw new Error('Gemini ตอบกลับมาไม่ใช่ JSON ที่ถูกต้อง');
  }

  return {
    version: 1,
    source: 'gemini',
    confidence: clamp01(parsed.confidence),
    bbox: rect(parsed.bbox),
    bridge: point(parsed.bridge),
    leftLens: rect(parsed.leftLens),
    rightLens: rect(parsed.rightLens),
    leftTemple: point(parsed.leftTemple),
    rightTemple: point(parsed.rightTemple),
    lensOpacity: Math.max(0.15, Math.min(1, Number(parsed.lensOpacity) || 0.82)),
    frontFacing: parsed.frontFacing === undefined ? undefined : clamp01(parsed.frontFacing),
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Returns a src the canvas can read pixels from. Direct URLs are used when the
 * host allows CORS; otherwise the backend downloads the image and we use a data URL.
 */
export async function resolveReadableImageSrc(src: string): Promise<string> {
  if (src.startsWith('data:')) return src;
  const direct = await new Promise<boolean>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = 2; c.height = 2;
        const x = c.getContext('2d'); x?.drawImage(img, 0, 0, 2, 2); x?.getImageData(0, 0, 1, 1);
        resolve(true);
      } catch { resolve(false); }
    };
    img.onerror = () => resolve(false);
    img.src = src;
  });
  if (direct) return src;
  const viaBackend = await fetchImageViaBackend(src);
  return `data:${viaBackend.mimeType};base64,${viaBackend.data}`;
}
