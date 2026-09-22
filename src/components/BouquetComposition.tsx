import React, { useMemo } from "react";
import type { FlowerInstance } from "../engine/types.ts";
import type { WrappingOption, RibbonOption } from "../utils/botanicalImages.ts";
import { BouquetBloom } from "./BouquetBloom.tsx";
import { BouquetWrapping } from "./BouquetWrapping.tsx";
import { BouquetStemNetwork } from "./BouquetStemNetwork.tsx";

export interface BouquetCompositionProps {
  instances: FlowerInstance[];
  wrapping: WrappingOption;
  ribbon: RibbonOption;
  wrapCoverage?: "top" | "full";
  shapeId?: string;
  tiePoint?: { x: number; y: number };
  interactive?: boolean;
  selectedInstanceId?: string | null;
  draggingId?: string | null;
  onSelectInstance?: (id: string) => void;
  onDragStart?: (e: React.PointerEvent<HTMLDivElement>, instanceId: string) => void;
  showLabels?: boolean;
  className?: string;
}

/**
 * Single source of truth for physical bouquet rendering.
 * Consumed identically by:
 * 1. Live Interactive Preview (BouquetVisualizer)
 * 2. Static Clean Preview (BouquetAnalysisView)
 * 3. Export Snapshot Engine (bouquetSnapshotGenerator)
 */
export const BouquetComposition: React.FC<BouquetCompositionProps> = ({
  instances,
  wrapping,
  ribbon,
  wrapCoverage = "top",
  shapeId = "round-dome",
  tiePoint = { x: 0, y: 52 },
  interactive = false,
  selectedInstanceId = null,
  draggingId = null,
  onSelectInstance,
  onDragStart,
  showLabels = false,
  className = "",
}) => {
  const totalStems = instances.length;

  return (
    <div
      className={`relative w-[340px] h-[300px] flex items-center justify-center select-none ${
        interactive ? "pointer-events-none" : "pointer-events-none"
      } ${className}`}
    >
      {/* 1. Soft Studio Floor Grounding Shadow */}
      <div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-56 h-7 rounded-[100%] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(28, 38, 22, 0.20) 0%, rgba(28, 38, 22, 0.06) 55%, transparent 75%)",
          filter: "blur(4px)",
        }}
      />

      {/* 2. Layer 1: Back Wrapping Paper Shell (Foundation) */}
      <BouquetWrapping
        layer="back"
        wrapping={wrapping}
        ribbon={ribbon}
        totalStemsCount={totalStems}
        shapeId={shapeId}
        wrapCoverage={wrapCoverage}
      />

      {/* 3. Layer 2: Bottom Exposed Trimmed Stems (radiating below tie or cone base) */}
      <BouquetWrapping
        layer="stems-bottom"
        wrapping={wrapping}
        ribbon={ribbon}
        totalStemsCount={totalStems}
        shapeId={shapeId}
        wrapCoverage={wrapCoverage}
      />

      {/* 4. Layer 3: Organic SVG Stem Network */}
      <BouquetStemNetwork instances={instances} tiePoint={tiePoint} />

      {/* 5. Layer 4: Complete Flower Composition (Foliage, Fillers, Secondary, Focal Blooms) */}
      <div id="bouquet-composition-blooms" className="contents">
        {instances.map((instance) => (
          <BouquetBloom
            key={instance.instanceId}
            instance={instance}
            isSelected={interactive && selectedInstanceId === instance.instanceId}
            isDragging={interactive && draggingId === instance.instanceId}
            onSelect={interactive ? onSelectInstance : undefined}
            onDragStart={interactive ? onDragStart : undefined}
            showLabel={showLabels}
          />
        ))}
      </div>

      {/* 6. Layer 5: Front Wrapping Paper Collar & Flaps */}
      <BouquetWrapping
        layer="front"
        wrapping={wrapping}
        ribbon={ribbon}
        totalStemsCount={totalStems}
        shapeId={shapeId}
        wrapCoverage={wrapCoverage}
      />

      {/* 7. Layer 6: Florist Hand-Tied Binding Ribbon & 3D Bow */}
      <BouquetWrapping
        layer="ribbon"
        wrapping={wrapping}
        ribbon={ribbon}
        totalStemsCount={totalStems}
        shapeId={shapeId}
        wrapCoverage={wrapCoverage}
      />
    </div>
  );
};
