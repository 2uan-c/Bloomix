import React from "react";
import type { BouquetScoreResult, Occasion, BouquetStyle } from "../engine/types.ts";
import { Palette, GitMerge, Sparkles, Calendar, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface ScoreDashboardProps {
  scoreResult: BouquetScoreResult | null;
  selectedOccasion?: Occasion;
  selectedStyle?: BouquetStyle;
  onConsultAI?: () => void;
  isLoadingAI?: boolean;
}

export const ScoreDashboard: React.FC<ScoreDashboardProps> = ({
  scoreResult,
  selectedOccasion,
  selectedStyle,
  onConsultAI,
  isLoadingAI = false,
}) => {
  if (!scoreResult) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E4D9] p-6 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF8F3] border border-[#E8E4D9] flex items-center justify-center text-xl">
          🎯
        </div>
        <h3 className="font-serif text-base font-bold text-[#2D2D2D]">
          Bloomix Deterministic Score Engine
        </h3>
        <p className="text-xs text-[#2D2D2D]/60 max-w-xs mx-auto">
          Please select an occasion, a style, and at least one flower to calculate the deterministic score.
        </p>
      </div>
    );
  }

  const { overall, rating, color, compatibility, style, occasion } = scoreResult;

  // Color schemes for score tiers in Artistic Flair theme
  const getScoreColorClass = (score: number) => {
    if (score >= 90) return "text-[#2D4F1E]";
    if (score >= 80) return "text-[#3D6B28]";
    if (score >= 70) return "text-[#8B5A2B]";
    if (score >= 60) return "text-[#B8621B]";
    return "text-[#8B3A3A]";
  };

  const getStrokeColor = (score: number) => {
    if (score >= 90) return "#2D4F1E"; // Forest green
    if (score >= 80) return "#3D6B28"; // Botanical green
    if (score >= 70) return "#8B5A2B"; // Warm amber/clay
    if (score >= 60) return "#B8621B"; // Terracotta
    return "#8B3A3A"; // Vintage rose/wine
  };

  // SVG Progress Ring calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall / 100) * circumference;

  const categories = [
    {
      id: "color",
      name: "Color Harmony",
      vietnamese: "Hài hòa màu sắc",
      score: color.score,
      weight: "25%",
      explanation: "Evaluates palette coherence, temperature balance, and saturation harmony based on 1–2 dominant floral colors.",
      icon: Palette,
      issues: color.issues,
    },
    {
      id: "compatibility",
      name: "Flower Compatibility",
      vietnamese: "Tương thích loài hoa",
      score: compatibility.score,
      weight: "30%",
      explanation: "Measures floral hierarchy (focal anchor, supporting blooms, airy filler/foliage) and visual weight balance.",
      icon: GitMerge,
      issues: compatibility.issues,
    },
    {
      id: "style",
      name: "Style Consistency",
      vietnamese: "Đồng nhất phong cách",
      score: style.score,
      weight: "20%",
      explanation: `Measures aesthetic alignment with the '${selectedStyle?.name || "Selected"}' style guidelines and variety restraint.`,
      icon: Sparkles,
      issues: style.issues,
    },
    {
      id: "occasion",
      name: "Occasion Suitability",
      vietnamese: "Phù hợp hoàn cảnh",
      score: occasion.score,
      weight: "25%",
      explanation: `Evaluates cultural symbolism and floral etiquette for '${selectedOccasion?.name || "Selected Occasion"}'.`,
      icon: Calendar,
      issues: occasion.issues,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5 sm:p-6 shadow-xs space-y-6" id="score-result-dashboard">
      {/* Top Section: Overall Score Circular Ring */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 bg-gradient-to-r from-[#FAF8F3] via-[#F5F1E8] to-[#FAF8F3] p-5 sm:p-6 rounded-2xl border border-[#E8E4D9]">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAE5D8] text-[#2D4F1E] text-xs font-semibold border border-[#2D4F1E]/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Deterministic Scoring Engine</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2D2D2D]">
            Bloomix Score
          </h2>
          <p className="text-xs text-[#2D2D2D]/70 max-w-sm">
            Evaluated for <strong className="text-[#2D2D2D]">{selectedOccasion?.name || "Occasion"}</strong> in a <strong className="text-[#2D2D2D]">{selectedStyle?.name || "Style"}</strong> aesthetic.
          </p>
        </div>

        {/* Circular Progress Meter */}
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-[#E8E4D9]"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Foreground animated progress */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke={getStrokeColor(overall)}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-serif text-3xl font-extrabold tracking-tight ${getScoreColorClass(overall)}`}>
                {overall}
              </span>
              <span className="text-[11px] font-medium text-[#2D2D2D]/50">out of 100</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className={`font-serif text-base font-bold ${getScoreColorClass(overall)}`}>
              {rating.label}
            </div>
            <div className="text-[11px] text-[#2D2D2D]/65">
              {overall >= 80 ? "Exceeds standard floral composition guidelines." : "Adjust flower roles or colors to optimize score."}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Score Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const scoreClass = getScoreColorClass(cat.score);

          return (
            <div
              key={cat.id}
              id={`score-card-${cat.id}`}
              className="p-4 rounded-xl border border-[#E8E4D9] bg-[#FAF8F3] space-y-2.5 transition-all hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white border border-[#E8E4D9] text-[#2D4F1E]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-serif font-semibold text-xs text-[#2D2D2D]">
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-[#2D2D2D]/60">
                      {cat.vietnamese} (Weight: {cat.weight})
                    </div>
                  </div>
                </div>

                <div className={`font-serif text-xl font-bold ${scoreClass}`}>
                  {cat.score}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-[#E8E4D9] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${cat.score}%`,
                    backgroundColor: getStrokeColor(cat.score),
                  }}
                />
              </div>

              {/* Short explanation of what this category evaluates */}
              <p className="text-[11px] text-[#2D2D2D]/70 leading-relaxed italic">
                {cat.explanation}
              </p>

              {/* Issues/Insights if any */}
              {cat.issues.length > 0 ? (
                <div className="space-y-1 pt-1">
                  {cat.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-1.5 text-[11px] text-[#2D2D2D]/75"
                    >
                      <AlertTriangle
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          issue.severity === "high"
                            ? "text-[#8B3A3A]"
                            : issue.severity === "medium"
                            ? "text-[#B8621B]"
                            : "text-[#2D4F1E]"
                        }`}
                      />
                      <span className="leading-snug">{issue.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-[#2D4F1E] font-medium pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2D4F1E]" />
                  <span>Flawless standard alignment!</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
