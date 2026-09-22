import React from "react";
import type { Occasion } from "../engine/types.ts";
import { OCCASION_ICONS } from "../utils/flowerAssets.ts";
import { Sparkles, Check, ArrowRight } from "lucide-react";

interface OccasionPickerProps {
  occasions: Occasion[];
  selectedOccasionId: string;
  onSelectOccasion: (id: string) => void;
  onProceedToStyle?: () => void;
}

export const OccasionPicker: React.FC<OccasionPickerProps> = ({
  occasions,
  selectedOccasionId,
  onSelectOccasion,
  onProceedToStyle,
}) => {
  const selectedOcc = occasions.find((o) => o.id === selectedOccasionId);

  return (
    <div className="space-y-6" id="occasion-picker-section">
      {/* Title & Guidance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2D2D2D] tracking-tight">
            1. Choose Your Occasion
          </h2>
          <p className="text-xs sm:text-sm text-[#2D2D2D]/70 mt-0.5">
            Select the gifting moment to guide floral etiquette, symbolism, and harmony rules.
          </p>
        </div>

        <div className="text-xs text-[#2D4F1E] bg-[#FAF8F3] px-3 py-1.5 rounded-full border border-[#E8E4D9] font-medium w-fit">
          Selected: <strong className="font-bold text-[#2D2D2D]">{selectedOcc?.name || "Occasion"}</strong>
        </div>
      </div>

      {/* Occasions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {occasions.map((occ) => {
          const isSelected = occ.id === selectedOccasionId;
          const icon = OCCASION_ICONS[occ.id] || "💐";

          return (
            <button
              key={occ.id}
              id={`occasion-btn-${occ.id}`}
              type="button"
              onClick={() => onSelectOccasion(occ.id)}
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
                <div className="text-3xl mb-2">{icon}</div>

                <div className="font-serif font-bold text-base tracking-tight text-[#2D2D2D]">
                  {occ.name}
                </div>
                <div className="text-xs text-[#2D2D2D]/60 mt-0.5 font-medium">
                  {occ.displayName}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8E4D9]/80">
                <div className="text-[10px] text-[#2D2D2D]/50 uppercase font-semibold tracking-wider mb-1.5">
                  Best Floral Styles
                </div>
                <div className="flex flex-wrap gap-1">
                  {occ.preferredStyles.slice(0, 3).map((st) => (
                    <span
                      key={st}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-[#EFECE6] text-[#2D2D2D]/80 font-medium capitalize border border-[#E5E0D5]"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Primary Action Button */}
      {onProceedToStyle && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            id="proceed-to-style-btn"
            onClick={onProceedToStyle}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-white font-serif font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left leading-tight">
              <span className="text-xs sm:text-sm">Continue: Choose Style</span>
              <span className="text-[10px] text-white/80 font-normal">Tiếp tục: Chọn Phong cách cắm hoa</span>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
};
