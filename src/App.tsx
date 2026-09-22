import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  flowersList,
  flowersMap,
  occasionsList,
  stylesList,
  scoreBouquet,
  config,
} from "./engine/bouquetScorer.ts";
import type { BouquetItem, FlowerInstance, BouquetDraft } from "./engine/types.ts";
import { DEMO_PRESETS, type PresetBouquet } from "./data/presets.ts";
import { validateFlowerAssetRegistry, resolveWrappingOption, resolveRibbonOption } from "./utils/botanicalImages.ts";
import { type SavedBouquetRecord } from "./utils/savedBouquetsStorage.ts";
import { DEFAULT_SHAPE_BY_STYLE } from "./data/bouquetShapesConfig.ts";
import { getStyleCompositionProfile } from "./engine/styleComposition.ts";
import {
  generateInitialInstances,
  syncInstancesWithBouquet,
} from "./engine/bouquetInstanceManager.ts";

import { Header, type AppNavView } from "./components/Header.tsx";
import { StudioStepper, type StudioStepId } from "./components/StudioStepper.tsx";
import { OccasionPicker } from "./components/OccasionPicker.tsx";
import { StylePicker } from "./components/StylePicker.tsx";
import { FlowerCatalog } from "./components/FlowerCatalog.tsx";
import { WrappingPicker } from "./components/WrappingPicker.tsx";
import { BouquetVisualizer } from "./components/BouquetVisualizer.tsx";
import { MobileStudio } from "./components/MobileStudio.tsx";
import { BouquetAnalysisView } from "./components/BouquetAnalysisView.tsx";
import { PresetBar } from "./components/PresetBar.tsx";
import { ScoringTestMode } from "./components/ScoringTestMode.tsx";
import { ScoreDashboard } from "./components/ScoreDashboard.tsx";
import { GeminiAdvisor } from "./components/GeminiAdvisor.tsx";
import { MyBouquetsView } from "./components/MyBouquetsView.tsx";
import { InspirationView } from "./components/InspirationView.tsx";
import { FlowerGuideView } from "./components/FlowerGuideView.tsx";
import { HowItWorksView, AboutView } from "./components/HowItWorksView.tsx";

import { Sparkles, ArrowLeft, FlaskConical, AlertTriangle } from "lucide-react";

const INITIAL_BOUQUET: BouquetItem[] = [
  { flowerId: "rose", quantity: 3, selectedColor: "red" },
  { flowerId: "baby-breath", quantity: 2, selectedColor: "white" },
  { flowerId: "eucalyptus", quantity: 2, selectedColor: "green" },
];

