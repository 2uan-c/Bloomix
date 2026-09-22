import type {
  BouquetItem,
  CategoryScoreResult,
  Flower,
  ScoringConfig,
  ScoringIssue,
  StyleData,
} from "./types.ts";

export function scoreStyleConsistency(
  items: BouquetItem[],
  flowersMap: Map<string, Flower>,
  selectedStyleId: string,
  styleData: StyleData,
  config: ScoringConfig
): CategoryScoreResult {
  const issues: ScoringIssue[] = [];

  if (items.length === 0 || !selectedStyleId) {
    return {
      score: 0,
      issues: [
        {
          category: "style",
          severity: "high",
          message: !selectedStyleId ? "No bouquet style selected" : "No flowers selected",
        },
      ],
    };
  }

  const currentStyleObj = styleData.styles.find((s) => s.id === selectedStyleId);
  const styleName = currentStyleObj ? currentStyleObj.name : selectedStyleId;

  let totalStems = 0;
  let totalMatchSum = 0;
  const flowerMatchScores: { flower: Flower; match: number }[] = [];

  for (const item of items) {
    const flower = flowersMap.get(item.flowerId);
    if (!flower) continue;

    totalStems += item.quantity;

    let flowerScore = 0;
    if (flower.styles.includes(selectedStyleId)) {
      flowerScore = config.styleRules.directMatch; // 1.0
    } else {
      // Find highest compatibility with selected style
      const matrix = styleData.compatibility[selectedStyleId] || {};
      let bestComp = 0.4;
      for (const st of flower.styles) {
        if (matrix[st] !== undefined && matrix[st] > bestComp) {
          bestComp = matrix[st];
        }
      }
      flowerScore = bestComp;
    }

    flowerMatchScores.push({ flower, match: flowerScore });
    totalMatchSum += flowerScore * item.quantity;

    if (flowerScore < 0.6) {
      issues.push({
        category: "style",
        severity: "medium",
        message: `${flower.name} differs from the '${styleName}' style theme. Consider substituting with a flower native to this style.`,
      });
    }
  }

  const avgMatch = totalStems > 0 ? totalMatchSum / totalStems : 0;
  let rawScore = avgMatch * 100;

  // 1. Style Dissonance Penalties (e.g., rustic/playful flowers in romantic or luxury bouquets)
  const conflictingFlowers = flowerMatchScores.filter((f) => f.match < 0.75);
  if (conflictingFlowers.length > 0) {
    const penalty = Math.min(25, conflictingFlowers.length * 8);
    rawScore -= penalty;
  }

  // 2. Minimal Style Specific Restraint Rules
  if (selectedStyleId === "minimal") {
    if (items.length > 2) {
      const varietyPenalty = (items.length - 2) * 8;
      rawScore -= varietyPenalty;
      issues.push({
        category: "style",
        severity: "high",
        message: `Minimal style emphasizes restraint and clarity (1–2 varieties). Combining ${items.length} distinct flower varieties contradicts minimalist composition.`,
      });
    }
    if (totalStems > 6) {
      const stemPenalty = Math.min(20, (totalStems - 6) * 2.5);
      rawScore -= stemPenalty;
      issues.push({
        category: "style",
        severity: "medium",
        message: `Minimalist design favors sparse, intentional stems (1–6 stems). An arrangement of ${totalStems} stems feels overcrowded for this style.`,
      });
    }
  }

  // 3. High cohesion bonus only when truly unified
  if (avgMatch >= 0.95 && conflictingFlowers.length === 0 && (selectedStyleId !== "minimal" || items.length <= 2)) {
    rawScore += config.styleRules.templateBonus; // +5 bonus for pristine cohesion
  } else if (avgMatch < 0.75 && issues.length === 0) {
    issues.push({
      category: "style",
      severity: "low",
      message: `Overall flower assortment is moderately varied for the '${styleName}' aesthetic.`,
    });
  }

  const finalScore = Math.max(
    config.styleRules.minScore,
    Math.min(100, Math.round(rawScore))
  );

  return {
    score: finalScore,
    issues,
    details: {
      avgMatch: Math.round(avgMatch * 100) / 100,
      selectedStyle: selectedStyleId,
    },
  };
}
