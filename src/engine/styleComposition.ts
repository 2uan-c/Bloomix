import type { BouquetItem, Flower, FlowerInstance, FlowerRole } from "./types.ts";
import bouquetShapesRaw from "../data/bouquetShapes.json";
import { resolveWrappingOption, resolveRibbonOption } from "../utils/botanicalImages.ts";
import { computeNormalizedScale } from "./flowerScaleNormalization.ts";
import { getBouquetShapeById, DEFAULT_SHAPE_BY_STYLE, type BouquetShapeOption } from "../data/bouquetShapesConfig.ts";

export interface RoleCompositionConfig {
  preferredRatio?: number;
  placement: string;
  scaleMultiplier: number;
  layer: "front" | "front-middle" | "middle" | "middle-front" | "middle-back" | "back";
  density?: number;
}

export interface StyleCompositionShapeRule {
  displayName: string;
  variant?: string;
  shape: string;
  silhouette: string;
  width: number;
  height: number;
  density: number;
  symmetry: number;
  negativeSpace: number;
  flowerScaleVariation: number;
  rotationVariation: number;
  heightVariation: number;
  depthVariation: number;
  focal: RoleCompositionConfig;
  secondary: RoleCompositionConfig;
  filler: RoleCompositionConfig;
  foliage: RoleCompositionConfig;
  stemDirection: string;
  defaultWrapping: string;
  defaultRibbon: string;
}

export interface BouquetShapesGlobalConfig {
  coordinateSystem: string;
  bindingPoint: { x: number; y: number };
  flowerMassCenter: { x: number; y: number };
  quantityLimits: {
    minimumStems: number;
    maximumStems: number;
  };
}

export interface BouquetShapesData {
  version: string;
  description: string;
  global: BouquetShapesGlobalConfig;
  styles: Record<string, StyleCompositionShapeRule>;
}

export const BOUQUET_SHAPES_DATA = bouquetShapesRaw as BouquetShapesData;

/**
 * Returns the single-source-of-truth style rule for a given style ID.
 */
export function getStyleShapeRule(styleId?: string): StyleCompositionShapeRule {
  const normalizedId = (styleId || "romantic").toLowerCase().trim();
  if (BOUQUET_SHAPES_DATA.styles[normalizedId]) {
    return BOUQUET_SHAPES_DATA.styles[normalizedId];
  }
  // Check if styleId has variant like playful1 -> playful-1
  if (normalizedId === "playful1" && BOUQUET_SHAPES_DATA.styles["playful-1"]) {
    return BOUQUET_SHAPES_DATA.styles["playful-1"];
  }
  return BOUQUET_SHAPES_DATA.styles.romantic;
}

/**
 * Profile adapter for visualizer and UI compatibility
 */
export interface StyleCompositionProfile {
  id: string;
  name: string;
  shape: string;
  silhouette: string;
  width: number;
  height: number;
  density: number;
  symmetry: number;
  negativeSpace: number;
  tiePoint: { x: number; y: number };
  massCenter: { x: number; y: number };
  defaultWrappingPreset: string;
  defaultRibbonId: string;
  rule: StyleCompositionShapeRule;
}

export function getStyleCompositionProfile(styleId?: string): StyleCompositionProfile {
  const normalizedId = (styleId || "romantic").toLowerCase().trim();
  const rule = getStyleShapeRule(normalizedId);
  const global = BOUQUET_SHAPES_DATA.global;

  // Normalized (0.5, 0.78) -> Canvas pixel coordinate (0, 52)
  const tiePoint = {
    x: Math.round((global.bindingPoint.x - 0.5) * 340),
    y: Math.round((global.bindingPoint.y - 0.5) * 200), // ~56px
  };

  // Normalized (0.5, 0.36) -> Canvas pixel mass center (0, -42)
  const massCenter = {
    x: Math.round((global.flowerMassCenter.x - 0.5) * 340),
    y: Math.round((global.flowerMassCenter.y - 0.5) * 300), // ~-42px
  };

  const wrapping = resolveWrappingOption(rule.defaultWrapping);
  const ribbon = resolveRibbonOption(rule.defaultRibbon);

  return {
    id: normalizedId,
    name: rule.displayName,
    shape: rule.shape,
    silhouette: rule.silhouette,
    width: rule.width,
    height: rule.height,
    density: rule.density,
    symmetry: rule.symmetry,
    negativeSpace: rule.negativeSpace,
    tiePoint,
    massCenter,
    defaultWrappingPreset: wrapping.id,
    defaultRibbonId: ribbon.id,
    rule,
  };
}

