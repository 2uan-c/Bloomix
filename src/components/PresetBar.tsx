import React, { useState } from "react";
import { DEMO_PRESETS, type PresetBouquet } from "../data/presets.ts";
import { Sparkles, ChevronDown, ChevronUp, Lightbulb, ArrowRight } from "lucide-react";

interface PresetBarProps {
  onSelectPreset: (preset: PresetBouquet) => void;
  activePresetId?: string;
}

export const PresetBar: React.FC<PresetBarProps> = ({
  onSelectPreset,
  activePresetId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="bg-[#FAF8F3] border border-[#E8E4D9] rounded-2xl p-3 sm:p-4 shadow-xs space-y-2 transition-all"
      id="preset-bar-inspiration-section"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-[#2D4F1E]/10 text-[#2D4F1E]">
            <Lightbulb className="w-4 h-4" />
          </span>
          <div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-[#2D2D2D]">
              Need Inspiration?
            </h4>
            <p className="text-[11px] text-[#2D2D2D]/60">
              Optional florist templates to jump-start your arrangement (freely customize anytime)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-semibold text-[#2D4F1E] hover:underline flex items-center gap-1 cursor-pointer px-2 py-1"
        >
          <span>{isOpen ? "Hide Templates" : "Explore Presets"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick Clickable Chips (Always accessible) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
        {DEMO_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              id={`preset-chip-${preset.id}`}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                isActive
                  ? "bg-[#2D4F1E] text-white border-[#2D4F1E] font-bold"
                  : "bg-white text-[#2D2D2D] border-[#E8E4D9] hover:border-[#2D4F1E]/60 hover:bg-[#F3EFE6]"
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#EAB308]" />
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Expandable detailed cards if opened */}
      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-[#E8E4D9]">
          {DEMO_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="bg-white p-3 rounded-xl border border-[#E8E4D9] flex flex-col justify-between space-y-2 hover:border-[#2D4F1E]/50 transition-colors shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-serif font-bold text-xs text-[#2D2D2D]">
                    {preset.name}
                  </span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#FAF8F3] text-[#2D4F1E] border border-[#E8E4D9]">
                    {preset.tag}
                  </span>
                </div>
                <p className="text-[11px] text-[#2D2D2D]/70 line-clamp-2">
                  {preset.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectPreset(preset)}
                className="w-full py-1.5 px-2 rounded-lg bg-[#FAF8F3] hover:bg-[#2D4F1E] hover:text-white border border-[#E8E4D9] text-xs font-semibold text-[#2D2D2D] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>Load Template</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