export function App() {
  // Startup validation check: Verify that all flower assets exist
  useEffect(() => {
    validateFlowerAssetRegistry(flowersList.map((f) => f.id));
  }, []);

  // Navigation & Studio Workflow State
  const [activeView, setActiveView] = useState<AppNavView>("builder");
  const [studioStep, setStudioStep] = useState<StudioStepId>("occasion");

  // Configuration State
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>("valentines");
  const [selectedStyleId, setSelectedStyleId] = useState<string>("romantic");
  const [selectedShapeId, setSelectedShapeId] = useState<string>("round-dome");
  const [selectedWrappingId, setSelectedWrappingId] = useState<string>("kraft_cone");
  const [selectedRibbonId, setSelectedRibbonId] = useState<string>("rustic-twine");
  const [wrapCoverage, setWrapCoverage] = useState<"top" | "full">("top");
  const [wrappingSelectionSource, setWrappingSelectionSource] = useState<"default" | "user">("default");
  const [ribbonSelectionSource, setRibbonSelectionSource] = useState<"default" | "user">("default");
  const [activePresetId, setActivePresetId] = useState<string>("");
  const [showTestMode, setShowTestMode] = useState<boolean>(false);

  // Explicit user selection handlers
  const handleSelectWrapping = useCallback((id: string) => {
    setSelectedWrappingId(id);
    setWrappingSelectionSource("user");
  }, []);

  const handleSelectRibbon = useCallback((id: string) => {
    setSelectedRibbonId(id);
    setRibbonSelectionSource("user");
  }, []);

  const handleSelectWrapCoverage = useCallback((coverage: "top" | "full") => {
    setWrapCoverage(coverage);
  }, []);

  // Manual arrangement tracking & confirmation modal state
  const [hasManualArrangement, setHasManualArrangement] = useState<boolean>(false);
  const [pendingConfigChange, setPendingConfigChange] = useState<{
    type: "style" | "shape" | "preset" | "recipe";
    styleId?: string;
    shapeId?: string;
    preset?: PresetBouquet;
    recipe?: { items: BouquetItem[]; styleId: string };
    autoEvaluate?: boolean;
  } | null>(null);

  // Initial user bouquet
  const [bouquet, setBouquet] = useState<BouquetItem[]>(INITIAL_BOUQUET);

  // Authoritative flower instances state (Single Source of Truth)
  const [flowerInstances, setFlowerInstances] = useState<FlowerInstance[]>(() => {
    return generateInitialInstances(INITIAL_BOUQUET, flowersMap, "romantic", "round-dome");
  });

  // Single Authoritative Bouquet Draft Object
  const bouquetDraft: BouquetDraft = useMemo(() => ({
    occasion: selectedOccasionId,
    style: selectedStyleId,
    shape: selectedShapeId,
    wrapping: selectedWrappingId,
    ribbon: selectedRibbonId,
    wrapCoverage,
    flowerInstances,
  }), [selectedOccasionId, selectedStyleId, selectedShapeId, selectedWrappingId, selectedRibbonId, wrapCoverage, flowerInstances]);

  // Occasion and Style objects
  const selectedOccasion = useMemo(() => {
    return (
      occasionsList.occasions.find((o) => o.id === selectedOccasionId) ||
      occasionsList.occasions[0]
    );
  }, [selectedOccasionId]);

  const selectedStyle = useMemo(() => {
    return (
      stylesList.styles.find((s) => s.id === selectedStyleId) ||
      stylesList.styles[0]
    );
  }, [selectedStyleId]);

  // Synchronize default wrapping & ribbon when style changes (only if user hasn't explicitly chosen)
  useEffect(() => {
    const styleProfile = getStyleCompositionProfile(selectedStyleId);
    if (wrappingSelectionSource === "default" && styleProfile.defaultWrappingPreset) {
      const wrap = resolveWrappingOption(styleProfile.defaultWrappingPreset);
      setSelectedWrappingId(wrap.id);
    }
    if (ribbonSelectionSource === "default" && styleProfile.defaultRibbonId) {
      const rib = resolveRibbonOption(styleProfile.defaultRibbonId);
      setSelectedRibbonId(rib.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getStyleCompositionProfile, resolveWrappingOption, and resolveRibbonOption are stable pure functions
  }, [selectedStyleId, wrappingSelectionSource, ribbonSelectionSource]);

  // Deterministic Scoring Engine computation (Zero-latency, 100% deterministic)
  const scoreResult = useMemo(() => {
    return scoreBouquet(
      bouquet,
      selectedOccasionId,
      selectedStyleId,
      flowersMap,
      occasionsList,
      stylesList,
      config
    );
  }, [bouquet, selectedOccasionId, selectedStyleId]);

  const totalStems = useMemo(() => {
    return bouquet.reduce((sum, item) => sum + item.quantity, 0);
  }, [bouquet]);

  // Handlers
  const handleNavigateToAnalyze = () => {
    setStudioStep("analyze");
  };

  const executeSelectPreset = (preset: PresetBouquet, autoEvaluate = false) => {
    setActivePresetId(preset.id);
    setSelectedOccasionId(preset.occasionId);
    setSelectedStyleId(preset.styleId);
    const defaultShape = DEFAULT_SHAPE_BY_STYLE[preset.styleId] || "round-dome";
    setSelectedShapeId(defaultShape);
    setBouquet(preset.items);
    const fresh = generateInitialInstances(preset.items, flowersMap, preset.styleId, defaultShape);
    setFlowerInstances(fresh);
    setHasManualArrangement(false);
    if (autoEvaluate) {
      handleNavigateToAnalyze();
      setActiveView("builder");
    } else {
      setStudioStep("arrange");
      setActiveView("builder");
    }
  };

  const handleSelectPreset = (preset: PresetBouquet, autoEvaluate = false) => {
    if (hasManualArrangement) {
      setPendingConfigChange({ type: "preset", preset, autoEvaluate });
    } else {
      executeSelectPreset(preset, autoEvaluate);
    }
  };

  const handleLoadSavedBouquet = (saved: SavedBouquetRecord) => {
    setSelectedOccasionId(saved.occasionId || "valentines");
    setSelectedStyleId(saved.styleId || "romantic");
    const shape = saved.shapeId || DEFAULT_SHAPE_BY_STYLE[saved.styleId || "romantic"] || "round-dome";
    setSelectedShapeId(shape);
    if (saved.wrappingId) {
      setSelectedWrappingId(saved.wrappingId);
      setWrappingSelectionSource("user");
    }
    if (saved.ribbonId) {
      setSelectedRibbonId(saved.ribbonId);
      setRibbonSelectionSource("user");
    }
    if (saved.wrapCoverage) {
      setWrapCoverage(saved.wrapCoverage);
    } else {
      setWrapCoverage("top");
    }
    setBouquet(saved.items);
    if (saved.instances && saved.instances.length > 0) {
      setFlowerInstances(saved.instances);
      setHasManualArrangement(saved.instances.some((i) => i.isUserPositioned || i.isManuallyPositioned));
    } else {
      const fresh = generateInitialInstances(saved.items, flowersMap, saved.styleId || "romantic", shape);
      setFlowerInstances(fresh);
      setHasManualArrangement(false);
    }
    setActivePresetId("");
    setStudioStep("arrange");
    setActiveView("builder");
  };

  const executeApplyRecipe = (recipe: { items: BouquetItem[]; styleId: string }) => {
    setSelectedStyleId(recipe.styleId);
    const shape = DEFAULT_SHAPE_BY_STYLE[recipe.styleId] || "round-dome";
    setSelectedShapeId(shape);
    setBouquet(recipe.items);
    const fresh = generateInitialInstances(recipe.items, flowersMap, recipe.styleId, shape);
    setFlowerInstances(fresh);
    setHasManualArrangement(false);
    setActivePresetId("");
    setStudioStep("arrange");
  };

  const handleApplyOccasionRecipe = (recipe: { items: BouquetItem[]; styleId: string }) => {
    if (hasManualArrangement) {
      setPendingConfigChange({ type: "recipe", recipe });
    } else {
      executeApplyRecipe(recipe);
    }
  };

  const executeSelectStyle = (styleId: string) => {
    setSelectedStyleId(styleId);
    const shape = DEFAULT_SHAPE_BY_STYLE[styleId] || "round-dome";
    setSelectedShapeId(shape);
    const fresh = generateInitialInstances(bouquet, flowersMap, styleId, shape);
    setFlowerInstances(fresh);
    setHasManualArrangement(false);
    setActivePresetId("");
  };

  const handleRequestSelectStyle = (styleId: string) => {
    if (styleId === selectedStyleId) return;
    if (hasManualArrangement) {
      setPendingConfigChange({ type: "style", styleId });
    } else {
      executeSelectStyle(styleId);
    }
  };

  const executeSelectShape = (shapeId: string) => {
    setSelectedShapeId(shapeId);
    const fresh = generateInitialInstances(bouquet, flowersMap, selectedStyleId, shapeId);
    setFlowerInstances(fresh);
    setHasManualArrangement(false);
    setActivePresetId("");
  };

  const handleRequestSelectShape = (shapeId: string) => {
    if (shapeId === selectedShapeId) return;
    if (hasManualArrangement) {
      setPendingConfigChange({ type: "shape", shapeId });
    } else {
      executeSelectShape(shapeId);
    }
  };

  const handleConfirmPendingConfigChange = () => {
    if (!pendingConfigChange) return;
    if (pendingConfigChange.type === "style" && pendingConfigChange.styleId) {
      executeSelectStyle(pendingConfigChange.styleId);
    } else if (pendingConfigChange.type === "shape" && pendingConfigChange.shapeId) {
      executeSelectShape(pendingConfigChange.shapeId);
    } else if (pendingConfigChange.type === "preset" && pendingConfigChange.preset) {
      executeSelectPreset(pendingConfigChange.preset, pendingConfigChange.autoEvaluate);
    } else if (pendingConfigChange.type === "recipe" && pendingConfigChange.recipe) {
      executeApplyRecipe(pendingConfigChange.recipe);
    }
    setPendingConfigChange(null);
  };

  const handleAddFlower = (flowerId: string, color?: string) => {
    setActivePresetId("");
    const existing = bouquet.find((item) => item.flowerId === flowerId);
    const updated = existing
      ? bouquet.map((item) =>
          item.flowerId === flowerId
            ? {
                ...item,
                quantity: item.quantity + 1,
                selectedColor: color || item.selectedColor,
              }
            : item
        )
      : [...bouquet, { flowerId, quantity: 1, selectedColor: color }];

    setBouquet(updated);
    setFlowerInstances((prevInstances) =>
      syncInstancesWithBouquet(prevInstances, updated, flowersMap, selectedStyleId, selectedShapeId)
    );
  };

  const handleUpdateQuantity = (flowerId: string, delta: number) => {
    setActivePresetId("");
    const updated = bouquet
      .map((item) => {
        if (item.flowerId === flowerId) {
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        }
        return item;
      })
      .filter(Boolean) as BouquetItem[];

    setBouquet(updated);
    setFlowerInstances((prevInstances) =>
      syncInstancesWithBouquet(prevInstances, updated, flowersMap, selectedStyleId, selectedShapeId)
    );
  };

  const handleRemoveFlower = (flowerId: string) => {
    setActivePresetId("");
    const updated = bouquet.filter((item) => item.flowerId !== flowerId);
    setBouquet(updated);
    setFlowerInstances((prevInstances) =>
      syncInstancesWithBouquet(prevInstances, updated, flowersMap, selectedStyleId, selectedShapeId)
    );
  };

  const handleChangeColor = (flowerId: string, newColor: string) => {
    setActivePresetId("");
    const updated = bouquet.map((item) =>
      item.flowerId === flowerId ? { ...item, selectedColor: newColor } : item
    );
    setBouquet(updated);
    setFlowerInstances((prevInstances) =>
      syncInstancesWithBouquet(prevInstances, updated, flowersMap, selectedStyleId, selectedShapeId)
    );
  };

  const handleClearBouquet = () => {
    setActivePresetId("");
    setBouquet([]);
    setFlowerInstances([]);
    setHasManualArrangement(false);
  };

  const handleReset = () => {
    setSelectedOccasionId("valentines");
    setSelectedStyleId("romantic");
    setSelectedShapeId("round-dome");
    setSelectedWrappingId("kraft_cone");
    setSelectedRibbonId("rustic-twine");
    setWrapCoverage("top");
    setWrappingSelectionSource("default");
    setRibbonSelectionSource("default");
    setBouquet([]);
    setFlowerInstances([]);
    setHasManualArrangement(false);
    setActivePresetId("");
    setStudioStep("occasion");
    setActiveView("builder");
  };

  const handleApplySubstitution = (originalId: string, suggestedId: string) => {
    setActivePresetId("");
    const origItem = bouquet.find((i) => i.flowerId === originalId);
    const origQty = origItem ? origItem.quantity : 1;
    const filtered = bouquet.filter((i) => i.flowerId !== originalId);
    const suggExisting = filtered.find((i) => i.flowerId === suggestedId);

    const updated = suggExisting
      ? filtered.map((i) =>
          i.flowerId === suggestedId
            ? { ...i, quantity: i.quantity + origQty }
            : i
        )
      : [
          ...filtered,
          {
            flowerId: suggestedId,
            quantity: origQty,
            selectedColor: origItem?.selectedColor,
          },
        ];

    setBouquet(updated);
    setFlowerInstances((prevInstances) =>
      syncInstancesWithBouquet(prevInstances, updated, flowersMap, selectedStyleId, selectedShapeId)
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#2D2D2D] flex flex-col font-sans selection:bg-[#2D4F1E]/20 selection:text-[#2D4F1E]">
      {/* Header with Navigation - On mobile builder studio, MobileStudio has its own sleek header */}
      <div className={activeView === "builder" && studioStep !== "analyze" ? "hidden lg:block" : "block"}>
        <Header
          onReset={handleReset}
          activeView={activeView}
          setActiveView={setActiveView}
          hasBouquet={bouquet.length > 0}
          score={scoreResult.overall}
        />
      </div>

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full mx-auto ${
          activeView === "builder" && studioStep !== "analyze"
            ? "p-0 lg:max-w-[1720px] lg:px-8 lg:py-6"
            : "max-w-[1720px] px-4 sm:px-6 lg:px-8 py-6 space-y-6"
        }`}
      >
        {/* VIEW 1: STUDIO BUILDER WORKBENCH */}
        {activeView === "builder" && (
          <>
            {/* MOBILE STUDIO: DEDICATED TOUCH-OPTIMIZED VIEW (< lg) */}
            {studioStep !== "analyze" && (
              <div className="block lg:hidden w-full h-full">
                <MobileStudio
                  bouquet={bouquet}
                  flowersList={flowersList}
                  flowersMap={flowersMap}
                  scoreResult={scoreResult}
                  selectedOccasion={selectedOccasion}
                  selectedStyle={selectedStyle}
                  selectedShapeId={selectedShapeId}
                  selectedWrappingId={selectedWrappingId}
                  selectedRibbonId={selectedRibbonId}
                  wrapCoverage={wrapCoverage}
                  occasionsList={occasionsList}
                  stylesList={stylesList}
                  flowerInstances={flowerInstances}
                  initialInstances={flowerInstances}
                  onSelectOccasion={(id) => {
                    setSelectedOccasionId(id);
                    setActivePresetId("");
                  }}
                  onSelectStyle={handleRequestSelectStyle}
                  onSelectShape={handleRequestSelectShape}
                  onSelectWrapping={handleSelectWrapping}
                  onSelectRibbon={handleSelectRibbon}
                  onSelectWrapCoverage={handleSelectWrapCoverage}
                  onAddFlower={handleAddFlower}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveFlower={handleRemoveFlower}
                  onChangeColor={handleChangeColor}
                  onClearBouquet={handleClearBouquet}
                  onProceedToAnalyze={handleNavigateToAnalyze}
                  onInstancesChange={setFlowerInstances}
                  onManualEditChange={setHasManualArrangement}
                  onSelectPreset={(p) => handleSelectPreset(p, false)}
                  onReset={handleReset}
                />
              </div>
            )}

            {/* DESKTOP STUDIO (lg and up) */}
            <div className={`space-y-6 animate-in fade-in duration-200 ${studioStep !== "analyze" ? "hidden lg:block" : "block"}`}>
            {/* Quick Inspiration Bar */}
            {studioStep !== "analyze" && (
              <PresetBar
                onSelectPreset={(p) => handleSelectPreset(p, false)}
                activePresetId={activePresetId}
              />
            )}

            {/* Studio Stepper Bar */}
            {studioStep !== "analyze" && (
              <StudioStepper
                currentStep={studioStep}
                onSelectStep={(step) => setStudioStep(step)}
                totalStems={totalStems}
                score={scoreResult.overall}
                onReset={handleReset}
              />
            )}

            {/* STEP 1: OCCASION */}
            {studioStep === "occasion" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E4D9] shadow-xs">
                    <OccasionPicker
                      occasions={occasionsList.occasions}
                      selectedOccasionId={selectedOccasionId}
                      onSelectOccasion={(id) => {
                        setSelectedOccasionId(id);
                        setActivePresetId("");
                      }}
                      onProceedToStyle={() => setStudioStep("style")}
                    />
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <BouquetVisualizer
                    bouquet={bouquet}
                    flowersMap={flowersMap}
                    scoreResult={scoreResult}
                    selectedOccasion={selectedOccasion}
                    selectedStyle={selectedStyle}
                    selectedShapeId={selectedShapeId}
                    selectedWrappingId={selectedWrappingId}
                    selectedRibbonId={selectedRibbonId}
                    wrapCoverage={wrapCoverage}
                    onSelectShape={handleRequestSelectShape}
                    onSelectWrapping={handleSelectWrapping}
                    onSelectRibbon={handleSelectRibbon}
                    onSelectWrapCoverage={handleSelectWrapCoverage}
                    flowerInstances={flowerInstances}
                    initialInstances={flowerInstances}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveFlower={handleRemoveFlower}
                    onChangeColor={handleChangeColor}
                    onClearBouquet={handleClearBouquet}
                    onProceedToScore={handleNavigateToAnalyze}
                    onManualEditChange={setHasManualArrangement}
                    onInstancesChange={setFlowerInstances}
                    mode="compact-preview"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: STYLE */}
            {studioStep === "style" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E4D9] shadow-xs">
                    <StylePicker
                      styles={stylesList.styles}
                      selectedStyleId={selectedStyleId}
                      selectedOccasion={selectedOccasion}
                      onSelectStyle={handleRequestSelectStyle}
                      onProceedToFlowers={() => setStudioStep("flowers")}
                      onBackToOccasion={() => setStudioStep("occasion")}
                    />
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <BouquetVisualizer
                    bouquet={bouquet}
                    flowersMap={flowersMap}
                    scoreResult={scoreResult}
                    selectedOccasion={selectedOccasion}
                    selectedStyle={selectedStyle}
                    selectedShapeId={selectedShapeId}
                    selectedWrappingId={selectedWrappingId}
                    selectedRibbonId={selectedRibbonId}
                    wrapCoverage={wrapCoverage}
                    onSelectShape={handleRequestSelectShape}
                    onSelectWrapping={handleSelectWrapping}
                    onSelectRibbon={handleSelectRibbon}
                    onSelectWrapCoverage={handleSelectWrapCoverage}
                    flowerInstances={flowerInstances}
                    initialInstances={flowerInstances}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveFlower={handleRemoveFlower}
                    onChangeColor={handleChangeColor}
                    onClearBouquet={handleClearBouquet}
                    onProceedToScore={handleNavigateToAnalyze}
                    onManualEditChange={setHasManualArrangement}
                    onInstancesChange={setFlowerInstances}
                    mode="compact-preview"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: CHOOSE FLOWERS */}
            {studioStep === "flowers" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-6">
                  <FlowerCatalog
                    flowers={flowersList}
                    currentBouquet={bouquet}
                    selectedStyleId={selectedStyleId}
                    selectedOccasionId={selectedOccasionId}
                    onAddFlower={handleAddFlower}
                    onUpdateQuantity={handleUpdateQuantity}
                    onProceedToArrange={() => setStudioStep("arrange")}
                    onBackToStyle={() => setStudioStep("style")}
                  />
                </div>

                <div className="lg:col-span-5 lg:sticky lg:top-6">
                  <BouquetVisualizer
                    bouquet={bouquet}
                    flowersMap={flowersMap}
                    scoreResult={scoreResult}
                    selectedOccasion={selectedOccasion}
                    selectedStyle={selectedStyle}
                    selectedShapeId={selectedShapeId}
                    selectedWrappingId={selectedWrappingId}
                    selectedRibbonId={selectedRibbonId}
                    wrapCoverage={wrapCoverage}
                    onSelectShape={handleRequestSelectShape}
                    onSelectWrapping={handleSelectWrapping}
                    onSelectRibbon={handleSelectRibbon}
                    onSelectWrapCoverage={handleSelectWrapCoverage}
                    flowerInstances={flowerInstances}
                    initialInstances={flowerInstances}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveFlower={handleRemoveFlower}
                    onChangeColor={handleChangeColor}
                    onClearBouquet={handleClearBouquet}
                    onProceedToScore={handleNavigateToAnalyze}
                    onManualEditChange={setHasManualArrangement}
                    onInstancesChange={setFlowerInstances}
                    mode="compact-preview"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: ARRANGE BOUQUET (HERO WORKBENCH) */}
            {studioStep === "arrange" && (
              <div className="w-full">
                <BouquetVisualizer
                  bouquet={bouquet}
                  flowersMap={flowersMap}
                  scoreResult={scoreResult}
                  selectedOccasion={selectedOccasion}
                  selectedStyle={selectedStyle}
                  selectedShapeId={selectedShapeId}
                  selectedWrappingId={selectedWrappingId}
                  selectedRibbonId={selectedRibbonId}
                  wrapCoverage={wrapCoverage}
                  onSelectShape={handleRequestSelectShape}
                  onSelectWrapping={handleSelectWrapping}
                  onSelectRibbon={handleSelectRibbon}
                  onSelectWrapCoverage={handleSelectWrapCoverage}
                  flowerInstances={flowerInstances}
                  initialInstances={flowerInstances}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveFlower={handleRemoveFlower}
                  onChangeColor={handleChangeColor}
                  onClearBouquet={handleClearBouquet}
                  onProceedToScore={handleNavigateToAnalyze}
                  onProceedToWrapping={() => setStudioStep("wrapping")}
                  onBackToFlowers={() => setStudioStep("flowers")}
                  onManualEditChange={setHasManualArrangement}
                  onInstancesChange={setFlowerInstances}
                  mode="arrange-workbench"
                />
              </div>
            )}

            {/* STEP 5: WRAPPING & RIBBON */}
            {studioStep === "wrapping" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E4D9] shadow-xs">
                    <WrappingPicker
                      selectedWrappingId={selectedWrappingId}
                      selectedRibbonId={selectedRibbonId}
                      wrapCoverage={wrapCoverage}
                      onSelectWrapping={handleSelectWrapping}
                      onSelectRibbon={handleSelectRibbon}
                      onSelectWrapCoverage={handleSelectWrapCoverage}
                      onProceedToAnalyze={handleNavigateToAnalyze}
                      onBackToArrange={() => setStudioStep("arrange")}
                    />
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <BouquetVisualizer
                    bouquet={bouquet}
                    flowersMap={flowersMap}
                    scoreResult={scoreResult}
                    selectedOccasion={selectedOccasion}
                    selectedStyle={selectedStyle}
                    selectedShapeId={selectedShapeId}
                    selectedWrappingId={selectedWrappingId}
                    selectedRibbonId={selectedRibbonId}
                    wrapCoverage={wrapCoverage}
                    onSelectShape={handleRequestSelectShape}
                    onSelectWrapping={handleSelectWrapping}
                    onSelectRibbon={handleSelectRibbon}
                    onSelectWrapCoverage={handleSelectWrapCoverage}
                    flowerInstances={flowerInstances}
                    initialInstances={flowerInstances}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveFlower={handleRemoveFlower}
                    onChangeColor={handleChangeColor}
                    onClearBouquet={handleClearBouquet}
                    onProceedToScore={handleNavigateToAnalyze}
                    onManualEditChange={setHasManualArrangement}
                    onInstancesChange={setFlowerInstances}
                    mode="compact-preview"
                  />
                </div>
              </div>
            )}

            {/* STEP 6: ANALYZE & AI EVALUATION (WITH REAL-WORLD PHOTO GENERATION) */}
            {studioStep === "analyze" && (
              <BouquetAnalysisView
                bouquet={bouquet}
                flowersMap={flowersMap}
                scoreResult={scoreResult}
                selectedOccasion={selectedOccasion}
                selectedStyle={selectedStyle}
                selectedShapeId={selectedShapeId}
                selectedWrappingId={selectedWrappingId}
                selectedRibbonId={selectedRibbonId}
                wrapCoverage={wrapCoverage}
                instances={flowerInstances}
                bouquetDraft={bouquetDraft}
                onBackToEdit={() => setStudioStep("arrange")}
                onApplySubstitution={handleApplySubstitution}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveFlower={handleRemoveFlower}
                onChangeColor={handleChangeColor}
                onClearBouquet={handleClearBouquet}
                onSelectShape={handleRequestSelectShape}
                onSelectWrapping={setSelectedWrappingId}
                onSelectRibbon={setSelectedRibbonId}
                onInstancesChange={setFlowerInstances}
              />
            )}

            {/* Deterministic Scoring Benchmark Test Suite */}
            <div className="pt-4 border-t border-[#E8E4D9]">
              <button
                type="button"
                onClick={() => setShowTestMode(!showTestMode)}
                className="text-xs font-semibold text-[#2D2D2D]/60 hover:text-[#2D4F1E] flex items-center gap-1.5 cursor-pointer py-1"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>
                  {showTestMode
                    ? "Hide Scoring Benchmark Suite"
                    : "Audit Deterministic Scoring Engine (4 Official Test Cases)"}
                </span>
              </button>

              {showTestMode && (
                <div className="mt-3">
                  <ScoringTestMode
                    onLoadTestCase={(tc, autoEval) => handleSelectPreset(tc, autoEval)}
                    currentScoreResult={scoreResult}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

        {/* VIEW 2: DIRECT SCORE & GEMINI AI FLORIST ADVISOR */}
        {activeView === "evaluation" && (
          <BouquetAnalysisView
            bouquet={bouquet}
            flowersMap={flowersMap}
            scoreResult={scoreResult}
            selectedOccasion={selectedOccasion}
            selectedStyle={selectedStyle}
            selectedShapeId={selectedShapeId}
            selectedWrappingId={selectedWrappingId}
            selectedRibbonId={selectedRibbonId}
            wrapCoverage={wrapCoverage}
            instances={flowerInstances}
            bouquetDraft={bouquetDraft}
            onBackToEdit={() => {
              setStudioStep("arrange");
              setActiveView("builder");
            }}
            onApplySubstitution={handleApplySubstitution}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFlower={handleRemoveFlower}
            onChangeColor={handleChangeColor}
            onClearBouquet={handleClearBouquet}
            onSelectShape={handleRequestSelectShape}
            onSelectWrapping={setSelectedWrappingId}
            onSelectRibbon={setSelectedRibbonId}
            onInstancesChange={setFlowerInstances}
          />
        )}

        {/* VIEW 3: MY SAVED BOUQUETS */}
        {activeView === "my-bouquets" && (
          <MyBouquetsView
            flowersMap={flowersMap}
            onLoadSavedBouquet={handleLoadSavedBouquet}
            onGoToStudio={() => {
              setStudioStep("arrange");
              setActiveView("builder");
            }}
          />
        )}

        {/* VIEW 4: INSPIRATION GALLERY */}
        {activeView === "inspiration" && (
          <InspirationView
            flowersMap={flowersMap}
            onLoadPreset={(preset) => handleSelectPreset(preset, false)}
          />
        )}

        {/* VIEW 5: BOTANICAL FLOWER GUIDE */}
        {activeView === "flower-guide" && (
          <FlowerGuideView
            flowers={flowersList}
            onSelectFlowerToStudio={(flowerId) => {
              handleAddFlower(flowerId);
              setStudioStep("flowers");
              setActiveView("builder");
            }}
          />
        )}

        {/* VIEW 6: HOW IT WORKS */}
        {activeView === "how-it-works" && <HowItWorksView />}

        {/* VIEW 7: ABOUT */}
        {activeView === "about" && <AboutView />}
      </main>

      {/* Manual Edit Protection Confirmation Modal */}
      {pendingConfigChange && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#E8E4D9] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
                  Apply New Configuration?
                </h3>
                <p className="text-xs text-[#2D2D2D]/60 mt-0.5">
                  You have customized individual stem positions. Changing this will recalculate the arrangement.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E8E4D9] text-xs text-[#2D2D2D]/80">
              {pendingConfigChange.type === "style" && (
                <span>Switching bouquet style to <strong>{stylesList.styles.find((s) => s.id === pendingConfigChange.styleId)?.name}</strong></span>
              )}
              {pendingConfigChange.type === "shape" && (
                <span>Applying shape geometry for <strong>{pendingConfigChange.shapeId}</strong></span>
              )}
              {pendingConfigChange.type === "preset" && (
                <span>Loading preset: <strong>{pendingConfigChange.preset?.name}</strong></span>
              )}
              {pendingConfigChange.type === "recipe" && (
                <span>Applying curated recipe with {pendingConfigChange.recipe?.items.length} flower varieties</span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfigChange(null)}
                className="px-4 py-2 rounded-xl bg-[#FAF8F3] hover:bg-[#F3EFE6] text-xs font-serif font-bold text-[#2D2D2D] transition-colors cursor-pointer"
              >
                Keep Current
              </button>
              <button
                type="button"
                onClick={handleConfirmPendingConfigChange}
                className="px-5 py-2 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-xs font-serif font-bold text-white transition-colors cursor-pointer shadow-xs"
              >
                Apply & Recalculate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
