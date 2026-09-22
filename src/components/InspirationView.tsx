import React from "react";
import type { Flower } from "../engine/types.ts";
import { DEMO_PRESETS, type PresetBouquet } from "../data/presets.ts";
import { OCCASION_FLORIST_GUIDES } from "../data/occasionRecommendations.ts";
import { FlowerBotanicalImage } from "./FlowerBotanicalImage.tsx";
import { Sparkles, ArrowRight, CheckCircle2, Bookmark, Flame } from "lucide-react";

interface InspirationViewProps {
  flowersMap: Map<string, Flower>;
  onLoadPreset: (preset: PresetBouquet) => void;
}

export const InspirationView: React.FC<InspirationViewProps> = ({
  flowersMap,
  onLoadPreset,
}) => {
  return (
    <div className="max-w-6xl w-full mx-auto space-y-6">
      {/* Hero Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E4D9] shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#2D4F1E] text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#2D2D2D]">
            Florist Inspiration & Signature Recipes
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#2D2D2D]/70 max-w-2xl">
          Curated floral recipes mathematically calibrated for specific occasions, color harmonies, and structural balance. Click any recipe to load it immediately into the Studio workbench.
        </p>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {DEMO_PRESETS.map((preset) => {
          const totalStems = preset.items.reduce((s, i) => s + i.quantity, 0);
          const guide = OCCASION_FLORIST_GUIDES[preset.occasionId];

          return (
            <div
              key={preset.id}
              onClick={() => onLoadPreset(preset)}
              className="bg-white rounded-3xl border border-[#E8E4D9] hover:border-[#2D4F1E] p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all cursor-pointer group space-y-4"
            >
              <div className="space-y-3">
                {/* Header Tag & Occasion */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF8F3] text-[#2D4F1E] border border-[#E8E4D9]">
                    {preset.tag}
                  </span>
                  <span className="text-xs font-medium text-[#2D2D2D]/60 capitalize">
                    {guide?.name || preset.occasionId}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2D2D2D] group-hover:text-[#2D4F1E] transition-colors">
                    {preset.name}
                  </h3>
                  <p className="text-xs text-[#2D2D2D]/65 mt-1 leading-relaxed">
                    {preset.subtitle}
                  </p>
                </div>

                {/* Botanical Mini Gallery */}
                <div className="flex items-center gap-2 py-1">
                  {preset.items.map((item) => {
                    const flower = flowersMap.get(item.flowerId);
                    return (
                      <div
                        key={item.flowerId}
                        className="relative w-14 h-14 rounded-2xl overflow-hidden border border-[#E8E4D9] bg-[#FAF8F3] shrink-0"
                        title={`${flower?.name || item.flowerId} (${item.quantity} stems)`}
                      >
                        <FlowerBotanicalImage
                          flowerId={item.flowerId}
                          color={item.selectedColor}
                          size="sm"
                          className="w-full h-full"
                        />
                        <span className="absolute bottom-0 right-0 bg-[#2D2D2D]/85 text-white text-[9px] font-bold px-1 rounded-tl">
                          ×{item.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Florist recipe detail */}
                <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] text-[11px] text-[#2D2D2D]/75 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold">Style:</span>
                    <span className="capitalize font-serif font-bold text-[#2D2D2D]">
                      {preset.styleId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Stems:</span>
                    <span className="font-bold text-[#2D4F1E]">{totalStems} stems</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-[#E8E4D9] flex items-center justify-between">
                <span className="text-[11px] text-[#2D2D2D]/50">Click to customize</span>
                <span className="text-xs font-serif font-bold text-[#2D4F1E] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Load into Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
