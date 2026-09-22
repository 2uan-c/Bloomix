import type { BouquetItem, Flower, FlowerInstance, FlowerRole, BouquetStyle } from "./types.ts";
import { computeNormalizedScale } from "./flowerScaleNormalization.ts";
import { getStyleCompositionProfile, type StyleCompositionProfile } from "./styleComposition.ts";
import { getBouquetShapeById } from "../data/bouquetShapesConfig.ts";

export interface GenerateBouquetLayoutArgs {
  shapeId?: string;
  styleId?: string;
  bouquet: BouquetItem[];
  flowersMap: Map<string, Flower>;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface InternalStemDescriptor {
  instanceId: string;
  flowerId: string;
  flowerName: string;
  role: FlowerRole;
  color: string;
  indexInRole: number;
  totalInRole: number;
  overallIndex: number;
  totalStems: number;
}

export type LayoutEngineName =
  | "createRoundDomeLayout"
  | "createHandTiedLayout"
  | "createLooseWildLayout"
  | "createLongStemLayout"
  | "createCascadingLayout"
  | "createCompactPosyLayout";

/**
 * 1. ROUND DOME LAYOUT ALGORITHM
 * - Broad bouquet, high visual mass centered in a classic parabolic arch
 * - Center flowers slightly higher, outer flowers gently sloping downward
 * - Focals in core dome, fillers filling interstitial pockets, foliage framing outer rim
 */
export function createRoundDomeLayout(
  stems: InternalStemDescriptor[],
  flowersMap: Map<string, Flower>,
  styleProfile: StyleCompositionProfile
): FlowerInstance[] {
  const rule = styleProfile.rule;
  const focals = stems.filter((s) => s.role === "focal");
  const secondaries = stems.filter((s) => s.role === "secondary");
  const fillers = stems.filter((s) => s.role === "filler");
  const foliages = stems.filter((s) => s.role === "foliage");

  const instances: FlowerInstance[] = [];

  // FOCAL: Center dome anchor
  focals.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "focal",
      rule.focal.scaleMultiplier * 1.02,
      stem.indexInRole
    );

    let x = 0;
    let y = -48;
    let rotate = 0;
    let depth = 55 - stem.indexInRole;

    if (stem.indexInRole === 0) {
      x = 0;
      y = -52;
      rotate = 0;
      depth = 58;
    } else {
      const side = stem.indexInRole % 2 === 1 ? 1 : -1;
      const pairIndex = Math.floor((stem.indexInRole - 1) / 2);
      x = side * (24 + pairIndex * 18) * rule.width;
      // Parabolic dome curve: y slopes down as x moves outward
      y = -46 + pairIndex * 10 + Math.pow(Math.abs(x) / 60, 2) * 8;
      rotate = side * (5 + pairIndex * 5);
      depth = 54 - stem.indexInRole;
    }

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth,
      isUserPositioned: false,
    });
  });

  // SECONDARY: Interstitial ring reinforcing the dome
  secondaries.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "secondary",
      rule.secondary.scaleMultiplier,
      stem.indexInRole
    );

    const count = Math.max(1, secondaries.length);
    const angleStep = Math.PI / (count + 1);
    const angle = Math.PI - angleStep * (stem.indexInRole + 1);
    const radiusX = 55 * rule.width;
    const radiusY = 32 * rule.height;

    const x = Math.cos(angle) * radiusX;
    const y = -40 + Math.sin(angle) * radiusY;
    const rotate = (angle - Math.PI / 2) * (180 / Math.PI) * 0.35;

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 42 - stem.indexInRole,
      isUserPositioned: false,
    });
  });

  // FILLER: Distributed evenly inside dome gaps
  fillers.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "filler",
      rule.filler.scaleMultiplier,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? 1 : -1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (34 + tier * 20) * rule.width;
    const y = -36 + (tier * 12) + (Math.abs(x) > 40 ? 8 : -6);
    const rotate = side * (8 + tier * 4);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 32 + stem.indexInRole,
      isUserPositioned: false,
    });
  });

  // FOLIAGE: Back rim framing the dome circumference
  foliages.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "foliage",
      rule.foliage.scaleMultiplier,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? -1 : 1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (68 + tier * 18) * rule.width;
    const y = -34 + tier * 14;
    const rotate = side * (22 + tier * 8);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 14 + stem.indexInRole,
      isUserPositioned: false,
    });
  });

  return instances;
}

