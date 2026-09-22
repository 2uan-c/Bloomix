export type FlowerRole = "focal" | "secondary" | "filler" | "foliage";
export type FlowerSize = "small" | "medium" | "large";
export type FlowerShape = "round" | "clustered" | "open" | "elongated" | "ruffled" | "branching";
export type FlowerTexture =
  | "smooth"
  | "bold"
  | "soft"
  | "ruffled"
  | "delicate"
  | "dense"
  | "airy"
  | "papery"
  | "matte"
  | "feathery";

export type ColorTemperature = "warm" | "cool" | "neutral";
export type ColorSaturation = "high" | "medium" | "low";

export interface ColorProfile {
  temperature: ColorTemperature;
  saturation: ColorSaturation;
}

export interface FlowerVisual {
  size: FlowerSize;
  shape: FlowerShape;
  texture: FlowerTexture;
  visualWeight: number;
}

export interface Flower {
  id: string;
  name: string;
  displayName: string;
  colors: string[];
  roles: FlowerRole[];
  styles: string[];
  occasions: Record<string, number>;
  visual: FlowerVisual;
  colorProfiles: Record<string, ColorProfile>;
  meaning: string[];
}

export interface Occasion {
  id: string;
  name: string;
  displayName: string;
  preferredStyles: string[];
  styleCompatibility: Record<string, number>;
}

export interface BouquetStyle {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

export interface StyleData {
  version: string;
  styles: BouquetStyle[];
  compatibility: Record<string, Record<string, number>>;
}

export interface OccasionsData {
  version: string;
  occasions: Occasion[];
}

export interface ScoringConfig {
  version: string;
  weights: {
    color: number;
    compatibility: number;
    style: number;
    occasion: number;
  };
  scoreRanges: {
    excellent: { min: number; label: string };
    veryGood: { min: number; label: string };
    good: { min: number; label: string };
    needsImprovement: { min: number; label: string };
    poor: { min: number; label: string };
  };
  colorRules: {
    baseScore: number;
    minScore: number;
    maxDominantColors: number;
    penalties: {
      threeDominantColors: number;
      fourOrMoreDominantColors: number;
      temperatureConflict: number;
      multipleHighSaturationColors: number;
      strongSaturationWithoutNeutral: number;
    };
    bonuses: {
      controlledAccent: number;
    };
  };
  compatibilityRules: {
    baseScore: number;
    minScore: number;
    penalties: {
      noFocal: number;
      tooManyFocal: number;
      noSupportingFlowers: number;
      missingFillerWhenNeeded: number;
      tooManyHeavyFlowers: number;
      largeVisualWeightDifference: number;
      sameSize: number;
      sameShape: number;
      sameTexture: number;
    };
    bonuses: {
      shapeDiversity: number;
      textureDiversity: number;
    };
  };
  styleRules: {
    baseScore: number;
    minScore: number;
    directMatch: number;
    compatibleMatch: number;
    mismatch: number;
    templateBonus: number;
  };
  occasionRules: {
    baseScore: number;
    minScore: number;
    occasionStyleWeight: number;
  };
  scoreFloors: {
    color: number;
    compatibility: number;
    style: number;
    occasion: number;
  };
  limits: {
    maxSingleCategoryPenalty: number;
  };
}

export interface BouquetItem {
  flowerId: string;
  quantity: number;
  selectedColor?: string;
}

export interface FlowerInstance {
  instanceId: string;
  flowerId: string;
  flowerName: string;
  role: FlowerRole;
  color: string;
  size: number;
  scale: number;
  baseScale?: number;
  x: number;
  y: number;
  rotate: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  depth: number;
  zIndex?: number;
  stemPath?: string;
  stemColor?: string;
  isUserPositioned?: boolean;
  isManuallyPositioned?: boolean;
}

export type WrapCoverageType = "top" | "full";

export interface BouquetDraft {
  occasion: string;
  style: string;
  shape: string;
  wrapping: string;
  ribbon: string;
  wrapCoverage?: WrapCoverageType;
  flowerInstances: FlowerInstance[];
}

export type IssueSeverity = "low" | "medium" | "high";
export type IssueCategory = "color" | "compatibility" | "style" | "occasion";

export interface ScoringIssue {
  category: IssueCategory;
  severity: IssueSeverity;
  message: string;
}

export interface CategoryScoreResult {
  score: number;
  issues: ScoringIssue[];
  details?: Record<string, unknown>;
}

export interface RatingInfo {
  min: number;
  label: string;
  tier: "excellent" | "veryGood" | "good" | "needsImprovement" | "poor";
}

export type ScoreResult = BouquetScoreResult;

export interface BouquetScoreResult {
  color: CategoryScoreResult;
  compatibility: CategoryScoreResult;
  style: CategoryScoreResult;
  occasion: CategoryScoreResult;
  overall: number;
  rating: RatingInfo;
  stemCount: number;
  flowerCount: number;
}

export interface BouquetRecommendation {
  action: "KEEP" | "ADD" | "REMOVE" | "REPLACE";
  flowerName: string;
  targetFlowerName?: string;
  reason: string;
}

export interface GeminiExplanationResponse {
  strengths: string[];
  improvements: string[];
  recommendations?: BouquetRecommendation[];
  substitutions: { originalFlower: string; suggestedFlower: string; reason: string }[];
  summary: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bloomix";
  text: string;
  timestamp: string;
}
