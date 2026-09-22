import React from "react";
import type { Occasion, BouquetStyle, BouquetItem } from "../engine/types.ts";
import { OCCASION_ICONS, STYLE_ICONS } from "../utils/flowerAssets.ts";
import { getOccasionFloristGuide } from "../data/occasionRecommendations.ts";
import { BOUQUET_SHAPES, getBouquetShapeById, type BouquetShapeOption } from "../data/bouquetShapesConfig.ts";
import {
  Calendar,
  Wand2,
  Check,
  Sparkles,
  Info,
  ArrowRight,
  Bookmark,
  Layers,
  Circle,
  Wind,
  Flower2,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";

interface ConfigSidebarProps {
  occasions: Occasion[];
  styles: BouquetStyle[];
  selectedOccasionId: string;
  selectedStyleId: string;
  selectedShapeId?: string;
  onSelectOccasion: (id: string) => void;
  onSelectStyle: (id: string) => void;
  onSelectShape?: (id: string) => void;
  onApplyOccasionRecipe?: (recipe: { items: BouquetItem[]; styleId: string }) => void;
}

export const ConfigSidebar: React.FC<ConfigSidebarProps> = ({
  occasions,
  styles,
  selectedOccasionId,
  selectedStyleId,
  selectedShapeId = "round-dome",
  onSelectOccasion,
  onSelectStyle,
  onSelectShape,
  onApplyOccasionRecipe,
}) => {
  const currentOccasion = occasions.find((o) => o.id === selectedOccasionId);
  const currentStyle = styles.find((s) => s.id === selectedStyleId);
  const currentShape = getBouquetShapeById(selectedShapeId);
  const floristGuide = getOccasionFloristGuide(selectedOccasionId);

  const getShapeIcon = (iconType: BouquetShapeOption["iconType"]) => {
    switch (iconType) {
      case "dome":
        return <Circle className="w-4 h-4 text-emerald-800" />;
      case "hand-tied":
        return <Flower2 className="w-4 h-4 text-emerald-800" />;
      case "wild":
        return <Wind className="w-4 h-4 text-emerald-800" />;
      case "long-stem":
        return <ArrowUpRight className="w-4 h-4 text-emerald-800" />;
      case "cascade":
        return <TrendingDown className="w-4 h-4 text-emerald-800" />;
      case "posy":
        return <Sparkles className="w-4 h-4 text-emerald-800" />;
      default:
        return <Circle className="w-4 h-4 text-emerald-800" />;
    }
  };

  return (
    <aside className="space-y-4" id="bloomix-config-sidebar">
      {/* 1. OCCASION SELECTOR */}
      <div className="bg-white rounded-2xl border border-[#E8E4D9] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D4F1E] flex items-center justify-center font-bold text-xs">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#2D2D2D]">
                1. Occasion
              </h3>
              <p className="text-[11px] text-[#2D2D2D]/60">
                {currentOccasion?.displayName || "Mục đích tặng"}
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#FAF8F3] text-[#2D4F1E] border border-[#E8E4D9]">
            Intent
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {occasions.map((occ) => {
            const isSelected = occ.id === selectedOccasionId;
            const icon = OCCASION_ICONS[occ.id] || "💐";

            return (
              <button
                key={occ.id}
                id={`sidebar-occasion-${occ.id}`}
                type="button"
                onClick={() => onSelectOccasion(occ.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#F3EFE6] border-[#2D4F1E] ring-1 ring-[#2D4F1E]/30 text-[#2D2D2D] shadow-2xs"
                    : "bg-[#FAF8F3]/60 border-[#E8E4D9] hover:bg-white hover:border-[#2D4F1E]/40 text-[#2D2D2D]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{icon}</span>
                  {isSelected && (
                    <div className="w-3.5 h-3.5 rounded-full bg-[#2D4F1E] text-white flex items-center justify-center">
                      <Check className="w-2 h-2 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="mt-1">
                  <div className="font-serif font-semibold text-xs text-[#2D2D2D] truncate">
                    {occ.name}
                  </div>
                  <div className="text-[10px] text-[#2D2D2D]/55 truncate">
                    {occ.displayName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Occasion Florist Intelligence Dossier */}
        {floristGuide && (
          <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] text-[11px] space-y-2">
            <div className="flex items-center gap-1.5 text-[#2D4F1E] font-serif font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Florist Advice for {floristGuide.name}</span>
            </div>
            <p className="text-[#2D2D2D]/75 leading-relaxed italic">
              "{floristGuide.tagline}"
            </p>

            {onApplyOccasionRecipe && (
              <div className="pt-2 border-t border-[#E8E4D9]/80">
                <button
                  type="button"
                  onClick={() =>
                    onApplyOccasionRecipe({
                      items: floristGuide.starterRecipe.items,
                      styleId: floristGuide.starterRecipe.recommendedStyleId,
                    })
                  }
                  className="w-full py-1.5 px-2.5 rounded-lg bg-white border border-[#2D4F1E]/30 text-[#2D4F1E] hover:bg-[#F4F9F1] transition-all flex items-center justify-between text-xs font-serif font-bold cursor-pointer shadow-2xs"
                >
                  <span className="truncate">Load {floristGuide.starterRecipe.name}</span>
                  <ArrowRight className="w-3 h-3 shrink-0 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. STYLE SELECTOR */}
      <div className="bg-white rounded-2xl border border-[#E8E4D9] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D4F1E] flex items-center justify-center font-bold text-xs">
              <Wand2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#2D2D2D]">
                2. Bouquet Style
              </h3>
              <p className="text-[11px] text-[#2D2D2D]/60">
                {currentStyle?.displayName || "Phong cách cắm"}
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#FAF8F3] text-[#2D4F1E] border border-[#E8E4D9]">
            Aesthetic
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {styles.map((style) => {
            const isSelected = style.id === selectedStyleId;
            const icon = STYLE_ICONS[style.id] || "🌸";

            // Occasion compatibility
            const occComp =
              currentOccasion?.styleCompatibility[style.id] !== undefined
                ? currentOccasion.styleCompatibility[style.id]
                : 0.8;
            const isBestFit = occComp >= 0.9;

            return (
              <button
                key={style.id}
                id={`sidebar-style-${style.id}`}
                type="button"
                onClick={() => onSelectStyle(style.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-[#F3EFE6] border-[#2D4F1E] ring-1 ring-[#2D4F1E]/30 text-[#2D2D2D] shadow-2xs"
                    : "bg-[#FAF8F3]/60 border-[#E8E4D9] hover:bg-white hover:border-[#2D4F1E]/40 text-[#2D2D2D]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-serif font-semibold text-xs text-[#2D2D2D] truncate">
                        {style.name}
                      </span>
                      {isBestFit && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#ECE7DC] text-[#2D4F1E] font-bold shrink-0">
                          Best fit
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#2D2D2D]/60 truncate">
                      {style.displayName}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-[#2D4F1E] text-white flex items-center justify-center shrink-0 ml-1">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. BOUQUET SHAPE SELECTOR */}
      <div className="bg-white rounded-2xl border border-[#E8E4D9] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D4F1E] flex items-center justify-center font-bold text-xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#2D2D2D]">
                3. Bouquet Shape
              </h3>
              <p className="text-[11px] text-[#2D2D2D]/60">
                {currentShape.name} • {currentShape.vietnamese}
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#FAF8F3] text-[#2D4F1E] border border-[#E8E4D9]">
            Form
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {BOUQUET_SHAPES.map((shape) => {
            const isSelected = shape.id === selectedShapeId;

            return (
              <button
                key={shape.id}
                id={`sidebar-shape-${shape.id}`}
                type="button"
                onClick={() => onSelectShape && onSelectShape(shape.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-[#F3EFE6] border-[#2D4F1E] ring-1 ring-[#2D4F1E]/30 text-[#2D2D2D] shadow-2xs"
                    : "bg-[#FAF8F3]/60 border-[#E8E4D9] hover:bg-white hover:border-[#2D4F1E]/40 text-[#2D2D2D]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-[#2D4F1E]/10" : "bg-white border border-[#E8E4D9]"
                  }`}>
                    {getShapeIcon(shape.iconType)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-semibold text-xs text-[#2D2D2D] truncate">
                        {shape.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#EAE5D8] text-[#2D4F1E] font-medium shrink-0">
                        {shape.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#2D2D2D]/60 truncate">
                      {shape.vietnamese}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-[#2D4F1E] text-white flex items-center justify-center shrink-0 ml-1">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