/**
 * Calculates a smooth botanical bezier curve connecting a bloom calyx down to the binding tie point.
 * Incorporates stemDirection from bouquetShapes.json.
 */
export function computeBotanicalStemPath(
  bloomX: number,
  bloomY: number,
  bloomSize: number,
  scale: number,
  tieX: number = 0,
  tieY: number = 52,
  stemDirection: string = "slightly-inward"
): string {
  const startX = bloomX;
  const startY = bloomY + bloomSize * scale * 0.28;

  const dx = tieX - startX;
  const dy = tieY - startY;

  // Stem curvature factor tailored to the style's stemDirection
  let directionBias = 1.0;
  if (stemDirection.includes("wild")) {
    directionBias = 1.6;
  } else if (stemDirection.includes("clean") || stemDirection.includes("slightly-inward")) {
    directionBias = 0.6;
  } else if (stemDirection.includes("organic")) {
    directionBias = 1.3;
  }

  const curvatureBias = Math.sin((startX / 100) * Math.PI * 0.5) * 5 * directionBias;
  const cp1X = startX + dx * 0.22 - curvatureBias;
  const cp1Y = startY + dy * 0.42;

  const cp2X = tieX - dx * 0.28 + curvatureBias * 0.4;
  const cp2Y = startY + dy * 0.82;

  const targetX = tieX + Math.sin(startX * 0.06) * 3.2;
  const targetY = tieY;

  return `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${targetX.toFixed(1)} ${targetY.toFixed(1)}`;
}

/**
 * Returns botanical stem color based on role
 */
export function getStemColorByRole(role: FlowerRole): string {
  switch (role) {
    case "foliage":
      return "#1D4216";
    case "filler":
      return "#2B581C";
    case "secondary":
      return "#264E19";
    case "focal":
    default:
      return "#1E3E11";
  }
}

/**
 * Maps role layer string to base zIndex
 */
function getLayerBaseZIndex(layer: RoleCompositionConfig["layer"], role: FlowerRole): number {
  switch (layer) {
    case "front":
      return 68;
    case "front-middle":
      return role === "focal" ? 58 : 50;
    case "middle":
      return 40;
    case "middle-front":
      return 46;
    case "middle-back":
      return 30;
    case "back":
    default:
      return 15;
  }
}

/**
 * Pure generator function: Calculates initial 2D flower instances from bouquet items, flowers map,
 * and the single-source-of-truth bouquetShapes.json specification combined with physical shape geometry.
 */