/**
 * 2. HAND-TIED LAYOUT ALGORITHM
 * - Natural florist hand-tied spiral structure with visible stem convergence
 * - Moderate width, taller than dome, organic height staggering
 * - Slightly asymmetric spiraling angles
 */
export function createHandTiedLayout(
  stems: InternalStemDescriptor[],
  flowersMap: Map<string, Flower>,
  styleProfile: StyleCompositionProfile
): FlowerInstance[] {
  const rule = styleProfile.rule;
  const focals = stems.filter((s) => s.role === "focal");
  const secondaries = stems.filter((s) => s.role === "secondary");
  const fillers = stems.filter((s) => s.role === "filler");
  const foliages = stems.filter((s) => s.role === "foliage");

  const instances: FlowerInstance[] = [];

  // FOCAL: Natural spiral cluster with organic staggering
  focals.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "focal",
      rule.focal.scaleMultiplier * 1.0,
      stem.indexInRole
    );

    let x = 0;
    let y = -54;
    let rotate = 0;
    let depth = 55 - stem.indexInRole;

    if (stem.indexInRole === 0) {
      x = -6;
      y = -58;
      rotate = -4;
      depth = 56;
    } else if (stem.indexInRole === 1) {
      x = 18;
      y = -50;
      rotate = 6;
      depth = 54;
    } else if (stem.indexInRole === 2) {
      x = -16;
      y = -40;
      rotate = -8;
      depth = 51;
    } else {
      const side = stem.indexInRole % 2 === 1 ? 1 : -1;
      const idx = stem.indexInRole - 3;
      x = side * (26 + idx * 14) * 0.92;
      y = -44 + (idx * 12) + (side > 0 ? 4 : -4);
      rotate = side * (10 + idx * 4);
      depth = 48 - stem.indexInRole;
    }

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth,
      isUserPositioned: false,
    });
  });

  // SECONDARY: Layered alongside the spiral stem paths
  secondaries.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "secondary",
      rule.secondary.scaleMultiplier,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? 1 : -1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (28 + tier * 18);
    const y = -48 + (tier * 16) + (side > 0 ? -4 : 6);
    const rotate = side * (12 + tier * 6);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 42 - stem.indexInRole,
      isUserPositioned: false,
    });
  });

  // FILLER: Nestled throughout the hand-tied arrangement
  fillers.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "filler",
      rule.filler.scaleMultiplier,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? -1 : 1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (22 + tier * 16);
    const y = -62 + tier * 18;
    const rotate = side * (8 + tier * 5);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 30 + stem.indexInRole,
      isUserPositioned: false,
    });
  });

  // FOLIAGE: Natural collar framing the hand-tied base & sides
  foliages.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "foliage",
      rule.foliage.scaleMultiplier,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? 1 : -1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (52 + tier * 18);
    const y = -40 + tier * 16 + (side > 0 ? 8 : -6);
    const rotate = side * (24 + tier * 7);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 16 + stem.indexInRole,
      isUserPositioned: false,
    });
  });

  return instances;
}

/**
 * 3. LOOSE / WILD LAYOUT ALGORITHM
 * - Extra wide, strongly asymmetrical, large height and width variance
 * - Stems branch out freely in organic meadow style with airy negative space
 * - Extended foliage perimeter and organic filler sprays
 */
