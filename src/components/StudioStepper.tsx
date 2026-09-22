import React from "react";
import {
  Calendar,
  Sparkles,
  Flower2,
  Move,
  Package,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

export type StudioStepId =
  | "occasion"
  | "style"
  | "flowers"
  | "arrange"
  | "wrapping"
  | "analyze";

export interface StudioStepDef {
  id: StudioStepId;
  stepNumber: number;
  label: string;
  vietnamese: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const STUDIO_STEPS: StudioStepDef[] = [
  {
    id: "occasion",
    stepNumber: 1,
    label: "Occasion",
    vietnamese: "Dịp tặng",
    icon: Calendar,
  },
  {
    id: "style",
    stepNumber: 2,
    label: "Style",
    vietnamese: "Phong cách",
    icon: Sparkles,
  },
  {
    id: "flowers",
    stepNumber: 3,
    label: "Flowers",
    vietnamese: "Chọn hoa",
    icon: Flower2,
  },
  {
    id: "arrange",
    stepNumber: 4,
    label: "Arrange",
    vietnamese: "Xếp dáng & Layer",
    icon: Move,
  },
  {
    id: "wrapping",
    stepNumber: 5,
    label: "Wrapping",
    vietnamese: "Giấy gói & Nơ",
    icon: Package,
  },
  {
    id: "analyze",
    stepNumber: 6,
    label: "Analyze",
    vietnamese: "Đánh giá & AI",
    icon: CheckCircle2,
  },
];

interface StudioStepperProps {
  currentStep: StudioStepId;
  onSelectStep: (step: StudioStepId) => void;
  totalStems: number;
  score: number;
  onReset?: () => void;
}

export const StudioStepper: React.FC<StudioStepperProps> = ({
  currentStep,
  onSelectStep,
  totalStems,
  score,
  onReset,
}) => {
  const currentIndex = STUDIO_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div
      id="studio-step-progress-bar"
      className="bg-white rounded-2xl border border-[#E8E4D9] p-2.5 sm:p-3 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {/* Step Items */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-max">
          {STUDIO_STEPS.map((step, idx) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = idx < currentIndex;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isCompleted
                        ? "text-[#2D4F1E]"
                        : "text-[#E8E4D9]"
                    }`}
                  />
                )}

                <button
                  type="button"
                  id={`studio-step-btn-${step.id}`}
                  onClick={() => onSelectStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer text-left ${
                    isCurrent
                      ? "bg-[#2D4F1E] text-white shadow-sm font-semibold"
                      : isCompleted
                      ? "bg-[#FAF8F3] text-[#2D4F1E] border border-[#2D4F1E]/20 hover:bg-[#F3EFE6]"
                      : "text-[#2D2D2D]/60 hover:text-[#2D2D2D] hover:bg-[#FAF8F3]"
                  }`}
                >
                  {/* Step Number Circle / Icon */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isCurrent
                        ? "bg-white text-[#2D4F1E]"
                        : isCompleted
                        ? "bg-[#2D4F1E] text-white"
                        : "bg-[#EAE5DA] text-[#2D2D2D]/70"
                    }`}
                  >
                    {isCompleted ? "✓" : step.stepNumber}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-serif font-bold whitespace-nowrap leading-none">
                      {step.label}
                    </span>
                    <span
                      className={`text-[10px] hidden md:block whitespace-nowrap mt-0.5 ${
                        isCurrent
                          ? "text-white/80"
                          : isCompleted
                          ? "text-[#2D4F1E]/80"
                          : "text-[#2D2D2D]/50"
                      }`}
                    >
                      {step.vietnamese}
                    </span>
                  </div>

                  {step.id === "flowers" && totalStems > 0 && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ml-0.5 ${
                        isCurrent
                          ? "bg-white/20 text-white"
                          : "bg-[#2D4F1E] text-white"
                      }`}
                    >
                      {totalStems}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Side Stats: Stems count & Quick Score badge */}
        <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-[#E8E4D9] shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#2D2D2D]/50">
              Bouquet Stems
            </div>
            <div className="text-xs font-bold text-[#2D4F1E]">
              {totalStems} {totalStems === 1 ? "stem" : "stems"} selected
            </div>
          </div>

          <div
            className={`px-2.5 py-1 rounded-xl border text-xs font-bold font-mono ${
              score >= 85
                ? "bg-[#EAF3E6] text-[#2D4F1E] border-[#C8DEC0]"
                : score >= 70
                ? "bg-[#F3EFE6] text-[#63553D] border-[#DDD5C5]"
                : "bg-[#FAF1E4] text-[#8C5D23] border-[#EDD9BF]"
            }`}
            title="Current Deterministic Score"
          >
            Score {score}/100
          </div>
        </div>
      </div>
    </div>
  );
};
