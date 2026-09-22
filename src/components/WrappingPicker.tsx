import React from "react";
import {
  WRAPPING_OPTIONS,
  RIBBON_OPTIONS,
  type WrappingOption,
  type RibbonOption,
} from "../utils/botanicalImages.ts";
import { Package, Sparkles, Check, ArrowRight, ArrowLeft, Layers } from "lucide-react";

interface WrappingPickerProps {
  selectedWrappingId: string;
  selectedRibbonId: string;
  wrapCoverage?: "top" | "full";
  onSelectWrapping: (id: string) => void;
  onSelectRibbon: (id: string) => void;
  onSelectWrapCoverage?: (coverage: "top" | "full") => void;
  onProceedToAnalyze?: () => void;
  onBackToArrange?: () => void;
}

export const WrappingPicker: React.FC<WrappingPickerProps> = ({
  selectedWrappingId,
  selectedRibbonId,
  wrapCoverage = "top",
  onSelectWrapping,
  onSelectRibbon,
  onSelectWrapCoverage,
  onProceedToAnalyze,
  onBackToArrange,
}) => {
  return (
    <div className="space-y-6" id="wrapping-picker-step-view">
      {/* Title & Guidance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2D2D2D] tracking-tight">
            5. Choose Wrapping & Ribbon
          </h2>
          <p className="text-xs sm:text-sm text-[#2D2D2D]/70 mt-0.5">
            Select multi-layer florist papers, wrap coverage style, and tied ribbons to frame your bouquet.
          </p>
        </div>

        <div className="text-xs text-[#2D4F1E] bg-[#EAF3E6] px-3 py-1.5 rounded-full border border-[#C8DEC0] font-semibold w-fit flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Studio Layering</span>
        </div>
      </div>

      {/* Wrapping Coverage Style Selector (Top Wrap vs Full Wrap) */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E4D9] shadow-xs space-y-3" id="wrapping-coverage-selector-card">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2D4F1E]" />
            <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
              Wrapping Coverage Style
            </h3>
            <span className="text-xs text-[#2D2D2D]/60">(Kiểu bọc bó hoa)</span>
          </div>

          <span className="text-[11px] font-semibold text-[#2D4F1E] bg-[#EAF3E6] px-2.5 py-0.5 rounded-full border border-[#C8DEC0]">
            {wrapCoverage === "full" ? "Bọc toàn phần (Full Wrap)" : "Bọc trên (Top Wrap)"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Wrapping coverage options">
          {/* Option 1: Top Wrap (Default) */}
          <button
            type="button"
            id="wrap-style-top-btn"
            role="radio"
            aria-checked={wrapCoverage === "top"}
            onClick={() => onSelectWrapCoverage?.("top")}
            className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${
              wrapCoverage === "top"
                ? "bg-[#FAF8F3] border-[#2D4F1E] ring-2 ring-[#2D4F1E]/20 shadow-xs"
                : "bg-white border-[#E8E4D9] hover:bg-[#FAF8F3]/60 hover:border-[#2D4F1E]/40"
            }`}
          >
            {/* Visual Icon: Top Wrap (stems exposed below) */}
            <div className="w-11 h-12 rounded-lg bg-[#F5F2EB] border border-[#E0DACB] shrink-0 flex flex-col items-center justify-center relative p-1 overflow-hidden">
              {/* Flower head silhouette */}
              <div className="w-6 h-3 bg-[#E58C8A] rounded-t-full opacity-80" />
              {/* Upper paper cone */}
              <div
                className="w-7 h-4 rounded-b-sm border-t border-[#B59775] relative z-10"
                style={{ backgroundColor: "#C9AE8D" }}
              />
              {/* Exposed stems radiating below */}
              <div className="flex gap-1 justify-center mt-0.5 z-0">
                <div className="w-0.5 h-3.5 bg-[#2B5219] -rotate-6" />
                <div className="w-0.5 h-4 bg-[#1F4212]" />
                <div className="w-0.5 h-3.5 bg-[#2B5219] rotate-6" />
              </div>
              {wrapCoverage === "top" && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#2D4F1E] text-white flex items-center justify-center">
                  <Check className="w-2 h-2 stroke-[3]" />
                </div>
              )}
            </div>

            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-[#2D2D2D]">Top Wrap</span>
                <span className="text-xs font-medium text-[#2D4F1E] bg-[#EAF3E6] px-1.5 py-0.2 rounded">Bọc trên</span>
              </div>
              <p className="text-xs text-[#2D2D2D]/70 leading-relaxed">
                Upper cone wrap with natural fresh stems exposed below.
              </p>
            </div>
          </button>

          {/* Option 2: Full Wrap (New) */}
          <button
            type="button"
            id="wrap-style-full-btn"
            role="radio"
            aria-checked={wrapCoverage === "full"}
            onClick={() => onSelectWrapCoverage?.("full")}
            className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${
              wrapCoverage === "full"
                ? "bg-[#FAF8F3] border-[#2D4F1E] ring-2 ring-[#2D4F1E]/20 shadow-xs"
                : "bg-white border-[#E8E4D9] hover:bg-[#FAF8F3]/60 hover:border-[#2D4F1E]/40"
            }`}
          >
            {/* Visual Icon: Full Wrap (cone extends down enclosing stems) */}
            <div className="w-11 h-12 rounded-lg bg-[#F5F2EB] border border-[#E0DACB] shrink-0 flex flex-col items-center justify-center relative p-1 overflow-hidden">
              {/* Flower head silhouette */}
              <div className="w-6 h-3 bg-[#E58C8A] rounded-t-full opacity-80" />
              {/* Full paper cone wrapping down */}
              <div
                className="w-7 h-5 rounded-b-none border-t border-[#B59775] relative z-10"
                style={{ backgroundColor: "#C9AE8D" }}
              />
              {/* Extended paper wrap cone over stem bundle */}
              <div
                className="w-3.5 h-3 rounded-b-xs border-x border-[#B59775] relative z-10"
                style={{ backgroundColor: "#B59775" }}
              />
              {/* Small ribbon bow at base */}
              <div className="w-4 h-1 bg-[#A0805B] rounded-full mt-[-2px] z-20" />
              {wrapCoverage === "full" && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#2D4F1E] text-white flex items-center justify-center">
                  <Check className="w-2 h-2 stroke-[3]" />
                </div>
              )}
            </div>

            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-[#2D2D2D]">Full Wrap</span>
                <span className="text-xs font-medium text-[#2D4F1E] bg-[#EAF3E6] px-1.5 py-0.2 rounded">Bọc toàn phần</span>
              </div>
              <p className="text-xs text-[#2D2D2D]/70 leading-relaxed">
                Full florist cone enclosing stems with bow tied at the base handle.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Wrapping Papers Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#2D4F1E]" />
          <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
            Florist Paper Preset
          </h3>
          <span className="text-xs text-[#2D2D2D]/60">(Giấy gói cao cấp)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WRAPPING_OPTIONS.map((wrap) => {
            const isSelected = wrap.id === selectedWrappingId;

            return (
              <button
                key={wrap.id}
                id={`wrapping-option-${wrap.id}`}
                type="button"
                onClick={() => onSelectWrapping(wrap.id)}
                className={`relative text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex gap-3.5 items-start ${
                  isSelected
                    ? "bg-[#FAF8F3] border-[#2D4F1E] ring-2 ring-[#2D4F1E]/25 shadow-sm"
                    : "bg-white border-[#E8E4D9] hover:border-[#2D4F1E]/40 hover:bg-[#FAF8F3]/60"
                }`}
              >
                {/* Paper Color Swatch & Fold Mockup */}
                <div
                  className="w-12 h-14 rounded-xl border shadow-inner shrink-0 flex flex-col justify-end p-1 relative overflow-hidden"
                  style={{
                    backgroundColor: wrap.paperColor,
                    borderColor: wrap.paperBorder,
                  }}
                >
                  <div
                    className="w-full h-5 rounded-t-lg border-t border-l border-r opacity-90"
                    style={{
                      backgroundColor: wrap.innerPaperColor,
                      borderColor: wrap.paperBorder,
                    }}
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2D4F1E] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Paper Info */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <h4 className="font-serif font-bold text-sm text-[#2D2D2D]">
                      {wrap.name}
                    </h4>
                  </div>
                  <div className="text-xs text-[#2D2D2D]/60 italic">
                    {wrap.vietnamese}
                  </div>
                  <p className="text-[11px] text-[#2D2D2D]/75 line-clamp-2 leading-relaxed">
                    {wrap.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ribbons Section */}
      <div className="space-y-3 pt-2 border-t border-[#E8E4D9]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2D4F1E]" />
          <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
            Tied Ribbon & Bow
          </h3>
          <span className="text-xs text-[#2D2D2D]/60">(Nơ & Dây thắt điểm nhấn)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {RIBBON_OPTIONS.map((ribbon) => {
            const isSelected = ribbon.id === selectedRibbonId;

            return (
              <button
                key={ribbon.id}
                id={`ribbon-option-${ribbon.id}`}
                type="button"
                onClick={() => onSelectRibbon(ribbon.id)}
                className={`relative text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-2.5 ${
                  isSelected
                    ? "bg-[#FAF8F3] border-[#2D4F1E] ring-2 ring-[#2D4F1E]/25 shadow-xs"
                    : "bg-white border-[#E8E4D9] hover:border-[#2D4F1E]/40 hover:bg-[#FAF8F3]/60"
                }`}
              >
                {/* Ribbon Color Circle */}
                <span
                  className="w-5 h-5 rounded-full border shrink-0 shadow-2xs flex items-center justify-center"
                  style={{
                    backgroundColor: ribbon.color,
                    borderColor: ribbon.borderColor,
                  }}
                >
                  {isSelected && (
                    <Check className="w-3 h-3 text-white drop-shadow-xs stroke-[3]" />
                  )}
                </span>

                <div className="min-w-0">
                  <div className="text-xs font-serif font-bold text-[#2D2D2D] truncate">
                    {ribbon.name}
                  </div>
                  <div className="text-[10px] text-[#2D2D2D]/60 truncate">
                    {ribbon.vietnamese}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Step Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E8E4D9]">
        {onBackToArrange && (
          <button
            type="button"
            onClick={onBackToArrange}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#E8E4D9] bg-white hover:bg-[#FAF8F3] text-[#2D2D2D] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <div className="flex flex-col items-start text-left leading-tight">
              <span className="text-xs sm:text-sm">Back to Arrange</span>
              <span className="text-[10px] text-[#2D2D2D]/60 font-normal">Quay lại Xếp Bó hoa</span>
            </div>
          </button>
        )}

        {onProceedToAnalyze && (
          <button
            type="button"
            id="proceed-to-analyze-btn"
            onClick={onProceedToAnalyze}
            className="w-full sm:w-auto ml-auto px-6 py-2.5 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-white font-serif font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left leading-tight">
              <span className="text-xs sm:text-sm">Evaluate & AI Insights</span>
              <span className="text-[10px] text-white/80 font-normal">Đánh giá Bó hoa & Lời khuyên AI</span>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};
