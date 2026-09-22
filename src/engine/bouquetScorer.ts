import { scoreColorHarmony } from "./colorScorer.ts";
import { scoreFlowerCompatibility } from "./compatibilityScorer.ts";
import { scoreOccasionSuitability } from "./occasionScorer.ts";
import { scoreStyleConsistency } from "./styleScorer.ts";
import type {
  BouquetItem,
  BouquetScoreResult,
  Flower,
  OccasionsData,
  RatingInfo,
  ScoringConfig,
  StyleData,
} from "./types.ts";

import flowersData from "../data/flowers.json";
import occasionsData from "../data/occasions.json";
import stylesData from "../data/styles.json";
import scoringConfig from "../config/scoringConfig.json";

// Single source of truth flowers map
export const flowersList: Flower[] = flowersData as unknown as Flower[];
export const flowersMap: Map<string, Flower> = new Map(
  flowersList.map((f) => [f.id, f])
);

export const occasionsList: OccasionsData = occasionsData as unknown as OccasionsData;
export const stylesList: StyleData = stylesData as unknown as StyleData;
export const config: ScoringConfig = scoringConfig as unknown as ScoringConfig;

export function calculateRating(overallScore: number, config: ScoringConfig): RatingInfo {
  if (overallScore >= config.scoreRanges.excellent.min) {
    return { ...config.scoreRanges.excellent, tier: "excellent" };
  }
  if (overallScore >= config.scoreRanges.veryGood.min) {
    return { ...config.scoreRanges.veryGood, tier: "veryGood" };
  }
  if (overallScore >= config.scoreRanges.good.min) {
    return { ...config.scoreRanges.good, tier: "good" };
  }
  if (overallScore >= config.scoreRanges.needsImprovement.min) {
    return { ...config.scoreRanges.needsImprovement, tier: "needsImprovement" };
  }
  return { ...config.scoreRanges.poor, tier: "poor" };
}

export function scoreBouquet(
  items: BouquetItem[],
  selectedOccasionId: string,
  selectedStyleId: string,
  customFlowersMap: Map<string, Flower> = flowersMap,
  customOccasionsData: OccasionsData = occasionsList,
  customStylesData: StyleData = stylesList,
  customConfig: ScoringConfig = config
): BouquetScoreResult {
  const colorResult = scoreColorHarmony(items, customFlowersMap, customConfig);
  const compatibilityResult = scoreFlowerCompatibility(
    items,
    customFlowersMap,
    customConfig
  );
  const styleResult = scoreStyleConsistency(
    items,
    customFlowersMap,
    selectedStyleId,
    customStylesData,
    customConfig
  );
  const occasionResult = scoreOccasionSuitability(
    items,
    customFlowersMap,
    selectedOccasionId,
    selectedStyleId,
    customOccasionsData,
    customConfig
  );

  const wColor = customConfig.weights.color || 0.25;
  const wComp = customConfig.weights.compatibility || 0.3;
  const wStyle = customConfig.weights.style || 0.2;
  const wOccasion = customConfig.weights.occasion || 0.25;

  const rawOverall =
    colorResult.score * wColor +
    compatibilityResult.score * wComp +
    styleResult.score * wStyle +
    occasionResult.score * wOccasion;

  const overall = Math.max(0, Math.min(100, Math.round(rawOverall)));
  const rating = calculateRating(overall, customConfig);

  const stemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const flowerCount = items.length;

  return {
    color: colorResult,
    compatibility: compatibilityResult,
    style: styleResult,
    occasion: occasionResult,
    overall,
    rating,
    stemCount,
    flowerCount,
  };
}
