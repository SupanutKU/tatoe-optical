const cache = new Map<string, HTMLImageElement>();

/** Returns a cached, loaded <img> for the given src, loading it (with CORS) if needed. */
export function loadCachedImage(src: string): Promise<HTMLImageElement> {
  const existing = cache.get(src);
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve, reject) => {
    const img = existing ?? new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    if (img.src !== src) img.src = src;
    else if (img.complete) resolve(img);
  });
}
