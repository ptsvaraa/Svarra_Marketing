const WIDTHS = [800, 1448] as const;

/** Lifestyle photos are 4:3, exported as WebP at these widths. */
export const IMAGE_WIDTH = 1448;
export const IMAGE_HEIGHT = 1086;

const url = (name: string, width: number) => `${import.meta.env.BASE_URL}images/${name}-${width}.webp`;

export const imageSrc = (name: string) => url(name, IMAGE_WIDTH);

export const imageSrcSet = (name: string) => WIDTHS.map((w) => `${url(name, w)} ${w}w`).join(', ');

/**
 * Warm the cache for the other tabs once the browser is idle, so switching is instant.
 * `sizes` must match the <img> that will show them, so the same srcset candidate is fetched.
 */
export function preloadImages(names: readonly string[], sizes: string): () => void {
  const run = () => {
    for (const name of names) {
      const img = new Image();
      img.sizes = sizes;
      img.srcset = imageSrcSet(name);
    }
  };
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(run, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(run, 1500);
  return () => clearTimeout(id);
}
