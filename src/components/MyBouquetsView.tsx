import React, { useState } from "react";
import type { Flower } from "../engine/types.ts";
import {
  getSavedBouquets,
  deleteSavedBouquet,
  type SavedBouquetRecord,
} from "../utils/savedBouquetsStorage.ts";
import { FlowerBotanicalImage } from "./FlowerBotanicalImage.tsx";
import { getBouquetShapeById } from "../data/bouquetShapesConfig.ts";
import { resolveWrappingOption } from "../utils/botanicalImages.ts";
import {
  BookmarkCheck,
  Calendar,
  Trash2,
  ArrowRight,
  Plus,
  Package,
  AlertCircle,
} from "lucide-react";

interface MyBouquetsViewProps {
  flowersMap: Map<string, Flower>;
  onLoadSavedBouquet: (saved: SavedBouquetRecord) => void;
  onGoToStudio: () => void;
}

export const MyBouquetsView: React.FC<MyBouquetsViewProps> = ({
  flowersMap,
  onLoadSavedBouquet,
  onGoToStudio,
}) => {
  const [savedList, setSavedList] = useState<SavedBouquetRecord[]>(() =>
    getSavedBouquets()
  );
  const [bouquetToDelete, setBouquetToDelete] = useState<SavedBouquetRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenDeleteConfirm = (item: SavedBouquetRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMessage(null);
    setBouquetToDelete(item);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bouquetToDelete) return;

    const result = deleteSavedBouquet(bouquetToDelete.id);
    if (result.success) {
      setSavedList(result.data);
      setBouquetToDelete(null);
      setErrorMessage(null);
    } else {
      setErrorMessage(result.error || "Unable to delete this bouquet. Please try again.");
      setBouquetToDelete(null);
    }
  };

  const handleCancelDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBouquetToDelete(null);
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6">
      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FDECEB] border border-[#F5C2BE] text-[#8F3326] flex items-center justify-between text-xs sm:text-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold underline hover:text-[#6E261C] cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#E8E4D9] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#2D4F1E] text-white flex items-center justify-center">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2D2D2D]">
              My Saved Bouquets
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#2D2D2D]/70 mt-1">
            Personal collection of hand-crafted arrangements, custom layers, and florist scores.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToStudio}
          className="px-4 py-2 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-white text-xs font-serif font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Bouquet Design</span>
        </button>
      </div>

      {/* List / Grid */}
      {savedList.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8E4D9] text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F3] border border-[#E8E4D9] flex items-center justify-center text-[#2D4F1E]">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">
            Your bouquets will appear here.
          </h3>
          <p className="text-xs text-[#2D2D2D]/60 max-w-md mx-auto">
            Create your first bouquet and save it to come back later.
          </p>
          <button
            type="button"
            onClick={onGoToStudio}
            className="mt-2 px-5 py-2.5 rounded-xl bg-[#2D4F1E] text-white text-xs font-serif font-bold cursor-pointer hover:bg-[#233F17] transition-colors inline-block shadow-xs"
          >
            Create Bouquet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedList.map((item) => {
            const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const totalStems = item.items.reduce((s, i) => s + i.quantity, 0);

            return (
              <div
                key={item.id}
                onClick={() => onLoadSavedBouquet(item)}
                className="bg-white rounded-2xl border border-[#E8E4D9] hover:border-[#2D4F1E] p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="space-y-3">
                  {/* Card Top: Title & Score */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#2D2D2D] group-hover:text-[#2D4F1E] transition-colors">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[#2D2D2D]/60 mt-1">
                        <span className="capitalize">{item.occasionId}</span>
                        <span>•</span>
                        <span className="capitalize">{item.styleId}</span>
                        {item.shapeId && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-[#2D4F1E] bg-[#FAF8F3] px-1.5 py-0.2 rounded border border-[#E8E4D9]">
                              {getBouquetShapeById(item.shapeId).name}
                            </span>
                          </>
                        )}
                        {item.wrappingId && (
                          <>
                            <span>•</span>
                            <span className="text-[#2D2D2D]/70 bg-[#FAF8F3] px-1.5 py-0.2 rounded border border-[#E8E4D9]">
                              {resolveWrappingOption(item.wrappingId).name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {item.score !== undefined && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#EAF3E6] text-[#2D4F1E] border border-[#C8DEC0] shrink-0">
                        {item.score}/100
                      </span>
                    )}
                  </div>

                  {/* Botanical Flower Mini Thumbnails */}
                  <div className="flex items-center gap-1.5 overflow-hidden py-1">
                    {item.items.slice(0, 4).map((bi) => {
                      const flower = flowersMap.get(bi.flowerId);
                      return (
                        <div
                          key={bi.flowerId}
                          className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#E8E4D9] bg-[#FAF8F3] shrink-0"
                          title={`${flower?.name || bi.flowerId} ×${bi.quantity}`}
                        >
                          <FlowerBotanicalImage
                            flowerId={bi.flowerId}
                            color={bi.selectedColor}
                            size="sm"
                            className="w-full h-full"
                          />
                          <span className="absolute bottom-0 right-0 bg-[#2D2D2D]/80 text-white text-[9px] font-bold px-1 rounded-tl">
                            ×{bi.quantity}
                          </span>
                        </div>
                      );
                    })}
                    {item.items.length > 4 && (
                      <div className="w-12 h-12 rounded-xl border border-[#E8E4D9] bg-[#FAF8F3] flex items-center justify-center text-xs font-bold text-[#2D2D2D]/60 shrink-0">
                        +{item.items.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Stem Summary */}
                  <p className="text-xs text-[#2D2D2D]/70 line-clamp-1">
                    {item.items
                      .map((i) => `${flowersMap.get(i.flowerId)?.name || i.flowerId} ×${i.quantity}`)
                      .join(", ")}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-[#E8E4D9] flex items-center justify-between">
                  <div className="text-[11px] text-[#2D2D2D]/50 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{dateStr}</span>
                    <span>•</span>
                    <span>{totalStems} stems</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Delete button: strictly deletes this bouquet */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenDeleteConfirm(item, e)}
                      className="px-2 py-1 text-xs text-[#8F3326] hover:text-[#6E261C] hover:bg-[#FBEAE8] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      title={`Delete "${item.name}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="font-medium">Delete</span>
                    </button>

                    {/* Open in Studio button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadSavedBouquet(item);
                      }}
                      className="px-2.5 py-1 text-xs font-serif font-bold text-[#2D4F1E] bg-[#FAF8F3] hover:bg-[#F0EBE0] border border-[#E8E4D9] rounded-lg flex items-center gap-1 group-hover:border-[#2D4F1E]/40 transition-colors cursor-pointer"
                    >
                      <span>Open in Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact Delete Confirmation Modal */}
      {bouquetToDelete && (
        <div
          onClick={() => handleCancelDelete()}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-[#E8E4D9] p-6 max-w-sm w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FBEAE8] border border-[#F5C2BE] text-[#8F3326] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
                  Delete this bouquet?
                </h3>
                <p className="text-xs text-[#2D2D2D]/60 mt-0.5">
                  This saved bouquet will be removed from My Bouquets.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E8E4D9] text-xs text-[#2D2D2D]">
              <span className="font-bold text-[#2D2D2D]">{bouquetToDelete.name}</span>
              <span className="block text-[11px] text-[#2D2D2D]/60 mt-0.5 capitalize">
                {bouquetToDelete.occasionId} • {bouquetToDelete.styleId} • {bouquetToDelete.items.reduce((s, i) => s + i.quantity, 0)} stems
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 rounded-xl bg-[#FAF8F3] hover:bg-[#F3EFE6] text-xs font-serif font-bold text-[#2D2D2D] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-[#8F3326] hover:bg-[#782B20] text-xs font-serif font-bold text-white transition-colors cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
