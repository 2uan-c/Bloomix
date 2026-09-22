import React from "react";
import type { FlowerInstance } from "../engine/types.ts";
import { getFlowerVisualBounds } from "./BouquetBloom.tsx";
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Minus,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";

interface FlowerContextualToolbarProps {
  selectedInstance: FlowerInstance;
  instances?: FlowerInstance[];
  stageSize?: { width: number; height: number };
  canvasScale?: number;
  offsetX?: number;
  offsetY?: number;
  onRotate: (instanceId: string, delta: number) => void;
  onSetRotation?: (instanceId: string, angle: number) => void;
  onFlip: (instanceId: string, axis: "x" | "y") => void;
  onScale: (instanceId: string, deltaOrAction: number | "reset") => void;
  onAdjustDepth: (
    instanceId: string,
    direction: "forward" | "backward" | "toFront" | "toBack"
  ) => void;
  onDelete: (instanceId: string) => void;
  onDeselect: () => void;
  className?: string;
}

export const FlowerContextualToolbar: React.FC<FlowerContextualToolbarProps> = ({
  selectedInstance,
  instances = [],
  stageSize = { width: 600, height: 500 },
  canvasScale = 1.0,
  offsetX = 0,
  offsetY = 0,
  onRotate,
  onFlip,
  onScale,
  onAdjustDepth,
  onDelete,
  onDeselect,
  className = "",
}) => {
  const {
    instanceId,
    flowerName,
    flowerId,
    role,
    color,
    scale,
    size: baseSize,
    baseScale = 1.0,
    rotate = 0,
    flipX = false,
    flipY = false,
    depth,
    x,
    y,
  } = selectedInstance;

  // Calculate instance display title (e.g. "Rose #2" or "Rose")
  const sameFlowerInstances = instances.filter((i) => i.flowerId === flowerId);
  const instanceIndex =
    sameFlowerInstances.findIndex((i) => i.instanceId === instanceId) + 1;
  const displayTitle =
    sameFlowerInstances.length > 1
      ? `${flowerName} #${instanceIndex}`
      : flowerName;

  const currentScalePct = Math.round((scale / (baseScale || 1.0)) * 100);

  // ----------------------------------------------------
  // Compact Floating Geometry & Collision-Aware Positioning
  // ----------------------------------------------------
  const TOOLBAR_WIDTH = 74;
  const TOOLBAR_HEIGHT = 192;
  const PADDING = 10;
  const GAP = 8; // Snug florist gap between flower and toolbar

  const visualBounds = getFlowerVisualBounds(flowerId, role);
  const visualHalfWidth = (baseSize * scale * visualBounds.widthFactor * canvasScale) / 2;
  const visualHalfHeight = (baseSize * scale * visualBounds.heightFactor * canvasScale) / 2;

  const flowerCenterX = stageSize.width / 2 + (offsetX || 0) + x * canvasScale;
  const flowerCenterY = stageSize.height / 2 + (offsetY || 0) + y * canvasScale;

  // Horizontal smart placement: prefer side with more space
  const spaceRight = stageSize.width - (flowerCenterX + visualHalfWidth + PADDING);
  const spaceLeft = flowerCenterX - visualHalfWidth - PADDING;

  let calculatedLeft: number;
  let calculatedTop = flowerCenterY - TOOLBAR_HEIGHT / 2;

  if (spaceRight >= TOOLBAR_WIDTH + GAP) {
    // Place snugly to the right of the flower
    calculatedLeft = flowerCenterX + visualHalfWidth + GAP;
  } else if (spaceLeft >= TOOLBAR_WIDTH + GAP) {
    // Place snugly to the left of the flower
    calculatedLeft = flowerCenterX - visualHalfWidth - TOOLBAR_WIDTH - GAP;
  } else {
    // Center horizontally if tight on both sides (narrow canvas), position vertically
    calculatedLeft = flowerCenterX - TOOLBAR_WIDTH / 2;
    if (flowerCenterY - visualHalfHeight - TOOLBAR_HEIGHT - GAP >= PADDING) {
      // Above flower
      calculatedTop = flowerCenterY - visualHalfHeight - TOOLBAR_HEIGHT - GAP;
    } else {
      // Below flower
      calculatedTop = flowerCenterY + visualHalfHeight + GAP;
    }
  }

  // Clamp within stage viewport bounds
  calculatedLeft = Math.max(
    PADDING,
    Math.min(stageSize.width - TOOLBAR_WIDTH - PADDING, calculatedLeft)
  );
  calculatedTop = Math.max(
    PADDING,
    Math.min(stageSize.height - TOOLBAR_HEIGHT - PADDING, calculatedTop)
  );

  return (
    <div
      id="flower-contextual-toolbar"
      style={{
        left: `${calculatedLeft}px`,
        top: `${calculatedTop}px`,
        width: `${TOOLBAR_WIDTH}px`,
      }}
      className={`absolute z-50 select-none transition-[left,top] duration-150 ease-out ${className}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {/* Compact Florist Floating Card */}
      <div className="bg-[#FAF8F5]/98 text-[#2D3B22] backdrop-blur-md rounded-2xl shadow-[0_10px_25px_rgba(45,79,30,0.14)] border border-[#E4DFD5] p-1.5 flex flex-col items-center gap-1.5 transition-all duration-150 animate-in fade-in zoom-in-95">
        {/* Header: Dot + Name + Close Button */}
        <div
          id="toolbar-compact-header"
          className="w-full flex items-center justify-between pb-1 border-b border-[#EAE5DA] px-0.5"
        >
          <div className="flex items-center gap-1 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
              style={{ backgroundColor: color || "#2D4F1E" }}
            />
            <span
              className="text-[10px] font-serif font-bold text-[#2D3B22] truncate max-w-[42px]"
              title={displayTitle}
            >
              {displayTitle}
            </span>
          </div>
          <button
            id="toolbar-btn-close"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeselect();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Deselect flower"
            aria-label="Close"
            className="p-0.5 hover:bg-[#EAE4D7] rounded-md text-[#73806B] hover:text-[#2D3B22] transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* 1. Rotation Row: [ ↺ ] [ ↻ ] */}
        <div
          id="toolbar-rotate-row"
          className="grid grid-cols-2 gap-1 w-full"
          title={`Rotation: ${rotate}°`}
        >
          <button
            id="toolbar-btn-rotate-left"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRotate(instanceId, -15);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Rotate Left (-15°)"
            aria-label="Rotate Left"
            className="h-7 flex items-center justify-center bg-[#F0ECE1] hover:bg-[#E4DDCF] active:bg-[#D9D0BF] rounded-lg text-[#2D3B22] transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-rotate-right"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRotate(instanceId, 15);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Rotate Right (+15°)"
            aria-label="Rotate Right"
            className="h-7 flex items-center justify-center bg-[#F0ECE1] hover:bg-[#E4DDCF] active:bg-[#D9D0BF] rounded-lg text-[#2D3B22] transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Flip Row: [ ↔ ] [ ↕ ] */}
        <div id="toolbar-flip-row" className="grid grid-cols-2 gap-1 w-full">
          <button
            id="toolbar-btn-flip-h"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFlip(instanceId, "x");
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Flip Horizontal"
            aria-label="Flip Horizontal"
            className={`h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer shadow-2xs ${
              flipX
                ? "bg-[#2D4F1E] text-white font-bold"
                : "bg-[#F0ECE1] hover:bg-[#E4DDCF] active:bg-[#D9D0BF] text-[#2D3B22]"
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-flip-v"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFlip(instanceId, "y");
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Flip Vertical"
            aria-label="Flip Vertical"
            className={`h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer shadow-2xs ${
              flipY
                ? "bg-[#2D4F1E] text-white font-bold"
                : "bg-[#F0ECE1] hover:bg-[#E4DDCF] active:bg-[#D9D0BF] text-[#2D3B22]"
            }`}
          >
            <FlipVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. Scale Size Row: [ − ] [ + ] */}
        <div
          id="toolbar-scale-row"
          className="grid grid-cols-2 gap-1 w-full"
          title={`Scale: ${currentScalePct}%`}
        >
          <button
            id="toolbar-btn-size-minus"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onScale(instanceId, -0.06);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Decrease Size (-6%)"
            aria-label="Decrease Size"
            className="h-7 flex items-center justify-center bg-[#F0ECE1] hover:bg-[#E4DDCF] active:bg-[#D9D0BF] rounded-lg text-[#2D3B22] transition-colors cursor-pointer shadow-2xs"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-size-plus"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onScale(instanceId, 0.06);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Increase Size (+6%)"
            aria-label="Increase Size"
            className="h-7 flex items-center justify-center bg-[#F0ECE1] hover:bg-[#E4DDCF] active:bg-[#D9D0BF] rounded-lg text-[#2D3B22] transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4. Layer Ordering Row: [ ↑ ] [ ↓ ] */}
        <div
          id="toolbar-layer-row"
          className="grid grid-cols-2 gap-1 w-full"
          title={`Layer Depth: ${depth}`}
        >
          <button
            id="toolbar-btn-layer-forward"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdjustDepth(instanceId, "forward");
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Bring Forward (+1 Layer)"
            aria-label="Bring Forward"
            className="h-7 flex items-center justify-center bg-[#F0ECE1] hover:bg-[#E4DDCF] active:bg-[#D9D0BF] rounded-lg text-[#2D3B22] transition-colors cursor-pointer shadow-2xs"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-layer-backward"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdjustDepth(instanceId, "backward");
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Send Backward (-1 Layer)"
            aria-label="Send Backward"
            className="h-7 flex items-center justify-center bg-[#F0ECE1] hover:bg-[#E4DDCF] active:bg-[#D9D0BF] rounded-lg text-[#2D3B22] transition-colors cursor-pointer shadow-2xs"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#EAE5DA]" />

        {/* 5. Delete Action (Visually Separated) */}
        <button
          id="toolbar-btn-delete-instance"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(instanceId);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Delete stem from bouquet"
          aria-label="Delete stem"
          className="w-full h-7 flex items-center justify-center bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 rounded-lg border border-rose-200/80 transition-colors cursor-pointer shadow-2xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