export function createLooseWildLayout(
  stems: InternalStemDescriptor[],
  flowersMap: Map<string, Flower>,
  styleProfile: StyleCompositionProfile
): FlowerInstance[] {
  const rule = styleProfile.rule;
  const focals = stems.filter((s) => s.role === "focal");
  const secondaries = stems.filter((s) => s.role === "secondary");
  const fillers = stems.filter((s) => s.role === "filler");
  const foliages = stems.filter((s) => s.role === "foliage");

  const instances: FlowerInstance[] = [];

  // FOCAL: Scattered asymmetric anchor points
  focals.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "focal",
      rule.focal.scaleMultiplier * 1.05,
      stem.indexInRole
    );

    let x = 0;
    let y = -65;
    let rotate = 0;
    let depth = 55 - stem.indexInRole;

    if (stem.indexInRole === 0) {
      x = -24;
      y = -70;
      rotate = -14;
      depth = 56;
    } else if (stem.indexInRole === 1) {
      x = 32;
      y = -44;
      rotate = 18;
      depth = 53;
    } else if (stem.indexInRole === 2) {
      x = -8;
      y = -28;
      rotate = 5;
      depth = 49;
    } else {
      const side = stem.indexInRole % 2 === 1 ? 1 : -1;
      const idx = stem.indexInRole - 3;
      x = side * (46 + idx * 22);
      y = -55 + (idx * 24) * (side > 0 ? 1 : -0.7);
      rotate = side * (20 + idx * 8);
      depth = 46 - stem.indexInRole;
    }

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth,
      isUserPositioned: false,
    });
  });

  // SECONDARY: Sprawling intermediate blooms
  secondaries.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "secondary",
      rule.secondary.scaleMultiplier,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? -1 : 1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (52 + tier * 26);
    const y = -66 + (tier * 26) + (side > 0 ? 14 : -10);
    const rotate = side * (22 + tier * 7);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 38 - stem.indexInRole,
      isUserPositioned: false,
    });
  });

  // FILLER: Airy sprays reaching into upper & outer perimeter
  fillers.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "filler",
      rule.filler.scaleMultiplier * 1.05,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? 1 : -1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (68 + tier * 24);
    const y = -84 + tier * 28 + (side > 0 ? -8 : 12);
    const rotate = side * (28 + tier * 8);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 28 + stem.indexInRole,
      isUserPositioned: false,
    });
  });

  // FOLIAGE: Wide organic framing extending prominently
  foliages.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "foliage",
      rule.foliage.scaleMultiplier * 1.1,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? -1 : 1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (92 + tier * 24);
    const y = -72 + tier * 32 + (side > 0 ? 16 : -12);
    const rotate = side * (36 + tier * 8);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 12 + stem.indexInRole,
      isUserPositioned: false,
    });
  });

  return instances;
}

/**
 * 4. LONG-STEM LAYOUT ALGORITHM
 * - Tall and narrow, strong vertical columnar architecture
 * - Flower heads placed significantly higher, narrow horizontal spread
 * - Extended visible stems traveling down to the tie point
 */
export function createLongStemLayout(
  stems: InternalStemDescriptor[],
  flowersMap: Map<string, Flower>,
  styleProfile: StyleCompositionProfile
): FlowerInstance[] {
  const rule = styleProfile.rule;
  const focals = stems.filter((s) => s.role === "focal");
  const secondaries = stems.filter((s) => s.role === "secondary");
  const fillers = stems.filter((s) => s.role === "filler");
  const foliages = stems.filter((s) => s.role === "foliage");

  const instances: FlowerInstance[] = [];

  // FOCAL: Stepped vertical column high above tie point
  focals.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "focal",
      rule.focal.scaleMultiplier * 0.98,
      stem.indexInRole
    );

    let x = 0;
    let y = -98;
    let rotate = 0;
    let depth = 55 - stem.indexInRole;

    if (stem.indexInRole === 0) {
      x = 0;
      y = -102;
      rotate = 0;
      depth = 58;
    } else if (stem.indexInRole === 1) {
      x = -14;
      y = -84;
      rotate = -4;
      depth = 54;
    } else if (stem.indexInRole === 2) {
      x = 15;
      y = -70;
      rotate = 5;
      depth = 51;
    } else {
      const side = stem.indexInRole % 2 === 1 ? 1 : -1;
      const idx = stem.indexInRole - 3;
      x = side * (12 + idx * 8);
      y = -58 + idx * 18;
      rotate = side * (4 + idx * 3);
      depth = 48 - stem.indexInRole;
    }

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth,
      isUserPositioned: false,
    });
  });

  // SECONDARY: Slender vertical steps
  secondaries.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "secondary",
      rule.secondary.scaleMultiplier * 0.95,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? -1 : 1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (16 + tier * 10);
    const y = -90 + tier * 24;
    const rotate = side * (5 + tier * 3);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 42 - stem.indexInRole,
      isUserPositioned: false,
    });
  });

  // FILLER: Vertical accents tucked close along the stem line
  fillers.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "filler",
      rule.filler.scaleMultiplier * 0.92,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? 1 : -1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (20 + tier * 12);
    const y = -78 + tier * 22;
    const rotate = side * (6 + tier * 3);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 30 + stem.indexInRole,
      isUserPositioned: false,
    });
  });

  // FOLIAGE: Long vertical framing hugging the tall stem silhouette
  foliages.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "foliage",
      rule.foliage.scaleMultiplier,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? -1 : 1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (28 + tier * 12);
    const y = -74 + tier * 26;
    const rotate = side * (10 + tier * 4);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 16 + stem.indexInRole,
      isUserPositioned: false,
    });
  });

  return instances;
}

