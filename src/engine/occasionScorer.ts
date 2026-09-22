import type {
  BouquetItem,
  CategoryScoreResult,
  Flower,
  OccasionsData,
  ScoringConfig,
  ScoringIssue,
} from "./types.ts";

export function scoreOccasionSuitability(
  items: BouquetItem[],
  flowersMap: Map<string, Flower>,
  selectedOccasionId: string,
  selectedStyleId: string,
  occasionsData: OccasionsData,
  config: ScoringConfig
): CategoryScoreResult {
  const issues: ScoringIssue[] = [];

  if (items.length === 0 || !selectedOccasionId) {
    return {
      score: 0,
      issues: [
        {
          category: "occasion",
          severity: "high",
          message: !selectedOccasionId ? "No occasion selected" : "No flowers selected",
        },
      ],
    };
  }

  const occasionObj = occasionsData.occasions.find((o) => o.id === selectedOccasionId);
  const occasionName = occasionObj ? occasionObj.name : selectedOccasionId;

  // 1. Style-to-Occasion compatibility
  const styleComp =
    occasionObj && selectedStyleId && occasionObj.styleCompatibility[selectedStyleId] !== undefined
      ? occasionObj.styleCompatibility[selectedStyleId]
      : 0.8;

  if (styleComp < 0.6) {
    issues.push({
      category: "occasion",
      severity: "medium",
      message: `The selected style isn't traditionally optimal for ${occasionName}. Consider a style preferred for this occasion.`,
    });
  }

  // 2. Flower-to-Occasion suitability
  let totalStems = 0;
  let totalSuitabilitySum = 0;

  for (const item of items) {
    const flower = flowersMap.get(item.flowerId);
    if (!flower) continue;

    totalStems += item.quantity;
    const flowerSuitability =
      flower.occasions[selectedOccasionId] !== undefined
        ? flower.occasions[selectedOccasionId]
        : 0.7;

    totalSuitabilitySum += flowerSuitability * item.quantity;

    if (flowerSuitability < 0.6) {
      issues.push({
        category: "occasion",
        severity: "medium",
        message: `${flower.name} has lower traditional relevance or symbolism for ${occasionName}.`,
      });
    }
  }

  const avgFlowerSuitability = totalStems > 0 ? totalSuitabilitySum / totalStems : 0;
  const styleWeight = config.occasionRules.occasionStyleWeight || 0.15;
  const flowerWeight = 1 - styleWeight;

  const rawScore = (avgFlowerSuitability * flowerWeight + styleComp * styleWeight) * 100;

  const finalScore = Math.max(
    config.occasionRules.minScore,
    Math.min(100, Math.round(rawScore))
  );

  return {
    score: finalScore,
    issues,
    details: {
      avgFlowerSuitability: Math.round(avgFlowerSuitability * 100) / 100,
      styleCompatibility: Math.round(styleComp * 100) / 100,
      occasion: selectedOccasionId,
    },
  };
}
