import React from "react";
import type { FlowerInstance } from "../engine/types.ts";

interface BouquetStemNetworkProps {
  instances: FlowerInstance[];
  tiePoint?: { x: number; y: number };
}

/**
 * Renders subtle, realistic botanical stem shafts behind the flower mass
 * converging gracefully down into the narrowed bouquet neck and tie point.
 */
export const BouquetStemNetwork: React.FC<BouquetStemNetworkProps> = ({
  instances,
  tiePoint = { x: 0, y: 52 },
}) => {
  const upperStems = React.useMemo(() => {
    if (!instances || instances.length === 0) return [];
    const stemColors = ["#1A3312", "#224217", "#172C10", "#284A1C", "#15280E"];

    // Filter instances and create subtle organic stem paths converging into the neck
    return instances
      .map((inst, i) => {
        // Only draw stems for flowers above the tie point
        if (inst.y >= tiePoint.y - 8) return null;

        const startX = inst.x * 0.75;
        const startY = inst.y + (inst.size || 60) * 0.22;
        const endRatio = instances.length > 1 ? (i / (instances.length - 1)) * 2 - 1 : 0;
        const endX = tiePoint.x + endRatio * 10;
        const endY = tiePoint.y - 2;

        const cpX = (startX + endX) * 0.5 + (i % 2 === 0 ? 3 : -3);
        const cpY = (startY + endY) * 0.55;

        const path = `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
        const color = stemColors[i % stemColors.length];
        const width = 2.4 + (i % 3) * 0.3;

        return { path, color, width, opacity: 0.75 };
      })
      .filter(Boolean) as { path: string; color: string; width: number; opacity: number }[];
  }, [instances, tiePoint]);

  if (instances.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="-170 -150 340 300"
      preserveAspectRatio="xMidYMid meet"
      style={{ zIndex: 5 }}
    >
      <defs>
        <filter id="internalStemShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.3" dy="1.0" stdDeviation="0.8" floodColor="#081005" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#internalStemShadow)" id="bouquet-internal-stem-network">
        {upperStems.map((stem, idx) => (
          <path
            key={`internal-stem-${idx}`}
            d={stem.path}
            fill="none"
            stroke={stem.color}
            strokeWidth={stem.width}
            strokeLinecap="round"
            opacity={stem.opacity}
          />
        ))}
      </g>
    </svg>
  );
};

