import React from "react";

interface FlowerIconProps {
  flowerId: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const FlowerIcon: React.FC<FlowerIconProps> = ({
  flowerId,
  color = "pink",
  size = "md",
  className = "",
}) => {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const getPetalColor = (c: string) => {
    switch (c) {
      case "red":
        return { primary: "#e11d48", secondary: "#be123c", light: "#fda4af" };
      case "pink":
        return { primary: "#ec4899", secondary: "#db2777", light: "#fbcfe8" };
      case "white":
        return { primary: "#f8fafc", secondary: "#e2e8f0", light: "#ffffff" };
      case "yellow":
        return { primary: "#eab308", secondary: "#ca8a04", light: "#fef08a" };
      case "peach":
        return { primary: "#fb923c", secondary: "#ea580c", light: "#ffedd5" };
      case "orange":
        return { primary: "#f97316", secondary: "#c2410c", light: "#fed7aa" };
      case "blue":
        return { primary: "#38bdf8", secondary: "#0284c7", light: "#bae6fd" };
      case "purple":
        return { primary: "#a855f7", secondary: "#7e22ce", light: "#e9d5ff" };
      case "green":
        return { primary: "#15803d", secondary: "#166534", light: "#86efac" };
      case "silver":
        return { primary: "#64748b", secondary: "#475569", light: "#e2e8f0" };
      default:
        return { primary: "#ec4899", secondary: "#db2777", light: "#fbcfe8" };
    }
  };

  const palette = getPetalColor(color);

  // Render stylized SVG blossoms based on species
  const renderSvg = () => {
    switch (flowerId) {
      case "rose":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <circle cx="50" cy="50" r="42" fill={palette.secondary} />
            <path
              d="M 50 16 C 68 16 82 32 82 50 C 82 68 68 84 50 84 C 32 84 18 68 18 50 C 18 32 32 16 50 16 Z"
              fill={palette.primary}
            />
            <path
              d="M 50 24 C 64 24 74 36 74 50 C 74 64 64 76 50 76 C 36 76 26 64 26 50 C 26 36 36 24 50 24"
              fill={palette.secondary}
              opacity="0.85"
            />
            <path
              d="M 50 32 C 60 32 68 40 68 50 C 68 60 60 68 50 68 C 40 68 32 60 32 50 C 32 40 40 32 50 32"
              fill={palette.light}
            />
            <circle cx="50" cy="50" r="8" fill={palette.secondary} />
          </svg>
        );

      case "sunflower":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <g transform="translate(50,50)">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                <ellipse
                  key={i}
                  cx="0"
                  cy="-34"
                  rx="7"
                  ry="16"
                  transform={`rotate(${angle})`}
                  fill={i % 2 === 0 ? palette.primary : palette.light}
                />
              ))}
              <circle cx="0" cy="0" r="22" fill="#542e0e" />
              <circle cx="0" cy="0" r="17" fill="#381e05" stroke="#78350f" strokeWidth="2" />
            </g>
          </svg>
        );

      case "peony":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <circle cx="50" cy="50" r="44" fill={palette.secondary} opacity="0.6" />
            <g transform="translate(50,50)">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <circle
                  key={i}
                  cx="0"
                  cy="-18"
                  r="18"
                  transform={`rotate(${angle})`}
                  fill={palette.primary}
                  opacity="0.8"
                />
              ))}
              {[22, 67, 112, 157, 202, 247, 292, 337].map((angle, i) => (
                <circle
                  key={`in-${i}`}
                  cx="0"
                  cy="-10"
                  r="13"
                  transform={`rotate(${angle})`}
                  fill={palette.light}
                />
              ))}
              <circle cx="0" cy="0" r="8" fill={palette.secondary} />
            </g>
          </svg>
        );

      case "hydrangea":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <g transform="translate(50,50)">
              {[
                { x: -20, y: -18 },
                { x: 18, y: -20 },
                { x: -18, y: 18 },
                { x: 20, y: 16 },
                { x: 0, y: -28 },
                { x: 0, y: 28 },
                { x: -28, y: 0 },
                { x: 28, y: 0 },
                { x: 0, y: 0 },
              ].map((pos, idx) => (
                <g key={idx} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle cx="-5" cy="0" r="7" fill={palette.primary} />
                  <circle cx="5" cy="0" r="7" fill={palette.primary} />
                  <circle cx="0" cy="-5" r="7" fill={palette.light} />
                  <circle cx="0" cy="5" r="7" fill={palette.secondary} />
                  <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                </g>
              ))}
            </g>
          </svg>
        );

      case "lily":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <g transform="translate(50,50)">
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <path
                  key={i}
                  d="M 0 0 C -12 -20 -10 -40 0 -48 C 10 -40 12 -20 0 0"
                  transform={`rotate(${angle})`}
                  fill={i % 2 === 0 ? palette.primary : palette.light}
                  stroke={palette.secondary}
                  strokeWidth="1"
                />
              ))}
              <circle cx="0" cy="0" r="6" fill="#ca8a04" />
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <line
                  key={`pistil-${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-18"
                  transform={`rotate(${angle + 30})`}
                  stroke="#78350f"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ))}
            </g>
          </svg>
        );

      case "orchid":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <g transform="translate(50,50)">
              <ellipse cx="0" cy="-26" rx="14" ry="20" fill={palette.light} />
              <ellipse cx="-26" cy="10" rx="20" ry="14" fill={palette.primary} />
              <ellipse cx="26" cy="10" rx="20" ry="14" fill={palette.primary} />
              <ellipse cx="-16" cy="-14" rx="18" ry="12" fill={palette.light} />
              <ellipse cx="16" cy="-14" rx="18" ry="12" fill={palette.light} />
              {/* Orchid Lip / Column */}
              <path
                d="M -12 8 C -12 24 0 30 0 30 C 0 30 12 24 12 8 Z"
                fill={palette.secondary}
              />
              <circle cx="0" cy="6" r="4" fill="#facc15" />
            </g>
          </svg>
        );

      case "tulip":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <g transform="translate(50,50)">
              <path
                d="M -24 15 C -28 -15 -18 -38 0 -42 C 18 -38 28 -15 24 15 C 16 32 -16 32 -24 15 Z"
                fill={palette.primary}
              />
              <path
                d="M -24 15 C -15 -25 0 -42 0 -42 C 0 -42 15 -25 24 15 Z"
                fill={palette.secondary}
                opacity="0.9"
              />
              <path
                d="M -12 18 C -6 -15 0 -34 0 -34 C 0 -34 6 -15 12 18 Z"
                fill={palette.light}
              />
              {/* Small green base */}
              <ellipse cx="0" cy="24" rx="8" ry="4" fill="#15803d" />
            </g>
          </svg>
        );

      case "carnation":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <g transform="translate(50,50)">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                <path
                  key={i}
                  d="M 0 0 C -10 -15 -15 -28 0 -36 C 15 -28 10 -15 0 0"
                  transform={`rotate(${angle})`}
                  fill={i % 2 === 0 ? palette.primary : palette.light}
                  stroke={palette.secondary}
                  strokeWidth="0.8"
                />
              ))}
              <circle cx="0" cy="0" r="12" fill={palette.secondary} />
            </g>
          </svg>
        );

      case "gerbera":
      case "daisy":
      case "chrysanthemum":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <g transform="translate(50,50)">
              {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map(
                (angle, i) => (
                  <ellipse
                    key={i}
                    cx="0"
                    cy="-28"
                    rx="5"
                    ry="15"
                    transform={`rotate(${angle})`}
                    fill={i % 2 === 0 ? palette.primary : palette.light}
                  />
                )
              )}
              <circle cx="0" cy="0" r="14" fill="#ca8a04" stroke="#a16207" strokeWidth="2" />
            </g>
          </svg>
        );

      case "baby-breath":
      case "waxflower":
      case "statice":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Branch stems */}
            <path
              d="M 50 90 L 50 50 M 50 65 L 25 35 M 50 55 L 75 30 M 25 35 L 15 20 M 25 35 L 35 15 M 75 30 L 65 15 M 75 30 L 85 18"
              stroke="#15803d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Little floral clusters */}
            {[
              { x: 50, y: 45 },
              { x: 15, y: 18 },
              { x: 35, y: 15 },
              { x: 65, y: 15 },
              { x: 85, y: 18 },
              { x: 25, y: 35 },
              { x: 75, y: 30 },
            ].map((p, idx) => (
              <g key={idx} transform={`translate(${p.x}, ${p.y})`}>
                <circle cx="0" cy="0" r="8" fill={palette.light} stroke={palette.secondary} strokeWidth="1" />
                <circle cx="0" cy="0" r="2.5" fill="#facc15" />
              </g>
            ))}
          </svg>
        );

      case "eucalyptus":
      case "ruscus":
      case "olive-branch":
      case "italian-ruscus":
      case "fern":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <path
              d="M 50 92 Q 52 50 50 10"
              stroke="#166534"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {[
              { y: 22, side: -1 },
              { y: 22, side: 1 },
              { y: 40, side: -1 },
              { y: 40, side: 1 },
              { y: 58, side: -1 },
              { y: 58, side: 1 },
              { y: 76, side: -1 },
              { y: 76, side: 1 },
            ].map((leaf, idx) => (
              <ellipse
                key={idx}
                cx={50 + leaf.side * 18}
                cy={leaf.y}
                rx="14"
                ry="9"
                transform={`rotate(${leaf.side * 28} ${50 + leaf.side * 18} ${leaf.y})`}
                fill={idx % 3 === 0 ? "#15803d" : "#22c55e"}
                stroke="#14532d"
                strokeWidth="1"
              />
            ))}
            <ellipse cx="50" cy="12" rx="10" ry="6" fill="#4ade80" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="36" fill={palette.primary} />
            <circle cx="50" cy="50" r="14" fill="#facc15" />
          </svg>
        );
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeMap[size]} ${className}`}>
      {renderSvg()}
    </div>
  );
};