export function generateBouquetInstancesFromShapeRule(
  bouquet: BouquetItem[],
  flowersMap: Map<string, Flower>,
  styleId: string = "romantic",
  shapeId?: string
): FlowerInstance[] {
  const profile = getStyleCompositionProfile(styleId);
  const rule = profile.rule;
  const tie = profile.tiePoint;
  const rawMassCenter = profile.massCenter;
  const effectiveShapeId = shapeId || DEFAULT_SHAPE_BY_STYLE[styleId] || "round-dome";
  const shapeOption = getBouquetShapeById(effectiveShapeId);

  const instances: FlowerInstance[] = [];

  // Group items by role
  const foliageItems: { item: BouquetItem; flower: Flower }[] = [];
  const fillerItems: { item: BouquetItem; flower: Flower }[] = [];
  const secondaryItems: { item: BouquetItem; flower: Flower }[] = [];
  const focalItems: { item: BouquetItem; flower: Flower }[] = [];

  bouquet.forEach((item) => {
    const flower = flowersMap.get(item.flowerId);
    if (!flower) return;
    if (flower.roles.includes("foliage")) {
      foliageItems.push({ item, flower });
    } else if (flower.roles.includes("filler")) {
      fillerItems.push({ item, flower });
    } else if (flower.roles.includes("focal")) {
      focalItems.push({ item, flower });
    } else {
      secondaryItems.push({ item, flower });
    }
  });

  const totalStems = bouquet.reduce((sum, item) => sum + item.quantity, 0);
  if (totalStems === 0) return [];

  // Blend Style Rules (aesthetics/roles/scales) with Physical Bouquet Shape (geometry/bounding/form)
  const effectiveWidth = rule.width * 0.40 + shapeOption.width * 0.60;
  const effectiveHeight = rule.height * 0.40 + shapeOption.height * 0.60;
  const effectiveDensity = rule.density * 0.45 + shapeOption.density * 0.55;
  const effectiveSymmetry = shapeOption.symmetry;
  const isSymmetric = effectiveSymmetry >= 0.65;

  // Distinct Physical Shape Geometry Offsets & Multipliers
  let massCenterY = rawMassCenter.y;
  let shapeRadiusMultiplier = 1.0;
  let shapeWidthMultiplier = 1.0;
  let shapeHeightMultiplier = 1.0;
  let shapeStemAngleMultiplier = 1.0;

  if (effectiveShapeId === "round-dome") {
    // Round Dome: Balanced circular dome, compact radius, symmetrical concentric distribution
    massCenterY = rawMassCenter.y;
    shapeRadiusMultiplier = 0.92;
    shapeWidthMultiplier = 0.90;
    shapeHeightMultiplier = 0.82;
    shapeStemAngleMultiplier = 0.80;
  } else if (effectiveShapeId === "hand-tied") {
    // Hand-Tied: Classic florist spiral arrangement, slightly vertical oval silhouette
    massCenterY = rawMassCenter.y - 4;
    shapeRadiusMultiplier = 1.00;
    shapeWidthMultiplier = 0.94;
    shapeHeightMultiplier = 1.02;
    shapeStemAngleMultiplier = 1.05;
  } else if (effectiveShapeId === "loose-wild") {
    // Loose / Wild: Wide, airy, organic wildflower silhouette with high asymmetry and sprawling foliage
    massCenterY = rawMassCenter.y - 8;
    shapeRadiusMultiplier = 1.22;
    shapeWidthMultiplier = 1.25;
    shapeHeightMultiplier = 1.10;
    shapeStemAngleMultiplier = 1.40;
  } else if (effectiveShapeId === "long-stem") {
    // Long-Stem: Tall slender vertical silhouette, flowers lifted high to highlight long stems
    massCenterY = rawMassCenter.y - 28;
    shapeRadiusMultiplier = 0.82;
    shapeWidthMultiplier = 0.68;
    shapeHeightMultiplier = 1.30;
    shapeStemAngleMultiplier = 0.55;
  } else if (effectiveShapeId === "cascading") {
    // Cascading: Waterfall bouquet with upper dome and trailing floral waterfall descending downward
    massCenterY = rawMassCenter.y - 12;
    shapeRadiusMultiplier = 1.04;
    shapeWidthMultiplier = 1.00;
    shapeHeightMultiplier = 1.22;
    shapeStemAngleMultiplier = 1.10;
  } else if (effectiveShapeId === "compact-posy") {
    // Compact Posy: Petite, tightly gathered, round nosegay right above the ribbon collar
    massCenterY = rawMassCenter.y + 10;
    shapeRadiusMultiplier = 0.72;
    shapeWidthMultiplier = 0.74;
    shapeHeightMultiplier = 0.68;
    shapeStemAngleMultiplier = 0.70;
  }

  const widthSpread = effectiveWidth * 135 * shapeWidthMultiplier;
  const heightSpread = effectiveHeight * 105 * shapeHeightMultiplier;
  const densityPack = 1.12 - effectiveDensity * 0.35;
  const gapSpread = 0.88 + rule.negativeSpace * 0.45;

  // ----------------------------------------------------
  // 1. Foliage Greenery (Back Layer)
  // ----------------------------------------------------
  const totalFoliage = foliageItems.reduce((sum, i) => sum + i.item.quantity, 0);
  const foliageDensityMultiplier = rule.foliage.density || 0.5;
  let foliageIdx = 0;
  const foliageZBase = getLayerBaseZIndex(rule.foliage.layer, "foliage");

  foliageItems.forEach(({ item, flower }) => {
    const chosenColor = item.selectedColor || flower.colors[0] || "green";
    for (let q = 0; q < item.quantity; q++) {
      const idx = foliageIdx++;
      // Deterministic stable instance ID
      const instanceId = `${item.flowerId}-foliage-${q + 1}`;

      // Arc placement based on silhouette & width
      const totalArc = isSymmetric ? 94 * effectiveWidth : 124 * effectiveWidth;
      let angle = totalFoliage > 1 ? -totalArc / 2 + (totalArc / (totalFoliage - 1)) * idx : 0;

      if (!isSymmetric) {
        angle += (1 - effectiveSymmetry) * (idx % 2 === 0 ? -20 : 20);
      }

      // Height variation & placement
      const rad = (angle * Math.PI) / 180;
      let radialDist = (92 + (idx % 3) * 14) * effectiveWidth * foliageDensityMultiplier * gapSpread * shapeRadiusMultiplier;

      // Special placement overrides from shape rule
      if (effectiveShapeId === "loose-wild") {
        radialDist *= 1.32;
      } else if (effectiveShapeId === "compact-posy") {
        radialDist *= 0.74;
      } else if (effectiveShapeId === "long-stem") {
        radialDist *= 0.82;
      }

      let x = Math.sin(rad) * radialDist * (widthSpread / 115);
      let y = massCenterY - Math.cos(rad) * radialDist * 0.7 * (heightSpread / 95);

      // Cascading descending trail for waterfall silhouette
      if (effectiveShapeId === "cascading" && idx >= Math.floor(totalFoliage / 2)) {
        const cascadeRank = idx - Math.floor(totalFoliage / 2) + 1;
        y += cascadeRank * 24 + 10;
        x = (idx % 2 === 0 ? -1 : 1) * (14 + cascadeRank * 8);
      }

      // Height stagger variation
      y += ((idx % 3) - 1) * (rule.heightVariation * 24);

      // Deterministic normalized scale for foliage variety
      const { baseSize: size, scale, baseScale } = computeNormalizedScale(
        flower.id,
        "foliage",
        rule.foliage.scaleMultiplier,
        q
      );

      const rot = Math.round(angle * 0.7 * shapeStemAngleMultiplier + Math.sin(idx * 2) * rule.rotationVariation);
      const depth = foliageZBase + idx;

      instances.push({
        instanceId,
        flowerId: item.flowerId,
        flowerName: flower.name,
        role: "foliage",
        color: chosenColor,
        size,
        scale,
        baseScale,
        x: Math.round(x),
        y: Math.round(y),
        rotate: rot,
        rotation: rot,
        flipX: false,
        flipY: false,
        depth,
        zIndex: depth,
        stemPath: computeBotanicalStemPath(x, y, size, scale, tie.x, tie.y, rule.stemDirection),
        stemColor: getStemColorByRole("foliage"),
        isUserPositioned: false,
      });
    }
  });

  // ----------------------------------------------------
  // 2. Filler Blooms (Middle-Back / Soft Frame Layer)
  // ----------------------------------------------------
  const totalFillers = fillerItems.reduce((sum, i) => sum + i.item.quantity, 0);
  const fillerDensityMultiplier = rule.filler.density || 0.6;
  let fillerIdx = 0;
  const fillerZBase = getLayerBaseZIndex(rule.filler.layer, "filler");

  fillerItems.forEach(({ item, flower }) => {
    const chosenColor = item.selectedColor || flower.colors[0] || "white";
    for (let q = 0; q < item.quantity; q++) {
      const idx = fillerIdx++;
      // Deterministic stable instance ID
      const instanceId = `${item.flowerId}-filler-${q + 1}`;

      const fillerArc = isSymmetric ? 86 * effectiveWidth : 112 * effectiveWidth;
      let angle = totalFillers > 1 ? -fillerArc / 2 + (fillerArc / (totalFillers - 1)) * idx : 0;

      if (!isSymmetric) {
        angle += (1 - effectiveSymmetry) * (idx % 2 === 0 ? -16 : 16);
      }

      const rad = (angle * Math.PI) / 180;
      let radius = (72 + (idx % 2) * 16) * effectiveWidth * fillerDensityMultiplier * densityPack * shapeRadiusMultiplier;

      if (effectiveShapeId === "loose-wild") {
        radius *= 1.28;
      } else if (effectiveShapeId === "compact-posy") {
        radius *= 0.72;
      } else if (effectiveShapeId === "long-stem") {
        radius *= 0.80;
      }

      let x = Math.sin(rad) * radius * (widthSpread / 110);
      let y = massCenterY - Math.cos(rad) * radius * 0.65 * (heightSpread / 90) + (idx % 2 === 0 ? -6 : 6);

      // Cascading descending trail
      if (effectiveShapeId === "cascading" && idx % 2 === 1) {
        y += 24;
      }

      // Height stagger variation
      y += ((idx % 3) - 1) * (rule.heightVariation * 26);

      // Deterministic normalized scale for filler variety
      const { baseSize: size, scale, baseScale } = computeNormalizedScale(
        flower.id,
        "filler",
        rule.filler.scaleMultiplier,
        q
      );

      const rot = Math.round(angle * 0.55 * shapeStemAngleMultiplier + Math.sin(idx * 3) * rule.rotationVariation);
      const depth = fillerZBase + idx;

      instances.push({
        instanceId,
        flowerId: item.flowerId,
        flowerName: flower.name,
        role: "filler",
        color: chosenColor,
        size,
        scale,
        baseScale,
        x: Math.round(x),
        y: Math.round(y),
        rotate: rot,
        rotation: rot,
        flipX: false,
        flipY: false,
        depth,
        zIndex: depth,
        stemPath: computeBotanicalStemPath(x, y, size, scale, tie.x, tie.y, rule.stemDirection),
        stemColor: getStemColorByRole("filler"),
        isUserPositioned: false,
      });
    }
  });

  // ----------------------------------------------------
  // 3. Secondary Blooms (Middle Support Layer)
  // ----------------------------------------------------
  const totalSecondary = secondaryItems.reduce((sum, i) => sum + i.item.quantity, 0);
  let secondaryIdx = 0;
  const secondaryZBase = getLayerBaseZIndex(rule.secondary.layer, "secondary");

  secondaryItems.forEach(({ item, flower }) => {
    const chosenColor = item.selectedColor || flower.colors[0] || "pink";
    for (let q = 0; q < item.quantity; q++) {
      const idx = secondaryIdx++;
      // Deterministic stable instance ID
      const instanceId = `${item.flowerId}-sec-${q + 1}`;

      const secArc = isSymmetric ? 74 * effectiveWidth : 96 * effectiveWidth;
      let angle = totalSecondary > 1 ? -secArc / 2 + (secArc / (totalSecondary - 1)) * idx : 0;

      if (!isSymmetric) {
        angle += (1 - effectiveSymmetry) * (idx % 2 === 0 ? 15 : -15);
      }

      const rad = (angle * Math.PI) / 180;
      let radius = (54 + (idx % 2) * 14) * effectiveWidth * densityPack * gapSpread * shapeRadiusMultiplier;

      if (effectiveShapeId === "loose-wild") {
        radius *= 1.24;
      } else if (effectiveShapeId === "compact-posy") {
        radius *= 0.70;
      } else if (effectiveShapeId === "long-stem") {
        radius *= 0.78;
      }

      let x = (Math.sin(rad) * radius + (idx % 2 === 0 ? 10 : -10)) * (widthSpread / 110);
      let y = massCenterY - Math.cos(rad) * radius * 0.62 * (heightSpread / 90) + 12 + (idx % 2 === 0 ? -6 : 6);

      // Cascading descending trail
      if (effectiveShapeId === "cascading" && idx === totalSecondary - 1 && totalSecondary > 1) {
        y += 32;
        x *= 0.6;
      }

      // Height stagger variation
      y += ((idx % 3) - 1) * (rule.heightVariation * 28);

      // Deterministic normalized scale for secondary variety
      const { baseSize: size, scale, baseScale } = computeNormalizedScale(
        flower.id,
        "secondary",
        rule.secondary.scaleMultiplier,
        q
      );

      const rot = Math.round(angle * 0.5 * shapeStemAngleMultiplier + Math.sin(idx * 2.5) * rule.rotationVariation);
      const depth = secondaryZBase + idx;

      instances.push({
        instanceId,
        flowerId: item.flowerId,
        flowerName: flower.name,
        role: "secondary",
        color: chosenColor,
        size,
        scale,
        baseScale,
        x: Math.round(x),
        y: Math.round(y),
        rotate: rot,
        rotation: rot,
        flipX: false,
        flipY: false,
        depth,
        zIndex: depth,
        stemPath: computeBotanicalStemPath(x, y, size, scale, tie.x, tie.y, rule.stemDirection),
        stemColor: getStemColorByRole("secondary"),
        isUserPositioned: false,
      });
    }
  });

  // ----------------------------------------------------
  // 4. Focal Hero Blooms (Foreground Anchor)
  // ----------------------------------------------------
  const totalFocal = focalItems.reduce((sum, i) => sum + i.item.quantity, 0);
  let focalIdx = 0;
  const focalZBase = getLayerBaseZIndex(rule.focal.layer, "focal");

  focalItems.forEach(({ item, flower }) => {
    const chosenColor = item.selectedColor || flower.colors[0] || "red";
    for (let q = 0; q < item.quantity; q++) {
      const idx = focalIdx++;
      // Deterministic stable instance ID
      const instanceId = `${item.flowerId}-focal-${q + 1}`;

      let x = 0;
      let y = massCenterY + 12;
      let rot = 0;

      const focalPlacement = rule.focal.placement;

      if (effectiveShapeId === "compact-posy") {
        // Tight posy center dome cluster
        if (totalFocal === 1) {
          x = 0;
          y = massCenterY + 4;
        } else {
          const theta = (idx / totalFocal) * Math.PI * 2;
          x = Math.cos(theta) * 14;
          y = massCenterY + 4 + Math.sin(theta) * 10;
          rot = Math.sin(idx * 2) * 5;
        }
      } else if (effectiveShapeId === "long-stem") {
        // Long-stem: slender vertical hero positioning lifted high
        if (totalFocal === 1) {
          x = 0;
          y = massCenterY;
        } else if (totalFocal === 2) {
          x = idx === 0 ? -12 : 12;
          y = massCenterY + (idx === 0 ? -4 : 6);
          rot = idx === 0 ? -3 : 3;
        } else {
          x = (idx - (totalFocal - 1) / 2) * 16;
          y = massCenterY + Math.abs(idx - (totalFocal - 1) / 2) * 8 - 4;
          rot = (idx - (totalFocal - 1) / 2) * 4;
        }
      } else if (effectiveShapeId === "loose-wild" || focalPlacement.includes("slightly-off-center") || focalPlacement.includes("offset")) {
        // Asymmetric focal layout (e.g. Natural, Rustic, Loose/Wild)
        if (totalFocal === 1) {
          x = -16 * (widthSpread / 100);
          y = massCenterY + 4;
          rot = -5;
        } else {
          x = (idx === 0 ? -24 : 20 + (idx - 1) * 16) * (widthSpread / 100);
          y = massCenterY + (idx === 0 ? -6 : 12 + (idx - 1) * 6);
          rot = idx === 0 ? -8 : 8;
        }
      } else if (effectiveShapeId === "cascading") {
        // Cascading focal blooms: upper anchor with descending flow
        if (totalFocal === 1) {
          x = 0;
          y = massCenterY + 2;
        } else if (idx === 0) {
          x = 0;
          y = massCenterY - 4;
          rot = 0;
        } else {
          x = (idx % 2 === 0 ? -16 : 14);
          y = massCenterY + idx * 14;
          rot = idx % 2 === 0 ? -5 : 5;
        }
      } else if (focalPlacement.includes("central-layered-cluster")) {
        // Luxury dense central cluster
        if (totalFocal === 1) {
          x = 0;
          y = massCenterY + 8;
          rot = 0;
        } else if (totalFocal === 2) {
          x = (idx === 0 ? -20 : 20) * densityPack;
          y = massCenterY + (idx === 0 ? -2 : 12);
          rot = idx === 0 ? -5 : 5;
        } else {
          const theta = (idx / totalFocal) * Math.PI * 2 + (idx * 0.4);
          const r = (12 + idx * 10) * densityPack * shapeRadiusMultiplier;
          x = Math.cos(theta) * r;
          y = massCenterY + Math.sin(theta) * r * 0.8 + 6;
          rot = Math.sin(idx * 2) * rule.rotationVariation;
        }
      } else {
        // Symmetrical Center Dome (Round Dome, Classic, Romantic, Soft, Minimal)
        if (totalFocal === 1) {
          x = 0;
          y = massCenterY + 6;
          rot = 0;
        } else if (totalFocal === 2) {
          x = (idx === 0 ? -22 : 22) * densityPack * (widthSpread / 110) * shapeRadiusMultiplier;
          y = massCenterY + 10;
          rot = idx === 0 ? -5 : 5;
        } else if (totalFocal === 3) {
          const positions = [
            { x: 0, y: massCenterY - 8, rot: 0 },
            { x: -24 * densityPack * shapeRadiusMultiplier, y: massCenterY + 16, rot: -6 },
            { x: 24 * densityPack * shapeRadiusMultiplier, y: massCenterY + 16, rot: 6 },
          ];
          x = positions[idx]?.x ?? 0;
          y = positions[idx]?.y ?? (massCenterY + 10);
          rot = positions[idx]?.rot ?? 0;
        } else {
          const theta = idx * 2.39996 + 0.6;
          const radius = Math.min(52, 16 + Math.sqrt(idx) * 16) * densityPack * shapeRadiusMultiplier;
          x = Math.cos(theta) * radius * (widthSpread / 110);
          y = massCenterY + Math.sin(theta) * radius * 0.7 * (heightSpread / 95);
          rot = Math.sin(idx * 1.5) * rule.rotationVariation;
        }
      }

      // Height stagger variation
      y += ((idx % 3) - 1) * (rule.heightVariation * 20);

      // Deterministic normalized scale for focal variety
      const { baseSize: size, scale, baseScale } = computeNormalizedScale(
        flower.id,
        "focal",
        rule.focal.scaleMultiplier,
        q
      );

      const depth = focalZBase + idx;

      instances.push({
        instanceId,
        flowerId: item.flowerId,
        flowerName: flower.name,
        role: "focal",
        color: chosenColor,
        size,
        scale,
        baseScale,
        x: Math.round(x),
        y: Math.round(y),
        rotate: Math.round(rot),
        rotation: Math.round(rot),
        flipX: false,
        flipY: false,
        depth,
        zIndex: depth,
        stemPath: computeBotanicalStemPath(x, y, size, scale, tie.x, tie.y, rule.stemDirection),
        stemColor: getStemColorByRole("focal"),
        isUserPositioned: false,
      });
    }
  });

  return instances;
}

/**
 * Calculates deterministic 2D stem positioning for a bouquet based strictly on the chosen style profile and shape.
 * Retained for backward compatibility.
 */
export function calculateBouquetStemLayout(
  bouquet: BouquetItem[],
  flowersMap: Map<string, Flower>,
  styleId: string = "romantic",
  shapeId?: string
): FlowerInstance[] {
  return generateBouquetInstancesFromShapeRule(bouquet, flowersMap, styleId, shapeId);
}
