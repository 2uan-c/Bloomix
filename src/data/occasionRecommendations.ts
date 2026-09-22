import type { BouquetItem, Flower } from "../engine/types.ts";

export interface OccasionFloristGuide {
  id: string;
  name: string;
  vietnameseName: string;
  tagline: string;
  floristIntent: string;
  preferredRoles: {
    focal: string[];
    secondary: string[];
    filler: string[];
    foliage: string[];
  };
  recommendedColors: string[];
  starterRecipe: {
    name: string;
    description: string;
    items: BouquetItem[];
    recommendedStyleId: string;
  };
  floristTips: string[];
}

export const OCCASION_FLORIST_GUIDES: Record<string, OccasionFloristGuide> = {
  valentines: {
    id: "valentines",
    name: "Valentine's Day",
    vietnameseName: "Lễ Tình Nhân (Valentine)",
    tagline: "Romantic devotion, passion, and tender affection",
    floristIntent:
      "Valentine's bouquets prioritize romantic flower combinations, strong focal blooms (luxurious velvety roses, lush peonies), delicate cloud-like filler (baby's breath), and a rich romantic palette centered on reds, deep pinks, and pure whites.",
    preferredRoles: {
      focal: ["rose", "peony", "tulip", "ranunculus"],
      secondary: ["carnation", "anemone", "lisianthus"],
      filler: ["baby-breath", "waxflower", "statice"],
      foliage: ["eucalyptus", "ruscus", "dusty-miller"],
    },
    recommendedColors: ["red", "pink", "white", "peach"],
    starterRecipe: {
      name: "Valentine Romance",
      description: "Classic red roses anchored by delicate baby's breath and silver-dollar eucalyptus.",
      recommendedStyleId: "romantic",
      items: [
        { flowerId: "rose", quantity: 3, selectedColor: "red" },
        { flowerId: "baby-breath", quantity: 2, selectedColor: "white" },
        { flowerId: "eucalyptus", quantity: 2, selectedColor: "green" },
      ],
    },
    floristTips: [
      "Keep the focal roses clustered near the center for visual impact.",
      "Use soft white baby's breath around the perimeter to soften the high-contrast reds.",
      "A classic or romantic wrap (Midnight Velvet or Soft Blush) complements this palette.",
    ],
  },
  birthday: {
    id: "birthday",
    name: "Birthday",
    vietnameseName: "Sinh Nhật",
    tagline: "Cheerful celebration, joyful energy, and vibrant warmth",
    floristIntent:
      "Birthday bouquets emphasize cheerful, colorful, and energetic combinations with playful or soft flowers. Medium-to-high visual variety with warm yellows, sunny oranges, and playful pinks creates a lively festive mood.",
    preferredRoles: {
      focal: ["sunflower", "gerbera", "lily", "tulip", "peony"],
      secondary: ["carnation", "freesia", "alstroemeria", "snapdragon"],
      filler: ["chamomile", "baby-breath", "solidago", "waxflower"],
      foliage: ["eucalyptus", "fern", "ruscus"],
    },
    recommendedColors: ["yellow", "orange", "pink", "purple", "white"],
    starterRecipe: {
      name: "Sunny Birthday Radiance",
      description: "Bright sunflowers and cheerful gerberas with chamomile and fresh greenery.",
      recommendedStyleId: "playful",
      items: [
        { flowerId: "sunflower", quantity: 2, selectedColor: "yellow" },
        { flowerId: "gerbera", quantity: 2, selectedColor: "orange" },
        { flowerId: "chamomile", quantity: 2, selectedColor: "white" },
        { flowerId: "eucalyptus", quantity: 2, selectedColor: "green" },
      ],
    },
    floristTips: [
      "Combine 2–3 vibrant contrasting hues (yellow + orange + pink) for an energetic festive flair.",
      "Incorporate open, cheerful blooms like Sunflowers or Gerberas facing forward.",
      "Kraft Paper or Japanese Washi wrapping keeps the mood modern and friendly.",
    ],
  },
  anniversary: {
    id: "anniversary",
    name: "Anniversary",
    vietnameseName: "Kỷ Niệm Ngày Cưới / Tình Yêu",
    tagline: "Enduring love, timeless elegance, and cherished memories",
    floristIntent:
      "Anniversary bouquets embody romantic, elegant, and refined combinations. Deeply meaningful heritage flowers like premium garden roses, royal orchids, and elegant calla lilies deliver sophisticated reverence and enduring devotion.",
    preferredRoles: {
      focal: ["rose", "orchid", "peony", "calla-lily", "lily"],
      secondary: ["lisianthus", "carnation", "anthurium", "anemone"],
      filler: ["baby-breath", "waxflower", "statice"],
      foliage: ["ruscus", "eucalyptus", "olive-branch"],
    },
    recommendedColors: ["red", "pink", "white", "purple", "peach"],
    starterRecipe: {
      name: "Timeless Devotion",
      description: "Velvety red and blush roses paired with graceful lilies and Italian ruscus.",
      recommendedStyleId: "romantic",
      items: [
        { flowerId: "rose", quantity: 3, selectedColor: "red" },
        { flowerId: "lily", quantity: 2, selectedColor: "white" },
        { flowerId: "lisianthus", quantity: 2, selectedColor: "pink" },
        { flowerId: "ruscus", quantity: 2, selectedColor: "green" },
      ],
    },
    floristTips: [
      "Blend rich velvety blooms with graceful trailing foliage for romantic depth.",
      "Pair with luxury wrapping (Velvet Burgundy or Tiered Ivory) with a gold satin ribbon.",
    ],
  },
  graduation: {
    id: "graduation",
    name: "Graduation",
    vietnameseName: "Lễ Tốt Nghiệp",
    tagline: "Academic triumph, bright horizons, and proud achievement",
    floristIntent:
      "Graduation bouquets prefer elegant, classic, natural, or celebratory combinations with clean structure, proud upward lines, and bright uplifting tones (golden yellows, brilliant blues, pure whites) symbolizing future success.",
    preferredRoles: {
      focal: ["sunflower", "lily", "orchid", "gladiolus", "hydrangea"],
      secondary: ["tulip", "iris", "delphinium", "snapdragon"],
      filler: ["solidago", "baby-breath", "statice"],
      foliage: ["olive-branch", "eucalyptus", "fern"],
    },
    recommendedColors: ["yellow", "blue", "white", "orange", "purple"],
    starterRecipe: {
      name: "Academic Triumph",
      description: "Noble golden sunflowers, white lilies, and proud olive branch greenery.",
      recommendedStyleId: "elegant",
      items: [
        { flowerId: "sunflower", quantity: 2, selectedColor: "yellow" },
        { flowerId: "lily", quantity: 2, selectedColor: "white" },
        { flowerId: "delphinium", quantity: 2, selectedColor: "blue" },
        { flowerId: "olive-branch", quantity: 2, selectedColor: "green" },
      ],
    },
    floristTips: [
      "Sunflowers represent bright futures, while Olive branches symbolize honor and peace.",
      "Sturdy stem structures make graduation hand-holding easy during photos and ceremonies.",
    ],
  },
  "thank-you": {
    id: "thank-you",
    name: "Thank You",
    vietnameseName: "Tri Ân & Cảm Ơn",
    tagline: "Warm appreciation, gratitude, and heartfelt respect",
    floristIntent:
      "Thank You bouquets focus on soft, elegant, and appreciative combinations. Gentle pastel pinks, creamy peaches, and calming greens reflect genuine appreciation without overwhelming theatricality.",
    preferredRoles: {
      focal: ["hydrangea", "peony", "carnation", "rose", "tulip"],
      secondary: ["lisianthus", "freesia", "alstroemeria"],
      filler: ["baby-breath", "chamomile", "waxflower"],
      foliage: ["eucalyptus", "dusty-miller", "ruscus"],
    },
    recommendedColors: ["pink", "peach", "white", "cream", "yellow"],
    starterRecipe: {
      name: "Heartfelt Gratitude",
      description: "Lush pink peonies, peach carnations, and airy baby's breath.",
      recommendedStyleId: "soft",
      items: [
        { flowerId: "peony", quantity: 2, selectedColor: "pink" },
        { flowerId: "carnation", quantity: 2, selectedColor: "peach" },
        { flowerId: "baby-breath", quantity: 3, selectedColor: "white" },
        { flowerId: "eucalyptus", quantity: 2, selectedColor: "green" },
      ],
    },
    floristTips: [
      "Carnations historically symbolize enduring gratitude and maternal appreciation.",
      "Soft pastel tones in matte kraft wrap create an authentic, warm personal gift.",
    ],
  },
  "get-well": {
    id: "get-well",
    name: "Get Well",
    vietnameseName: "Thăm Người Bệnh / Hồi Phục Sức Khỏe",
    tagline: "Calming recovery, gentle freshness, and soothing optimism",
    floristIntent:
      "Get Well bouquets prefer fresh, calming, natural combinations with lighter colors, airy composition, and supportive soothing greenery. Gentle scents and non-invasive blooms encourage peaceful healing and rest.",
    preferredRoles: {
      focal: ["hydrangea", "tulip", "gerbera", "peony"],
      secondary: ["chamomile", "carnation", "alstroemeria", "freesia"],
      filler: ["baby-breath", "lavender", "waxflower"],
      foliage: ["eucalyptus", "fern", "ruscus"],
    },
    recommendedColors: ["yellow", "white", "pink", "green", "lavender"],
    starterRecipe: {
      name: "Gentle Healing Garden",
      description: "Soothing chamomile, light pastel tulips, and refreshing eucalyptus greenery.",
      recommendedStyleId: "natural",
      items: [
        { flowerId: "tulip", quantity: 3, selectedColor: "pink" },
        { flowerId: "chamomile", quantity: 3, selectedColor: "white" },
        { flowerId: "hydrangea", quantity: 1, selectedColor: "white" },
        { flowerId: "eucalyptus", quantity: 2, selectedColor: "green" },
      ],
    },
    floristTips: [
      "Avoid heavy fragrance flowers (like Asiatic lilies) in hospital or recovery rooms.",
      "Chamomile and eucalyptus impart natural botanical serenity and soothing wellness.",
    ],
  },
  congratulations: {
    id: "congratulations",
    name: "Congratulations",
    vietnameseName: "Chúc Mừng Thành Tựu",
    tagline: "Grand celebration, distinguished achievement, and festive cheer",
    floristIntent:
      "Congratulations bouquets feature cheerful, elegant, and celebratory combinations. Striking exotic focal blooms, bold architectural shapes, and confident colors inspire pride and joyous recognition.",
    preferredRoles: {
      focal: ["sunflower", "gerbera", "bird-of-paradise", "anthurium", "lily"],
      secondary: ["iris", "tulip", "gladiolus", "delphinium"],
      filler: ["solidago", "statice", "waxflower"],
      foliage: ["monstera", "fern", "eucalyptus"],
    },
    recommendedColors: ["orange", "yellow", "red", "purple", "blue"],
    starterRecipe: {
      name: "Grand Achievement",
      description: "Bold gerberas, radiant sunflowers, and majestic purple irises.",
      recommendedStyleId: "playful",
      items: [
        { flowerId: "gerbera", quantity: 3, selectedColor: "orange" },
        { flowerId: "sunflower", quantity: 2, selectedColor: "yellow" },
        { flowerId: "iris", quantity: 2, selectedColor: "purple" },
        { flowerId: "eucalyptus", quantity: 2, selectedColor: "green" },
      ],
    },
    floristTips: [
      "Combine high-energy colors like orange and yellow with deep purple for regal contrast.",
      "A structured fan layout makes the bouquet stand out proudly in opening ceremonies.",
    ],
  },
  celebration: {
    id: "celebration",
    name: "Celebration",
    vietnameseName: "Đại Tiệc & Ăn Mừng",
    tagline: "Dynamic festivity, opulence, and shared jubilation",
    floristIntent:
      "Celebration bouquets prefer energetic, elegant, or luxurious combinations. Full-bodied multi-variety arrangements with high petal count and rich colors create an unforgettable centerpiece.",
    preferredRoles: {
      focal: ["peony", "rose", "lily", "hydrangea", "orchid"],
      secondary: ["delphinium", "carnation", "anemone", "anthurium"],
      filler: ["baby-breath", "waxflower", "solidago"],
      foliage: ["eucalyptus", "ruscus", "fern"],
    },
    recommendedColors: ["red", "purple", "pink", "yellow", "white"],
    starterRecipe: {
      name: "Opulent Festivity",
      description: "Lush peonies, royal roses, white lilies, and silver-dollar greenery.",
      recommendedStyleId: "luxury",
      items: [
        { flowerId: "peony", quantity: 3, selectedColor: "pink" },
        { flowerId: "rose", quantity: 3, selectedColor: "red" },
        { flowerId: "baby-breath", quantity: 2, selectedColor: "white" },
        { flowerId: "eucalyptus", quantity: 2, selectedColor: "green" },
      ],
    },
    floristTips: [
      "Layering multiple focal varieties creates rich depth and opulent floristry texture.",
      "Pair with pleated or velvet wrap with double satin bow for gala elegance.",
    ],
  },
};

/**
 * Returns the florist guidance profile for an occasion
 */
export function getOccasionFloristGuide(occasionId?: string): OccasionFloristGuide {
  if (!occasionId) return OCCASION_FLORIST_GUIDES["valentines"];
  return (
    OCCASION_FLORIST_GUIDES[occasionId] ||
    OCCASION_FLORIST_GUIDES["valentines"]
  );
}

/**
 * Returns flowers ranked and categorized for the selected occasion
 */
export function getRankedFlowersForOccasion(
  flowers: Flower[],
  occasionId: string
): {
  topOccasionFlowers: Flower[];
  allRanked: { flower: Flower; occasionScore: number }[];
} {
  const scored = flowers.map((flower) => {
    const occasionScore = flower.occasions[occasionId] !== undefined
      ? flower.occasions[occasionId]
      : 0.7;
    return { flower, occasionScore };
  });

  scored.sort((a, b) => b.occasionScore - a.occasionScore);

  const topOccasionFlowers = scored
    .filter((s) => s.occasionScore >= 0.85)
    .map((s) => s.flower);

  return {
    topOccasionFlowers,
    allRanked: scored,
  };
}
