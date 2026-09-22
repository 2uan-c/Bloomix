import React from "react";
import type { BouquetItem, Flower } from "../engine/types.ts";
import { FlowerBotanicalImage } from "./FlowerBotanicalImage.tsx";
import { COLOR_HEX_MAP, ROLE_DETAILS } from "../utils/flowerAssets.ts";
import { Plus, Minus, Trash2, Layers, Sparkles, AlertCircle } from "lucide-react";

interface BouquetCanvasProps {
  bouquet: BouquetItem[];
  flowersMap: Map<string, Flower>;
  onUpdateQuantity: (flowerId: string, delta: number) => void;
  onRemoveFlower: (flowerId: string) => void;
  onChangeColor: (flowerId: string, newColor: string) => void;
  onClearBouquet: () => void;
}

export const BouquetCanvas: React.FC<BouquetCanvasProps> = ({
  bouquet,
  flowersMap,
  onUpdateQuantity,
  onRemoveFlower,
  onChangeColor,
  onClearBouquet,
}) => {
  const totalStems = bouquet.reduce((sum, item) => sum + item.quantity, 0);

  // Group items by role for structure inspection
  const focalItems = bouquet.filter((item) => {
    const f = flowersMap.get(item.flowerId);
    return f?.roles.includes("focal");
  });

  const secondaryItems = bouquet.filter((item) => {
    const f = flowersMap.get(item.flowerId);
    return f?.roles.includes("secondary") && !f?.roles.includes("focal");
  });

  const fillerAndFoliageItems = bouquet.filter((item) => {
    const f = flowersMap.get(item.flowerId);
    return f?.roles.includes("filler") || f?.roles.includes("foliage");
  });

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4D9] p-4 sm:p-5 shadow-xs space-y-4" id="bouquet-workbench">
      <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F4EFE6] text-[#2D4F1E] flex items-center justify-center font-bold text-sm border border-[#E8E4D9]">
            💐
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
              Your Bouquet
            </h3>
            <p className="text-xs text-[#2D2D2D]/60">
              {totalStems} stems ({bouquet.length} distinct varieties)
            </p>
          </div>
        </div>

        {bouquet.length > 0 && (
          <button
            type="button"
            onClick={onClearBouquet}
            className="text-xs text-[#2D2D2D]/50 hover:text-[#8B3A3A] transition-colors cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {bouquet.length === 0 ? (
        <div className="py-10 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF8F3] border border-dashed border-[#D2CCBF] flex items-center justify-center text-2xl">
            🌿
          </div>
          <div className="max-w-xs mx-auto">
            <p className="font-serif text-sm font-semibold text-[#2D2D2D]">
              Your bouquet is empty
            </p>
            <p className="text-xs text-[#2D2D2D]/60 mt-1">
              Select flowers from the catalog below or load one of our curated floral collections above to start scoring.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Visual Composition preview card */}
          <div className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F3] to-[#F2EDE2] rounded-xl p-4 border border-[#E8E4D9]">
            <div className="text-[11px] font-semibold text-[#2D2D2D]/50 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Bouquet Arrangement Composition</span>
              <span className="text-[#2D4F1E] font-semibold">Layered View</span>
            </div>

            {/* Visual Arrangement Staging */}
            <div className="relative min-h-[140px] flex items-center justify-center">
              {/* Background Foliage/Filler Layer */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-70 scale-90 -translate-y-2">
                {fillerAndFoliageItems.map((item) => {
                  const flower = flowersMap.get(item.flowerId);
                  if (!flower) return null;
                  return (
                    <div key={`bg-${item.flowerId}`} className="flex flex-col items-center">
                      <FlowerBotanicalImage flowerId={flower.id} color={item.selectedColor || flower.colors[0]} size="md" rounded="full" />
                    </div>
                  );
                })}
              </div>

              {/* Foreground Focal & Secondary Layer */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 py-2">
                {[...focalItems, ...secondaryItems].map((item) => {
                  const flower = flowersMap.get(item.flowerId);
                  if (!flower) return null;
                  const isFocal = flower.roles.includes("focal");
                  return (
                    <div
                      key={`fg-${item.flowerId}`}
                      className={`relative flex flex-col items-center transition-transform duration-300 hover:scale-110 ${
                        isFocal ? "scale-110" : ""
                      }`}
                    >
                      <FlowerBotanicalImage
                        flowerId={flower.id}
                        color={item.selectedColor || flower.colors[0]}
                        size={isFocal ? "lg" : "md"}
                        rounded="full"
                      />
                      <span className="mt-1 text-[11px] font-semibold bg-white/95 px-2 py-0.5 rounded-full border border-[#E8E4D9] shadow-xs text-[#2D2D2D]">
                        {flower.name} ×{item.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Composition stats */}
            <div className="mt-3 pt-2 border-t border-[#E8E4D9] flex items-center justify-between text-xs text-[#2D2D2D]/70">
              <div className="flex items-center gap-3">
                <span>
                  Focal: <strong className="text-[#2D2D2D]">{focalItems.reduce((acc, i) => acc + i.quantity, 0)}</strong>
                </span>
                <span>
                  Secondary: <strong className="text-[#2D2D2D]">{secondaryItems.reduce((acc, i) => acc + i.quantity, 0)}</strong>
                </span>
                <span>
                  Filler/Greens: <strong className="text-[#2D2D2D]">{fillerAndFoliageItems.reduce((acc, i) => acc + i.quantity, 0)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* List of Selected Stems with Controls */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#2D2D2D]/70">
              Selected Stems List:
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {bouquet.map((item) => {
                const flower = flowersMap.get(item.flowerId);
                if (!flower) return null;

                const chosenColor = item.selectedColor || flower.colors[0];
                const primaryRole = flower.roles[0];
                const roleDetail = ROLE_DETAILS[primaryRole];

                return (
                  <div
                    key={item.flowerId}
                    id={`bouquet-item-${item.flowerId}`}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[#E8E4D9] bg-[#FAF8F3] hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FlowerBotanicalImage
                        flowerId={flower.id}
                        color={chosenColor}
                        size="sm"
                        rounded="lg"
                      />
                      <div>
                        <div className="font-serif font-semibold text-xs sm:text-sm text-[#2D2D2D]">
                          {flower.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[9px] uppercase font-semibold px-1.5 py-0.2 rounded border ${
                              roleDetail?.badgeClass || "bg-[#F3EFE6] text-[#2D2D2D]"
                            }`}
                          >
                            {roleDetail?.label || primaryRole}
                          </span>

                          {/* Color Switcher */}
                          {flower.colors.length > 1 && (
                            <div className="flex items-center gap-1 ml-1">
                              {flower.colors.map((c) => {
                                const hex = COLOR_HEX_MAP[c];
                                const isCurrent = c === chosenColor;
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => onChangeColor(flower.id, c)}
                                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                                      isCurrent
                                        ? "ring-1 ring-[#2D4F1E] scale-110"
                                        : "opacity-60 hover:opacity-100"
                                    }`}
                                    style={{ backgroundColor: hex?.bg || "#ccc" }}
                                    title={c}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-[#E8E4D9] rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(flower.id, -1)}
                          className="p-1.5 hover:bg-[#F4EFE6] text-[#2D2D2D]/70 rounded-l-lg transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-[#2D2D2D] min-w-[28px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(flower.id, 1)}
                          className="p-1.5 hover:bg-[#F4EFE6] text-[#2D2D2D]/70 rounded-r-lg transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveFlower(flower.id)}
                        className="p-1.5 text-[#2D2D2D]/40 hover:text-[#8B3A3A] hover:bg-[#FAF8F3] rounded-lg transition-colors cursor-pointer"
                        title="Remove flower"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
