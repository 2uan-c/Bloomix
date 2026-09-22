import React, { useId, useEffect } from "react";
import type { WrappingOption, RibbonOption, WrappingPresetType } from "../utils/botanicalImages.ts";

interface BouquetWrappingProps {
  layer: "back" | "front" | "stems-bottom" | "ribbon";
  wrapping: WrappingOption;
  ribbon: RibbonOption;
  totalStemsCount?: number;
  presetOverride?: WrappingPresetType;
  shapeId?: string;
  wrapCoverage?: "top" | "full";
}

export const BouquetWrapping: React.FC<BouquetWrappingProps> = ({
  layer,
  wrapping,
  ribbon,
  totalStemsCount = 7,
  presetOverride,
  shapeId = "round-dome",
  wrapCoverage = "top",
}) => {
  const uniqueId = useId().replace(/:/g, "_");
  const preset = presetOverride || wrapping?.preset || "kraft_cone";
  const isFullWrap = wrapCoverage === "full";

  // Calculate shape-responsive transform profile (kept tight to prevent oversized wrapping)
  const normalizedShape = (shapeId || "round-dome").toLowerCase();
  let stemLengthMultiplier = 1.0;
  let wrapScaleX = 1.0;
  let wrapScaleY = 1.0;
  let wrapOffsetY = 0;

  if (normalizedShape.includes("long-stem")) {
    stemLengthMultiplier = 1.3;
    wrapScaleX = 0.90;
    wrapScaleY = 1.08;
    wrapOffsetY = -6;
  } else if (normalizedShape.includes("posy")) {
    stemLengthMultiplier = 0.8;
    wrapScaleX = 0.92;
    wrapScaleY = 0.92;
    wrapOffsetY = 6;
  } else if (normalizedShape.includes("wild")) {
    stemLengthMultiplier = 1.05;
    wrapScaleX = 1.08;
    wrapScaleY = 0.98;
    wrapOffsetY = -2;
  } else if (normalizedShape.includes("cascade")) {
    stemLengthMultiplier = 1.0;
    wrapScaleX = 0.96;
    wrapScaleY = 1.04;
    wrapOffsetY = -4;
  } else if (normalizedShape.includes("dome")) {
    stemLengthMultiplier = 0.95;
    wrapScaleX = 1.02;
    wrapScaleY = 1.0;
    wrapOffsetY = 0;
  }

  const shapeTransform = `translate(0, ${wrapOffsetY}) scale(${wrapScaleX}, ${wrapScaleY})`;

  // =========================================================================
  // LAYER 1: BOTTOM EXPOSED TRIMMED STEMS (Narrow coherent bundle below neck tie)
  // =========================================================================
  if (layer === "stems-bottom") {
    const count =
      preset === "japanese_minimal_wrap"
        ? Math.min(6, Math.max(4, Math.ceil(totalStemsCount * 0.6)))
        : preset === "kraft_cone" || preset === "small_hand_tied_wrap"
        ? Math.min(10, Math.max(5, totalStemsCount))
        : Math.min(9, Math.max(5, Math.ceil(totalStemsCount * 0.8)));

    const stemSpecs = [
      { angle: -7, length: 30, offset: -5.5, width: 2.7, color: "#1F4212" },
      { angle: -4, length: 35, offset: -3.5, width: 3.0, color: "#2B5219" },
      { angle: -1, length: 32, offset: -1.2, width: 2.5, color: "#366320" },
      { angle: 1, length: 37, offset: 0.5, width: 3.2, color: "#1D3D10" },
      { angle: 3, length: 34, offset: 2.5, width: 2.8, color: "#284E17" },
      { angle: 6, length: 31, offset: 4.8, width: 2.9, color: "#224714" },
      { angle: -9, length: 28, offset: -7.0, width: 2.3, color: "#3C6B24" },
      { angle: 8, length: 27, offset: 6.2, width: 2.4, color: "#2F591B" },
      { angle: -5, length: 36, offset: -2.5, width: 3.1, color: "#1E3F11" },
      { angle: 4, length: 34, offset: 3.0, width: 2.7, color: "#274F18" },
    ];

    const activeStems = stemSpecs.slice(0, count);

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="-170 -150 340 300"
        preserveAspectRatio="xMidYMid meet"
        style={{ zIndex: 4 }}
      >
        <defs>
          <filter id={`botStemShadow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.3" dy="1.0" stdDeviation="0.8" floodColor="#0A1605" floodOpacity="0.30" />
          </filter>
        </defs>

        <g filter={`url(#botStemShadow_${uniqueId})`}>
          {activeStems.map((stem, i) => {
            const startX = stem.offset * (isFullWrap ? 0.45 : 0.85);
            const startY = isFullWrap ? 88 : 52; // Exits at wrap cone bottom opening for Full Wrap, or neck tie for Top Wrap
            const stemLength = (stem.length * stemLengthMultiplier) * (isFullWrap ? 0.32 : 1.0);
            const rad = ((stem.angle * (isFullWrap ? 0.6 : 1.0)) * Math.PI) / 180;
            const endX = startX + Math.sin(rad) * stemLength;
            const endY = startY + Math.cos(rad) * stemLength;

            return (
              <g key={`bot-stem-${i}`}>
                {/* Main stem shaft */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={stem.color}
                  strokeWidth={stem.width}
                  strokeLinecap="round"
                />
                {/* 45° diagonal florist shear cut end */}
                <line
                  x1={endX - 1.1}
                  y1={endY - 0.5}
                  x2={endX + 1.1}
                  y2={endY + 0.5}
                  stroke="#8BA870"
                  strokeWidth={stem.width * 0.85}
                  strokeLinecap="round"
                  opacity={0.9}
                />
              </g>
            );
          })}
        </g>
      </svg>
    );
  }

  // =========================================================================
  // LAYER 2: BACK WRAPPING PAPER (Cradling Lower Arrangement — Flowers Emerge Above)
  // =========================================================================
  if (layer === "back") {
    const isDarkLuxury = preset === "dark_luxury_wrap";
    const paperColor = wrapping?.paperColor || "#C9AE8D";
    const paperBorder = wrapping?.paperBorder || "#B59775";
    const innerPaperColor = wrapping?.innerPaperColor || "#EFE8DC";
    const backPaperBaseColor = isDarkLuxury ? "#121512" : paperBorder;
    const goldAccent = "#C6A85A";

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="-170 -150 340 300"
        preserveAspectRatio="xMidYMid meet"
        style={{ zIndex: 2 }}
      >
        <defs>
          <filter id={`backPaperShadow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#1E140A" floodOpacity="0.18" />
          </filter>

          {/* Dynamic Gradient using exact wrapping colors */}
          <linearGradient id={`backGrad_${uniqueId}`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor={isDarkLuxury ? "#1A1E1A" : paperColor} />
            <stop offset="55%" stopColor={paperColor} />
            <stop offset="100%" stopColor={backPaperBaseColor} />
          </linearGradient>

          <linearGradient id={`innerGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={innerPaperColor} stopOpacity="0.95" />
            <stop offset="100%" stopColor={isDarkLuxury ? "#171B17" : paperColor} stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* ---------------- WRAPPER BACK LAYER (MODERATE WIDTH, OPEN RIM) ---------------- */}
        <g transform={shapeTransform}>
          {/* 1. JAPANESE MINIMAL ORIGAMI WRAP */}
          {preset === "japanese_minimal_wrap" && (
            <g filter={`url(#backPaperShadow_${uniqueId})`}>
              {/* Primary Angular Origami Sheet — framing blooms down to waist or full base */}
              <path
                d={
                  isFullWrap
                    ? "M -78 -34 L 74 -26 L 56 16 L 15 48 L 9 88 L -9 88 L -15 48 L -56 16 Z"
                    : "M -78 -34 L 74 -26 L 56 16 L 15 48 L -15 48 L -56 16 Z"
                }
                fill={`url(#backGrad_${uniqueId})`}
                stroke={paperBorder}
                strokeWidth="1.2"
              />
              {/* Inner crisp folded paper facet */}
              <path
                d={
                  isFullWrap
                    ? "M -62 -26 L 62 -18 L 44 14 L 11 46 L 7 84 L -7 84 L -11 46 L -44 14 Z"
                    : "M -62 -26 L 62 -18 L 44 14 L 11 46 L -11 46 L -44 14 Z"
                }
                fill={`url(#innerGrad_${uniqueId})`}
                stroke={paperBorder}
                strokeWidth="0.8"
                opacity="0.9"
              />
              {/* Crisp diagonal origami crease lines converging to waist / base */}
              <line x1="-34" y1="-30" x2="-6" y2={isFullWrap ? 88 : 48} stroke={paperBorder} strokeWidth="1.0" opacity="0.55" />
              <line x1="34" y1="-22" x2="6" y2={isFullWrap ? 88 : 48} stroke={paperBorder} strokeWidth="1.0" opacity="0.55" />
              <line x1="0" y1="-28" x2="0" y2={isFullWrap ? 88 : 48} stroke="#FFFFFF" strokeWidth="0.7" opacity="0.35" />
            </g>
          )}

          {/* 2. DARK LUXURY MATTE CHARCOAL WRAP */}
          {preset === "dark_luxury_wrap" && (
            <g filter={`url(#backPaperShadow_${uniqueId})`}>
              {/* Refined matte charcoal paper cradling lower bloom mass */}
              <path
                d={
                  isFullWrap
                    ? "M -82 -32 C -50 -44, 0 -44, 50 -44 C 70 -38, 82 -32, 82 -32 C 74 2, 54 26, 32 36 C 24 42, 18 46, 15 48 C 13 60, 10 74, 9 88 L -9 88 C -10 74, -13 60, -15 48 C -18 46, -24 42, -32 36 C -54 26, -74 2, -82 -32 Z"
                    : "M -82 -32 C -50 -44, 0 -44, 50 -44 C 70 -38, 82 -32, 82 -32 C 74 2, 54 26, 32 36 C 24 42, 18 46, 15 48 L -15 48 C -18 46, -24 42, -32 36 C -54 26, -74 2, -82 -32 Z"
                }
                fill={`url(#backGrad_${uniqueId})`}
              />
              {/* Refined subtle warm gold piping accent along top opening edge */}
              <path
                d="M -82 -32 C -50 -44, 0 -44, 50 -44 C 70 -38, 82 -32, 82 -32"
                fill="none"
                stroke={goldAccent}
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Inner subtle emerald charcoal liner fold */}
              <path
                d={
                  isFullWrap
                    ? "M -68 -24 C -35 -34, 35 -34, 68 -24 C 58 4, 40 24, 12 46 C 10 58, 8 72, 7 84 L -7 84 C -8 72, -10 58, -12 46 C -40 24, -58 4, -68 -24 Z"
                    : "M -68 -24 C -35 -34, 35 -34, 68 -24 C 58 4, 40 24, 12 46 L -12 46 C -40 24, -58 4, -68 -24 Z"
                }
                fill={`url(#innerGrad_${uniqueId})`}
              />
              {/* Gold accent piping along inner liner rim */}
              <path
                d="M -68 -24 C -35 -34, 35 -34, 68 -24"
                fill="none"
                stroke={goldAccent}
                strokeWidth="0.75"
                opacity="0.6"
              />
              {/* Subtle matte paper fold creases tapering to waist / base */}
              <path d={`M -42 -38 C -30 -6, -18 20, -7 ${isFullWrap ? 88 : 48}`} fill="none" stroke="#0D100D" strokeWidth="0.9" opacity="0.45" />
              <path d={`M 42 -38 C 30 -6, 18 20, 7 ${isFullWrap ? 88 : 48}`} fill="none" stroke="#0D100D" strokeWidth="0.9" opacity="0.45" />
            </g>
          )}

          {/* 3. LAYERED PREMIUM WHITE / IVORY LINEN WRAP */}
          {preset === "layered_premium_wrap" && (
            <g filter={`url(#backPaperShadow_${uniqueId})`}>
              {/* Center Tier Sheet tapering gracefully to waist / base */}
              <path
                d={
                  isFullWrap
                    ? "M -78 -36 C -40 -46, 40 -46, 78 -36 C 70 2, 52 26, 30 36 C 22 42, 18 46, 15 48 C 13 60, 10 74, 9 88 L -9 88 C -10 74, -13 60, -15 48 C -18 46, -22 42, -30 36 C -52 26, -70 2, -78 -36 Z"
                    : "M -78 -36 C -40 -46, 40 -46, 78 -36 C 70 2, 52 26, 30 36 C 22 42, 18 46, 15 48 L -15 48 C -18 46, -22 42, -30 36 C -52 26, -70 2, -78 -36 Z"
                }
                fill={`url(#backGrad_${uniqueId})`}
                stroke={paperBorder}
                strokeWidth="1.1"
              />
              {/* Left Wing Pleat */}
              <path
                d={
                  isFullWrap
                    ? "M -82 -28 L -34 -42 L -5 88 L -10 88 C -22 60, -40 30, -82 -28 Z"
                    : "M -82 -28 L -34 -42 L -6 48 L -18 48 C -40 30, -64 4, -82 -28 Z"
                }
                fill={`url(#innerGrad_${uniqueId})`}
                stroke={paperBorder}
                strokeWidth="0.85"
              />
              {/* Right Wing Pleat */}
              <path
                d={
                  isFullWrap
                    ? "M 82 -28 L 34 -42 L 5 88 L 10 88 C 22 60, 40 30, 82 -28 Z"
                    : "M 82 -28 L 34 -42 L 6 48 L 18 48 C 40 30, 64 4, 82 -28 Z"
                }
                fill="#FFFFFF"
                fillOpacity="0.95"
                stroke={paperBorder}
                strokeWidth="0.85"
              />
              {/* Subtle pleat lines converging to waist / base */}
              <line x1="-34" y1="-42" x2="-6" y2={isFullWrap ? 88 : 48} stroke={paperBorder} strokeWidth="0.9" opacity="0.6" />
              <line x1="34" y1="-42" x2="6" y2={isFullWrap ? 88 : 48} stroke={paperBorder} strokeWidth="0.9" opacity="0.6" />
            </g>
          )}

          {/* 4. SOFT BLUSH SILK / LINEN WRAP */}
          {preset === "soft_paper_cone" && (
            <g filter={`url(#backPaperShadow_${uniqueId})`}>
              {/* Soft Scalloped Blush Outer Paper with organic waist cinch / base */}
              <path
                d={
                  isFullWrap
                    ? "M -80 -30 C -48 -42, 0 -42, 48 -42 C 68 -36, 80 -30, 80 -30 C 72 2, 52 26, 30 36 C 22 42, 18 46, 15 48 C 13 60, 10 74, 9 88 L -9 88 C -10 74, -13 60, -15 48 C -18 46, -22 42, -30 36 C -52 26, -72 2, -80 -30 Z"
                    : "M -80 -30 C -48 -42, 0 -42, 48 -42 C 68 -36, 80 -30, 80 -30 C 72 2, 52 26, 30 36 C 22 42, 18 46, 15 48 L -15 48 C -18 46, -22 42, -30 36 C -52 26, -72 2, -80 -30 Z"
                }
                fill={`url(#backGrad_${uniqueId})`}
                stroke={paperBorder}
                strokeWidth="1.1"
              />
              {/* Inner soft ivory linen liner */}
              <path
                d={
                  isFullWrap
                    ? "M -66 -22 C -32 -32, 32 -32, 66 -22 C 56 4, 38 24, 12 46 C 10 58, 8 72, 7 84 L -7 84 C -8 72, -10 58, -12 46 C -38 24, -56 4, -66 -22 Z"
                    : "M -66 -22 C -32 -32, 32 -32, 66 -22 C 56 4, 38 24, 12 46 L -12 46 C -38 24, -56 4, -66 -22 Z"
                }
                fill={`url(#innerGrad_${uniqueId})`}
              />
              {/* Soft organic drapery curves converging to waist / base */}
              <path d={`M -38 -36 C -26 -4, -15 22, -6 ${isFullWrap ? 88 : 48}`} fill="none" stroke={paperBorder} strokeWidth="1.0" opacity="0.5" />
              <path d={`M 38 -36 C 26 -4, 15 22, 6 ${isFullWrap ? 88 : 48}`} fill="none" stroke={paperBorder} strokeWidth="1.0" opacity="0.5" />
              <path d={`M 0 -42 L 0 ${isFullWrap ? 88 : 48}`} fill="none" stroke="#FFFFFF" strokeWidth="0.75" opacity="0.3" />
            </g>
          )}

          {/* 5. SAGE BOTANICAL WRAP */}
          {preset === "sage_wrap" && (
            <g filter={`url(#backPaperShadow_${uniqueId})`}>
              {/* Muted Sage Outer Paper cradling lower flower mass */}
              <path
                d={
                  isFullWrap
                    ? "M -82 -32 C -50 -44, 0 -44, 50 -44 C 70 -38, 82 -32, 82 -32 C 74 2, 54 26, 32 36 C 24 42, 18 46, 15 48 C 13 60, 10 74, 9 88 L -9 88 C -10 74, -13 60, -15 48 C -18 46, -24 42, -32 36 C -54 26, -74 2, -82 -32 Z"
                    : "M -82 -32 C -50 -44, 0 -44, 50 -44 C 70 -38, 82 -32, 82 -32 C 74 2, 54 26, 32 36 C 24 42, 18 46, 15 48 L -15 48 C -18 46, -24 42, -32 36 C -54 26, -74 2, -82 -32 Z"
                }
                fill={`url(#backGrad_${uniqueId})`}
                stroke={paperBorder}
                strokeWidth="1.1"
              />
              {/* Inner eucalyptus tissue liner */}
              <path
                d={
                  isFullWrap
                    ? "M -68 -24 C -35 -34, 35 -34, 68 -24 C 58 4, 40 24, 12 46 C 10 58, 8 72, 7 84 L -7 84 C -8 72, -10 58, -12 46 C -40 24, -58 4, -68 -24 Z"
                    : "M -68 -24 C -35 -34, 35 -34, 68 -24 C 58 4, 40 24, 12 46 L -12 46 C -40 24, -58 4, -68 -24 Z"
                }
                fill={`url(#innerGrad_${uniqueId})`}
              />
              {/* Natural paper fold creases */}
              <path d={`M -40 -38 C -28 -6, -16 20, -7 ${isFullWrap ? 88 : 48}`} fill="none" stroke={paperBorder} strokeWidth="1.0" opacity="0.45" />
              <path d={`M 40 -38 C 28 -6, 16 20, 7 ${isFullWrap ? 88 : 48}`} fill="none" stroke={paperBorder} strokeWidth="1.0" opacity="0.45" />
            </g>
          )}

          {/* 6. TRANSLUCENT VELLUM WRAP */}
          {preset === "translucent_wrap" && (
            <g filter={`url(#backPaperShadow_${uniqueId})`}>
              {/* Translucent Frosted Vellum with elegant cradle */}
              <path
                d={
                  isFullWrap
                    ? "M -80 -30 C -48 -42, 48 -42, 80 -30 C 72 2, 52 26, 30 36 C 22 42, 18 46, 15 48 C 13 60, 10 74, 9 88 L -9 88 C -10 74, -13 60, -15 48 C -18 46, -22 42, -30 36 C -52 26, -72 2, -80 -30 Z"
                    : "M -80 -30 C -48 -42, 48 -42, 80 -30 C 72 2, 52 26, 30 36 C 22 42, 18 46, 15 48 L -15 48 C -18 46, -22 42, -30 36 C -52 26, -72 2, -80 -30 Z"
                }
                fill={`url(#backGrad_${uniqueId})`}
                fillOpacity="0.75"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="1.3"
              />
              {/* Inner frosted diffusion layer */}
              <path
                d={
                  isFullWrap
                    ? "M -65 -22 C -30 -32, 30 -32, 65 -22 C 55 4, 36 24, 11 46 C 10 58, 8 72, 7 84 L -7 84 C -8 72, -10 58, -11 46 C -36 24, -55 4, -65 -22 Z"
                    : "M -65 -22 C -30 -32, 30 -32, 65 -22 C 55 4, 36 24, 11 46 L -11 46 C -36 24, -55 4, -65 -22 Z"
                }
                fill="rgba(255, 255, 255, 0.5)"
              />
            </g>
          )}

          {/* 7. BOTANICAL GARDEN BURLAP WRAP */}
          {preset === "small_hand_tied_wrap" && (
            <g filter={`url(#backPaperShadow_${uniqueId})`}>
              {/* Rustic Burlap Hessian Shell */}
              <path
                d={
                  isFullWrap
                    ? "M -78 -28 C -45 -38, 45 -38, 78 -28 C 70 2, 50 26, 30 36 C 22 42, 18 46, 15 48 C 13 60, 10 74, 9 88 L -9 88 C -10 74, -13 60, -15 48 C -18 46, -22 42, -30 36 C -50 26, -70 2, -78 -28 Z"
                    : "M -78 -28 C -45 -38, 45 -38, 78 -28 C 70 2, 50 26, 30 36 C 22 42, 18 46, 15 48 L -15 48 C -18 46, -22 42, -30 36 C -50 26, -70 2, -78 -28 Z"
                }
                fill={`url(#backGrad_${uniqueId})`}
                stroke={paperBorder}
                strokeWidth="1.2"
              />
              {/* Raw linen liner */}
              <path
                d={
                  isFullWrap
                    ? "M -64 -20 C -28 -28, 28 -28, 64 -20 C 54 4, 36 24, 11 46 C 10 58, 8 72, 7 84 L -7 84 C -8 72, -10 58, -11 46 C -36 24, -54 4, -64 -20 Z"
                    : "M -64 -20 C -28 -28, 28 -28, 64 -20 C 54 4, 36 24, 11 46 L -11 46 C -36 24, -54 4, -64 -20 Z"
                }
                fill={`url(#innerGrad_${uniqueId})`}
              />
              {/* Textural burlap folds */}
              <path d={`M -36 -32 C -24 -4, -14 20, -6 ${isFullWrap ? 88 : 48}`} fill="none" stroke={paperBorder} strokeWidth="1.1" opacity="0.5" />
              <path d={`M 36 -32 C 24 -4, 14 20, 6 ${isFullWrap ? 88 : 48}`} fill="none" stroke={paperBorder} strokeWidth="1.1" opacity="0.5" />
            </g>
          )}

          {/* 8. DEFAULT: NATURAL KRAFT CONE */}
          {(preset === "kraft_cone" ||
            !["japanese_minimal_wrap", "dark_luxury_wrap", "layered_premium_wrap", "soft_paper_cone", "sage_wrap", "translucent_wrap", "small_hand_tied_wrap"].includes(preset)) && (
            <g filter={`url(#backPaperShadow_${uniqueId})`}>
              {/* Main Kraft Backdrop Sheet cradling lower flower stems */}
              <path
                d={
                  isFullWrap
                    ? "M -82 -32 C -50 -44, 0 -44, 50 -44 C 70 -38, 82 -32, 82 -32 C 74 2, 54 26, 32 36 C 24 42, 18 46, 15 48 C 13 60, 10 74, 9 88 L -9 88 C -10 74, -13 60, -15 48 C -18 46, -24 42, -32 36 C -54 26, -74 2, -82 -32 Z"
                    : "M -82 -32 C -50 -44, 0 -44, 50 -44 C 70 -38, 82 -32, 82 -32 C 74 2, 54 26, 32 36 C 24 42, 18 46, 15 48 L -15 48 C -18 46, -24 42, -32 36 C -54 26, -74 2, -82 -32 Z"
                }
                fill={`url(#backGrad_${uniqueId})`}
                stroke={paperBorder}
                strokeWidth="1.2"
              />

              {/* Inner Parchment / Tissue Liner peeking behind lower stems */}
              <path
                d={
                  isFullWrap
                    ? "M -68 -24 C -35 -34, 35 -34, 68 -24 C 58 4, 40 24, 12 46 C 10 58, 8 72, 7 84 L -7 84 C -8 72, -10 58, -12 46 C -40 24, -58 4, -68 -24 Z"
                    : "M -68 -24 C -35 -34, 35 -34, 68 -24 C 58 4, 40 24, 12 46 L -12 46 C -40 24, -58 4, -68 -24 Z"
                }
                fill={`url(#innerGrad_${uniqueId})`}
              />

              {/* Natural Kraft Paper Fold Creases & Scoring converging into the waist / base */}
              <path
                d={`M -40 -38 C -28 -6, -16 20, -7 ${isFullWrap ? 88 : 48}`}
                fill="none"
                stroke={paperBorder}
                strokeWidth="1.1"
                opacity="0.5"
              />
              <path
                d={`M 40 -38 C 28 -6, 16 20, 7 ${isFullWrap ? 88 : 48}`}
                fill="none"
                stroke={paperBorder}
                strokeWidth="1.1"
                opacity="0.5"
              />
              <path
                d={`M 0 -44 L 0 ${isFullWrap ? 88 : 48}`}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="0.7"
                opacity="0.3"
              />
            </g>
          )}
        </g>
      </svg>
    );
  }

  // =========================================================================
  // LAYER 3: FRONT WRAPPING COLLAR & TAPERED PLEATS (Lower Third Only)
  // =========================================================================
  if (layer === "front") {
    const isDarkLuxury = preset === "dark_luxury_wrap";
    const paperColor = wrapping?.paperColor || "#C9AE8D";
    const paperBorder = wrapping?.paperBorder || "#B59775";
    const innerPaperColor = wrapping?.innerPaperColor || "#EFE8DC";
    const frontBaseColor = isDarkLuxury ? "#121512" : paperBorder;
    const goldAccent = "#C6A85A";

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="-170 -150 340 300"
        preserveAspectRatio="xMidYMid meet"
        style={{ zIndex: 25 }}
      >
        <defs>
          <filter id={`foldShadow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="-0.8" dy="2" stdDeviation="2" floodColor="#0A0805" floodOpacity="0.22" />
          </filter>

          <linearGradient id={`frontLeftGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={innerPaperColor} />
            <stop offset="100%" stopColor={paperColor} />
          </linearGradient>

          <linearGradient id={`frontRightGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={paperColor} />
            <stop offset="100%" stopColor={frontBaseColor} />
          </linearGradient>
        </defs>

        {/* ---------------- FRONT WRAPPING COLLAR (LOWER STEMS ONLY) ---------------- */}
        <g transform={shapeTransform}>
          {preset === "dark_luxury_wrap" ? (
            <g>
              {/* Left Diagonal Matte Charcoal Flap */}
              <path
                d={
                  isFullWrap
                    ? "M -54 18 C -36 28, -10 38, 12 46 C 14 58, 11 74, 8 88 L -9 88 C -10 74, -13 60, -15 48 C -32 40, -46 28, -54 18 Z"
                    : "M -54 18 C -36 28, -10 38, 14 46 L -15 48 C -32 40, -46 28, -54 18 Z"
                }
                fill={`url(#frontLeftGrad_${uniqueId})`}
                stroke={goldAccent}
                strokeWidth="0.9"
                opacity="0.95"
              />
              {/* Right Overlapping Diagonal Matte Charcoal Flap */}
              <path
                d={
                  isFullWrap
                    ? "M 58 12 C 36 26, 10 38, -12 46 C -14 58, -11 74, -9 88 L 9 88 C 11 74, 13 60, 15 48 C 34 40, 48 26, 58 12 Z"
                    : "M 58 12 C 36 26, 10 38, -14 46 L 15 48 C 34 40, 48 26, 58 12 Z"
                }
                fill={`url(#frontRightGrad_${uniqueId})`}
                stroke={goldAccent}
                strokeWidth="1.1"
                filter={`url(#foldShadow_${uniqueId})`}
              />
              {/* Gold accent crease at neck gathering / base */}
              <path
                d={isFullWrap ? "M -9 88 C -3 86, 3 86, 9 88" : "M -15 48 C -5 45, 5 45, 15 48"}
                fill="none"
                stroke={goldAccent}
                strokeWidth="0.9"
                opacity="0.8"
              />
            </g>
          ) : preset === "japanese_minimal_wrap" ? (
            <g>
              {/* Clean Origami Diagonal Fold */}
              <path
                d={
                  isFullWrap
                    ? "M -52 18 L 12 46 L 8 88 L -9 88 L -15 48 Z"
                    : "M -52 18 L 14 46 L -15 48 Z"
                }
                fill={`url(#frontLeftGrad_${uniqueId})`}
                stroke={paperBorder}
                strokeWidth="1.0"
              />
              <path
                d={
                  isFullWrap
                    ? "M 56 12 L -12 46 L -8 88 L 9 88 L 15 48 Z"
                    : "M 56 12 L -14 46 L 15 48 Z"
                }
                fill={`url(#frontRightGrad_${uniqueId})`}
                stroke={paperBorder}
                strokeWidth="1.2"
                filter={`url(#foldShadow_${uniqueId})`}
              />
            </g>
          ) : (
            /* Standard / Kraft / Linen / Blush / Sage / Burlap overlapping front collar */
            <g>
              {/* Left Diagonal Flap wrapping across lower stems */}
              <path
                d={
                  isFullWrap
                    ? "M -54 18 C -36 28, -10 38, 12 46 C 14 58, 11 74, 8 88 L -9 88 C -10 74, -13 60, -15 48 C -32 40, -46 28, -54 18 Z"
                    : "M -54 18 C -36 28, -10 38, 14 46 L -15 48 C -32 40, -46 28, -54 18 Z"
                }
                fill={`url(#frontLeftGrad_${uniqueId})`}
                stroke={paperBorder}
                strokeWidth="1.0"
              />
              {/* Right Overlapping Diagonal Flap */}
              <path
                d={
                  isFullWrap
                    ? "M 58 12 C 36 26, 10 38, -12 46 C -14 58, -11 74, -9 88 L 9 88 C 11 74, 13 60, 15 48 C 34 40, 48 26, 58 12 Z"
                    : "M 58 12 C 36 26, 10 38, -14 46 L 15 48 C 34 40, 48 26, 58 12 Z"
                }
                fill={`url(#frontRightGrad_${uniqueId})`}
                stroke={paperBorder}
                strokeWidth="1.2"
                filter={`url(#foldShadow_${uniqueId})`}
              />
              {/* Gathered paper pinch creases right above the binding band */}
              <path
                d={isFullWrap ? "M -14 46 C -12 56, -9 70, -6 88" : "M -18 34 C -14 38, -10 42, -6 48"}
                fill="none"
                stroke={paperBorder}
                strokeWidth="0.9"
                opacity="0.5"
              />
              <path
                d={isFullWrap ? "M 14 46 C 12 56, 9 70, 6 88" : "M 18 34 C 14 38, 10 42, 6 48"}
                fill="none"
                stroke={paperBorder}
                strokeWidth="0.9"
                opacity="0.5"
              />
              {/* Subtle creased fold highlight along right flap edge */}
              <path
                d={
                  isFullWrap
                    ? "M 58 12 C 36 26, 10 38, -12 46 C -14 58, -11 74, -9 88"
                    : "M 58 12 C 36 26, 10 38, -14 46"
                }
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="0.8"
                opacity="0.35"
              />
            </g>
          )}
        </g>
      </svg>
    );
  }

  // =========================================================================
  // LAYER 4: FLORIST HAND-TIED BINDING RIBBON & 3D BOW (Stage 2 Neck Binding)
  // =========================================================================
  if (layer === "ribbon") {
    const ribbonColor = ribbon?.color || "#A0805B";
    const ribbonBorder = ribbon?.borderColor || "#7A5E3E";
    const ribbonTransform = isFullWrap
      ? `translate(0, ${28 + wrapOffsetY}) scale(0.92, 0.92)`
      : wrapOffsetY !== 0
      ? `translate(0, ${wrapOffsetY})`
      : undefined;

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="-170 -150 340 300"
        preserveAspectRatio="xMidYMid meet"
        style={{ zIndex: 60 }}
      >
        <defs>
          <filter id={`ribbonShadow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.5" dy="1.8" stdDeviation="1.5" floodColor="#0A0805" floodOpacity="0.30" />
          </filter>

          <linearGradient id={`ribbonBandGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={ribbonBorder} />
            <stop offset="25%" stopColor={ribbonColor} />
            <stop offset="75%" stopColor={ribbonColor} />
            <stop offset="100%" stopColor={ribbonBorder} />
          </linearGradient>

          <linearGradient id={`ribbonTailLeftGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ribbonColor} />
            <stop offset="100%" stopColor={ribbonBorder} />
          </linearGradient>

          <linearGradient id={`ribbonTailRightGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ribbonColor} />
            <stop offset="100%" stopColor={ribbonBorder} />
          </linearGradient>
        </defs>

        <g id={`florist-ribbon-binding_${uniqueId}`} filter={`url(#ribbonShadow_${uniqueId})`} transform={ribbonTransform}>
          {/* A. Gathered Binding Band wrapping tightly around the narrowed neck waist */}
          <path
            d="M -15 46 C -5 44, 5 44, 15 46 L 14 55 C 5 57, -5 57, -14 55 Z"
            fill={`url(#ribbonBandGrad_${uniqueId})`}
            stroke={ribbonBorder}
            strokeWidth="1.0"
          />
          {/* Silky light specular highlight on wrap band */}
          <path
            d="M -12 49 C -4 47, 4 47, 12 49"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.85"
            opacity="0.55"
          />

          {/* B. Left Ribbon Loop */}
          <path
            d="M -3 51 C -10 41, -24 43, -21 53 C -18 59, -7 55, -3 52 Z"
            fill={ribbonColor}
            stroke={ribbonBorder}
            strokeWidth="1.0"
          />
          {/* Left loop inner shadow */}
          <path
            d="M -4 51 C -12 45, -19 46, -17 52 C -15 56, -8 53, -4 52 Z"
            fill={ribbonBorder}
            opacity="0.3"
          />

          {/* C. Right Ribbon Loop */}
          <path
            d="M 3 51 C 10 41, 24 43, 21 53 C 18 59, 7 55, 3 52 Z"
            fill={ribbonColor}
            stroke={ribbonBorder}
            strokeWidth="1.0"
          />
          {/* Right loop inner shadow */}
          <path
            d="M 4 51 C 12 45, 19 46, 17 52 C 15 56, 8 53, 4 52 Z"
            fill={ribbonBorder}
            opacity="0.3"
          />

          {/* D. Center Knot (Soft 3D knot) */}
          <ellipse
            cx="0"
            cy="51"
            rx="5.2"
            ry="4.4"
            fill={ribbonColor}
            stroke={ribbonBorder}
            strokeWidth="1.1"
          />
          {/* Knot crease highlight */}
          <path
            d="M -2.8 49 C -0.6 48, 1.6 48.5, 2.8 50.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.85"
            opacity="0.6"
          />

          {/* E. Left Draping Ribbon Tail with natural wave and V-notch cut */}
          <path
            d="M -3 53 C -7 62, -14 73, -11 83 L -7 80 C -9 71, -4 61, 0 53 Z"
            fill={`url(#ribbonTailLeftGrad_${uniqueId})`}
            stroke={ribbonBorder}
            strokeWidth="0.75"
          />

          {/* F. Right Draping Ribbon Tail with natural wave and V-notch cut */}
          <path
            d="M 3 53 C 7 62, 14 73, 11 85 L 7 82 C 9 72, 4 61, 0 53 Z"
            fill={`url(#ribbonTailRightGrad_${uniqueId})`}
            stroke={ribbonBorder}
            strokeWidth="0.75"
          />
        </g>
      </svg>
    );
  }

  return null;
};

