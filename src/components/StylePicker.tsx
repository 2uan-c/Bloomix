import React from "react";
import type { BouquetStyle, Occasion } from "../engine/types.ts";
import { STYLE_ICONS } from "../utils/flowerAssets.ts";
import { getStyleShapeRule } from "../engine/styleComposition.ts";
import { Check, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

interface StylePickerProps {
  styles: BouquetStyle[];
  selectedStyleId: string;
  selectedOccasion?: Occasion;
  onSelectStyle: (id: string) => void;
  onProceedToFlowers?: () => void;
  onBackToOccasion?: () => void;
}

export const StylePicker: React.FC<StylePickerProps> = ({
  styles,
  selectedStyleId,
  selectedOccasion,
  onSelectStyle,
  onProceedToFlowers,
  onBackToOccasion,
}) => {
  const selectedStyle = styles.find((s) => s.id === selectedStyleId);

  return (
    <div className="space-y-6" id="style-picker-section">
      {/* Title & Guidance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2D2D2D] tracking-tight">
            2. Choose Bouquet Style
          </h2>
          <p className="text-xs sm:text-sm text-[#2D2D2D]/70 mt-0.5">
            Defines the florist architecture, density, stem distribution, and emotional atmosphere.
          </p>
        </div>

        <div className="text-xs text-[#2D4F1E] bg-[#FAF8F3] px-3 py-1.5 rounded-full border border-[#E8E4D9] font-medium w-fit">
          Selected: <strong className="font-bold text-[#2D2D2D]">{selectedStyle?.name || "Style"}</strong>
        </div>
      </div>

      {/* Styles Grid (9 Styles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {styles.map((style) => {
          const isSelected = style.id === selectedStyleId;
          const icon = STYLE_ICONS[style.id] || "🌸";
          const shapeRule = getStyleShapeRule(style.id);

          // Check compatibility with current occasion
          const occComp =
            selectedOccasion?.styleCompatibility[style.id] !== undefined
              ? selectedOccasion.styleCompatibility[style.id]
              : 0.8;
          const isHighlyRecommended = occComp >= 0.9;

          return (
            <button
              key={style.id}
              id={`style-btn-${style.id}`}
              type="button"
              onClick={() => onSelectStyle(style.id)}
              className={`relative text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-[#FAF8F3] border-[#2D4F1E] ring-2 ring-[#2D4F1E]/25 shadow-sm text-[#2D2D2D]"
                  : "bg-white border-[#E8E4D9] text-[#2D2D2D] hover:border-[#2D4F1E]/40 hover:bg-[#FAF8F3]/60 hover:shadow-xs"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#2D4F1E] text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{icon}</span>
                  {isHighlyRecommended && (
                    <span className="text-[10px] flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAF3E6] text-[#2D4F1E] font-bold border border-[#C8DEC0]">
                      <Sparkles className="w-3 h-3" /> Best fit
                    </span>
                  )}
                </div>

                <div className="font-serif font-bold text-base tracking-tight text-[#2D2D2D]">
                  {style.name}
                </div>
                <div className="text-xs text-[#2D2D2D]/60 font-medium mt-0.5">
                  {style.displayName}
                </div>

                {shapeRule && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-lg bg-[#EFECE6] text-[#2D2D2D]/80 border border-[#E5E0D5]">
                      {shapeRule.shape.replace("-", " ")}
                    </span>
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-lg bg-[#FAF8F5] text-[#2D2D2D]/70 border border-[#EBE7DF]">
                      {Math.round(shapeRule.density * 100)}% density
                    </span>
                  </div>
                )}

                <p className="text-xs text-[#2D2D2D]/75 mt-2 leading-relaxed">
                  {style.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8E4D9]/80 flex items-center justify-between text-xs">
                <span className="text-[#2D2D2D]/60 font-medium">Occasion Suitability</span>
                <span
                  className={`font-bold ${
                    occComp >= 0.9
                      ? "text-[#2D4F1E]"
                      : occComp >= 0.7
                      ? "text-[#8B5A2B]"
                      : "text-[#8B3A3A]"
                  }`}
                >
                  {Math.round(occComp * 100)}% match
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {onBackToOccasion && (
          <button
            type="button"
            onClick={onBackToOccasion}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#E8E4D9] bg-white hover:bg-[#FAF8F3] text-[#2D2D2D] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <div className="flex flex-col items-start text-left leading-tight">
              <span className="text-xs sm:text-sm">Back to Occasion</span>
              <span className="text-[10px] text-[#2D2D2D]/60 font-normal">Quay lại Chọn Dịp</span>
            </div>
          </button>
        )}

        {onProceedToFlowers && (
          <button
            type="button"
            id="proceed-to-flowers-btn"
            onClick={onProceedToFlowers}
            className="w-full sm:w-auto ml-auto px-6 py-2.5 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-white font-serif font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left leading-tight">
              <span className="text-xs sm:text-sm">Continue: Choose Flowers</span>
              <span className="text-[10px] text-white/80 font-normal">Tiếp tục: Chọn Hoa cho Bó</span>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};
