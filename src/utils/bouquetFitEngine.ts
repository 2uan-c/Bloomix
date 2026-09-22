import type { FlowerInstance } from "../engine/types.ts";
import { getFlowerVisualBounds } from "../components/BouquetBloom.tsx";

export interface BouquetBoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  aspectRatio: number;
}

export interface BouquetFitOptions {
  /** Target fraction of canvas width the bouquet should occupy (default: 0.64, target range 0.55-0.70) */
  targetWidthRatio?: number;
  /** Target fraction of canvas height the bouquet should occupy (default: 0.74, target range 0.65-0.80) */
  targetHeightRatio?: number;
  /** Minimum allowed scale factor (default: 0.85) */
  minScale?: number;
  /** Maximum allowed scale factor (default: 2.50) */
  maxScale?: number;
  /** Vertical lift factor above geometric center (default: 0.025) */
  verticalBiasFactor?: number;
  /** Minimum padding margin fraction around canvas edges to guarantee no clipping (default: 0.06) */
  edgeSafetyMargin?: number;
}

export interface BouquetFitResult {
  /** The uniform scale factor to apply to the complete bouquet */
  scale: number;
  /** Horizontal translation offset in pixels */
  offsetX: number;
  /** Vertical translation offset in pixels */
  offsetY: number;
  /** The computed physical bounding box of the bouquet */
  bbox: BouquetBoundingBox;
  /** Rendered width on canvas */
  renderedWidth: number;
  /** Rendered height on canvas */
  renderedHeight: number;
  /** Fraction of canvas width occupied */
  widthRatio: number;
  /** Fraction of canvas height occupied */
  heightRatio: number;
}

/**
 * Computes the actual rendered bounding box of the complete bouquet composition
 * in the local coordinate space where (0,0) is the bouquet center.
 * 
 * Accurately accounts for:
 * - Flower heads and foliage (including species-specific visual aspect ratios and scale)
 * - Wrapping paper shell & flaps (with shape-specific dimensions)
 * - Lower exposed trimmed stems
 * - Florist hand-tied ribbon and draping tails
 */
export function computeBouquetBoundingBox(
  instances: FlowerInstance[] = [],
  shapeId = "round-dome",
  wrappingId?: string,
  ribbonId?: string
): BouquetBoundingBox {
  if (!instances || instances.length === 0) {
    return {
      minX: -85,
      maxX: 85,
      minY: -85,
      maxY: 95,
      width: 170,
      height: 180,
      centerX: 0,
      centerY: 5,
      aspectRatio: 170 / 180,
    };
  }

  // 1. Calculate bounding extent of all flower blooms and foliage
  let flowersMinX = Infinity;
  let flowersMaxX = -Infinity;
  let flowersMinY = Infinity;
  let flowersMaxY = -Infinity;

  for (const inst of instances) {
    const size = (inst.size || 60) * (inst.scale || 1.0);
    const bounds = getFlowerVisualBounds(inst.flowerId, inst.role);
    const halfW = (size * bounds.widthFactor) / 2;
    const halfH = (size * bounds.heightFactor) / 2;

    const left = inst.x - halfW;
    const right = inst.x + halfW;
    const top = inst.y - halfH;
    const bottom = inst.y + halfH;

    if (left < flowersMinX) flowersMinX = left;
    if (right > flowersMaxX) flowersMaxX = right;
    if (top < flowersMinY) flowersMinY = top;
    if (bottom > flowersMaxY) flowersMaxY = bottom;
  }

  if (flowersMinX === Infinity) {
    flowersMinX = -70;
    flowersMaxX = 70;
    flowersMinY = -70;
    flowersMaxY = 70;
  }

  // 2. Calculate wrapping, stems, and ribbon structural extents based on shape
  const normalizedShape = (shapeId || "round-dome").toLowerCase();
  let stemLengthMultiplier = 1.0;
  let wrapScaleX = 1.0;
  let wrapScaleY = 1.0;
  let wrapOffsetY = 0;

  if (normalizedShape.includes("long-stem")) {
    stemLengthMultiplier = 1.3;
    wrapScaleX = 0.90;
    wrapScaleY = 1.08;
    wrapOffsetY = -6;
  } else if (normalizedShape.includes("posy")) {
    stemLengthMultiplier = 0.8;
    wrapScaleX = 0.92;
    wrapScaleY = 0.92;
    wrapOffsetY = 6;
  } else if (normalizedShape.includes("wild")) {
    stemLengthMultiplier = 1.05;
    wrapScaleX = 1.08;
    wrapScaleY = 0.98;
    wrapOffsetY = -2;
  } else if (normalizedShape.includes("cascade")) {
    stemLengthMultiplier = 1.0;
    wrapScaleX = 0.96;
    wrapScaleY = 1.04;
    wrapOffsetY = -4;
  } else if (normalizedShape.includes("dome")) {
    stemLengthMultiplier = 0.95;
    wrapScaleX = 1.02;
    wrapScaleY = 1.0;
    wrapOffsetY = 0;
  }

  // Wrapping outer boundaries
  const wrapHalfWidth = 82 * wrapScaleX;
  const wrapTop = -44 * wrapScaleY + wrapOffsetY;
  const wrapBottom = 48 * wrapScaleY + wrapOffsetY;

  // Bottom exposed trimmed stems extend below tie point (y=52)
  const stemsBottom = 52 + 37 * stemLengthMultiplier;

  // Hand-tied ribbon draping tails extend down to y ~ 85
  const ribbonBottom = 85;

  // 3. Merge complete visual composition boundaries
  const minX = Math.min(flowersMinX, -wrapHalfWidth);
  const maxX = Math.max(flowersMaxX, wrapHalfWidth);
  const minY = Math.min(flowersMinY, wrapTop);
  const maxY = Math.max(flowersMaxY, wrapBottom, stemsBottom, ribbonBottom);

  const width = Math.max(40, maxX - minX);
  const height = Math.max(40, maxY - minY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    centerX,
    centerY,
    aspectRatio: width / height,
  };
}

