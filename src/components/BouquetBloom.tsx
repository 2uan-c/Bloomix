import React, { useState, useEffect, useRef } from "react";
import type { FlowerInstance } from "../engine/types.ts";
import { getFlowerImageUrl } from "../utils/botanicalImages.ts";
import { getTransparentFlowerCutout } from "../utils/flowerCutoutProcessor.ts";

export interface FlowerVisualBounds {
  widthFactor: number;
  heightFactor: number;
  borderRadius: string;
  shapeCategory: "tall" | "wide" | "round" | "branching";
}

/**
 * Returns the botanical visual profile and aspect ratio for a given flower species,
 * ensuring the selection halo and contextual controls hug the rendered bloom bounds.
 */
export function getFlowerVisualBounds(flowerId: string, role?: string): FlowerVisualBounds {
  const id = (flowerId || "").toLowerCase().trim();

  // 1. Tall / Elongated Silhouettes (Spikes, Stems, Foliage)
  if (
    id.includes("delphinium") ||
    id.includes("snapdragon") ||
    id.includes("gladiolus") ||
    id.includes("lavender") ||
    id.includes("ruscus") ||
    id.includes("eucalyptus") ||
    id.includes("anthurium") ||
    id.includes("calla") ||
    id.includes("solidago") ||
    id.includes("larkspur") ||
    id.includes("bells_of_ireland") ||
    role === "foliage"
  ) {
    return {
      widthFactor: 0.56,
      heightFactor: 0.88,
      borderRadius: "20px",
      shapeCategory: "tall",
    };
  }

  // 2. Wide / Clustered / Dense Multi-Petal Blooms
  if (
    id.includes("hydrangea") ||
    id.includes("peony") ||
    id.includes("dahlia")
  ) {
    return {
      widthFactor: 0.84,
      heightFactor: 0.78,
      borderRadius: "24px",
      shapeCategory: "wide",
    };
  }

  // 3. Branching / Delicate Spray Fillers
  if (
    id.includes("babys_breath") ||
    id.includes("waxflower") ||
    id.includes("statice") ||
    id.includes("limonium") ||
    id.includes("astilbe") ||
    id.includes("chamomile") ||
    role === "filler"
  ) {
    return {
      widthFactor: 0.76,
      heightFactor: 0.74,
      borderRadius: "22px",
      shapeCategory: "branching",
    };
  }

  // 4. Slender Open Blooms (e.g. Tulip)
  if (id.includes("tulip") || id.includes("iris")) {
    return {
      widthFactor: 0.62,
      heightFactor: 0.82,
      borderRadius: "22px",
      shapeCategory: "tall",
    };
  }

  // 5. Standard Focal & Secondary Round Blooms (Rose, Carnation, Gerbera, Sunflower, Ranunculus, Anemone, Lily, Orchid, etc.)
  return {
    widthFactor: 0.74,
    heightFactor: 0.74,
    borderRadius: "9999px",
    shapeCategory: "round",
  };
}

interface BouquetBloomProps {
  instance: FlowerInstance;
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect?: (instanceId: string) => void;
  onDragStart?: (e: React.PointerEvent<HTMLDivElement>, instanceId: string) => void;
  className?: string;
  showLabel?: boolean;
}

