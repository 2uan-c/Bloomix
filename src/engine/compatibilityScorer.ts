import type {
  BouquetItem,
  CategoryScoreResult,
  Flower,
  FlowerRole,
  ScoringConfig,
  ScoringIssue,
} from "./types.ts";

export function scoreFlowerCompatibility(
  items: BouquetItem[],
  flowersMap: Map<string, Flower>,
  config: ScoringConfig
): CategoryScoreResult {
  const issues: ScoringIssue[] = [];
  let score = config.compatibilityRules.baseScore;

  if (items.length === 0) {
    return {
      score: 0,
      issues: [{ category: "compatibility", severity: "high", message: "No flowers in bouquet" }],
    };
  }

  let totalStems = 0;
  const rolesPresent = new Set<FlowerRole>();
  const focalFlowers: Flower[] = [];
  const sizes = new Set<string>();
  const shapes = new Set<string>();
  const textures = new Set<string>();
  const visualWeights: number[] = [];

  let heavyFlowersCount = 0;

  for (const item of items) {
    const flower = flowersMap.get(item.flowerId);
    if (!flower) continue;

    totalStems += item.quantity;
    flower.roles.forEach((r) => rolesPresent.add(r));

    if (flower.roles.includes("focal")) {
      focalFlowers.push(flower);
    }

    if (flower.visual.visualWeight >= 8) {
      heavyFlowersCount += item.quantity;
    }

    sizes.add(flower.visual.size);
    shapes.add(flower.visual.shape);
    textures.add(flower.visual.texture);
    visualWeights.push(flower.visual.visualWeight);
  }

  // 1. Focal role checks
  if (focalFlowers.length === 0) {
    score -= config.compatibilityRules.penalties.noFocal;
    issues.push({
      category: "compatibility",
      severity: "high",
      message: "The bouquet lacks a clear focal flower (e.g., Rose, Peony, Sunflower, Lily, or Orchid) to serve as the visual anchor.",
    });
  } else if (focalFlowers.length >= 4) {
    score -= 25; // Severe focal competition penalty for 4+ focal flowers
    issues.push({
      category: "compatibility",
      severity: "high",
      message: `Too many different focal flowers (${focalFlowers.length} focal varieties) are competing for the main spotlight. Choosing 1 or 2 focal varieties creates clear visual hierarchy.`,
    });
  } else if (focalFlowers.length > 2) {
    score -= config.compatibilityRules.penalties.tooManyFocal;
    issues.push({
      category: "compatibility",
      severity: "high",
      message: "Too many different focal flowers (3 focal varieties) are competing for the main spotlight. Choosing 1 or 2 focal varieties creates better hierarchy.",
    });
  }

  // 2. Supporting flower checks
  const hasSupporting = rolesPresent.has("secondary");
  const hasFoliageOrFiller = rolesPresent.has("filler") || rolesPresent.has("foliage");

  if (focalFlowers.length > 1 && items.length > 1 && !hasSupporting && !hasFoliageOrFiller) {
    score -= config.compatibilityRules.penalties.noSupportingFlowers;
    issues.push({
      category: "compatibility",
      severity: "medium",
      message: "The arrangement lacks secondary supporting flowers (like Tulips, Carnations, or Daisies) to transition between focal blooms.",
    });
  }

  // 3. Filler & foliage check
  if ((totalStems >= 3 || items.length >= 2) && !hasFoliageOrFiller) {
    score -= 8;
    issues.push({
      category: "compatibility",
      severity: "medium",
      message: "Adding delicate filler (e.g., Baby's Breath, Waxflower) or greens (e.g., Eucalyptus, Ruscus) would give the bouquet natural depth, softness, and transitions.",
    });
  }

  // 4. Heavy flower overload (visual weight >= 7)
  const heavyBloomRatio = totalStems > 0 ? heavyFlowersCount / totalStems : 0;
  if (items.length >= 2 && heavyBloomRatio >= 0.7 && !hasFoliageOrFiller) {
    score -= 12;
    issues.push({
      category: "compatibility",
      severity: "medium",
      message: "The bouquet is dominated by heavy blossoms without enough airy fillers or foliage to balance the visual weight.",
    });
  }

  // 5. Visual weight extremes
  if (visualWeights.length >= 2) {
    const minW = Math.min(...visualWeights);
    const maxW = Math.max(...visualWeights);
    const hasIntermediate = visualWeights.some((w) => w > minW && w < maxW);
    if (maxW - minW >= 6 && !hasIntermediate && items.length >= 2 && !hasFoliageOrFiller) {
      score -= config.compatibilityRules.penalties.largeVisualWeightDifference;
      issues.push({
        category: "compatibility",
        severity: "low",
        message: "There is a sharp contrast in flower visual weight without medium-weight blooms to bridge them.",
      });
    }
  }

  // 6. Diversity & Monotony
  if (items.length >= 3) {
    if (sizes.size === 1) {
      score -= config.compatibilityRules.penalties.sameSize;
      issues.push({
        category: "compatibility",
        severity: "low",
        message: "All flowers are the same size. Varying sizes creates dynamic scale.",
      });
    }
    if (shapes.size === 1) {
      score -= config.compatibilityRules.penalties.sameShape;
      issues.push({
        category: "compatibility",
        severity: "low",
        message: "All selected flowers have the same flower shape.",
      });
    }
    if (textures.size === 1) {
      score -= config.compatibilityRules.penalties.sameTexture;
      issues.push({
        category: "compatibility",
        severity: "low",
        message: "All flowers share identical petal texture.",
      });
    }
  }

  // Bonuses (only awarded when bouquet has sound focal hierarchy)
  if (focalFlowers.length <= 2) {
    if (shapes.size >= 2) {
      score += config.compatibilityRules.bonuses.shapeDiversity;
    }
    if (textures.size >= 2) {
      score += config.compatibilityRules.bonuses.textureDiversity;
    }
  }

  const finalScore = Math.max(
    config.compatibilityRules.minScore,
    Math.min(100, Math.round(score))
  );

  return {
    score: finalScore,
    issues,
    details: {
      focalCount: focalFlowers.length,
      hasSupporting,
      hasFoliageOrFiller,
      shapeCount: shapes.size,
      textureCount: textures.size,
    },
  };
}
