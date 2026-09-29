import type { Product } from '../types';
import { cropToAlpha, removeBorderBackground, type PreparedEyewearAsset } from './eyewearAsset';
import { callModel, getBrowserGeminiApiKey, imageSrcToBase64 } from './geminiVtoClient';
import { alphaBounds, chromaKeyGreen, cornerGreenness, judgeCleanModel } from './aiModelMath';
import { levelAssetFromLensOpenings, loadAiAnchors } from './frameAiAnchors';

const IMAGE_MODEL = String((import.meta as any).env?.VITE_GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image').trim();
const CACHE = 'vto-ai-model:v1:';
const memory = new Map<string, string>();
const running = new Map<string, Promise<PreparedEyewearAsset | null>>();

const PROMPT = (name: string, color: string) => `You are preparing a product photo of eyeglasses for a virtual try-on.
Re-render THE SAME glasses (${name}${color ? ', ' + color : ''}) so they can be pasted onto a face:
- Keep the design EXACTLY as in the photo: same frame shape, rim thickness, colours, metal/plastic finish, nose pads, bridge, brow bar, and any details. Do not restyle, simplify, or invent anything.
- Show them perfectly straight-on from the front, level and symmetric, both lenses fully visible, centred with a small margin.
- Do NOT show the temple arms (side arms); the end pieces / hinges may remain.
- Lenses: clear lenses must be filled with the same flat background colour (so they become see-through). If the lenses are clearly tinted, keep that tint.
- Background: one flat, uniform, pure chroma-key green (#00FF00). No shadow, no floor, no reflection, no gradient, no text, no watermark.
Output only the image.`;

const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img')); i.src = src; });

function cacheKey(product: Product, asset: PreparedEyewearAsset) {
  return `${CACHE}${product.id}:${asset.source.length}:${asset.source.slice(-40)}`;
}

async function generate(asset: PreparedEyewearAsset, product: Product): Promise<string | null> {
  const apiKey = getBrowserGeminiApiKey();
  if (!apiKey) return null;
  let input: { mimeType: string; data: string };
  try { input = await imageSrcToBase64(asset.source); } catch { input = await imageSrcToBase64(asset.dataUrl); }
  const body = {
    contents: [{ parts: [{ text: PROMPT(product.name || 'eyeglasses', product.colorName || '') }, { inline_data: { mime_type: input.mimeType, data: input.data } }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'], temperature: 0.2 },
  };
  const payload = await callModel(IMAGE_MODEL, apiKey, body);
  const part = (payload?.candidates?.[0]?.content?.parts || []).find((p: any) => p.inlineData || p.inline_data);
  const inline = part?.inlineData || part?.inline_data;
  const data = inline?.data as string | undefined;
  if (!data) return null;
  return `data:${inline.mimeType || inline.mime_type || 'image/png'};base64,${data}`;
}

/** Green-screen -> transparent PNG of the front frame; null if it fails the "really a straight front view" check. */
async function toCutout(rawDataUrl: string): Promise<{ dataUrl: string; canvas: HTMLCanvasElement } | null> {
  const img = await loadImg(rawDataUrl);
  const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const id = ctx.getImageData(0, 0, c.width, c.height);
  if (cornerGreenness(id.data, c.width, c.height) > 60) { chromaKeyGreen(id.data, c.width, c.height); ctx.putImageData(id, 0, 0); }
  else removeBorderBackground(c, 46, 18); // AI ignored the green: fall back to the flat-background remover
  const cropped = cropToAlpha(c);
  const cx = cropped.getContext('2d', { willReadFrequently: true })!;
  const d = cx.getImageData(0, 0, cropped.width, cropped.height);
  if (!alphaBounds(d.data, cropped.width, cropped.height)) return null;
  const verdict = judgeCleanModel(d.data, cropped.width, cropped.height);
  console.info('[VTO] AI model check', verdict);
  if (!verdict.ok) return null;
  return { dataUrl: cropped.toDataURL('image/png'), canvas: cropped };
}

async function build(asset: PreparedEyewearAsset, product: Product, force: boolean): Promise<PreparedEyewearAsset | null> {
  const key = cacheKey(product, asset);
  let dataUrl = force ? undefined : memory.get(key) ?? (() => { try { return localStorage.getItem(key) ?? undefined; } catch { return undefined; } })();
  if (!dataUrl) {
    const raw = await generate(asset, product);
    if (!raw) return null;
    const cut = await toCutout(raw);
    if (!cut) return null;
    dataUrl = cut.dataUrl;
    memory.set(key, dataUrl);
    try { localStorage.setItem(key, dataUrl); } catch { /* quota: memory cache only */ }
  }
  const image = await loadImg(dataUrl);
  return { source: asset.source, dataUrl, width: image.naturalWidth, height: image.naturalHeight, image };
}

/**
 * AI-assisted eyewear model: (1) the AI re-renders the product photo as a clean, straight, arm-free front view on
 * green, (2) we keyed it to a transparent PNG and verify symmetry, (3) the AI then locates lens centres / hinges on
 * that clean image. Every step degrades gracefully to the original photo pipeline.
 * Returns the asset the renderer should switch to, or null to keep the current one.
 */
export function upgradeAssetWithAi(asset: PreparedEyewearAsset, product: Product, force = false): Promise<PreparedEyewearAsset | null> {
  const key = cacheKey(product, asset) + (force ? ':force' : '');
  const existing = running.get(key);
  if (existing) return existing;
  const job = (async () => {
    let base = asset, cleaned: PreparedEyewearAsset | null = null;
    try { cleaned = await build(asset, product, force); if (cleaned) base = cleaned; }
    catch (err) { console.warn('[VTO] AI model generation failed, using the original photo:', err); }
    const normalized = await loadAiAnchors(base, product);
    const result = normalized ?? cleaned;
    if (result) return (await levelAssetFromLensOpenings(result)) ?? result;
    return levelAssetFromLensOpenings(base);
  })().finally(() => running.delete(key));
  running.set(key, job);
  return job;
}