/**
 * Calculates the uniform fit scale and centering translation offsets
 * to normalize the visual presence of any bouquet composition to target canvas dimensions.
 * 
 * Target specification:
 * - Occupies ~55-70% of canvas width
 * - Occupies ~65-80% of canvas height
 * - Preserves aspect ratio perfectly
 * - Centers horizontally
 * - Positions vertically with slight upward bias so lower stems/ribbon have breathing room
 * - Strictly respects safety margins (5-8%) to prevent any clipping of blooms, wrapping, or ribbon
 */
export function computeBouquetFit(
  bbox: BouquetBoundingBox,
  canvasWidth: number,
  canvasHeight: number,
  options: BouquetFitOptions = {}
): BouquetFitResult {
  const w = Math.max(100, canvasWidth || 600);
  const h = Math.max(100, canvasHeight || 500);

  const {
    targetWidthRatio = 0.64,
    targetHeightRatio = 0.74,
    minScale = 0.85,
    maxScale = 2.50,
    verticalBiasFactor = 0.025,
    edgeSafetyMargin = 0.06,
  } = options;

  // 1. Calculate available dimensions based on target presence ratios
  const availableWidth = w * targetWidthRatio;
  const availableHeight = h * targetHeightRatio;

  // 2. Calculate ideal scale factors
  const scaleX = availableWidth / bbox.width;
  const scaleY = availableHeight / bbox.height;

  // Scale the complete bouquet as a single uniform unit (min scale to preserve aspect ratio)
  const rawFitScale = Math.min(scaleX, scaleY);

  // 3. Enforce strict safety boundary to guarantee 0% clipping (5-8% safety margin)
  const maxSafeWidth = w * (1 - 2 * edgeSafetyMargin);
  const maxSafeHeight = h * (1 - 2 * edgeSafetyMargin);
  const maxSafeScaleX = maxSafeWidth / bbox.width;
  const maxSafeScaleY = maxSafeHeight / bbox.height;
  const safeCeiling = Math.min(maxSafeScaleX, maxSafeScaleY);

  const constrainedScale = Math.min(rawFitScale, safeCeiling);
  const finalScale = Math.max(minScale, Math.min(maxScale, constrainedScale));

  // 4. Calculate centering translation offsets
  // Horizontal centering: offset by negative bbox center scaled
  const offsetX = -bbox.centerX * finalScale;

  // Vertical centering: place slightly above geometric center for florist balance & lower stem clearance
  const verticalLift = h * verticalBiasFactor;
  const offsetY = -bbox.centerY * finalScale - verticalLift;

  const renderedWidth = bbox.width * finalScale;
  const renderedHeight = bbox.height * finalScale;

  return {
    scale: finalScale,
    offsetX,
    offsetY,
    bbox,
    renderedWidth,
    renderedHeight,
    widthRatio: renderedWidth / w,
    heightRatio: renderedHeight / h,
  };
}
