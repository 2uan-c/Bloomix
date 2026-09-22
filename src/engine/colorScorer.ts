import type {
  BouquetItem,
  CategoryScoreResult,
  ColorProfile,
  Flower,
  ScoringConfig,
  ScoringIssue,
} from "./types.ts";

export function scoreColorHarmony(
  items: BouquetItem[],
  flowersMap: Map<string, Flower>,
  config: ScoringConfig
): CategoryScoreResult {
  const issues: ScoringIssue[] = [];
  let score = config.colorRules.baseScore;

  if (items.length === 0) {
    return { score: 0, issues: [{ category: "color", severity: "high", message: "No flowers in bouquet" }] };
  }

  // Gather flower color profiles
  const colorCounts: Record<string, number> = {};
  const temperatures: Set<string> = new Set();
  const saturations: { color: string; saturation: string }[] = [];
  const distinctColorSet = new Set<string>();
  const floralColorSet = new Set<string>(); // non-foliage flower colors

  for (const item of items) {
    const flower = flowersMap.get(item.flowerId);
    if (!flower) continue;

    const chosenColor =
      item.selectedColor && flower.colors.includes(item.selectedColor)
        ? item.selectedColor
        : flower.colors[0];

    distinctColorSet.add(chosenColor);
    colorCounts[chosenColor] = (colorCounts[chosenColor] || 0) + item.quantity;

    if (!flower.roles.includes("foliage")) {
      floralColorSet.add(chosenColor);
    }

    const profile: ColorProfile | undefined = flower.colorProfiles[chosenColor] || {
      temperature: "neutral",
      saturation: "medium",
    };

    temperatures.add(profile.temperature);
    saturations.push({ color: chosenColor, saturation: profile.saturation });
  }

  const distinctCount = distinctColorSet.size;
  const floralDistinctCount = floralColorSet.size;

  // 1. Dominant color count rules (evaluating floral petal colors)
  if (floralDistinctCount === 3) {
    score -= config.colorRules.penalties.threeDominantColors;
    issues.push({
      category: "color",
      severity: "medium",
      message: "The bouquet features 3 distinct floral colors. Restricting to 1–2 main flower colors creates a cleaner, more intentional palette.",
    });
  } else if (floralDistinctCount >= 4 || distinctCount >= 4) {
    score -= config.colorRules.penalties.fourOrMoreDominantColors;
    issues.push({
      category: "color",
      severity: "high",
      message: "4 or more distinct colors are competing in the arrangement. This creates visual clutter and dilutes aesthetic focus.",
    });
  }

  // 2. Temperature conflict
  const hasWarm = temperatures.has("warm");
  const hasCool = temperatures.has("cool");
  const hasNeutral = temperatures.has("neutral");

  if (hasWarm && hasCool && !hasNeutral) {
    score -= config.colorRules.penalties.temperatureConflict;
    issues.push({
      category: "color",
      severity: "medium",
      message: "Warm and cool hues are combined without a neutral bridge (such as white, cream, or silver foliage) to soften the transition.",
    });
  }

  // 3. High saturation checks
  const highSaturationColors = new Set(
    saturations.filter((s) => s.saturation === "high").map((s) => s.color)
  );

  if (highSaturationColors.size > 1) {
    score -= config.colorRules.penalties.multipleHighSaturationColors;
    issues.push({
      category: "color",
      severity: "medium",
      message: "Multiple highly saturated vivid colors are competing for visual dominance.",
    });
  }

  const hasLowOrNeutral =
    saturations.some((s) => s.saturation === "low") || hasNeutral;

  if (highSaturationColors.size >= 1 && !hasLowOrNeutral) {
    score -= config.colorRules.penalties.strongSaturationWithoutNeutral;
    issues.push({
      category: "color",
      severity: "low",
      message: "Intense vivid colors are present without soft pastel or neutral flowers to provide visual breathing room.",
    });
  }

  // 4. Controlled accent bonus
  if (floralDistinctCount <= 2 && (hasNeutral || highSaturationColors.size <= 1)) {
    score += config.colorRules.bonuses.controlledAccent;
  }

  // Clamping score
  const finalScore = Math.max(
    config.colorRules.minScore,
    Math.min(100, Math.round(score))
  );

  return {
    score: finalScore,
    issues,
    details: {
      distinctColors: Array.from(distinctColorSet),
      temperatures: Array.from(temperatures),
      highSaturationCount: highSaturationColors.size,
    },
  };
}
