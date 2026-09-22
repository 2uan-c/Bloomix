import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type {
  BouquetItem,
  Flower,
  ScoreResult,
  Occasion,
  BouquetStyle,
  FlowerInstance,
  BouquetDraft,
} from "../engine/types.ts";
import { BouquetVisualizer } from "./BouquetVisualizer.tsx";
import { BouquetComposition } from "./BouquetComposition.tsx";
import { ScoreDashboard } from "./ScoreDashboard.tsx";
import { GeminiAdvisor } from "./GeminiAdvisor.tsx";
import {
  generateBouquetCanvasSnapshot,
  generateGeminiRealisticBouquetPrompt,
} from "../utils/bouquetSnapshotGenerator.ts";
import { saveBouquetToStorage } from "../utils/savedBouquetsStorage.ts";
import { resolveWrappingOption, resolveRibbonOption } from "../utils/botanicalImages.ts";
import { getBouquetShapeById } from "../data/bouquetShapesConfig.ts";
import { computeBouquetBoundingBox, computeBouquetFit } from "../utils/bouquetFitEngine.ts";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Layers,
  Copy,
  Check,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

interface BouquetAnalysisViewProps {
  bouquet: BouquetItem[];
  flowersMap: Map<string, Flower>;
  scoreResult: ScoreResult;
  selectedOccasion: Occasion;
  selectedStyle: BouquetStyle;
  selectedShapeId: string;
  selectedWrappingId: string;
  selectedRibbonId: string;
  wrapCoverage?: "top" | "full";
  instances?: FlowerInstance[];
  bouquetDraft?: BouquetDraft;
  onBackToEdit: () => void;
  onApplySubstitution?: (originalId: string, suggestedId: string) => void;
  onUpdateQuantity: (flowerId: string, delta: number) => void;
  onRemoveFlower: (flowerId: string) => void;
  onChangeColor: (flowerId: string, color: string) => void;
  onClearBouquet: () => void;
  onSelectShape: (id: string) => void;
  onSelectWrapping: (id: string) => void;
  onSelectRibbon: (id: string) => void;
  onInstancesChange?: (instances: FlowerInstance[]) => void;
}