/**
 * 5. CASCADING LAYOUT ALGORITHM
 * - Asymmetrical descending waterfall flow with upper crown cluster
 * - Trailing elements cascade down past the tie point along a graceful S-curve
 * - Clear downward directional flow
 */
export function createCascadingLayout(
  stems: InternalStemDescriptor[],
  flowersMap: Map<string, Flower>,
  styleProfile: StyleCompositionProfile
): FlowerInstance[] {
  const rule = styleProfile.rule;
  const focals = stems.filter((s) => s.role === "focal");
  const secondaries = stems.filter((s) => s.role === "secondary");
  const fillers = stems.filter((s) => s.role === "filler");
  const foliages = stems.filter((s) => s.role === "foliage");

  const instances: FlowerInstance[] = [];

  // FOCAL: Upper crown + descending cascade steps
  focals.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "focal",
      rule.focal.scaleMultiplier * (stem.indexInRole > 1 ? 0.92 : 1.02),
      stem.indexInRole
    );

    let x = 0;
    let y = -65;
    let rotate = 0;
    let depth = 55 - stem.indexInRole;

    if (stem.indexInRole === 0) {
      // Crown Focal Top
      x = -8;
      y = -66;
      rotate = -6;
      depth = 58;
    } else if (stem.indexInRole === 1) {
      // Crown Focal Center
      x = 12;
      y = -48;
      rotate = 8;
      depth = 55;
    } else if (stem.indexInRole === 2) {
      // Cascade Step 1 (Middle)
      x = -4;
      y = -22;
      rotate = 12;
      depth = 52;
    } else if (stem.indexInRole === 3) {
      // Cascade Step 2 (Lower waterfall)
      x = 8;
      y = 8;
      rotate = 18;
      depth = 48;
    } else {
      // Cascade Step 3 (Trailing tail)
      const idx = stem.indexInRole - 4;
      x = (idx % 2 === 0 ? -2 : 6) + idx * 4;
      y = 32 + idx * 24;
      rotate = 22 + idx * 8;
      depth = 44 - idx;
    }

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth,
      isUserPositioned: false,
    });
  });

  // SECONDARY: Supporting the upper crown and framing the cascade spine
  secondaries.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "secondary",
      rule.secondary.scaleMultiplier * (stem.indexInRole > 1 ? 0.88 : 1.0),
      stem.indexInRole
    );

    let x = 0;
    let y = -45;
    let rotate = 0;

    if (stem.indexInRole === 0) {
      x = -32;
      y = -52;
      rotate = -14;
    } else if (stem.indexInRole === 1) {
      x = 34;
      y = -42;
      rotate = 16;
    } else {
      // Descending secondary
      const idx = stem.indexInRole - 2;
      x = (idx % 2 === 0 ? -14 : 16) + idx * 2;
      y = -8 + idx * 26;
      rotate = 14 + idx * 8;
    }

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 40 - stem.indexInRole,
      isUserPositioned: false,
    });
  });

  // FILLER: Water droplet trailing spray along the cascade curve
  fillers.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "filler",
      rule.filler.scaleMultiplier * (stem.indexInRole > 1 ? 0.9 : 1.0),
      stem.indexInRole
    );

    const x = Math.sin(stem.indexInRole * 1.8) * 22 + (stem.indexInRole > 1 ? 4 : -6);
    const y = -40 + stem.indexInRole * 22;
    const rotate = 8 + stem.indexInRole * 10;

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 30 + stem.indexInRole,
      isUserPositioned: false,
    });
  });

  // FOLIAGE: Prominent trailing greenery extending downward below the tie point
  foliages.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "foliage",
      rule.foliage.scaleMultiplier,
      stem.indexInRole
    );

    let x = 0;
    let y = -30;
    let rotate = 0;

    if (stem.indexInRole === 0) {
      // Crown foliage left
      x = -48;
      y = -50;
      rotate = -28;
    } else if (stem.indexInRole === 1) {
      // Trailing waterfall foliage 1
      x = 14;
      y = -10;
      rotate = 24;
    } else if (stem.indexInRole === 2) {
      // Trailing waterfall foliage 2 (reaches down to y = 45)
      x = 6;
      y = 38;
      rotate = 32;
    } else {
      // Trailing waterfall foliage 3 (deep cascade tail)
      const idx = stem.indexInRole - 3;
      x = (idx % 2 === 0 ? -8 : 12);
      y = 58 + idx * 22;
      rotate = 36 + idx * 8;
    }

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 15 + stem.indexInRole,
      isUserPositioned: false,
    });
  });

  return instances;
}

