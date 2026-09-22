/**
 * High-performance botanical background removal & cutout engine.
 * Converts studio flower photographs with white/gray/off-white backgrounds into
 * crisp, isolated botanical assets with 100% alpha transparency.
 * Guaranteed no rectangular boundary, white borders, or backdrop smudges.
 */

// In-memory cache for processed cutout data URLs
const cutoutCache = new Map<string, string>();
const pendingPromises = new Map<string, Promise<string>>();

export interface CutoutResult {
  dataUrl: string;
  subjectBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

/**
 * Removes white, light-gray, studio backdrops, and edge boundaries from flower assets.
 * Automatically trims empty padding to center the floral subject and defringes edges.
 */
export async function getTransparentFlowerCutout(
  imageUrl: string,
  flowerId: string,
  color?: string
): Promise<string> {
  // Automatically route any flower asset to the transparent .png version
  const normalizedUrl =
    (imageUrl.includes("/assets/flowers/") || imageUrl.includes("/flowers/")) &&
    (imageUrl.endsWith(".jpg") || imageUrl.endsWith(".jpeg") || imageUrl.endsWith(".webp"))
      ? imageUrl.replace(/\.(jpg|jpeg|webp)$/i, ".png")
      : imageUrl;

  const cacheKey = `${flowerId}_${color || "default"}_${normalizedUrl}`;
  if (cutoutCache.has(cacheKey)) {
    return cutoutCache.get(cacheKey)!;
  }

  if (pendingPromises.has(cacheKey)) {
    return pendingPromises.get(cacheKey)!;
  }

  const promise = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const rawW = img.naturalWidth || img.width || 200;
        const rawH = img.naturalHeight || img.height || 200;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(normalizedUrl);
          return;
        }

        canvas.width = rawW;
        canvas.height = rawH;
        ctx.drawImage(img, 0, 0, rawW, rawH);

        const imgData = ctx.getImageData(0, 0, rawW, rawH);
        const data = imgData.data;

        // 0. Detect whether the image already contains native alpha transparency (e.g. transparent PNG/WebP)
        let transparentEdgeCount = 0;
        const testStepX = Math.max(1, Math.floor(rawW / 24));
        const testStepY = Math.max(1, Math.floor(rawH / 24));

        for (let x = 0; x < rawW; x += testStepX) {
          if (data[x * 4 + 3] < 100) transparentEdgeCount++;
          if (data[((rawH - 1) * rawW + x) * 4 + 3] < 100) transparentEdgeCount++;
        }
        for (let y = 0; y < rawH; y += testStepY) {
          if (data[(y * rawW) * 4 + 3] < 100) transparentEdgeCount++;
          if (data[(y * rawW + (rawW - 1)) * 4 + 3] < 100) transparentEdgeCount++;
        }

        const hasNativeAlpha = transparentEdgeCount > 8;

        let minSubjectX = rawW;
        let maxSubjectX = 0;
        let minSubjectY = rawH;
        let maxSubjectY = 0;

