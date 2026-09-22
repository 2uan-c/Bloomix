import type { FlowerRole } from "./types.ts";

export interface FlowerScaleMetadata {
  visualScale: number; // Baseline visual subject scale
  basePixelSize: number; // Baseline container dimension in pixels
}

/**
 * Normalized visual subject scale baseline for every floral variety.
 * Derived from physical bloom size and floral subject area.
 */
export const FLOWER_NORMALIZED_SCALES: Record<string, FlowerScaleMetadata> = {
  // Hero Focal Blooms (Large commanding visual mass)
  sunflower: { visualScale: 1.15, basePixelSize: 84 },
  hydrangea: { visualScale: 1.12, basePixelSize: 82 },
  peony: { visualScale: 1.10, basePixelSize: 80 },
  lily: { visualScale: 1.06, basePixelSize: 78 },
  rose: { visualScale: 1.00, basePixelSize: 74 },
  orchid: { visualScale: 1.00, basePixelSize: 74 },
  "calla-lily": { visualScale: 0.98, basePixelSize: 72 },

  // Secondary & Accents (Harmonizing volume and structure)
  gerbera: { visualScale: 0.96, basePixelSize: 72 },
  ranunculus: { visualScale: 0.94, basePixelSize: 70 },
  chrysanthemum: { visualScale: 0.92, basePixelSize: 68 },
  iris: { visualScale: 0.92, basePixelSize: 68 },
  tulip: { visualScale: 0.90, basePixelSize: 66 },
  carnation: { visualScale: 0.88, basePixelSize: 66 },
  lisianthus: { visualScale: 0.88, basePixelSize: 66 },
  daisy: { visualScale: 0.82, basePixelSize: 62 },

  // Structural Foliage & Greenery (Grounding backdrop)
  fern: { visualScale: 0.86, basePixelSize: 66 },
  "olive-branch": { visualScale: 0.82, basePixelSize: 64 },
  "italian-ruscus": { visualScale: 0.82, basePixelSize: 64 },
  eucalyptus: { visualScale: 0.80, basePixelSize: 62 },
  ruscus: { visualScale: 0.78, basePixelSize: 60 },
  lavender: { visualScale: 0.76, basePixelSize: 58 },

  // Airy Fillers (Delicate sprigs & texture)
  statice: { visualScale: 0.72, basePixelSize: 56 },
  waxflower: { visualScale: 0.70, basePixelSize: 54 },
  "baby-breath": { visualScale: 0.65, basePixelSize: 52 },
  "babys-breath": { visualScale: 0.65, basePixelSize: 52 },
};

/**
 * Retrieves the normalized scale metadata for a given flower species,
 * with role-based fallbacks if a custom variety is encountered.
 */
export function getFlowerScaleMetadata(
  flowerId: string,
  role?: FlowerRole
): FlowerScaleMetadata {
  const normalized = (flowerId || "").toLowerCase().trim();
  if (FLOWER_NORMALIZED_SCALES[normalized]) {
    return FLOWER_NORMALIZED_SCALES[normalized];
  }

  // Fallback metadata according to role
  switch (role) {
    case "focal":
      return { visualScale: 1.02, basePixelSize: 76 };
    case "filler":
      return { visualScale: 0.68, basePixelSize: 54 };
    case "foliage":
      return { visualScale: 0.80, basePixelSize: 62 };
    case "secondary":
    default:
      return { visualScale: 0.88, basePixelSize: 66 };
  }
}

/**
 * Computes deterministic, normalized instance scale:
 * instanceScale = flowerBaseScale * styleScaleMultiplier * controlledVariation
 *
 * controlledVariation stays tightly bounded in [0.975, 1.025] so all instances
 * of the same flower (e.g. Rose #1, Rose #2, Rose #3, Rose #4) remain consistently sized.
 */
export function computeNormalizedScale(
  flowerId: string,
  role: FlowerRole = "secondary",
  styleMultiplier: number = 1.0,
  instanceIndex: number = 0
): { baseSize: number; scale: number; baseScale: number } {
  const meta = getFlowerScaleMetadata(flowerId, role);
  // Controlled subtle variation for natural botanical asymmetry
  const controlledVariation = 1.0 + ((instanceIndex % 5) - 2) * 0.012;
  const computedScale = meta.visualScale * styleMultiplier * controlledVariation;

  return {
    baseSize: meta.basePixelSize,
    scale: parseFloat(computedScale.toFixed(3)),
    baseScale: meta.visualScale,
  };
}