export const BouquetAnalysisView: React.FC<BouquetAnalysisViewProps> = ({
  bouquet,
  flowersMap,
  scoreResult,
  selectedOccasion,
  selectedStyle,
  selectedShapeId,
  selectedWrappingId,
  selectedRibbonId,
  wrapCoverage = "top",
  instances,
  onBackToEdit,
  onApplySubstitution,
  onUpdateQuantity,
  onRemoveFlower,
  onChangeColor,
  onClearBouquet,
  onSelectShape,
  onSelectWrapping,
  onSelectRibbon,
  onInstancesChange,
}) => {
  // Save modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveBouquetName, setSaveBouquetName] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Copy Prompt & Download Reference state
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [isDownloadingReference, setIsDownloadingReference] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const wrapOption = useMemo(() => resolveWrappingOption(selectedWrappingId), [selectedWrappingId]);
  const ribbonOption = useMemo(() => resolveRibbonOption(selectedRibbonId), [selectedRibbonId]);
  const shapeConfig = useMemo(() => getBouquetShapeById(selectedShapeId), [selectedShapeId]);
  const totalStems = useMemo(() => bouquet.reduce((sum, item) => sum + item.quantity, 0), [bouquet]);

  // Generate dynamic prompt from the customer's actual final bouquet state
  const dynamicGeminiPrompt = useMemo(() => {
    return generateGeminiRealisticBouquetPrompt({
      occasion: {
        name: selectedOccasion.name,
        displayName: selectedOccasion.displayName,
      },
      style: {
        name: selectedStyle.name,
        description: selectedStyle.description,
      },
      shape: {
        name: shapeConfig.name,
      },
      wrapping: {
        name: wrapOption.name,
        paperColor: wrapOption.paperColor,
        wrapCoverage: wrapCoverage,
      },
      ribbon: {
        name: ribbonOption.name,
        color: ribbonOption.color,
      },
      bouquet,
      flowersMap,
      instances,
    });
  }, [
    selectedOccasion.name,
    selectedOccasion.displayName,
    selectedStyle.name,
    selectedStyle.description,
    shapeConfig.name,
    wrapOption.name,
    wrapOption.paperColor,
    ribbonOption.name,
    ribbonOption.color,
    bouquet,
    flowersMap,
    instances,
  ]);

  // Handle Copy Gemini Prompt
  const handleCopyPrompt = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(dynamicGeminiPrompt);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = dynamicGeminiPrompt;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch (err) {
      console.warn("Failed to copy prompt to clipboard:", err);
    }
  }, [dynamicGeminiPrompt]);

  // Handle Download Clean Design Reference
  const handleDownloadReference = useCallback(async () => {
    if (!instances || instances.length === 0) return;
    setIsDownloadingReference(true);
    setDownloadSuccess(false);

    try {
      const dataUrl = await generateBouquetCanvasSnapshot(
        instances,
        selectedWrappingId,
        selectedRibbonId,
        selectedShapeId,
        1024,
        1024,
        selectedStyle.id,
        wrapCoverage
      );

      if (dataUrl) {
        const link = document.createElement("a");
        const safeOccasion = (selectedOccasion.name || "occasion")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        const safeStyle = (selectedStyle.name || "style")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        link.download = `bloomix-${safeOccasion}-${safeStyle}-final-design.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Failed to export bouquet design snapshot:", err);
    } finally {
      setIsDownloadingReference(false);
    }
  }, [instances, selectedWrappingId, selectedRibbonId, selectedShapeId, selectedOccasion.name, selectedStyle.name]);

  // Handle Save Bouquet
  const handleOpenSaveModal = () => {
    const defaultName = `${selectedOccasion.name} ${selectedStyle.name} Bouquet`;
    setSaveBouquetName(defaultName);
    setShowSaveModal(true);
    setSaveSuccessMessage(null);
  };

  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveBouquetName.trim()) return;

    saveBouquetToStorage({
      name: saveBouquetName.trim(),
      occasionId: selectedOccasion.id,
      styleId: selectedStyle.id,
      shapeId: selectedShapeId,
      items: bouquet,
      instances: instances,
      wrappingId: selectedWrappingId,
      ribbonId: selectedRibbonId,
      wrapCoverage: wrapCoverage,
      score: scoreResult.overall,
    });

    setSaveSuccessMessage(`"${saveBouquetName.trim()}" saved to My Bouquets!`);
    setTimeout(() => {
      setShowSaveModal(false);
      setSaveSuccessMessage(null);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E4D9] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToEdit}
            className="text-xs sm:text-sm font-serif font-bold text-[#2D4F1E] hover:text-[#233F17] flex items-center gap-1.5 cursor-pointer px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] hover:bg-[#F3EFE6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Edit</span>
          </button>

          <div>
            <h2 className="font-serif font-bold text-lg sm:text-xl text-[#2D2D2D]">
              Bouquet Analysis
            </h2>
            <p className="text-xs text-[#2D2D2D]/60 hidden sm:block">
              {selectedOccasion.name} • {selectedStyle.name} • {shapeConfig.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#2D2D2D]/60 hidden sm:inline">
            Deterministic Score:
          </span>
          <span className="text-sm font-bold px-3 py-1.5 rounded-xl bg-[#EAF3E6] text-[#2D4F1E] border border-[#C8DEC0] shadow-2xs">
            {scoreResult.overall}/100 • {scoreResult.rating.label}
          </span>
        </div>
      </div>

      {/* SECTION 1: YOUR BOUQUET (DETERMINISTIC PREVIEW) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#2D4F1E] bg-[#2D4F1E]/10 px-2.5 py-0.5 rounded-md border border-[#2D4F1E]/20">
              Your Bouquet
            </span>
            <h3 className="font-serif font-bold text-base sm:text-lg text-[#2D2D2D]">
              Final Bouquet Composition
            </h3>
          </div>

          <span className="text-xs font-semibold text-[#2D4F1E] bg-white px-3 py-1 rounded-xl border border-[#E8E4D9] shadow-2xs">
            {totalStems} Stems • {bouquet.length} Varieties
          </span>
        </div>

        <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#E8E4D9] shadow-xs flex flex-col space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E8E4D9]/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D4F1E] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#2D2D2D]">
                  {selectedOccasion.name} {selectedStyle.name} Bouquet
                </h4>
                <p className="text-[11px] text-[#2D2D2D]/60">
                  {shapeConfig.name} Silhouette • Wrapped in {wrapOption.name} with {ribbonOption.name} Ribbon
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onBackToEdit}
              className="text-xs font-serif font-bold text-[#2D4F1E] hover:text-[#233F17] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Edit Arrangement</span>
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </button>
          </div>

          {/* Large Deterministic Bouquet Visualizer Preview Stage */}
          <div className="w-full min-h-[380px] sm:min-h-[440px] rounded-2xl bg-[#FAF8F3] border border-[#E8E4D9] p-6 flex items-center justify-center relative overflow-hidden">
            <div className="scale-90 sm:scale-100 transition-transform">
              <BouquetComposition
                instances={instances || []}
                wrapping={wrapOption}
                ribbon={ribbonOption}
                wrapCoverage={wrapCoverage}
                shapeId={selectedShapeId}
                tiePoint={{ x: 0, y: 52 }}
                interactive={false}
              />
            </div>
          </div>

          {/* Composition summary tags & Quick reference action */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#2D2D2D]/70">
            <div className="flex flex-wrap gap-1.5">
              {bouquet.map((item) => {
                const flower = flowersMap.get(item.flowerId);
                const color = item.selectedColor || (flower?.colors && flower.colors[0]) || "natural";
                return (
                  <span
                    key={item.flowerId}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D2D2D] font-medium text-[11px]"
                  >
                    {item.quantity}x {flower?.name || item.flowerId} ({color})
                  </span>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleDownloadReference}
              disabled={isDownloadingReference}
              className="text-xs font-serif font-semibold text-[#2D4F1E] hover:text-[#233F17] flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#E8E4D9] hover:bg-[#F3EFE6] transition-colors"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Design Reference Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingReference ? "Exporting..." : "Download Clean Design"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: BOUQUET SCORE & SCORE BREAKDOWN */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold tracking-widest text-[#2D4F1E] bg-[#2D4F1E]/10 px-2.5 py-0.5 rounded-md border border-[#2D4F1E]/20">
            Bouquet Score
          </span>
          <h3 className="font-serif font-bold text-base sm:text-lg text-[#2D2D2D]">
            Deterministic Evaluation &amp; Breakdown
          </h3>
        </div>

        <ScoreDashboard
          scoreResult={scoreResult}
          selectedOccasion={selectedOccasion}
          selectedStyle={selectedStyle}
        />
      </div>

      {/* SECTION 3: ASK BLOOMIX (GEMINI FLORAL ADVISOR) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold tracking-widest text-[#2D4F1E] bg-[#2D4F1E]/10 px-2.5 py-0.5 rounded-md border border-[#2D4F1E]/20">
            Ask Bloomix
          </span>
          <h3 className="font-serif font-bold text-base sm:text-lg text-[#2D2D2D]">
            Gemini Explanation &amp; Recommendations
          </h3>
        </div>

        <GeminiAdvisor
          scoreResult={scoreResult}
          bouquet={bouquet}
          flowersMap={flowersMap}
          selectedOccasion={selectedOccasion}
          selectedStyle={selectedStyle}
          onApplySubstitution={onApplySubstitution}
        />
      </div>

      {/* SECTION 4: SEE YOUR BOUQUET IN REAL LIFE */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold tracking-widest text-[#2D4F1E] bg-[#2D4F1E]/10 px-2.5 py-0.5 rounded-md border border-[#2D4F1E]/20">
            Real-World Visualization
          </span>
          <h3 className="font-serif font-bold text-base sm:text-lg text-[#2D2D2D]">
            See Your Bouquet in Real Life
          </h3>
        </div>

        <div className="bg-gradient-to-br from-white via-[#FAF8F3] to-[#F3EFE6] p-6 sm:p-8 rounded-3xl border border-[#E8E4D9] shadow-xs space-y-6">
          {/* Header & Description */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2D4F1E] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                </div>
                <h4 className="font-serif font-bold text-lg sm:text-xl text-[#2D2D2D]">
                  SEE YOUR BOUQUET IN REAL LIFE
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[#2D2D2D]/80 leading-relaxed font-serif">
                Take your final Bloomix design to Gemini and turn it into a realistic photograph.
              </p>
              <p className="text-xs text-[#2D4F1E] font-medium">
                Upload the downloaded design reference to Gemini, then paste the Bloomix prompt.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadReference}
                disabled={isDownloadingReference}
                className="px-5 py-3 rounded-xl bg-white hover:bg-[#FAF8F3] text-xs sm:text-sm font-serif font-bold text-[#2D2D2D] border border-[#E8E4D9] transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Reference Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#2D4F1E]" />
                    <span>{isDownloadingReference ? "Exporting..." : "Download Design Reference"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-5 py-3 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-xs sm:text-sm font-serif font-bold text-white transition-all cursor-pointer shadow-xs hover:shadow-sm flex items-center gap-2"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Prompt copied.</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Gemini Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Two Reference Roles Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-[#E8E4D9] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#EAF3E6] border border-[#C8DEC0] text-[#2D4F1E] text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <p className="font-serif font-bold text-xs sm:text-sm text-[#2D2D2D]">
                  Your Bloomix Image (Required)
                </p>
              </div>
              <p className="text-xs text-[#2D2D2D]/75 pl-8 leading-relaxed">
                → Tells Gemini <strong>what your bouquet looks like</strong> (exact flowers, colors, counts, shape, wrapping &amp; ribbon).
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-[#E8E4D9] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D4F1E] text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <p className="font-serif font-bold text-xs sm:text-sm text-[#2D2D2D]">
                  Optional Lifestyle Reference
                </p>
              </div>
              <p className="text-xs text-[#2D2D2D]/75 pl-8 leading-relaxed">
                → Tells Gemini <strong>how you want the bouquet photographed</strong> (human hand placement, pose, framing &amp; lighting).
              </p>
            </div>
          </div>

          {/* Simple 4-Step Quick Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-[#E8E4D9] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D4F1E] text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <p className="font-serif font-bold text-xs text-[#2D2D2D]">Download Reference</p>
                <p className="text-[11px] text-[#2D2D2D]/60 mt-0.5">
                  Save your clean bouquet image without toolbars or UI.
                </p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-[#E8E4D9] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D4F1E] text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <p className="font-serif font-bold text-xs text-[#2D2D2D]">Upload to Gemini</p>
                <p className="text-[11px] text-[#2D2D2D]/60 mt-0.5">
                  Attach the saved reference image into the Gemini app.
                </p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-[#E8E4D9] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D4F1E] text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <p className="font-serif font-bold text-xs text-[#2D2D2D]">Paste Bloomix Prompt</p>
                <p className="text-[11px] text-[#2D2D2D]/60 mt-0.5">
                  Click Copy Gemini Prompt above and paste it in chat.
                </p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-[#E8E4D9] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D4F1E] text-xs font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <div>
                <p className="font-serif font-bold text-xs text-[#2D2D2D]">Generate Photo</p>
                <p className="text-[11px] text-[#2D2D2D]/60 mt-0.5">
                  Ask Gemini to create your realistic florist photograph.
                </p>
              </div>
            </div>
          </div>

          {/* Collapsible Gemini Prompt Preview Section */}
          <div className="pt-2 border-t border-[#E8E4D9] space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPromptPreview((prev) => !prev)}
                className="text-xs font-serif font-bold text-[#2D4F1E] hover:text-[#233F17] flex items-center gap-1.5 cursor-pointer"
              >
                <span>{showPromptPreview ? "Hide Prompt ▴" : "View Prompt ▾"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="text-[11px] font-serif font-semibold text-[#2D4F1E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedPrompt ? "Prompt copied." : "Copy Prompt"}</span>
              </button>
            </div>

            {showPromptPreview && (
              <div className="relative rounded-2xl bg-white p-4 sm:p-5 border border-[#E8E4D9] text-xs text-[#2D2D2D]/85 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto shadow-2xs">
                {dynamicGeminiPrompt}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 5: FINAL ACTIONS BAR */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E4D9] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-[#2D2D2D]/70 space-y-0.5 text-center sm:text-left">
          <p className="font-serif font-bold text-sm text-[#2D2D2D]">
            {saveSuccessMessage || "Ready to save or store your bouquet?"}
          </p>
          <p className="text-[11px]">
            Your arrangement, score, and florist recommendations are saved deterministically.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBackToEdit}
            className="px-4 py-2.5 rounded-xl bg-[#FAF8F3] hover:bg-[#F3EFE6] text-xs font-serif font-bold text-[#2D2D2D] border border-[#E8E4D9] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Edit</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSaveModal}
            className="px-5 py-2.5 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-xs font-serif font-bold text-white transition-all cursor-pointer shadow-xs hover:shadow-sm flex items-center gap-1.5"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save Bouquet</span>
          </button>
        </div>
      </div>

      {/* SAVE BOUQUET MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#E8E4D9] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D4F1E] flex items-center justify-center">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">
                    Save Your Bouquet
                  </h3>
                  <p className="text-xs text-[#2D2D2D]/60">
                    Store arrangement to My Bouquets collection
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-1.5 rounded-lg text-[#2D2D2D]/60 hover:text-[#233F17] hover:bg-[#FAF8F3] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSave} className="space-y-4">
              <div>
                <label className="block text-xs font-serif font-bold text-[#2D2D2D] mb-1.5">
                  Bouquet Name
                </label>
                <input
                  type="text"
                  value={saveBouquetName}
                  onChange={(e) => setSaveBouquetName(e.target.value)}
                  placeholder="e.g. Romantic Rose Dome for Valentine"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] bg-[#FAF8F3] text-sm text-[#2D2D2D] focus:outline-none focus:border-[#2D4F1E] focus:ring-1 focus:ring-[#2D4F1E]"
                  autoFocus
                />
              </div>

              <div className="bg-[#FAF8F3] p-3 rounded-xl border border-[#E8E4D9] text-xs text-[#2D2D2D]/70 space-y-1">
                <div className="flex justify-between">
                  <span>Occasion:</span>
                  <span className="font-bold text-[#2D2D2D]">{selectedOccasion.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Style &amp; Shape:</span>
                  <span className="font-bold text-[#2D2D2D]">
                    {selectedStyle.name} ({shapeConfig.name})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Composition:</span>
                  <span className="font-bold text-[#2D2D2D]">{totalStems} stems</span>
                </div>
                <div className="flex justify-between">
                  <span>Deterministic Score:</span>
                  <span className="font-bold text-[#2D4F1E]">{scoreResult.overall}/100</span>
                </div>
              </div>

              {saveSuccessMessage && (
                <div className="p-3 bg-[#EAF3E6] border border-[#C8DEC0] rounded-xl text-xs text-[#2D4F1E] font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2D4F1E]" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF8F3] hover:bg-[#F3EFE6] text-xs font-serif font-bold text-[#2D2D2D] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!saveBouquetName.trim()}
                  className="px-5 py-2 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-xs font-serif font-bold text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Save Bouquet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