/**
 * 6. COMPACT POSY LAYOUT ALGORITHM
 * - Small, dense, tightly clustered petite bouquet right above the binding point
 * - Minimal width, low overall height, snug harmonious blooms
 * - French posy / tussie-mussie aesthetic
 */
export function createCompactPosyLayout(
  stems: InternalStemDescriptor[],
  flowersMap: Map<string, Flower>,
  styleProfile: StyleCompositionProfile
): FlowerInstance[] {
  const rule = styleProfile.rule;
  const focals = stems.filter((s) => s.role === "focal");
  const secondaries = stems.filter((s) => s.role === "secondary");
  const fillers = stems.filter((s) => s.role === "filler");
  const foliages = stems.filter((s) => s.role === "foliage");

  const instances: FlowerInstance[] = [];

  // FOCAL: Snug tight cluster centered at y = -32
  focals.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "focal",
      rule.focal.scaleMultiplier * 0.92,
      stem.indexInRole
    );

    let x = 0;
    let y = -36;
    let rotate = 0;
    let depth = 55 - stem.indexInRole;

    if (stem.indexInRole === 0) {
      x = 0;
      y = -38;
      rotate = 0;
      depth = 58;
    } else if (stem.indexInRole === 1) {
      x = -16;
      y = -30;
      rotate = -6;
      depth = 54;
    } else if (stem.indexInRole === 2) {
      x = 16;
      y = -30;
      rotate = 6;
      depth = 52;
    } else if (stem.indexInRole === 3) {
      x = 0;
      y = -18;
      rotate = 2;
      depth = 50;
    } else {
      const side = stem.indexInRole % 2 === 1 ? 1 : -1;
      const idx = stem.indexInRole - 4;
      x = side * (24 + idx * 10);
      y = -28 + idx * 8;
      rotate = side * (8 + idx * 3);
      depth = 46 - stem.indexInRole;
    }

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth,
      isUserPositioned: false,
    });
  });

  // SECONDARY: Tightly hugging the posy perimeter
  secondaries.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "secondary",
      rule.secondary.scaleMultiplier * 0.88,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? 1 : -1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (22 + tier * 12);
    const y = -32 + tier * 10;
    const rotate = side * (10 + tier * 4);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 42 - stem.indexInRole,
      isUserPositioned: false,
    });
  });

  // FILLER: Interlocking seamlessly between posy blooms
  fillers.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "filler",
      rule.filler.scaleMultiplier * 0.85,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? -1 : 1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (20 + tier * 10);
    const y = -24 + (tier * 8);
    const rotate = side * (6 + tier * 3);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 32 + stem.indexInRole,
      isUserPositioned: false,
    });
  });

  // FOLIAGE: Petite collar framing the posy edge without sprawling
  foliages.forEach((stem) => {
    const flower = flowersMap.get(stem.flowerId);
    if (!flower) return;
    const { baseSize, scale } = computeNormalizedScale(
      stem.flowerId,
      "foliage",
      rule.foliage.scaleMultiplier * 0.9,
      stem.indexInRole
    );

    const side = stem.indexInRole % 2 === 0 ? 1 : -1;
    const tier = Math.floor(stem.indexInRole / 2);
    const x = side * (34 + tier * 10);
    const y = -26 + tier * 8;
    const rotate = side * (18 + tier * 5);

    instances.push({
      instanceId: stem.instanceId,
      flowerId: stem.flowerId,
      flowerName: stem.flowerName,
      role: stem.role,
      color: stem.color,
      size: baseSize,
      scale,
      x: Math.round(x),
      y: Math.round(y),
      rotate: Math.round(rotate),
      depth: 14 + stem.indexInRole,
      isUserPositioned: false,
    });
  });

  return instances;
}

/**
 * MASTER ENTRY POINT: generateBouquetLayout
 * Calculates the initial layout array for all stems by executing the selected shape algorithm.
 */