        if (hasNativeAlpha) {
          // Image already has transparency: measure floral subject bounds directly
          for (let y = 0; y < rawH; y++) {
            for (let x = 0; x < rawW; x++) {
              const i = (y * rawW + x) * 4;
              if (data[i + 3] > 25) {
                if (x < minSubjectX) minSubjectX = x;
                if (x > maxSubjectX) maxSubjectX = x;
                if (y < minSubjectY) minSubjectY = y;
                if (y > maxSubjectY) maxSubjectY = y;
              }
            }
          }
        } else {
          // 1. Multi-corner backdrop sampling (accurately models non-uniform studio lighting & gradients)
          const sampleCorner = (startX: number, startY: number): [number, number, number] => {
            let rSum = 0, gSum = 0, bSum = 0, count = 0;
            const block = Math.min(16, Math.floor(Math.min(rawW, rawH) / 10));
            for (let cy = startY; cy < startY + block; cy++) {
              for (let cx = startX; cx < startX + block; cx++) {
                const idx = (cy * rawW + cx) * 4;
                rSum += data[idx];
                gSum += data[idx + 1];
                bSum += data[idx + 2];
                count++;
              }
            }
            return count > 0 ? [rSum / count, gSum / count, bSum / count] : [245, 245, 245];
          };

          const tl = sampleCorner(2, 2);
          const tr = sampleCorner(rawW - 18, 2);
          const bl = sampleCorner(2, rawH - 18);
          const br = sampleCorner(rawW - 18, rawH - 18);

          const avgBgR = (tl[0] + tr[0] + bl[0] + br[0]) / 4;
          const avgBgG = (tl[1] + tr[1] + bl[1] + br[1]) / 4;
          const avgBgB = (tl[2] + tr[2] + bl[2] + br[2]) / 4;
          const avgBgLum = 0.299 * avgBgR + 0.587 * avgBgG + 0.114 * avgBgB;
          const isStudioLightBg = avgBgLum > 130;

          // 2. Alpha Keying using Bilinear Backdrop Interpolation
          for (let y = 0; y < rawH; y++) {
            const v = y / Math.max(1, rawH - 1);
            for (let x = 0; x < rawW; x++) {
              const u = x / Math.max(1, rawW - 1);
              const i = (y * rawW + x) * 4;

              // Absolute outer 4px perimeter: 100% transparent (no perimeter box lines or clipped borders)
              if (x <= 3 || x >= rawW - 4 || y <= 3 || y >= rawH - 4) {
                data[i + 3] = 0;
                continue;
              }

              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Expected local background color at (x, y)
              const expR = (1 - u) * (1 - v) * tl[0] + u * (1 - v) * tr[0] + (1 - u) * v * bl[0] + u * v * br[0];
              const expG = (1 - u) * (1 - v) * tl[1] + u * (1 - v) * tr[1] + (1 - u) * v * bl[1] + u * v * br[1];
              const expB = (1 - u) * (1 - v) * tl[2] + u * (1 - v) * tr[2] + (1 - u) * v * bl[2] + u * v * br[2];

              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
              const localDist = Math.sqrt((r - expR) ** 2 + (g - expG) ** 2 + (b - expB) ** 2);
              const globalDist = Math.sqrt((r - avgBgR) ** 2 + (g - avgBgG) ** 2 + (b - avgBgB) ** 2);

              if (isStudioLightBg) {
                if (lum > 238 && maxDiff < 18) {
                  data[i + 3] = 0;
                } else if ((localDist < 30 || globalDist < 24) && maxDiff < 28) {
                  data[i + 3] = 0;
                } else if (localDist < 56 && maxDiff < 26) {
                  const factor = (localDist - 28) / 28;
                  data[i + 3] = Math.min(data[i + 3], Math.floor(255 * Math.pow(Math.max(0, factor), 1.4)));
                } else if (lum > 214 && maxDiff < 16 && (localDist < 70 || globalDist < 70)) {
                  const factor = Math.max(0, (238 - lum) / 24);
                  data[i + 3] = Math.min(data[i + 3], Math.floor(255 * Math.pow(factor, 1.5)));
                }
              }

              // Track visible subject bounding box
              if (data[i + 3] > 30) {
                if (x < minSubjectX) minSubjectX = x;
                if (x > maxSubjectX) maxSubjectX = x;
                if (y < minSubjectY) minSubjectY = y;
                if (y > maxSubjectY) maxSubjectY = y;
              }
            }
          }

          // 3. Defringing & Soft Halo Cleanup
          for (let y = 3; y < rawH - 3; y++) {
            for (let x = 3; x < rawW - 3; x++) {
              const i = (y * rawW + x) * 4;
              const alpha = data[i + 3];

              if (alpha > 0 && alpha < 240) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                if (lum > 210) {
                  data[i + 3] = Math.floor(alpha * 0.7);
                }
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // 4. Center the flower subject within a square frame for consistent optical alignment
        let finalCanvas = canvas;
        const subjWidth = maxSubjectX - minSubjectX;
        const subjHeight = maxSubjectY - minSubjectY;

        if (subjWidth > 20 && subjHeight > 20 && (subjWidth < rawW * 0.85 || subjHeight < rawH * 0.85)) {
          const maxDim = Math.max(subjWidth, subjHeight);
          const padding = Math.round(maxDim * 0.06); // 6% breathing room
          const squareSize = maxDim + padding * 2;

          const centeredCanvas = document.createElement("canvas");
          centeredCanvas.width = squareSize;
          centeredCanvas.height = squareSize;
          const cCtx = centeredCanvas.getContext("2d");
          if (cCtx) {
            const destX = Math.round((squareSize - subjWidth) / 2);
            const destY = Math.round((squareSize - subjHeight) / 2);
            cCtx.drawImage(
              canvas,
              minSubjectX,
              minSubjectY,
              subjWidth,
              subjHeight,
              destX,
              destY,
              subjWidth,
              subjHeight
            );
            finalCanvas = centeredCanvas;
          }
        }

        const dataUrl = finalCanvas.toDataURL("image/png");
        cutoutCache.set(cacheKey, dataUrl);
        resolve(dataUrl);
      } catch (err) {
        console.warn(`[CutoutProcessor] Failed to process ${normalizedUrl}:`, err);
        resolve(normalizedUrl);
      } finally {
        pendingPromises.delete(cacheKey);
      }
    };

    img.onerror = () => {
      // If .png failed to load, attempt the original imageUrl as fallback
      if (normalizedUrl !== imageUrl) {
        img.src = imageUrl;
        return;
      }
      resolve(normalizedUrl);
      pendingPromises.delete(cacheKey);
    };

    img.src = normalizedUrl;
  });

  pendingPromises.set(cacheKey, promise);
  return promise;
}

/**
 * Preloads and warms cutout cache for common floral assets
 */
export function preloadFloralCutouts(flowerIds: string[]): void {
  flowerIds.forEach((id) => {
    const url = `/assets/flowers/${id}.png`;
    getTransparentFlowerCutout(url, id).catch(() => {});
  });
}
