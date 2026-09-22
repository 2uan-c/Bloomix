import type { BouquetItem } from "../engine/types.ts";

export interface PresetBouquet {
  id: string;
  name: string;
  subtitle: string;
  occasionId: string;
  styleId: string;
  items: BouquetItem[];
  tag: string;
  isOfficialTestCase?: boolean;
  testCaseNumber?: number;
  expectedBehavior?: string;
}

export const OFFICIAL_TEST_CASES: PresetBouquet[] = [
  {
    id: "test-case-1",
    name: "TEST 1: Romantic Valentine (Coherent)",
    subtitle: "Rose ×3, Baby's Breath ×2, Eucalyptus ×2 • Style: Romantic • Occasion: Valentine's Day",
    occasionId: "valentines",
    styleId: "romantic",
    tag: "High Score (Coherent)",
    isOfficialTestCase: true,
    testCaseNumber: 1,
    expectedBehavior: "Expected: Logically high score. Classic romantic pairing with focal red roses, delicate filler, and natural foliage framing.",
    items: [
      { flowerId: "rose", quantity: 3, selectedColor: "red" },
      { flowerId: "baby-breath", quantity: 2, selectedColor: "white" },
      { flowerId: "eucalyptus", quantity: 2, selectedColor: "green" },
    ],
  },
  {
    id: "test-case-2",
    name: "TEST 2: Valentine Sunflower & Hydrangea",
    subtitle: "Sunflower ×3, Hydrangea ×3, Eucalyptus ×2 • Style: Romantic • Occasion: Valentine's Day",
    occasionId: "valentines",
    styleId: "romantic",
    tag: "Moderate / Conflicting Style",
    isOfficialTestCase: true,
    testCaseNumber: 2,
    expectedBehavior: "Expected: Meaningfully different result. Playful sunflower and heavy hydrangeas reduce romantic theme consistency and occasion suitability.",
    items: [
      { flowerId: "sunflower", quantity: 3, selectedColor: "yellow" },
      { flowerId: "hydrangea", quantity: 3, selectedColor: "blue" },
      { flowerId: "eucalyptus", quantity: 2, selectedColor: "green" },
    ],
  },
  {
    id: "test-case-3",
    name: "TEST 3: Soft Thank You",
    subtitle: "Peony ×2, Lisianthus ×2, Baby's Breath ×3, Eucalyptus ×2 • Style: Soft • Occasion: Thank You",
    occasionId: "thank-you",
    styleId: "soft",
    tag: "High Score (Gratitude Soft)",
    isOfficialTestCase: true,
    testCaseNumber: 3,
    expectedBehavior: "Expected: High score reflecting gratitude symbolism and soft pastel textures (peonies, lisianthus, airy baby's breath).",
    items: [
      { flowerId: "peony", quantity: 2, selectedColor: "pink" },
      { flowerId: "lisianthus", quantity: 2, selectedColor: "white" },
      { flowerId: "baby-breath", quantity: 3, selectedColor: "white" },
      { flowerId: "eucalyptus", quantity: 2, selectedColor: "green" },
    ],
  },
  {
    id: "test-case-4",
    name: "TEST 4: Overcrowded Minimal Get Well",
    subtitle: "Rose ×3, Sunflower ×3, Orchid ×3, Lily ×3 • Style: Minimal • Occasion: Get Well",
    occasionId: "get-well",
    styleId: "minimal",
    tag: "Low Score (Restraint Violation)",
    isOfficialTestCase: true,
    testCaseNumber: 4,
    expectedBehavior: "Expected: Low score. Severe Minimal style violation (12 stems across 4 competing focal flowers without filler/foliage).",
    items: [
      { flowerId: "rose", quantity: 3, selectedColor: "red" },
      { flowerId: "sunflower", quantity: 3, selectedColor: "yellow" },
      { flowerId: "orchid", quantity: 3, selectedColor: "purple" },
      { flowerId: "lily", quantity: 3, selectedColor: "white" },
    ],
  },
];

export const DEMO_PRESETS: PresetBouquet[] = [
  ...OFFICIAL_TEST_CASES,
  {
    id: "soft-birthday",
    name: "Soft Birthday",
    subtitle: "Pastel peonies & carnations with airy baby's breath for a gentle celebration",
    occasionId: "birthday",
    styleId: "soft",
    tag: "Birthday Favorite",
    items: [
      { flowerId: "peony", quantity: 2, selectedColor: "pink" },
      { flowerId: "carnation", quantity: 2, selectedColor: "peach" },
      { flowerId: "baby-breath", quantity: 2, selectedColor: "white" },
      { flowerId: "ruscus", quantity: 2, selectedColor: "green" },
    ],
  },
  {
    id: "elegant-graduation",
    name: "Elegant Graduation",
    subtitle: "Pure white lilies, graceful tulips, and dignified olive branches",
    occasionId: "graduation",
    styleId: "elegant",
    tag: "Graduation Honor",
    items: [
      { flowerId: "lily", quantity: 2, selectedColor: "white" },
      { flowerId: "tulip", quantity: 3, selectedColor: "white" },
      { flowerId: "olive-branch", quantity: 2, selectedColor: "green" },
    ],
  },
];

