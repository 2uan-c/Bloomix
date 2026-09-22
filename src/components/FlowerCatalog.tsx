import React, { useState, useMemo } from "react";
import type { BouquetItem, Flower } from "../engine/types.ts";
import { FlowerBotanicalImage } from "./FlowerBotanicalImage.tsx";
import { COLOR_HEX_MAP, ROLE_DETAILS } from "../utils/flowerAssets.ts";
import { getOccasionFloristGuide } from "../data/occasionRecommendations.ts";
import {
  Search,
  Plus,
  Minus,
  Check,
  Filter,
  Sparkles,
  X,
  Star,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface FlowerCatalogProps {
  flowers: Flower[];
  currentBouquet: BouquetItem[];
  selectedStyleId?: string;
  selectedOccasionId?: string;
  onAddFlower: (flowerId: string, color?: string) => void;
  onUpdateQuantity: (flowerId: string, delta: number) => void;
  onProceedToArrange?: () => void;
  onBackToStyle?: () => void;
}

export const FlowerCatalog: React.FC<FlowerCatalogProps> = ({
  flowers,
  currentBouquet,
  selectedStyleId,
  selectedOccasionId = "valentines",
  onAddFlower,
  onUpdateQuantity,
  onProceedToArrange,
  onBackToStyle,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [onlyOccasionFit, setOnlyOccasionFit] = useState<boolean>(false);
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  const [focusedFlowerId, setFocusedFlowerId] = useState<string | null>(null);

  const occasionGuide = useMemo(() => {
    return getOccasionFloristGuide(selectedOccasionId);
  }, [selectedOccasionId]);

  const totalStems = useMemo(() => {
    return currentBouquet.reduce((sum, item) => sum + item.quantity, 0);
  }, [currentBouquet]);

  const totalVarieties = useMemo(() => {
    return currentBouquet.filter((item) => item.quantity > 0).length;
  }, [currentBouquet]);

  const isContinueDisabled = totalStems === 0;

  // Filtered flowers list
  const filteredFlowers = useMemo(() => {
    return flowers.filter((f) => {
      // Search
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        f.name.toLowerCase().includes(search) ||
        f.displayName.toLowerCase().includes(search) ||
        f.meaning.some((m) => m.toLowerCase().includes(search));

      // Role filter
      const matchesRole =
        roleFilter === "all" || f.roles.includes(roleFilter as any);

      // Color filter
      const matchesColor =
        colorFilter === "all" || f.colors.includes(colorFilter);

      // Occasion suitability filter
      const occasionScore =
        f.occasions[selectedOccasionId] !== undefined
          ? f.occasions[selectedOccasionId]
          : 0.7;
      const matchesOccasion = !onlyOccasionFit || occasionScore >= 0.85;

      return matchesSearch && matchesRole && matchesColor && matchesOccasion;
    });
  }, [flowers, searchTerm, roleFilter, colorFilter, onlyOccasionFit, selectedOccasionId]);

  const handleColorSelect = (flowerId: string, color: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedColors((prev) => ({ ...prev, [flowerId]: color }));
  };

  const allAvailableColors = useMemo(() => {
    const set = new Set<string>();
    flowers.forEach((f) => f.colors.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [flowers]);

  return (
    <section className="space-y-5" id="flower-catalog-main-flow">
      {/* Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2D2D2D] tracking-tight">
            3. Choose Your Flowers
          </h2>
          <p className="text-xs sm:text-sm text-[#2D2D2D]/70 mt-0.5">
            Pick your favorite focal blooms, secondary accents, and textural greenery.
          </p>
        </div>

        <div className="text-xs text-[#2D2D2D]/60 bg-[#FAF8F3] px-3 py-1.5 rounded-full border border-[#E8E4D9] w-fit">
          Showing <strong className="text-[#2D2D2D]">{filteredFlowers.length}</strong> of {flowers.length} species
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E8E4D9] space-y-3 shadow-xs">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2D2D]/40" />
          <input
            type="text"
            id="flower-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by flower name (e.g. Rose, Sunflower, Peony, Lavender) or meaning..."
            className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#E8E4D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4F1E]/20 focus:border-[#2D4F1E] text-[#2D2D2D] placeholder-[#2D2D2D]/40 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D2D2D]/40 hover:text-[#2D2D2D] p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter by Role & Occasion Quick Toggle */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#E8E4D9]/70">
          <div className="flex items-center gap-1 text-xs text-[#2D2D2D]/70 mr-1.5">
            <Filter className="w-3 h-3 text-[#2D4F1E]" />
            <span className="font-semibold">Role:</span>
          </div>

          {[
            { id: "all", label: "All Roles" },
            { id: "focal", label: "Focal (Chính)" },
            { id: "secondary", label: "Secondary (Phụ)" },
            { id: "filler", label: "Filler (Điểm xuyết)" },
            { id: "foliage", label: "Foliage (Lá đệm)" },
          ].map((rf) => (
            <button
              key={rf.id}
              type="button"
              onClick={() => setRoleFilter(rf.id)}
              className={`text-xs px-3 py-1 rounded-lg transition-all cursor-pointer ${
                roleFilter === rf.id
                  ? "bg-[#2D4F1E] text-white font-semibold shadow-xs"
                  : "bg-[#F3EFE6] text-[#2D2D2D]/75 hover:bg-[#EAE5D9]"
              }`}
            >
              {rf.label}
            </button>
          ))}

          {/* Occasion fit toggle */}
          <button
            type="button"
            onClick={() => setOnlyOccasionFit(!onlyOccasionFit)}
            className={`text-xs px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ml-auto ${
              onlyOccasionFit
                ? "bg-[#2D4F1E] text-white font-bold shadow-xs"
                : "bg-[#FAF8F3] text-[#2D4F1E] border border-[#2D4F1E]/30 hover:bg-[#F4F9F1]"
            }`}
          >
            <Star className="w-3 h-3" />
            <span>Top Fit for {occasionGuide?.name || "Occasion"}</span>
          </button>
        </div>

        {/* Filter by Color */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#E8E4D9]/70">
          <span className="text-xs text-[#2D2D2D]/70 mr-1.5 font-semibold">Color:</span>
          <button
            type="button"
            onClick={() => setColorFilter("all")}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              colorFilter === "all"
                ? "bg-[#2D2D2D] text-[#FDFCF9] font-semibold"
                : "bg-[#F3EFE6] text-[#2D2D2D]/75 hover:bg-[#EAE5D9]"
            }`}
          >
            All
          </button>
          {allAvailableColors.map((c) => {
            const hex = COLOR_HEX_MAP[c];
            const isSelected = colorFilter === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColorFilter(c)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-[#2D4F1E] border-[#2D4F1E] font-bold bg-[#F3EFE6]"
                    : "border-[#E8E4D9] bg-[#FAF8F3] hover:border-[#2D4F1E]/40"
                }`}
                title={hex?.label || c}
              >
                <span
                  className="w-3 h-3 rounded-full border border-black/10 inline-block shadow-2xs"
                  style={{ backgroundColor: hex?.bg || "#ccc" }}
                />
                <span className="capitalize text-[11px] text-[#2D2D2D]">{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Flower Cards Grid with sufficient bottom padding for sticky footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-28 sm:pb-32">
        {filteredFlowers.map((flower) => {
          const selectedColor = selectedColors[flower.id] || flower.colors[0];
          const bouquetItem = currentBouquet.find((b) => b.flowerId === flower.id);
          const currentQty = bouquetItem?.quantity || 0;
          const isDirectStyleMatch =
            selectedStyleId && flower.styles.includes(selectedStyleId);
          const occasionSuitability =
            flower.occasions[selectedOccasionId] !== undefined
              ? flower.occasions[selectedOccasionId]
              : 0.7;
          const isTopOccasionFit = occasionSuitability >= 0.9;
          const primaryRole = flower.roles[0];
          const roleDetail = ROLE_DETAILS[primaryRole];

          const isFocused = focusedFlowerId === flower.id;

          return (
            <div
              key={flower.id}
              id={`flower-card-${flower.id}`}
              onClick={() => setFocusedFlowerId(flower.id)}
              className={`relative bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                isFocused
                  ? "ring-2 ring-[#2D4F1E] border-[#2D4F1E] shadow-md bg-[#FAF8F3]/60"
                  : currentQty > 0
                  ? "border-[#2D4F1E]/60 bg-[#F7F5EE]/40 hover:shadow-md"
                  : "border-[#E8E4D9] hover:border-[#2D4F1E]/40 hover:shadow-sm"
              }`}
            >
              {/* Card Body */}
              <div className="space-y-3">
                {/* Botanical Photography Image Hero */}
                <div className="relative w-full h-36 rounded-xl overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.04)] border border-[#DDD6C5]/80 group">
                  <FlowerBotanicalImage
                    flowerId={flower.id}
                    color={selectedColor}
                    size="hero"
                    rounded="xl"
                    catalogBackdrop={true}
                    className="w-full h-full"
                    alt={flower.name}
                  />

                  {/* Role Badge Overlay */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs border ${
                        roleDetail?.badgeClass || "bg-white/90 text-[#2D2D2D] border-[#E8E4D9]"
                      }`}
                    >
                      {roleDetail?.label || primaryRole}
                    </span>
                    {isTopOccasionFit && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#2D4F1E] text-white shadow-xs">
                        ★ Best Fit
                      </span>
                    )}
                  </div>

                  {/* Quantity In Bouquet Tag */}
                  {currentQty > 0 && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#2D4F1E] text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>{currentQty} in bouquet</span>
                    </div>
                  )}

                  {/* Visual Weight Badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium shadow-xs">
                    Weight {flower.visual.visualWeight}/10
                  </div>
                </div>

                {/* Name & Meaning */}
                <div>
                  <div className="flex items-baseline justify-between gap-1">
                    <h4 className="font-serif font-bold text-base text-[#2D2D2D]">
                      {flower.name}
                    </h4>
                    <span className="text-xs text-[#2D2D2D]/60 italic">
                      {flower.displayName}
                    </span>
                  </div>

                  <p className="text-xs text-[#2D2D2D]/75 mt-0.5 capitalize line-clamp-1">
                    {flower.meaning.join(" • ")}
                  </p>
                </div>

                {/* Color Selector */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#E8E4D9]">
                  <span className="text-[11px] text-[#2D2D2D]/60 font-medium">Colors:</span>
                  {flower.colors.map((c) => {
                    const isChosen = selectedColor === c;
                    const hex = COLOR_HEX_MAP[c];
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={(e) => handleColorSelect(flower.id, c, e)}
                        className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                          isChosen
                            ? "ring-2 ring-[#2D4F1E] scale-125 shadow-xs"
                            : "hover:scale-110 opacity-75 hover:opacity-100"
                        }`}
                        style={{
                          backgroundColor: hex?.bg || "#ccc",
                          borderColor: hex?.border || "#999",
                        }}
                        title={hex?.label || c}
                      />
                    );
                  })}
                </div>

                {/* Style Compatibility hint */}
                {isDirectStyleMatch && (
                  <div className="flex items-center gap-1 text-[11px] text-[#2D4F1E] font-medium bg-[#F4F9F1] px-2 py-1 rounded-lg border border-[#D5EAC9]">
                    <Sparkles className="w-3 h-3 text-[#2D4F1E] shrink-0" />
                    <span>Direct fit for chosen bouquet style</span>
                  </div>
                )}
              </div>

              {/* Action Toolbar: Stepper [ - ] [ qty ] [ + ] and Add Button */}
              <div
                className="mt-4 pt-3 border-t border-[#E8E4D9] flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Stepper [ - ] [ qty ] [ + ] */}
                <div
                  className={`flex items-center rounded-xl overflow-hidden border transition-all shadow-2xs ${
                    currentQty > 0
                      ? "border-[#2D4F1E] bg-[#FAF8F3]"
                      : "border-[#E8E4D9] bg-[#FAF8F3]/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(flower.id, -1);
                    }}
                    disabled={currentQty === 0}
                    className={`px-2.5 py-1.5 transition-colors ${
                      currentQty > 0
                        ? "hover:bg-[#F3EFE6] text-[#2D2D2D] cursor-pointer"
                        : "text-[#2D2D2D]/20 cursor-not-allowed"
                    }`}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span
                    className={`px-2.5 text-xs font-bold min-w-[28px] text-center ${
                      currentQty > 0 ? "text-[#2D4F1E]" : "text-[#2D2D2D]/40"
                    }`}
                  >
                    {currentQty}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentQty === 0) {
                        onAddFlower(flower.id, selectedColor);
                      } else {
                        onUpdateQuantity(flower.id, 1);
                      }
                    }}
                    className="px-2.5 py-1.5 hover:bg-[#F3EFE6] text-[#2D2D2D] transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  id={`add-flower-btn-${flower.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddFlower(flower.id, selectedColor);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-white text-xs font-serif font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ml-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{currentQty > 0 ? "Add +1" : "Add to Bouquet"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 3 Sticky Footer & Primary Navigation Actions */}
      <footer
        id="step-3-flowers-footer"
        aria-label="Step 3 actions"
        className="sticky bottom-0 z-30 -mx-3 sm:-mx-4 lg:mx-0 p-3.5 sm:p-4 bg-[#FAF8F3]/95 backdrop-blur-md border-t border-[#E8E4D9] rounded-b-2xl sm:rounded-b-3xl shadow-[0_-8px_24px_rgba(45,79,30,0.08)] transition-all pb-[max(0.875rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Left / Secondary: Back button and Dynamic Selection Summary */}
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 w-full sm:w-auto">
            {onBackToStyle && (
              <button
                type="button"
                id="back-to-style-btn"
                onClick={onBackToStyle}
                className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl border border-[#E8E4D9] bg-white hover:bg-[#F3EFE6] text-[#2D2D2D] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-98 shrink-0 shadow-2xs"
                aria-label="Back to Style selection"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <div className="flex flex-col items-start text-left leading-tight">
                  <span className="text-xs sm:text-sm">Back to Style</span>
                  <span className="text-[10px] text-[#2D2D2D]/60 font-normal">Quay lại Phong cách</span>
                </div>
              </button>
            )}

            {/* Dynamic Selection Summary */}
            <div className="flex flex-col text-left">
              <span className="text-xs sm:text-sm font-medium text-[#2D2D2D]/85">
                <strong className="text-[#2D4F1E] font-bold">
                  {totalStems} {totalStems === 1 ? "stem" : "stems"}
                </strong>{" "}
                ·{" "}
                <span className="text-[#2D2D2D] font-semibold">
                  {totalVarieties} {totalVarieties === 1 ? "variety" : "varieties"}
                </span>
              </span>
              {isContinueDisabled ? (
                <span className="text-[11px] text-[#8F3326] font-medium mt-0.5">
                  Add at least one flower to continue.
                </span>
              ) : (
                <span className="text-[11px] text-[#2D4F1E]/80 font-medium mt-0.5 hidden sm:inline">
                  Ready to arrange blooms
                </span>
              )}
            </div>
          </div>

          {/* Right / Primary CTA: Continue to Arrange */}
          {onProceedToArrange && (
            <button
              type="button"
              id="proceed-to-arrange-btn"
              onClick={onProceedToArrange}
              disabled={isContinueDisabled}
              aria-label={
                isContinueDisabled
                  ? "Add at least one flower to continue to arrange"
                  : `Continue to Arrange bouquet with ${totalStems} stems`
              }
              className={`w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl font-serif font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                isContinueDisabled
                  ? "bg-[#E8E4D9] text-[#2D2D2D]/40 cursor-not-allowed shadow-none"
                  : "bg-[#2D4F1E] hover:bg-[#233F17] text-white hover:shadow-lg group cursor-pointer"
              }`}
            >
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left leading-tight">
                <span className="text-xs sm:text-sm">Continue to Arrange</span>
                <span className="text-[10px] text-white/80 font-normal">Tiếp tục: Xếp dáng & Layer</span>
              </div>
              <ArrowRight
                className={`w-4 h-4 transition-transform shrink-0 ${
                  !isContinueDisabled ? "group-hover:translate-x-1" : ""
                }`}
              />
            </button>
          )}
        </div>
      </footer>
    </section>
  );
};
