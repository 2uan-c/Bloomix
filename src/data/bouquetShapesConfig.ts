export interface BouquetShapeOption {
  id: string;
  name: string;
  vietnamese: string;
  description: string;
  silhouette: "rounded" | "slightly-vertical" | "wide-irregular" | "tall-vertical" | "descending-cascade" | "compact-round";
  width: number;
  height: number;
  density: number;
  symmetry: number;
  stemSpread: number;
  focalPlacement: "center" | "slightly-off-center" | "distributed-offset" | "high-center" | "upper-mass-with-trail" | "tight-dome";
  badge: string;
  iconType: "dome" | "hand-tied" | "wild" | "long-stem" | "cascade" | "posy";
}

export const BOUQUET_SHAPES: BouquetShapeOption[] = [
  {
    id: "round-dome",
    name: "Round Dome",
    vietnamese: "Tròn cổ điển (Dome)",
    description: "Cân đối, tròn đầy, cành hoa phân bố đều đặn xung quanh tâm.",
    silhouette: "rounded",
    width: 0.85,
    height: 0.72,
    density: 0.88,
    symmetry: 0.92,
    stemSpread: 0.75,
    focalPlacement: "center",
    badge: "Classic",
    iconType: "dome",
  },
  {
    id: "hand-tied",
    name: "Hand-Tied",
    vietnamese: "Bó tự nhiên (Hand-Tied)",
    description: "Dáng bó tay tự nhiên của florist, cành xoắn hội tụ duyên dáng.",
    silhouette: "slightly-vertical",
    width: 0.82,
    height: 0.86,
    density: 0.76,
    symmetry: 0.70,
    stemSpread: 0.85,
    focalPlacement: "slightly-off-center",
    badge: "Versatile",
    iconType: "hand-tied",
  },
  {
    id: "loose-wild",
    name: "Loose / Wild",
    vietnamese: "Phóng khoáng (Wildflower)",
    description: "Bất đối xứng, bay bổng với lá xòe rộng và độ cao so le tự do.",
    silhouette: "wide-irregular",
    width: 0.98,
    height: 1.02,
    density: 0.60,
    symmetry: 0.28,
    stemSpread: 1.15,
    focalPlacement: "distributed-offset",
    badge: "Organic",
    iconType: "wild",
  },
  {
    id: "long-stem",
    name: "Long-Stem",
    vietnamese: "Dáng cành dài (Long-Stem)",
    description: "Thanh mảnh, thân cành vươn cao, tôn vinh vẻ đẹp kiêu sa của từng bông.",
    silhouette: "tall-vertical",
    width: 0.65,
    height: 1.15,
    density: 0.68,
    symmetry: 0.80,
    stemSpread: 0.55,
    focalPlacement: "high-center",
    badge: "Elegant",
    iconType: "long-stem",
  },
  {
    id: "cascading",
    name: "Cascading",
    vietnamese: "Dáng thác đổ (Cascade)",
    description: "Dáng hoa chảy mềm mại rủ xuống như thác nước, quý phái và lãng mạn.",
    silhouette: "descending-cascade",
    width: 0.88,
    height: 1.10,
    density: 0.78,
    symmetry: 0.45,
    stemSpread: 0.90,
    focalPlacement: "upper-mass-with-trail",
    badge: "Luxury",
    iconType: "cascade",
  },
  {
    id: "compact-posy",
    name: "Compact Posy",
    vietnamese: "Nhỏ gọn xinh xắn (Posy)",
    description: "Bó hoa nhỏ gọn, hoa xếp khít chặt chẽ, dễ thương và trang nhã.",
    silhouette: "compact-round",
    width: 0.70,
    height: 0.62,
    density: 0.94,
    symmetry: 0.88,
    stemSpread: 0.65,
    focalPlacement: "tight-dome",
    badge: "Petite",
    iconType: "posy",
  },
];

export const DEFAULT_SHAPE_BY_STYLE: Record<string, string> = {
  classic: "round-dome",
  romantic: "hand-tied",
  luxury: "cascading",
  natural: "loose-wild",
  rustic: "loose-wild",
  elegant: "long-stem",
  minimal: "long-stem",
  playful: "compact-posy",
  "playful-1": "compact-posy",
  soft: "round-dome",
};

export function getBouquetShapeById(shapeId?: string): BouquetShapeOption {
  if (!shapeId) return BOUQUET_SHAPES[0];
  const found = BOUQUET_SHAPES.find((s) => s.id === shapeId);
  return found || BOUQUET_SHAPES[0];
}
