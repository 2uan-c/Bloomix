export interface FlowerBotanicalAsset {
  id: string;
  name: string;
  displayName: string;
  imageUrl: string;
  defaultImageUrl: string;
  colorImageUrls?: Record<string, string>;
  photographerCredit?: string;
}

// Photorealistic botanical floral photography assets matching actual flower species
export const BOTANICAL_FLOWER_IMAGES: Record<string, FlowerBotanicalAsset> = {
  rose: {
    id: "rose",
    name: "Rose",
    displayName: "Hoa hồng",
    imageUrl: "/assets/flowers/rose.png",
    defaultImageUrl: "/flowers/rose.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  sunflower: {
    id: "sunflower",
    name: "Sunflower",
    displayName: "Hoa hướng dương",
    imageUrl: "/assets/flowers/sunflower.png",
    defaultImageUrl: "/flowers/sunflower.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  peony: {
    id: "peony",
    name: "Peony",
    displayName: "Hoa mẫu đơn",
    imageUrl: "/assets/flowers/peony.png",
    defaultImageUrl: "/flowers/peony.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  hydrangea: {
    id: "hydrangea",
    name: "Hydrangea",
    displayName: "Hoa cẩm tú cầu",
    imageUrl: "/assets/flowers/hydrangea.png",
    defaultImageUrl: "/flowers/hydrangea.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  lily: {
    id: "lily",
    name: "Lily",
    displayName: "Hoa ly",
    imageUrl: "/assets/flowers/lily.png",
    defaultImageUrl: "/flowers/lily.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  orchid: {
    id: "orchid",
    name: "Orchid",
    displayName: "Hoa lan",
    imageUrl: "/assets/flowers/orchid.png",
    defaultImageUrl: "/flowers/orchid.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  tulip: {
    id: "tulip",
    name: "Tulip",
    displayName: "Hoa tulip",
    imageUrl: "/assets/flowers/tulip.png",
    defaultImageUrl: "/flowers/tulip.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  carnation: {
    id: "carnation",
    name: "Carnation",
    displayName: "Hoa cẩm chướng",
    imageUrl: "/assets/flowers/carnation.png",
    defaultImageUrl: "/flowers/carnation.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  gerbera: {
    id: "gerbera",
    name: "Gerbera",
    displayName: "Hoa đồng tiền",
    imageUrl: "/assets/flowers/gerbera.png",
    defaultImageUrl: "/flowers/gerbera.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  daisy: {
    id: "daisy",
    name: "Daisy",
    displayName: "Hoa cúc họa mi",
    imageUrl: "/assets/flowers/daisy.png",
    defaultImageUrl: "/flowers/daisy.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  chrysanthemum: {
    id: "chrysanthemum",
    name: "Chrysanthemum",
    displayName: "Hoa cúc",
    imageUrl: "/assets/flowers/chrysanthemum.png",
    defaultImageUrl: "/flowers/chrysanthemum.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  "baby-breath": {
    id: "baby-breath",
    name: "Baby's Breath",
    displayName: "Hoa baby",
    imageUrl: "/assets/flowers/baby-breath.png",
    defaultImageUrl: "/flowers/baby-breath.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  "babys-breath": {
    id: "babys-breath",
    name: "Baby's Breath",
    displayName: "Hoa baby",
    imageUrl: "/assets/flowers/babys-breath.png",
    defaultImageUrl: "/flowers/babys-breath.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  waxflower: {
    id: "waxflower",
    name: "Waxflower",
    displayName: "Hoa thanh liễu",
    imageUrl: "/assets/flowers/waxflower.png",
    defaultImageUrl: "/flowers/waxflower.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  statice: {
    id: "statice",
    name: "Statice",
    displayName: "Hoa statice",
    imageUrl: "/assets/flowers/statice.png",
    defaultImageUrl: "/flowers/statice.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  eucalyptus: {
    id: "eucalyptus",
    name: "Eucalyptus",
    displayName: "Bạch đàn",
    imageUrl: "/assets/flowers/eucalyptus.png",
    defaultImageUrl: "/flowers/eucalyptus.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  ruscus: {
    id: "ruscus",
    name: "Ruscus",
    displayName: "Lá ruscus",
    imageUrl: "/assets/flowers/ruscus.png",
    defaultImageUrl: "/flowers/ruscus.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  "italian-ruscus": {
    id: "italian-ruscus",
    name: "Italian Ruscus",
    displayName: "Lá đuôi chồn Ý",
    imageUrl: "/assets/flowers/italian-ruscus.png",
    defaultImageUrl: "/flowers/italian-ruscus.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  "olive-branch": {
    id: "olive-branch",
    name: "Olive Branch",
    displayName: "Cành ô liu",
    imageUrl: "/assets/flowers/olive-branch.png",
    defaultImageUrl: "/flowers/olive-branch.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  fern: {
    id: "fern",
    name: "Fern",
    displayName: "Lá dương xỉ",
    imageUrl: "/assets/flowers/fern.png",
    defaultImageUrl: "/flowers/fern.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  lavender: {
    id: "lavender",
    name: "Lavender",
    displayName: "Hoa oải hương",
    imageUrl: "/assets/flowers/lavender.png",
    defaultImageUrl: "/flowers/lavender.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  lisianthus: {
    id: "lisianthus",
    name: "Lisianthus",
    displayName: "Hoa cát tường",
    imageUrl: "/assets/flowers/lisianthus.png",
    defaultImageUrl: "/flowers/lisianthus.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  "calla-lily": {
    id: "calla-lily",
    name: "Calla Lily",
    displayName: "Hoa rum",
    imageUrl: "/assets/flowers/calla-lily.png",
    defaultImageUrl: "/flowers/calla-lily.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  iris: {
    id: "iris",
    name: "Iris",
    displayName: "Hoa diên vĩ",
    imageUrl: "/assets/flowers/iris.png",
    defaultImageUrl: "/flowers/iris.png",
    photographerCredit: "Bloomix Florist Collection",
  },
  ranunculus: {
    id: "ranunculus",
    name: "Ranunculus",
    displayName: "Hoa mao lương",
    imageUrl: "/assets/flowers/ranunculus.png",
    defaultImageUrl: "/flowers/ranunculus.png",
    photographerCredit: "Bloomix Florist Collection",
  },
};