export const BouquetBloom: React.FC<BouquetBloomProps> = ({
  instance,
  isSelected = false,
  isDragging = false,
  onSelect,
  onDragStart,
  className = "",
  showLabel = true,
}) => {
  const {
    instanceId,
    flowerId,
    flowerName,
    role,
    color,
    size: baseSize,
    scale,
    x,
    y,
    rotate = 0,
    flipX = false,
    flipY = false,
    depth,
  } = instance;

  const rawUrl = getFlowerImageUrl(flowerId, color);
  const [transparentSrc, setTransparentSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Automatically segment and extract isolated botanical cutout with 100% alpha transparency
  useEffect(() => {
    let isCancelled = false;
    getTransparentFlowerCutout(rawUrl, flowerId, color)
      .then((cutoutUrl) => {
        if (!isCancelled) {
          setTransparentSrc(cutoutUrl);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setHasError(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [rawUrl, flowerId, color]);

  const handleImageError = () => {
    const normalized = (flowerId || "").toLowerCase().trim();
    if (transparentSrc && !transparentSrc.endsWith(".webp")) {
      setTransparentSrc(`/flowers/${normalized}.webp`);
    } else {
      setHasError(true);
    }
  };

  const pixelSize = Math.round(baseSize * scale);
  const visualBounds = getFlowerVisualBounds(flowerId, role);
  const visualWidth = Math.round(pixelSize * visualBounds.widthFactor);
  const visualHeight = Math.round(pixelSize * visualBounds.heightFactor);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only capture primary pointer (left mouse button or touch)
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.stopPropagation();
    onDragStart?.(e, instanceId);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(instanceId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  // Build transform string with rotation and directional flips
  const transformParts: string[] = [];
  if (rotate) transformParts.push(`rotate(${rotate}deg)`);
  if (flipX) transformParts.push("scaleX(-1)");
  if (flipY) transformParts.push("scaleY(-1)");
  const transformCss = transformParts.length > 0 ? transformParts.join(" ") : undefined;

  // Depth-responsive natural botanical drop-shadow (eliminates flat sticker look)
  const shadowDepth = Math.max(10, Math.min(depth || 40, 80));
  const shadowBlur = (shadowDepth / 16 + 2.5).toFixed(1);
  const shadowOffset = (shadowDepth / 28 + 1.2).toFixed(1);
  const shadowOpacity = (0.12 + (shadowDepth / 100) * 0.12).toFixed(2);

  const shadowFilter = isSelected
    ? "drop-shadow(0 4px 8px rgba(22, 32, 18, 0.22)) drop-shadow(0 1px 3px rgba(22, 32, 18, 0.16))"
    : `drop-shadow(0 ${shadowOffset}px ${shadowBlur}px rgba(22, 32, 18, ${shadowOpacity}))`;

  return (
    <div
      ref={containerRef}
      id={`flower-instance-${instanceId}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      className={`absolute select-none pointer-events-auto cursor-grab active:cursor-grabbing ${
        isDragging ? "transition-none" : "transition-transform duration-250 ease-out"
      } ${className}`}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        left: `calc(50% + ${x}px - ${pixelSize / 2}px)`,
        top: `calc(50% + ${y}px - ${pixelSize / 2}px)`,
        transform: transformCss,
        zIndex: isDragging ? 80 : (instance.zIndex ?? Math.max(depth || 20, 8)),
        touchAction: "none",
      }}
      title={`${flowerName} (${role}) — Click to edit or drag to reposition`}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Compact selection halo that closely hugs the flower's natural bounds (6-8px padding) */}
        {isSelected && (
          <div
            id={`flower-selection-halo-${instanceId}`}
            className="absolute pointer-events-none transition-all duration-150 ease-out"
            style={{
              width: `${visualWidth + 14}px`,
              height: `${visualHeight + 14}px`,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              borderRadius: visualBounds.borderRadius,
              border: "1.5px solid rgba(45, 79, 30, 0.72)",
              boxShadow:
                "0 0 0 1.5px rgba(255, 255, 255, 0.7), 0 2px 10px rgba(45, 79, 30, 0.16)",
              backgroundColor: "rgba(45, 79, 30, 0.025)",
            }}
          />
        )}

        {/* Botanical Isolated Flower Bloom (100% transparent PNG, no background/boundary) */}
        {!hasError && transparentSrc ? (
          <img
            src={transparentSrc}
            alt={flowerName}
            className={`w-full h-full object-contain select-none transition-opacity duration-300 pointer-events-none ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{
              filter: shadowFilter,
            }}
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            loading="eager"
            draggable={false}
          />
        ) : hasError ? (
          /* Graceful botanical fallback (soft colored organic disc) */
          <div
            className="rounded-full flex items-center justify-center border border-white/40 shadow-xs pointer-events-none"
            style={{
              width: `${visualWidth}px`,
              height: `${visualHeight}px`,
              backgroundColor: color || "#E8E4D9",
              opacity: 0.92,
              borderRadius: visualBounds.borderRadius,
            }}
          >
            <span className="text-[10px] font-serif font-bold text-white uppercase tracking-wider opacity-90">
              {flowerName.slice(0, 2)}
            </span>
          </div>
        ) : (
          /* Subtle skeleton placeholder during initial instant cutout render */
          <div
            className="bg-black/5 animate-pulse"
            style={{
              width: `${visualWidth}px`,
              height: `${visualHeight}px`,
              borderRadius: visualBounds.borderRadius,
            }}
          />
        )}

        {/* Floating minimal floral label on selection */}
        {showLabel && isSelected && (
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-[#1E241A]/95 text-[#FDFCF9] text-[9px] font-sans font-medium px-2 py-0.5 rounded-md shadow-md whitespace-nowrap pointer-events-none z-50 animate-in fade-in duration-150"
            style={{
              bottom: `calc(50% - ${visualHeight / 2 + 18}px)`,
              // Neutralize parent flip if flipped so text remains readable
              transform: `${flipX ? "scaleX(-1)" : ""} ${flipY ? "scaleY(-1)" : ""}`.trim() || undefined,
            }}
          >
            {flowerName}
          </div>
        )}
      </div>
    </div>
  );
};
