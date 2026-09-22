import React, { useMemo } from "react";
import type { FlowerInstance } from "../engine/types.ts";
import { COLOR_HEX_MAP, ROLE_DETAILS } from "../utils/flowerAssets.ts";
import { resolveWrappingOption, resolveRibbonOption } from "../utils/botanicalImages.ts";
import {
  Layers,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Sparkles,
  Eye,
  Package,
  Bookmark,
} from "lucide-react";

interface LayersPanelProps {
  instances: FlowerInstance[];
  selectedInstanceId: string | null;
  wrappingId?: string;
  ribbonId?: string;
  onSelectInstance: (instanceId: string) => void;
  onUpdateInstances: (newInstances: FlowerInstance[]) => void;
  className?: string;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  instances,
  selectedInstanceId,
  wrappingId,
  ribbonId,
  onSelectInstance,
  onUpdateInstances,
  className = "",
}) => {
  const wrapping = useMemo(() => (wrappingId ? resolveWrappingOption(wrappingId) : null), [wrappingId]);
  const ribbon = useMemo(() => (ribbonId ? resolveRibbonOption(ribbonId) : null), [ribbonId]);

  // Generate human-readable numbered names (e.g. Rose #1, Rose #2, Baby's Breath #1)
  const instancesWithDisplayNames = useMemo(() => {
    const countsByFlower = new Map<string, number>();
    // First pass: assign sequential numbers based on stable initial order
    const named = instances.map((inst) => {
      const current = countsByFlower.get(inst.flowerId) || 0;
      const count = current + 1;
      countsByFlower.set(inst.flowerId, count);
      return {
        ...inst,
        displayName: `${inst.flowerName} #${count}`,
      };
    });

    // Sort by visual z-index depth DESCENDING (top of list = topmost visible layer)
    return [...named].sort((a, b) => b.depth - a.depth);
  }, [instances]);

  // Calculate actual rendered design elements in the composition
  const totalLayersCount = useMemo(() => {
    if (instances.length === 0) return 0;
    let count = instances.length; // Flower stems
    if (wrapping) count += 2; // Back wrapping paper + Front collar
    if (ribbon) count += 1; // Binding ribbon & bow
    count += 1; // Stems network
    return count;
  }, [instances.length, wrapping, ribbon]);

  // Reorder depth helpers: only modifies depth (z-index) without changing any other properties
  const handleMoveLayer = (
    instanceId: string,
    action: "top" | "up" | "down" | "bottom"
  ) => {
    const sorted = [...instancesWithDisplayNames];
    const currentIndex = sorted.findIndex((i) => i.instanceId === instanceId);
    if (currentIndex === -1) return;

    const item = sorted[currentIndex];
    let newSorted = [...sorted];

    if (action === "top" && currentIndex > 0) {
      newSorted.splice(currentIndex, 1);
      newSorted.unshift(item);
    } else if (action === "up" && currentIndex > 0) {
      const prev = newSorted[currentIndex - 1];
      newSorted[currentIndex - 1] = item;
      newSorted[currentIndex] = prev;
    } else if (action === "down" && currentIndex < newSorted.length - 1) {
      const next = newSorted[currentIndex + 1];
      newSorted[currentIndex + 1] = item;
      newSorted[currentIndex] = next;
    } else if (action === "bottom" && currentIndex < newSorted.length - 1) {
      newSorted.splice(currentIndex, 1);
      newSorted.push(item);
    } else {
      return;
    }

    // Reassign normalized depths from bottom (index N-1 has depth 10) to top (index 0 has depth 10 + N*3)
    const total = newSorted.length;
    const depthMap = new Map<string, number>();
    newSorted.forEach((inst, idx) => {
      // index 0 is top (highest depth)
      const calculatedDepth = 15 + (total - 1 - idx) * 4;
      depthMap.set(inst.instanceId, calculatedDepth);
    });

    const updatedInstances = instances.map((inst) => {
      const newDepth = depthMap.get(inst.instanceId);
      return newDepth !== undefined ? { ...inst, depth: newDepth } : inst;
    });

    onUpdateInstances(updatedInstances);
    onSelectInstance(instanceId);
  };

  if (instances.length === 0) {
    return (
      <div className={`bg-white p-4 rounded-2xl border border-[#E8E4D9] shadow-xs text-center space-y-2 ${className}`}>
        <div className="w-9 h-9 mx-auto rounded-full bg-[#FAF8F3] border border-[#E8E4D9] flex items-center justify-center text-[#2D4F1E]">
          <Layers className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-serif font-bold text-[#2D2D2D]">Visual Stacking Layers</h4>
        <p className="text-[11px] text-[#2D2D2D]/60">
          Add flower stems to manage their foreground and background stacking hierarchy.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-[#E8E4D9] shadow-xs overflow-hidden flex flex-col ${className}`}
      id="florist-layers-panel"
    >
      {/* Header */}
      <div className="p-3.5 bg-[#FAF8F3] border-b border-[#E8E4D9] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2D4F1E]" />
          <h4 className="font-serif font-bold text-xs sm:text-sm text-[#2D2D2D]">
            Bouquet Layers ({totalLayersCount})
          </h4>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#2D4F1E] bg-[#2D4F1E]/10 px-2 py-0.5 rounded-full border border-[#2D4F1E]/20">
          Top to Bottom Order
        </span>
      </div>

      {/* Layer List Scrollable */}
      <div className="p-2 space-y-1.5 max-h-64 sm:max-h-72 overflow-y-auto divide-y-0 select-none">
        {/* Structural Top: Ribbon Binding */}
        {ribbon && (
          <div className="p-2 rounded-xl flex items-center justify-between gap-2 border border-[#E8E4D9] bg-[#FAF8F3]/60 text-xs opacity-90">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[10px] font-mono text-[#2D2D2D]/40 w-4 text-center font-bold">
                ▲
              </span>
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                style={{ backgroundColor: ribbon.color }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-serif font-bold text-[#2D2D2D] truncate block">
                  {ribbon.name}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#2D2D2D]/60 block truncate">
                  Ribbon & Bow Binding • Topmost Layer (z:32)
                </span>
              </div>
            </div>
            <span className="text-[9px] text-[#2D4F1E] font-medium bg-[#2D4F1E]/10 px-1.5 py-0.5 rounded">
              Ribbon
            </span>
          </div>
        )}

        {/* Structural Upper: Front Paper Collar */}
        {wrapping && (
          <div className="p-2 rounded-xl flex items-center justify-between gap-2 border border-[#E8E4D9] bg-[#FAF8F3]/60 text-xs opacity-90">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[10px] font-mono text-[#2D2D2D]/40 w-4 text-center font-bold">
                ▲
              </span>
              <span
                className="w-3.5 h-3.5 rounded-md border border-black/15 shrink-0 shadow-2xs"
                style={{ backgroundColor: wrapping.paperColor }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-serif font-bold text-[#2D2D2D] truncate block">
                  {wrapping.name} (Front Collar)
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#2D2D2D]/60 block truncate">
                  Front Paper Flaps • Waist Collar (z:28)
                </span>
              </div>
            </div>
            <span className="text-[9px] text-[#2D4F1E] font-medium bg-[#2D4F1E]/10 px-1.5 py-0.5 rounded">
              Paper
            </span>
          </div>
        )}

        {/* Dynamic Flower Stems Hierarchy */}
        {instancesWithDisplayNames.map((inst, index) => {
          const isSelected = selectedInstanceId === inst.instanceId;
          const roleDetail = ROLE_DETAILS[inst.role];
          const colorHex = COLOR_HEX_MAP[inst.color]?.bg || "#bbb";

          return (
            <div
              key={inst.instanceId}
              id={`layer-row-${inst.instanceId}`}
              onClick={() => onSelectInstance(inst.instanceId)}
              className={`p-2 rounded-xl flex items-center justify-between gap-2 border transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#F4F9F1] border-[#2D4F1E] shadow-xs ring-1 ring-[#2D4F1E]/30"
                  : "bg-white border-[#E8E4D9] hover:border-[#2D4F1E]/40 hover:bg-[#FAF8F3]"
              }`}
            >
              {/* Left Identity: Rank Index + Color Dot + Display Name + Role */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[10px] font-mono text-[#2D2D2D]/40 w-4 text-center font-bold">
                  {index + 1}
                </span>

                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                  style={{ backgroundColor: colorHex }}
                  title={inst.color}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-serif font-bold truncate ${
                        isSelected ? "text-[#2D4F1E]" : "text-[#2D2D2D]"
                      }`}
                    >
                      {inst.displayName}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-[#2D2D2D]/60 block truncate">
                    {roleDetail?.label || inst.role} • z:{inst.depth}
                  </span>
                </div>
              </div>

              {/* Right: Layer Hierarchy Reorder Controls */}
              <div
                className="flex items-center gap-0.5 bg-[#FAF8F3] p-0.5 rounded-lg border border-[#E8E4D9] shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Bring to Front (Topmost) */}
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMoveLayer(inst.instanceId, "top")}
                  className={`p-1 rounded transition-colors ${
                    index === 0
                      ? "text-[#2D2D2D]/20 cursor-not-allowed"
                      : "text-[#2D2D2D]/70 hover:bg-white hover:text-[#2D4F1E] cursor-pointer"
                  }`}
                  title="Bring to Front (Topmost Layer)"
                >
                  <ChevronsUp className="w-3 h-3" />
                </button>

                {/* Move Up (+1 Layer) */}
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMoveLayer(inst.instanceId, "up")}
                  className={`p-1 rounded transition-colors ${
                    index === 0
                      ? "text-[#2D2D2D]/20 cursor-not-allowed"
                      : "text-[#2D2D2D]/70 hover:bg-white hover:text-[#2D4F1E] cursor-pointer"
                  }`}
                  title="Bring Forward (+1)"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>

                {/* Move Down (-1 Layer) */}
                <button
                  type="button"
                  disabled={index === instancesWithDisplayNames.length - 1}
                  onClick={() => handleMoveLayer(inst.instanceId, "down")}
                  className={`p-1 rounded transition-colors ${
                    index === instancesWithDisplayNames.length - 1
                      ? "text-[#2D2D2D]/20 cursor-not-allowed"
                      : "text-[#2D2D2D]/70 hover:bg-white hover:text-[#2D4F1E] cursor-pointer"
                  }`}
                  title="Send Backward (-1)"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Send to Back (Bottommost) */}
                <button
                  type="button"
                  disabled={index === instancesWithDisplayNames.length - 1}
                  onClick={() => handleMoveLayer(inst.instanceId, "bottom")}
                  className={`p-1 rounded transition-colors ${
                    index === instancesWithDisplayNames.length - 1
                      ? "text-[#2D2D2D]/20 cursor-not-allowed"
                      : "text-[#2D2D2D]/70 hover:bg-white hover:text-[#2D4F1E] cursor-pointer"
                  }`}
                  title="Send to Back (Bottommost Layer)"
                >
                  <ChevronsDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Structural Lower: Organic Stem Network */}
        <div className="p-2 rounded-xl flex items-center justify-between gap-2 border border-[#E8E4D9] bg-[#FAF8F3]/60 text-xs opacity-90">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[10px] font-mono text-[#2D2D2D]/40 w-4 text-center font-bold">
              ▼
            </span>
            <span className="w-3.5 h-3.5 rounded-full bg-[#5F7A4A] border border-black/15 shrink-0 shadow-2xs" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-serif font-bold text-[#2D2D2D] truncate block">
                Organic Stem Network
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#2D2D2D]/60 block truncate">
                Botanical Greenery & Stem Binding (z:5)
              </span>
            </div>
          </div>
          <span className="text-[9px] text-[#5F7A4A] font-medium bg-[#5F7A4A]/10 px-1.5 py-0.5 rounded">
            Stems
          </span>
        </div>

        {/* Structural Bottom: Back Wrapping Paper */}
        {wrapping && (
          <div className="p-2 rounded-xl flex items-center justify-between gap-2 border border-[#E8E4D9] bg-[#FAF8F3]/60 text-xs opacity-90">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[10px] font-mono text-[#2D2D2D]/40 w-4 text-center font-bold">
                ▼
              </span>
              <span
                className="w-3.5 h-3.5 rounded-md border border-black/15 shrink-0 shadow-2xs"
                style={{ backgroundColor: wrapping.paperColor }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-serif font-bold text-[#2D2D2D] truncate block">
                  {wrapping.name} (Backdrop Fan)
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#2D2D2D]/60 block truncate">
                  Back Paper Shell • Foundation Layer (z:2)
                </span>
              </div>
            </div>
            <span className="text-[9px] text-[#2D4F1E] font-medium bg-[#2D4F1E]/10 px-1.5 py-0.5 rounded">
              Paper
            </span>
          </div>
        )}
      </div>

      {/* Footer Helper */}
      <div className="p-2 bg-[#FAF8F3] border-t border-[#E8E4D9] text-[10px] text-[#2D2D2D]/60 flex items-center justify-between">
        <span>Click flower stem to focus</span>
        <span>Use arrows to reorder z-depth</span>
      </div>
    </div>
  );
};