export function getFlowerImageUrl(flowerId: string, color?: string): string {
  const normalizedId = (flowerId || "").toLowerCase().trim();
  const asset = BOTANICAL_FLOWER_IMAGES[normalizedId];

  if (asset) {
    if (color && asset.colorImageUrls && asset.colorImageUrls[color]) {
      return asset.colorImageUrls[color];
    }
    return asset.imageUrl || asset.defaultImageUrl;
  }

  // Graceful deterministic fallback pointing to standard static path
  return `/assets/flowers/${normalizedId}.png`;
}

/**
 * Startup validation check: verifies that all flower assets exist in the registry
 */
export function validateFlowerAssetRegistry(requiredFlowerIds?: string[]): {
  isValid: boolean;
  checkedCount: number;
  missingIds: string[];
} {
  const allIds = requiredFlowerIds || Object.keys(BOTANICAL_FLOWER_IMAGES);
  const missingIds: string[] = [];

  for (const id of allIds) {
    const asset = BOTANICAL_FLOWER_IMAGES[id];
    if (!asset || !asset.imageUrl) {
      missingIds.push(id);
    }
  }

  return {
    isValid: missingIds.length === 0,
    checkedCount: allIds.length,
    missingIds,
  };
}

export type WrappingPresetType =
  | "kraft_cone"
  | "soft_paper_cone"
  | "layered_premium_wrap"
  | "sage_wrap"
  | "japanese_minimal_wrap"
  | "dark_luxury_wrap"
  | "translucent_wrap"
  | "small_hand_tied_wrap";