export function generateBouquetLayout({
  shapeId = "round-dome",
  styleId = "romantic",
  bouquet,
  flowersMap,
}: GenerateBouquetLayoutArgs): {
  instances: FlowerInstance[];
  engineName: LayoutEngineName;
  shapeName: string;
} {
  const normalizedShapeId = (shapeId || "round-dome").toLowerCase().trim();
  const shapeConfig = getBouquetShapeById(normalizedShapeId);
  const styleProfile = getStyleCompositionProfile(styleId);

  // 1. Expand BouquetItem[] into individual stem descriptors with role classification
  const stemDescriptors: InternalStemDescriptor[] = [];
  const roleCounters: Record<FlowerRole, number> = {
    focal: 0,
    secondary: 0,
    filler: 0,
    foliage: 0,
  };

  let stemIndex = 0;
  bouquet.forEach((item) => {
    const flower = flowersMap.get(item.flowerId);
    if (!flower) return;
    const primaryRole: FlowerRole = flower.roles[0] || "focal";
    const color = item.selectedColor || flower.colors[0] || "red";

    for (let q = 1; q <= item.quantity; q++) {
      stemDescriptors.push({
        instanceId: `${item.flowerId}-${q}-${Date.now().toString(36)}-${stemIndex}`,
        flowerId: item.flowerId,
        flowerName: flower.name,
        role: primaryRole,
        color,
        indexInRole: roleCounters[primaryRole]++,
        totalInRole: 0,
        overallIndex: stemIndex++,
        totalStems: 0,
      });
    }
  });

  // Assign total counts
  const totalStems = stemDescriptors.length;
  stemDescriptors.forEach((s) => {
    s.totalInRole = roleCounters[s.role];
    s.totalStems = totalStems;
  });

  // 2. Select & execute the explicit shape layout function
  let instances: FlowerInstance[];
  let engineName: LayoutEngineName;

  switch (normalizedShapeId) {
    case "hand-tied":
      engineName = "createHandTiedLayout";
      instances = createHandTiedLayout(stemDescriptors, flowersMap, styleProfile);
      break;

    case "loose-wild":
    case "wild":
      engineName = "createLooseWildLayout";
      instances = createLooseWildLayout(stemDescriptors, flowersMap, styleProfile);
      break;

    case "long-stem":
      engineName = "createLongStemLayout";
      instances = createLongStemLayout(stemDescriptors, flowersMap, styleProfile);
      break;

    case "cascading":
    case "cascade":
      engineName = "createCascadingLayout";
      instances = createCascadingLayout(stemDescriptors, flowersMap, styleProfile);
      break;

    case "compact-posy":
    case "posy":
      engineName = "createCompactPosyLayout";
      instances = createCompactPosyLayout(stemDescriptors, flowersMap, styleProfile);
      break;

    case "round-dome":
    case "dome":
    default:
      engineName = "createRoundDomeLayout";
      instances = createRoundDomeLayout(stemDescriptors, flowersMap, styleProfile);
      break;
  }

  // Normalize all instance fields
  const normalizedInstances: FlowerInstance[] = instances.map((inst) => ({
    ...inst,
    rotation: inst.rotation ?? inst.rotate,
    zIndex: inst.zIndex ?? inst.depth,
    flipX: inst.flipX ?? false,
    flipY: inst.flipY ?? false,
    isManuallyPositioned: inst.isManuallyPositioned ?? (inst.isUserPositioned ?? false),
  }));

  return {
    instances: normalizedInstances,
    engineName,
    shapeName: shapeConfig.name,
  };
}

/**
 * Layout metrics for developer assertion and comparison
 */
export interface LayoutMetrics {
  avgX: number;
  avgY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export function computeLayoutMetrics(instances: FlowerInstance[]): LayoutMetrics {
  if (instances.length === 0) {
    return { avgX: 0, avgY: 0, minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  instances.forEach((inst) => {
    sumX += inst.x;
    sumY += inst.y;
    if (inst.x < minX) minX = inst.x;
    if (inst.x > maxX) maxX = inst.x;
    if (inst.y < minY) minY = inst.y;
    if (inst.y > maxY) maxY = inst.y;
  });

  return {
    avgX: Math.round(sumX / instances.length),
    avgY: Math.round(sumY / instances.length),
    minX,
    maxX,
    minY,
    maxY,
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  };
}
