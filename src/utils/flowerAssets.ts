export const COLOR_HEX_MAP: Record<string, { bg: string; border: string; text: string; label: string }> = {
  red: { bg: "#e11d48", border: "#be123c", text: "#ffffff", label: "Red / Đỏ" },
  pink: { bg: "#f472b6", border: "#db2777", text: "#ffffff", label: "Pink / Hồng" },
  white: { bg: "#f8fafc", border: "#cbd5e1", text: "#334155", label: "White / Trắng" },
  yellow: { bg: "#eab308", border: "#ca8a04", text: "#422006", label: "Yellow / Vàng" },
  peach: { bg: "#fdba74", border: "#f97316", text: "#7c2d12", label: "Peach / Cam đào" },
  orange: { bg: "#f97316", border: "#c2410c", text: "#ffffff", label: "Orange / Cam" },
  blue: { bg: "#38bdf8", border: "#0284c7", text: "#ffffff", label: "Blue / Xanh dương" },
  purple: { bg: "#a855f7", border: "#7e22ce", text: "#ffffff", label: "Purple / Tím" },
  green: { bg: "#22c55e", border: "#15803d", text: "#ffffff", label: "Green / Xanh lá" },
  silver: { bg: "#94a3b8", border: "#64748b", text: "#ffffff", label: "Silver / Ánh bạc" },
};

export const ROLE_DETAILS: Record<string, { label: string; badgeClass: string; desc: string }> = {
  focal: {
    label: "Focal Bloom",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    desc: "Primary visual anchor & hero flower",
  },
  secondary: {
    label: "Secondary",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    desc: "Harmonizing volume and structure",
  },
  filler: {
    label: "Filler",
    badgeClass: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    desc: "Airy texture & soft transition",
  },
  foliage: {
    label: "Foliage",
    badgeClass: "bg-stone-200 text-stone-900 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700",
    desc: "Botanical greenery & grounding depth",
  },
};

export const OCCASION_ICONS: Record<string, string> = {
  birthday: "🎂",
  anniversary: "💍",
  valentines: "💖",
  graduation: "🎓",
  congratulations: "🎉",
  "thank-you": "💌",
  "get-well": "🌿",
  celebration: "✨",
};

export const STYLE_ICONS: Record<string, string> = {
  soft: "🌸",
  romantic: "🌹",
  elegant: "✨",
  minimal: "🌿",
  natural: "🌾",
  classic: "🏛️",
  playful: "🌻",
  luxury: "👑",
  rustic: "🍂",
};