export interface WrappingOption {
  id: string;
  preset: WrappingPresetType;
  name: string;
  vietnamese: string;
  description: string;
  paperColor: string;
  paperBorder: string;
  innerPaperColor: string;
  shadowColor: string;
  textColor: string;
  defaultRibbonId: string;
  widthRatio: number;
  heightRatio: number;
  opacity: number;
}

export const WRAPPING_OPTIONS: WrappingOption[] = [
  {
    id: "kraft_cone",
    preset: "kraft_cone",
    name: "Natural Kraft",
    vietnamese: "Giấy xi măng mộc",
    description: "Rustic earthy kraft paper with folded triangular wings and exposed stems.",
    paperColor: "#C9AE8D",
    paperBorder: "#B59775",
    innerPaperColor: "#DFCBBB",
    shadowColor: "rgba(70, 50, 30, 0.22)",
    textColor: "#2B1E12",
    defaultRibbonId: "rustic-twine",
    widthRatio: 1.05,
    heightRatio: 1.0,
    opacity: 0.98,
  },
  {
    id: "layered_premium_wrap",
    preset: "layered_premium_wrap",
    name: "Ivory Linen",
    vietnamese: "Giấy lanh màu ngà xếp lớp",
    description: "Tiered crisp ivory linen sheets with pleated champagne liners and elegant satin finish.",
    paperColor: "#FAF8F5",
    paperBorder: "#E5DEC9",
    innerPaperColor: "#EFE8DC",
    shadowColor: "rgba(60, 50, 40, 0.14)",
    textColor: "#1E293B",
    defaultRibbonId: "cream-white",
    widthRatio: 1.1,
    heightRatio: 1.1,
    opacity: 0.98,
  },
  {
    id: "soft_paper_cone",
    preset: "soft_paper_cone",
    name: "Blush Silk",
    vietnamese: "Giấy lụa hồng phấn",
    description: "Soft romantic blush paper cone with rounded curved folds and delicate drapery.",
    paperColor: "#F6D7DD",
    paperBorder: "#EAAEB9",
    innerPaperColor: "#FCEEEF",
    shadowColor: "rgba(160, 70, 90, 0.16)",
    textColor: "#5C2630",
    defaultRibbonId: "soft-pink",
    widthRatio: 1.0,
    heightRatio: 0.98,
    opacity: 0.95,
  },
  {
    id: "sage_wrap",
    preset: "sage_wrap",
    name: "Sage Botanical",
    vietnamese: "Giấy xanh lá xô thơm",
    description: "Earthy muted sage green wrapping with botanical cream liner and organic texture.",
    paperColor: "#859A86",
    paperBorder: "#687D69",
    innerPaperColor: "#EAF0EA",
    shadowColor: "rgba(40, 60, 45, 0.18)",
    textColor: "#1C3020",
    defaultRibbonId: "sage-green",
    widthRatio: 1.05,
    heightRatio: 1.02,
    opacity: 0.98,
  },
  {
    id: "dark_luxury_wrap",
    preset: "dark_luxury_wrap",
    name: "Midnight Luxury",
    vietnamese: "Giấy nhung hoàng gia đen",
    description: "Opulent charcoal black matte florist paper with subtle dark emerald undertone and refined warm gold accent.",
    paperColor: "#171B17",
    paperBorder: "#C6A85A", // Refined subtle warm gold piping
    innerPaperColor: "#202820",
    shadowColor: "rgba(0, 0, 0, 0.25)",
    textColor: "#F1F5F2",
    defaultRibbonId: "gold-satin",
    widthRatio: 1.15,
    heightRatio: 1.05,
    opacity: 1.0,
  },
  {
    id: "japanese_minimal_wrap",
    preset: "japanese_minimal_wrap",
    name: "Japanese Minimal Origami",
    vietnamese: "Giấy Origami tối giản",
    description: "Clean angular asymmetric fold with generous negative space and long exposed stems.",
    paperColor: "#EAE7DF",
    paperBorder: "#D0CBBF",
    innerPaperColor: "#F5F3ED",
    shadowColor: "rgba(50, 45, 35, 0.12)",
    textColor: "#2A2A2A",
    defaultRibbonId: "minimal-cord",
    widthRatio: 0.85,
    heightRatio: 0.9,
    opacity: 0.95,
  },
  {
    id: "translucent_wrap",
    preset: "translucent_wrap",
    name: "Frosted Vellum",
    vietnamese: "Giấy mờ sương vellum",
    description: "Semi-translucent frosted vellum wrap revealing stem silhouettes underneath.",
    paperColor: "rgba(255, 255, 255, 0.72)",
    paperBorder: "rgba(230, 235, 240, 0.85)",
    innerPaperColor: "rgba(245, 248, 250, 0.5)",
    shadowColor: "rgba(0, 0, 0, 0.08)",
    textColor: "#334155",
    defaultRibbonId: "cream-white",
    widthRatio: 0.95,
    heightRatio: 0.95,
    opacity: 0.75,
  },
  {
    id: "small_hand_tied_wrap",
    preset: "small_hand_tied_wrap",
    name: "Botanical Garden Burlap",
    vietnamese: "Bó thảo mộc thắt dây thừng",
    description: "Minimalist garden-gathered burlap collar secured with hand-tied jute twine.",
    paperColor: "#D6C4A5",
    paperBorder: "#BFA985",
    innerPaperColor: "#E2D3B8",
    shadowColor: "rgba(60, 45, 25, 0.20)",
    textColor: "#2D2214",
    defaultRibbonId: "rustic-twine",
    widthRatio: 0.9,
    heightRatio: 0.82,
    opacity: 0.96,
  },
];

export interface RibbonOption {
  id: string;
  name: string;
  vietnamese: string;
  color: string;
  borderColor: string;
  tailLength: number; // 1 to 3
}

export const RIBBON_OPTIONS: RibbonOption[] = [
  {
    id: "cream-white",
    name: "Silk White Ribbon",
    vietnamese: "Lụa trắng cao cấp",
    color: "#FAF8F5",
    borderColor: "#DDD6CA",
    tailLength: 2,
  },
  {
    id: "soft-pink",
    name: "Blush Satin Ribbon",
    vietnamese: "Hồng pastel satin",
    color: "#F472B6",
    borderColor: "#DB2777",
    tailLength: 2.2,
  },
  {
    id: "royal-red",
    name: "Crimson Velvet Ribbon",
    vietnamese: "Nhung đỏ hoàng gia",
    color: "#A11B2C",
    borderColor: "#78101E",
    tailLength: 2.5,
  },
  {
    id: "sage-green",
    name: "Sage Green Satin",
    vietnamese: "Ruy băng xanh sage",
    color: "#466B38",
    borderColor: "#2E4B22",
    tailLength: 2,
  },
  {
    id: "rustic-twine",
    name: "Natural Jute Twine",
    vietnamese: "Dây cói mộc",
    color: "#A0805B",
    borderColor: "#7A5E3E",
    tailLength: 1.8,
  },
  {
    id: "gold-satin",
    name: "Royal Gold Ribbon",
    vietnamese: "Ruy băng ánh kim vàng",
    color: "#D4AF37",
    borderColor: "#B8860B",
    tailLength: 2.4,
  },
  {
    id: "minimal-cord",
    name: "Black Minimalist Cord",
    vietnamese: "Dây mảnh tối giản",
    color: "#2D2D2D",
    borderColor: "#181818",
    tailLength: 1.5,
  },
];

const WRAPPING_ALIASES: Record<string, string> = {
  "formal-white-wrap": "layered_premium_wrap",
  "ivory-structured-wrap": "layered_premium_wrap",
  "premium-dark-wrap": "dark_luxury_wrap",
  "simple-white-wrap": "japanese_minimal_wrap",
  "natural-kraft-wrap": "kraft_cone",
  "light-kraft-wrap": "kraft_cone",
  "blush-ivory-wrap": "soft_paper_cone",
  "kraft-rustic-wrap": "kraft_cone",
  "soft-cream-wrap": "layered_premium_wrap",
  "sage-botanical-wrap": "sage_wrap",
  "botanical-garden-burlap": "small_hand_tied_wrap",
  "burlap-wrap": "small_hand_tied_wrap",
  "burlap": "small_hand_tied_wrap",
  "frosted-vellum": "translucent_wrap",
  "vellum-wrap": "translucent_wrap",
  "blush-silk": "soft_paper_cone",
  "ivory-linen": "layered_premium_wrap",
  "midnight-luxury": "dark_luxury_wrap",
  "japanese-minimal-origami": "japanese_minimal_wrap",
  "natural-kraft": "kraft_cone",
  "kraft": "kraft_cone",
};

const RIBBON_ALIASES: Record<string, string> = {
  "classic-ribbon": "cream-white",
  "sage-ribbon": "sage-green",
  "luxury-ribbon": "gold-satin",
  "minimal-ribbon": "minimal-cord",
  "romantic-ribbon": "soft-pink",
  "playful-ribbon": "soft-pink",
  "rustic-twine": "rustic-twine",
  "natural-twine": "rustic-twine",
  "jute-twine": "rustic-twine",
  "twine": "rustic-twine",
  "simple-playful-ribbon": "cream-white",
  "soft-ribbon": "cream-white",
  "red-ribbon": "royal-red",
  "romantic-red": "royal-red",
  "gold-ribbon": "gold-satin",
  "silk-white": "cream-white",
  "blush-satin": "soft-pink",
  "crimson-velvet": "royal-red",
};

export function resolveWrappingOption(idOrAlias?: string): WrappingOption {
  if (!idOrAlias) return WRAPPING_OPTIONS[0];
  const direct = WRAPPING_OPTIONS.find((w) => w.id === idOrAlias || w.preset === idOrAlias);
  if (direct) return direct;

  const normalized = idOrAlias.toLowerCase().trim();
  const directNorm = WRAPPING_OPTIONS.find(
    (w) =>
      w.id.toLowerCase() === normalized ||
      w.preset.toLowerCase() === normalized ||
      w.name.toLowerCase().replace(/\s+/g, "-") === normalized ||
      w.id.toLowerCase().replace(/_/g, "-") === normalized.replace(/_/g, "-")
  );
  if (directNorm) return directNorm;

  const targetId = WRAPPING_ALIASES[idOrAlias] || WRAPPING_ALIASES[normalized] || WRAPPING_ALIASES[normalized.replace(/_/g, "-")];
  if (targetId) {
    const aliased = WRAPPING_OPTIONS.find((w) => w.id === targetId || w.preset === targetId);
    if (aliased) return aliased;
  }
  return WRAPPING_OPTIONS[0];
}

export function resolveRibbonOption(idOrAlias?: string): RibbonOption {
  if (!idOrAlias) return RIBBON_OPTIONS[0];
  const direct = RIBBON_OPTIONS.find((r) => r.id === idOrAlias);
  if (direct) return direct;

  const normalized = idOrAlias.toLowerCase().trim();
  const directNorm = RIBBON_OPTIONS.find(
    (r) =>
      r.id.toLowerCase() === normalized ||
      r.name.toLowerCase().replace(/\s+/g, "-") === normalized ||
      r.id.toLowerCase().replace(/_/g, "-") === normalized.replace(/_/g, "-")
  );
  if (directNorm) return directNorm;

  const targetId = RIBBON_ALIASES[idOrAlias] || RIBBON_ALIASES[normalized] || RIBBON_ALIASES[normalized.replace(/_/g, "-")];
  if (targetId) {
    const aliased = RIBBON_OPTIONS.find((r) => r.id === targetId);
    if (aliased) return aliased;
  }
  return RIBBON_OPTIONS[0];
}

