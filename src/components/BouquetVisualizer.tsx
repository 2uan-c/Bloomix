import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type {
  BouquetItem,
  Flower,
  ScoreResult,
  Occasion,
  BouquetStyle,
  FlowerInstance,
} from "../engine/types.ts";
import {
  generateInitialInstances,
  syncInstancesWithBouquet,
  reapplyStylePreservingUserPositions,
  updateInstancePosition,
  adjustInstanceDepth,
  adjustInstanceRotation,
  setInstanceRotation,
  toggleInstanceFlip,
  adjustInstanceScale,
  removeInstanceById,
  getStyleCompositionProfile,
  type StyleCompositionProfile,
} from "../engine/bouquetInstanceManager.ts";
import {
  generateBouquetLayout,
  computeLayoutMetrics,
  type LayoutEngineName,
} from "../engine/bouquetShapeLayoutEngine.ts";
import { BouquetBloom } from "./BouquetBloom.tsx";
import { BouquetWrapping } from "./BouquetWrapping.tsx";
import { BouquetStemNetwork } from "./BouquetStemNetwork.tsx";
import { BouquetComposition } from "./BouquetComposition.tsx";
import { LayersPanel } from "./LayersPanel.tsx";
import { FlowerContextualToolbar } from "./FlowerContextualToolbar.tsx";
import { computeBouquetBoundingBox, computeBouquetFit } from "../utils/bouquetFitEngine.ts";
import { WRAPPING_OPTIONS, RIBBON_OPTIONS, resolveWrappingOption, resolveRibbonOption } from "../utils/botanicalImages.ts";
import { preloadFloralCutouts } from "../utils/flowerCutoutProcessor.ts";
import { COLOR_HEX_MAP, ROLE_DETAILS } from "../utils/flowerAssets.ts";
import { getOccasionFloristGuide } from "../data/occasionRecommendations.ts";
import { saveBouquetToStorage } from "../utils/savedBouquetsStorage.ts";
import { BOUQUET_SHAPES, getBouquetShapeById } from "../data/bouquetShapesConfig.ts";
import {
  Hand,
  RotateCw,
  RotateCcw,
  BringToFront,
  SendToBack,
  Trash2,
  Sparkles,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Info,
  Package,
  Layers,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  X,
  ArrowLeft,
} from "lucide-react";

export interface BouquetVisualizerProps {
  bouquet: BouquetItem[];
  flowersMap: Map<string, Flower>;
  scoreResult: ScoreResult;
  selectedOccasion?: Occasion;
  selectedStyle?: BouquetStyle;
  selectedShapeId?: string;
  onSelectShape?: (id: string) => void;
  onUpdateQuantity: (flowerId: string, delta: number) => void;
  onRemoveFlower: (flowerId: string) => void;
  onChangeColor: (flowerId: string, color: string) => void;
  onClearBouquet: () => void;
  onProceedToScore: () => void;
  flowerInstances?: FlowerInstance[];
  initialInstances?: FlowerInstance[];
  onManualEditChange?: (hasManual: boolean) => void;
  onInstancesChange?: (instances: FlowerInstance[]) => void;
  selectedWrappingId?: string;
  selectedRibbonId?: string;
  wrapCoverage?: "top" | "full";
  onSelectWrapping?: (id: string) => void;
  onSelectRibbon?: (id: string) => void;
  onSelectWrapCoverage?: (coverage: "top" | "full") => void;
  onProceedToWrapping?: () => void;
  onBackToFlowers?: () => void;
  mode?: "compact-preview" | "arrange-workbench";
}

export const BouquetVisualizer: React.FC<BouquetVisualizerProps> = ({
  bouquet,
  flowersMap,
  scoreResult,
  selectedOccasion,
  selectedStyle,
  selectedShapeId = "round-dome",
  onSelectShape,
  onUpdateQuantity,
  onRemoveFlower,
  onChangeColor,
  onClearBouquet,
  onProceedToScore,
  flowerInstances: propFlowerInstances,
  initialInstances,
  onManualEditChange,
  onInstancesChange,
  selectedWrappingId: propWrappingId,
  selectedRibbonId: propRibbonId,
  wrapCoverage = "top",
  onSelectWrapping: propOnSelectWrapping,
  onSelectRibbon: propOnSelectRibbon,
  onSelectWrapCoverage,
  onProceedToWrapping,
  onBackToFlowers,
  mode = "arrange-workbench",
}) => {
  // Authoritative wrapping and ribbon state directly derived from props
  const selectedWrappingId = propWrappingId || "kraft_cone";
  const selectedRibbonId = propRibbonId || "rustic-twine";
  const setSelectedWrappingId = useCallback(
    (id: string) => {
      propOnSelectWrapping?.(id);
    },
    [propOnSelectWrapping]
  );
  const setSelectedRibbonId = useCallback(
    (id: string) => {
      propOnSelectRibbon?.(id);
    },
    [propOnSelectRibbon]
  );

  // Authoritative flower instances directly from props
  const instances = propFlowerInstances ?? initialInstances ?? [];

  // Ephemeral live dragging state (for smooth 60fps drag without desyncing authoritative state)
  const [ephemeralDrag, setEphemeralDrag] = useState<{
    instanceId: string;
    x: number;
    y: number;
  } | null>(null);

  // Rendered instances combining authoritative state with ephemeral drag positioning
  const renderedInstances = useMemo(() => {
    if (!ephemeralDrag) return instances;
    return instances.map((inst) =>
      inst.instanceId === ephemeralDrag.instanceId
        ? { ...inst, x: ephemeralDrag.x, y: ephemeralDrag.y }
        : inst
    );
  }, [instances, ephemeralDrag]);

  // Console diagnostic for visualizer render
  console.log("💐 [BouquetVisualizer Render Diagnostic]:", {
    wrappingId: selectedWrappingId,
    ribbonId: selectedRibbonId,
    flowerInstanceCount: renderedInstances.length,
  });

  const [activeTab, setActiveTab] = useState<"canvas" | "layers" | "wrapping">("canvas");
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  // Save Bouquet Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveBouquetName, setSaveBouquetName] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Shape Selection & Confirmation Modal State
  const [showShapeConfirmModal, setShowShapeConfirmModal] = useState(false);
  const [showShapePickerModal, setShowShapePickerModal] = useState(false);
  const [pendingShapeId, setPendingShapeId] = useState<string | null>(null);

  // Active Style Composition Profile
  const styleProfile = useMemo<StyleCompositionProfile>(() => {
    return getStyleCompositionProfile(selectedStyle?.id);
  }, [selectedStyle?.id]);

  const occasionGuide = useMemo(() => {
    return getOccasionFloristGuide(selectedOccasion?.id);
  }, [selectedOccasion?.id]);

  const currentWrapping = useMemo(
    () => resolveWrappingOption(selectedWrappingId),
    [selectedWrappingId]
  );
  const currentRibbon = useMemo(
    () => resolveRibbonOption(selectedRibbonId),
    [selectedRibbonId]
  );

  // Preload and warm transparent cutout cache for all catalog flower species
  useEffect(() => {
    const flowerIds = Array.from(flowersMap.keys());
    if (flowerIds.length > 0) {
      preloadFloralCutouts(flowerIds);
    }
  }, [flowersMap]);

  // Reset all stems to algorithmic style profile from bouquetShapes.json
  const handleResetToStyleLayout = useCallback(() => {
    const fresh = generateInitialInstances(bouquet, flowersMap, selectedStyle?.id, selectedShapeId);
    onManualEditChange?.(false);
    onInstancesChange?.(fresh);
  }, [bouquet, flowersMap, selectedStyle?.id, selectedShapeId, onManualEditChange, onInstancesChange]);

  // Handle shape change request with manual edit protection
  const handleRequestChangeShape = useCallback(
    (newShapeId: string) => {
      if (newShapeId === selectedShapeId) return;
      const hasManualArrangement = instances.some((i) => i.isUserPositioned);
      if (hasManualArrangement) {
        setPendingShapeId(newShapeId);
        setShowShapeConfirmModal(true);
      } else {
        onSelectShape?.(newShapeId);
        const fresh = generateInitialInstances(
          bouquet,
          flowersMap,
          selectedStyle?.id,
          newShapeId
        );
        onManualEditChange?.(false);
        onInstancesChange?.(fresh);
      }
    },
    [instances, selectedShapeId, onSelectShape, bouquet, flowersMap, selectedStyle?.id, onManualEditChange, onInstancesChange]
  );

  const handleConfirmShapeChange = useCallback(() => {
    if (pendingShapeId) {
      onSelectShape?.(pendingShapeId);
      const fresh = generateInitialInstances(
        bouquet,
        flowersMap,
        selectedStyle?.id,
        pendingShapeId
      );
      onManualEditChange?.(false);
      onInstancesChange?.(fresh);
    }
    setShowShapeConfirmModal(false);
    setShowShapePickerModal(false);
    setPendingShapeId(null);
  }, [pendingShapeId, onSelectShape, bouquet, flowersMap, selectedStyle?.id, onManualEditChange, onInstancesChange]);

  // ----------------------------------------------------
  // Interactive Dragging & Selection Engine (Strict 4-State Machine: IDLE | SELECTED | PRESSED | DRAGGING)
  // ----------------------------------------------------
  type FlowerInteractionState = "IDLE" | "SELECTED" | "PRESSED" | "DRAGGING";
  const [interactionState, setInteractionState] = useState<FlowerInteractionState>("IDLE");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const justFinishedDragRef = useRef(false);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 500,
  });

  useEffect(() => {
    if (!stageRef.current) return;
    const updateSize = () => {
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setStageSize({ width: rect.width, height: rect.height });
        }
      }
    };
    updateSize();
    const ro = new ResizeObserver(() => updateSize());
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  // Calculate bouquet bounding box and normalized auto-fit scaling & translation
  const bouquetBbox = useMemo(() => {
    return computeBouquetBoundingBox(
      renderedInstances,
      selectedShapeId,
      selectedWrappingId,
      selectedRibbonId
    );
  }, [renderedInstances, selectedShapeId, selectedWrappingId, selectedRibbonId]);

  const bouquetFit = useMemo(() => {
    return computeBouquetFit(
      bouquetBbox,
      stageSize.width || 600,
      stageSize.height || 500,
      {
        targetWidthRatio: 0.64,
        targetHeightRatio: 0.74,
        minScale: 0.85,
        maxScale: 2.50,
        verticalBiasFactor: 0.025,
      }
    );
  }, [bouquetBbox, stageSize.width, stageSize.height]);

  const canvasScale = bouquetFit.scale;

  const DRAG_THRESHOLD = 7; // 7px movement threshold (6-8px range) to cleanly differentiate click from drag

  interface DragSessionState {
    instanceId: string;
    pointerId: number;
    pointerType: string;
    startX: number;
    startY: number;
    initialBloomX: number;
    initialBloomY: number;
    currentBloomX: number;
    currentBloomY: number;
    dragOffsetX: number;
    dragOffsetY: number;
    mode: "PRESSED" | "DRAGGING";
    targetElement: HTMLElement | null;
  }

  const dragSessionRef = useRef<DragSessionState | null>(null);

  const handleFlowerDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, instanceId: string) => {
      // 1. Only capture primary pointer (left mouse button or touch)
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.stopPropagation();

      const targetInst = instances.find((i) => i.instanceId === instanceId);
      if (!targetInst) return;

      // 2. Select the flower immediately & display edit controls without moving the flower
      setSelectedInstanceId(instanceId);
      setInteractionState("PRESSED");

      const targetEl = e.currentTarget;
      try {
        targetEl.setPointerCapture?.(e.pointerId);
      } catch {
        // Safe fallback
      }

      // 3. Initialize drag session in PRESSED mode with exact grab offset
      const session: DragSessionState = {
        instanceId,
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        startX: e.clientX,
        startY: e.clientY,
        initialBloomX: targetInst.x,
        initialBloomY: targetInst.y,
        currentBloomX: targetInst.x,
        currentBloomY: targetInst.y,
        dragOffsetX: e.clientX - targetInst.x,
        dragOffsetY: e.clientY - targetInst.y,
        mode: "PRESSED",
        targetElement: targetEl,
      };
      dragSessionRef.current = session;

      const finishDragSession = (pointerId?: number) => {
        const activeSession = dragSessionRef.current;
        if (!activeSession) return;

        const wasDragging = activeSession.mode === "DRAGGING";
        if (wasDragging) {
          justFinishedDragRef.current = true;
          setTimeout(() => {
            justFinishedDragRef.current = false;
          }, 120);

          const tie = styleProfile.tiePoint || { x: 0, y: 52 };
          const updated = updateInstancePosition(
            instances,
            activeSession.instanceId,
            activeSession.currentBloomX,
            activeSession.currentBloomY,
            tie.x,
            tie.y
          );
          setEphemeralDrag(null);
          onManualEditChange?.(true);
          onInstancesChange?.(updated);
        } else {
          setEphemeralDrag(null);
        }

        // Release pointer capture
        if (activeSession.targetElement && pointerId !== undefined) {
          try {
            if (activeSession.targetElement.hasPointerCapture?.(pointerId)) {
              activeSession.targetElement.releasePointerCapture?.(pointerId);
            }
          } catch {
            // Safe fallback
          }
        }

        // Stop dragging immediately
        setDraggingId(null);
        setInteractionState("SELECTED");

        dragSessionRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerCancel);
      };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const activeSession = dragSessionRef.current;
        if (!activeSession || moveEvent.pointerId !== activeSession.pointerId) return;

        // Anti-bug & Safety check: Left mouse button MUST be actively pressed
        if (activeSession.pointerType === "mouse" && (moveEvent.buttons & 1) === 0) {
          finishDragSession(activeSession.pointerId);
          return;
        }

        const deltaScreenX = moveEvent.clientX - activeSession.startX;
        const deltaScreenY = moveEvent.clientY - activeSession.startY;
        const distance = Math.hypot(deltaScreenX, deltaScreenY);

        // Check threshold before initiating actual drag repositioning
        if (activeSession.mode === "PRESSED") {
          if (distance >= DRAG_THRESHOLD) {
            activeSession.mode = "DRAGGING";
            setInteractionState("DRAGGING");
            setDraggingId(activeSession.instanceId);
          } else {
            // Below threshold: remain PRESSED, do not move flower
            return;
          }
        }

        if (activeSession.mode === "DRAGGING") {
          moveEvent.preventDefault();
          // Update position taking canvasScale into account
          const deltaX = deltaScreenX / canvasScale;
          const deltaY = deltaScreenY / canvasScale;
          const newX = activeSession.initialBloomX + deltaX;
          const newY = activeSession.initialBloomY + deltaY;

          activeSession.currentBloomX = newX;
          activeSession.currentBloomY = newY;
          setEphemeralDrag({
            instanceId: activeSession.instanceId,
            x: newX,
            y: newY,
          });
        }
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        const activeSession = dragSessionRef.current;
        if (!activeSession || upEvent.pointerId !== activeSession.pointerId) return;
        finishDragSession(upEvent.pointerId);
      };

      const handlePointerCancel = (cancelEvent: PointerEvent) => {
        const activeSession = dragSessionRef.current;
        if (!activeSession || cancelEvent.pointerId !== activeSession.pointerId) return;
        finishDragSession(cancelEvent.pointerId);
      };

      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerCancel);
    },
    [instances, styleProfile, canvasScale, onManualEditChange, onInstancesChange]
  );

  // Background Canvas Click: Deselect when tapping empty canvas background
  const handleStageBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (justFinishedDragRef.current) return;
    setSelectedInstanceId(null);
    setInteractionState("IDLE");
  };

  const selectedInstance = useMemo(() => {
    return renderedInstances.find((i) => i.instanceId === selectedInstanceId) || null;
  }, [renderedInstances, selectedInstanceId]);

  // Partition flower instances by layer hierarchy for structured botanical rendering
  const foliageInstances = useMemo(() => {
    return renderedInstances.filter((i) => i.role === "foliage");
  }, [renderedInstances]);

  const fillerAndSecondaryInstances = useMemo(() => {
    return renderedInstances.filter((i) => i.role === "filler" || i.role === "secondary");
  }, [renderedInstances]);

  const focalInstances = useMemo(() => {
    return renderedInstances.filter(
      (i) => i.role === "focal" || (!["foliage", "filler", "secondary"].includes(i.role))
    );
  }, [renderedInstances]);

  // Total Stem Metrics
  const totalStems = bouquet.reduce((sum, item) => sum + item.quantity, 0);
  const totalVarieties = bouquet.length;

  const focalItems = bouquet.filter((i) => flowersMap.get(i.flowerId)?.roles.includes("focal"));
  const secondaryItems = bouquet.filter(
    (i) =>
      flowersMap.get(i.flowerId)?.roles.includes("secondary") &&
      !flowersMap.get(i.flowerId)?.roles.includes("focal")
  );
  const fillerItems = bouquet.filter((i) => flowersMap.get(i.flowerId)?.roles.includes("filler"));
  const foliageItems = bouquet.filter((i) => flowersMap.get(i.flowerId)?.roles.includes("foliage"));

  const focalStemsCount = focalItems.reduce((acc, i) => acc + i.quantity, 0);
  const foliageStemsCount = foliageItems.reduce((acc, i) => acc + i.quantity, 0);
  const fillerStemsCount = fillerItems.reduce((acc, i) => acc + i.quantity, 0);

  // Total Rendered Layers in Composition
  const totalRenderedLayersCount = useMemo(() => {
    if (renderedInstances.length === 0) return 0;
    let count = renderedInstances.length; // Flower stems
    if (selectedWrappingId) count += 2; // Wrapping Paper (Back + Front)
    if (selectedRibbonId) count += 1; // Ribbon & Bow
    count += 1; // Stems network
    return count;
  }, [renderedInstances.length, selectedWrappingId, selectedRibbonId]);

  // Florist balance notes
  const physicalGuidelines = useMemo(() => {
    const notes: { type: "info" | "warning" | "success"; text: string }[] = [];

    if (totalStems === 0) {
      return [
        {
          type: "info" as const,
          text: "Select your first flowers from the catalog to begin designing.",
        },
      ];
    }

    if (totalStems < 4) {
      notes.push({
        type: "warning",
        text: "Bouquet is currently sparse. Florists recommend 5–9 stems for a balanced hand-tied bouquet.",
      });
    }

    if (focalStemsCount === 0) {
      notes.push({
        type: "warning",
        text: "No focal flower selected. Add a prominent bloom (e.g. Rose, Peony, Sunflower) as visual anchor.",
      });
    } else if (focalStemsCount >= 8) {
      notes.push({
        type: "warning",
        text: "Large number of focal blooms. Florists recommend balancing with filler and foliage.",
      });
    }

    if (fillerStemsCount === 0 && totalStems >= 4) {
      notes.push({
        type: "info",
        text: "Add filler flowers (e.g. Baby's Breath, Waxflower) to soften transitions.",
      });
    }

    if (foliageStemsCount === 0 && totalStems >= 4) {
      notes.push({
        type: "info",
        text: "Add greenery foliage (e.g. Eucalyptus, Ruscus) for structure and natural framing.",
      });
    }

    if (notes.length === 0 && totalStems >= 5) {
      notes.push({
        type: "success",
        text: "Harmonious stem proportion and florist structural balance.",
      });
    }

    return notes;
  }, [totalStems, focalStemsCount, fillerStemsCount, foliageStemsCount]);

  // Handle Save Bouquet
  const handleOpenSaveModal = () => {
    const defaultName = `${selectedOccasion?.name || "Custom"} ${selectedStyle?.name || "Hand-Tied"} Design`;
    setSaveBouquetName(defaultName);
    setShowSaveModal(true);
    setSaveSuccessMessage(null);
  };

  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveBouquetName.trim()) return;

    saveBouquetToStorage({
      name: saveBouquetName.trim(),
      occasionId: selectedOccasion?.id || "valentines",
      styleId: selectedStyle?.id || "romantic",
      shapeId: selectedShapeId,
      items: bouquet,
      instances: renderedInstances,
      wrappingId: selectedWrappingId,
      ribbonId: selectedRibbonId,
      score: scoreResult.overall,
    });

    setSaveSuccessMessage(`"${saveBouquetName.trim()}" saved to My Bouquets!`);
    setTimeout(() => {
      setShowSaveModal(false);
      setSaveSuccessMessage(null);
    }, 1500);
  };

  // Manual modifier helper that persists changes and notifies parent
  const handleManualInstanceUpdate = useCallback(
    (updater: (prev: FlowerInstance[]) => FlowerInstance[]) => {
      const updated = updater(instances);
      onManualEditChange?.(true);
      onInstancesChange?.(updated);
    },
    [instances, onManualEditChange, onInstancesChange]
  );

  const currentShapeConfig = getBouquetShapeById(selectedShapeId);

  // Compute Layout Engine name for debug and developer verification
  const currentEngineName = useMemo<LayoutEngineName>(() => {
    const normalized = (selectedShapeId || "round-dome").toLowerCase();
    if (normalized.includes("hand-tied")) return "createHandTiedLayout";
    if (normalized.includes("wild")) return "createLooseWildLayout";
    if (normalized.includes("long-stem")) return "createLongStemLayout";
    if (normalized.includes("cascade")) return "createCascadingLayout";
    if (normalized.includes("posy")) return "createCompactPosyLayout";
    return "createRoundDomeLayout";
  }, [selectedShapeId]);

  return (
    <div className="space-y-4" id="bouquet-visualizer-section">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8E4D9] shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#2D2D2D]">
              Bouquet Preview
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F3EFE6] text-[#2D2D2D]/75 border border-[#E8E4D9]">
              {selectedStyle?.displayName || "Hand-Tied"}
            </span>
            <button
              type="button"
              onClick={() => setShowShapePickerModal(true)}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAE5D8] hover:bg-[#DDD6C5] text-[#2D4F1E] border border-[#2D4F1E]/20 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Click to change bouquet shape"
            >
              <span>{currentShapeConfig.name}</span>
              <span className="text-[9px] text-[#2D4F1E]/70 font-normal">
                ({currentShapeConfig.vietnamese})
              </span>
            </button>
          </div>
          <p className="text-xs text-[#2D2D2D]/60 mt-0.5">
            Florist Workbench • {totalStems} stems • {totalVarieties} varieties
          </p>
        </div>

        {/* Action Controls & Navigation Modes */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* View Tab Buttons */}
          <div className="flex items-center p-1 bg-[#FAF8F3] rounded-xl border border-[#E8E4D9]">
            <button
              type="button"
              onClick={() => setActiveTab("canvas")}
              className={`text-xs font-serif font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === "canvas"
                  ? "bg-white text-[#2D4F1E] shadow-2xs"
                  : "text-[#2D2D2D]/70 hover:text-[#2D2D2D]"
              }`}
            >
              Canvas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("layers")}
              className={`text-xs font-serif font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === "layers"
                  ? "bg-white text-[#2D4F1E] shadow-2xs"
                  : "text-[#2D2D2D]/70 hover:text-[#2D2D2D]"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Layers ({totalRenderedLayersCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("wrapping")}
              className={`text-xs font-serif font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === "wrapping"
                  ? "bg-white text-[#2D4F1E] shadow-2xs"
                  : "text-[#2D2D2D]/70 hover:text-[#2D2D2D]"
              }`}
            >
              <Package className="w-3 h-3" />
              <span>Wrap</span>
            </button>
          </div>

          {/* Reset Layout */}
          {totalStems > 0 && (
            <button
              type="button"
              onClick={handleResetToStyleLayout}
              className="p-1.5 rounded-xl border border-[#E8E4D9] bg-white hover:bg-[#F3EFE6] text-[#2D2D2D]/80 font-medium transition-all cursor-pointer shadow-2xs"
              title="Reset all stems to algorithmic style placement"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2D4F1E]" />
            </button>
          )}

          {/* Save Bouquet Button */}
          {totalStems > 0 && (
            <button
              type="button"
              id="save-bouquet-button"
              onClick={handleOpenSaveModal}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-white font-serif font-bold transition-all cursor-pointer shadow-xs"
              title="Save current arrangement to My Bouquets"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          )}
        </div>
      </div>

      {/* Occasion Intelligence Strip */}
      {selectedOccasion && occasionGuide && (
        <div className="bg-[#FAF8F3] p-3 rounded-2xl border border-[#E8E4D9] flex items-center justify-between gap-2 text-xs min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">💐</span>
            <div className="min-w-0">
              <span className="font-bold text-[#2D2D2D] block truncate">
                {selectedOccasion.name} Fit
              </span>
              <span className="text-[11px] text-[#2D2D2D]/60 block truncate">
                {occasionGuide.floristTips[0] || occasionGuide.tagline}
              </span>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold text-[#2D4F1E] bg-[#2D4F1E]/10 px-2 py-0.5 rounded-md shrink-0">
            Occasion Guide
          </span>
        </div>
      )}

      {/* Wrapping Customizer Drawer */}
      {activeTab === "wrapping" && (
        <div className="bg-white p-4 rounded-2xl border border-[#E8E4D9] shadow-xs space-y-4 animate-in fade-in duration-200 min-w-0">
          <div>
            <span className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wider block mb-2">
              Florist Paper Wrap Style
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {WRAPPING_OPTIONS.map((w) => {
                const isSelected = selectedWrappingId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setSelectedWrappingId(w.id);
                      if (w.defaultRibbonId) setSelectedRibbonId(w.defaultRibbonId);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer min-w-0 ${
                      isSelected
                        ? "border-[#2D4F1E] ring-2 ring-[#2D4F1E]/20 bg-[#F4F9F1]"
                        : "border-[#E8E4D9] bg-[#FAF8F3] hover:border-[#2D4F1E]/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-4 h-4 rounded-md border border-black/10 shadow-2xs shrink-0"
                        style={{ backgroundColor: w.paperColor }}
                      />
                      <span className="text-xs font-bold text-[#2D2D2D] truncate">
                        {w.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#2D2D2D]/60 mt-1 truncate">
                      {w.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wider block mb-2">
              Ribbon & Binding Material
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RIBBON_OPTIONS.map((r) => {
                const isSelected = selectedRibbonId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRibbonId(r.id)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer min-w-0 ${
                      isSelected
                        ? "border-[#2D4F1E] ring-2 ring-[#2D4F1E]/20 bg-[#F4F9F1]"
                        : "border-[#E8E4D9] bg-[#FAF8F3] hover:border-[#2D4F1E]/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs shrink-0"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="text-xs font-medium text-[#2D2D2D] truncate">{r.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Layers Panel Drawer / Tab */}
      {activeTab === "layers" && (
        <LayersPanel
          instances={renderedInstances}
          selectedInstanceId={selectedInstanceId}
          wrappingId={selectedWrappingId}
          ribbonId={selectedRibbonId}
          onSelectInstance={(id) => {
            setSelectedInstanceId(id);
            setActiveTab("canvas");
          }}
          onUpdateInstances={(newInsts) => handleManualInstanceUpdate(() => newInsts)}
        />
      )}

      {/* DESKTOP LAYOUT SWITCH: Two-Column layout for arrange-workbench mode, Clean Column for compact-preview */}
      {mode === "arrange-workbench" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
          {/* Left Column (Canvas Stage & Navigation) */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4 min-w-0">
            {/* Main Preview Stage & Drag Canvas */}
            <div
              ref={stageRef}
              id="bouquet-stage-canvas"
              onClick={handleStageBackgroundClick}
              className="relative w-full min-w-0 h-[460px] sm:h-[500px] lg:h-[540px] xl:h-[580px] bg-gradient-to-b from-[#F8F6F0] via-[#FAF8F3] to-[#F2EFE8] rounded-3xl border border-[#E8E4D9] shadow-inner overflow-hidden flex items-center justify-center select-none cursor-default"
            >
              {/* Subtle Florist Studio Grid & Lighting Backdrop */}
              <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#2D2D2D 0.6px, transparent 0.6px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Ambient Top Lighting Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-white/60 rounded-full filter blur-3xl pointer-events-none" />

              {/* Helper Hint Badge on Top */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full border border-[#E8E4D9] text-[11px] font-sans text-[#2D2D2D]/75 shadow-xs whitespace-nowrap">
                <Hand className="w-3.5 h-3.5 text-[#2D4F1E] animate-bounce shrink-0" />
                <span>
                  {draggingId
                    ? "Positioning bloom in bouquet..."
                    : "Drag any flower to arrange your bouquet"}
                </span>
              </div>

              {/* Empty State */}
              {totalStems === 0 ? (
                <div className="relative z-10 text-center max-w-xs p-6 space-y-2">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#EAE5D9] flex items-center justify-center text-[#2D4F1E] shadow-inner">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h4 className="font-serif font-bold text-base text-[#2D2D2D]">
                    Bouquet Canvas Ready
                  </h4>
                  <p className="text-xs text-[#2D2D2D]/60 leading-relaxed">
                    Add your favorite flowers below. You can position, rotate, and stack each stem freely on this canvas.
                  </p>
                </div>
              ) : (
                /* THE PHYSICAL BOTANICAL BOUQUET (Scaled dynamically with normalized auto-fit) */
                <div
                  className="relative flex items-center justify-center transition-transform duration-150 ease-out origin-center"
                  style={{
                    transform: `translate(${bouquetFit.offsetX}px, ${bouquetFit.offsetY}px) scale(${bouquetFit.scale})`,
                  }}
                >
                  <BouquetComposition
                    instances={renderedInstances}
                    wrapping={currentWrapping}
                    ribbon={currentRibbon}
                    wrapCoverage={wrapCoverage}
                    shapeId={selectedShapeId}
                    tiePoint={styleProfile.tiePoint || { x: 0, y: 52 }}
                    interactive={true}
                    selectedInstanceId={selectedInstanceId}
                    draggingId={draggingId}
                    onSelectInstance={(id) => setSelectedInstanceId(id)}
                    onDragStart={handleFlowerDragStart}
                    showLabels={true}
                  />
                </div>
              )}

              {/* Selected Flower Dynamic Floating Contextual Toolbar */}
              {selectedInstance && (
                <FlowerContextualToolbar
                  selectedInstance={selectedInstance}
                  instances={renderedInstances}
                  stageSize={stageSize}
                  canvasScale={bouquetFit.scale}
                  offsetX={bouquetFit.offsetX}
                  offsetY={bouquetFit.offsetY}
                  onRotate={(id, delta) =>
                    handleManualInstanceUpdate((prev) => adjustInstanceRotation(prev, id, delta))
                  }
                  onSetRotation={(id, angle) =>
                    handleManualInstanceUpdate((prev) => setInstanceRotation(prev, id, angle))
                  }
                  onFlip={(id, axis) =>
                    handleManualInstanceUpdate((prev) => toggleInstanceFlip(prev, id, axis))
                  }
                  onScale={(id, deltaOrAction) =>
                    handleManualInstanceUpdate((prev) => adjustInstanceScale(prev, id, deltaOrAction))
                  }
                  onAdjustDepth={(id, dir) =>
                    handleManualInstanceUpdate((prev) => adjustInstanceDepth(prev, id, dir))
                  }
                  onDelete={(id) => {
                    handleManualInstanceUpdate((prev) => {
                      const { updatedInstances, removedFlowerId } = removeInstanceById(prev, id);
                      if (removedFlowerId) {
                        onUpdateQuantity(removedFlowerId, -1);
                      }
                      return updatedInstances;
                    });
                    setSelectedInstanceId(null);
                  }}
                  onDeselect={() => setSelectedInstanceId(null)}
                />
              )}

              {/* Developer / Engine Debug Info Badge */}
              <div
                id="bouquet-engine-debug-badge"
                className="absolute bottom-3 left-3 z-30 pointer-events-none bg-black/65 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/15 text-white shadow-xs font-mono text-[10px] space-y-0.5"
              >
                <div className="flex items-center gap-1.5 font-bold text-[#A7F3D0]">
                  <span className="text-[9px] uppercase tracking-wider text-white/60">Active Shape:</span>
                  <span>{currentShapeConfig.name.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-white/80">
                  <span className="text-white/50">Layout Engine:</span>
                  <span className="text-amber-200 font-semibold">{currentEngineName}</span>
                </div>
              </div>
            </div>

            {/* Step Navigation Bar */}
            {(onProceedToWrapping || onBackToFlowers) && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E8E4D9]">
                {onBackToFlowers && (
                  <button
                    type="button"
                    onClick={onBackToFlowers}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#E8E4D9] bg-white hover:bg-[#FAF8F3] text-[#2D2D2D] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <div className="flex flex-col items-start text-left leading-tight">
                      <span className="text-xs sm:text-sm">Back to Flowers</span>
                      <span className="text-[10px] text-[#2D2D2D]/60 font-normal">Quay lại Chọn Hoa</span>
                    </div>
                  </button>
                )}

                {onProceedToWrapping && (
                  <button
                    type="button"
                    id="proceed-to-wrapping-btn"
                    onClick={onProceedToWrapping}
                    className="w-full sm:w-auto ml-auto px-6 py-2.5 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-white font-serif font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left leading-tight">
                      <span className="text-xs sm:text-sm">Continue: Wrapping & Ribbon</span>
                      <span className="text-[10px] text-white/80 font-normal">Tiếp tục: Chọn Giấy gói & Nơ</span>
                    </div>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column (Florist Structure, Balance Insights, Stems Inventory) */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4 min-w-0">
            {/* Florist Guidelines & Stem Architecture */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E4D9] shadow-xs space-y-3 min-w-0">
              <div className="flex items-center justify-between text-xs font-bold text-[#2D2D2D]">
                <span>Stem Roles Breakdown</span>
                <span className="text-[#2D4F1E] font-serif">{totalStems} Total Stems</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center min-w-0">
                <div className="p-2 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] min-w-0">
                  <span className="block text-[10px] text-[#2D2D2D]/60 uppercase font-semibold truncate">Focal</span>
                  <span className="text-sm font-bold text-[#2D2D2D]">{focalStemsCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] min-w-0">
                  <span className="block text-[10px] text-[#2D2D2D]/60 uppercase font-semibold truncate">Secondary</span>
                  <span className="text-sm font-bold text-[#2D2D2D]">
                    {secondaryItems.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] min-w-0">
                  <span className="block text-[10px] text-[#2D2D2D]/60 uppercase font-semibold truncate">Filler</span>
                  <span className="text-sm font-bold text-[#2D2D2D]">{fillerStemsCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] min-w-0">
                  <span className="block text-[10px] text-[#2D2D2D]/60 uppercase font-semibold truncate">Foliage</span>
                  <span className="text-sm font-bold text-[#2D2D2D]">{foliageStemsCount}</span>
                </div>
              </div>

              {/* Florist Balance Insights */}
              <div className="pt-2.5 border-t border-[#E8E4D9] space-y-2 min-w-0">
                <span className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wider block">
                  Florist Balance Insights
                </span>
                <div className="space-y-1.5 min-w-0">
                  {physicalGuidelines.map((g, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs min-w-0">
                      {g.type === "warning" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#B45309] shrink-0 mt-0.5" />
                      ) : g.type === "success" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2D4F1E] shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-[#2D2D2D]/60 shrink-0 mt-0.5" />
                      )}
                      <span className="text-[#2D2D2D]/80 leading-relaxed break-words">{g.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Analysis Link */}
              {totalStems > 0 && (
                <div className="pt-2.5 border-t border-[#E8E4D9] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={onProceedToScore}
                    className="flex items-center gap-1 text-xs font-serif font-bold text-[#2D4F1E] hover:text-[#213C16] cursor-pointer shrink-0"
                  >
                    <span>View Full Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Selected Stems in Bouquet List */}
            {totalStems > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-[#E8E4D9] shadow-xs space-y-3 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wider truncate">
                    Selected Stems in Bouquet ({totalStems})
                  </span>
                  <button
                    type="button"
                    onClick={onClearBouquet}
                    className="text-xs text-[#8F3326] hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                  {bouquet.map((item) => {
                    const flower = flowersMap.get(item.flowerId);
                    if (!flower) return null;
                    const selectedColor = item.selectedColor || flower.colors[0];
                    const primaryRole = flower.roles[0];
                    const roleDetail = ROLE_DETAILS[primaryRole];

                    return (
                      <div
                        key={item.flowerId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] hover:border-[#2D4F1E]/30 transition-all shadow-2xs min-w-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                            style={{
                              backgroundColor: COLOR_HEX_MAP[selectedColor]?.bg || "#ccc",
                            }}
                            title={selectedColor}
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#2D2D2D] block truncate">
                              {flower.name}
                            </span>
                            <span className="text-[10px] text-[#2D2D2D]/60 block truncate">
                              {roleDetail?.label || primaryRole} • {selectedColor}
                            </span>
                          </div>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center rounded-lg border border-[#E8E4D9] bg-white overflow-hidden shrink-0 ml-1.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.flowerId, -1)}
                            className="px-1.5 py-1 text-[#2D2D2D]/70 hover:bg-[#F3EFE6] transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-1.5 text-xs font-bold text-[#2D4F1E] min-w-[18px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.flowerId, 1)}
                            className="px-1.5 py-1 text-[#2D2D2D]/70 hover:bg-[#F3EFE6] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* COMPACT PREVIEW MODE (Steps 1, 2, 3, 5) */
        <div className="space-y-4 min-w-0">
          {/* Main Preview Stage & Drag Canvas */}
          <div
            ref={stageRef}
            id="bouquet-stage-canvas"
            onClick={handleStageBackgroundClick}
            className="relative w-full min-w-0 h-[440px] sm:h-[480px] bg-gradient-to-b from-[#F8F6F0] via-[#FAF8F3] to-[#F2EFE8] rounded-3xl border border-[#E8E4D9] shadow-inner overflow-hidden flex items-center justify-center select-none cursor-default"
          >
            {/* Subtle Florist Studio Grid & Lighting Backdrop */}
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#2D2D2D 0.6px, transparent 0.6px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* Ambient Top Lighting Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-white/60 rounded-full filter blur-3xl pointer-events-none" />

            {/* Helper Hint Badge on Top */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full border border-[#E8E4D9] text-[11px] font-sans text-[#2D2D2D]/75 shadow-xs whitespace-nowrap">
              <Hand className="w-3.5 h-3.5 text-[#2D4F1E] animate-bounce shrink-0" />
              <span>
                {draggingId
                  ? "Positioning bloom in bouquet..."
                  : "Drag any flower to arrange your bouquet"}
              </span>
            </div>

            {/* Empty State */}
            {totalStems === 0 ? (
              <div className="relative z-10 text-center max-w-xs p-6 space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#EAE5D9] flex items-center justify-center text-[#2D4F1E] shadow-inner">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h4 className="font-serif font-bold text-base text-[#2D2D2D]">
                  Bouquet Canvas Ready
                </h4>
                <p className="text-xs text-[#2D2D2D]/60 leading-relaxed">
                  Add your favorite flowers to build your bouquet.
                </p>
              </div>
            ) : (
              /* THE PHYSICAL BOTANICAL BOUQUET (Scaled dynamically to fit the canvas stage) */
              <div
                className="relative flex items-center justify-center transition-transform duration-150 ease-out origin-center"
                style={{
                  transform: `scale(${canvasScale})`,
                }}
              >
                <BouquetComposition
                  instances={renderedInstances}
                  wrapping={currentWrapping}
                  ribbon={currentRibbon}
                  shapeId={selectedShapeId}
                  tiePoint={styleProfile.tiePoint || { x: 0, y: 52 }}
                  interactive={true}
                  selectedInstanceId={selectedInstanceId}
                  draggingId={draggingId}
                  onSelectInstance={(id) => setSelectedInstanceId(id)}
                  onDragStart={handleFlowerDragStart}
                  showLabels={true}
                />
              </div>
            )}

            {/* Selected Flower Dynamic Floating Contextual Toolbar */}
            {selectedInstance && (
              <FlowerContextualToolbar
                selectedInstance={selectedInstance}
                instances={renderedInstances}
                stageSize={stageSize}
                canvasScale={canvasScale}
                onRotate={(id, delta) =>
                  handleManualInstanceUpdate((prev) => adjustInstanceRotation(prev, id, delta))
                }
                onSetRotation={(id, angle) =>
                  handleManualInstanceUpdate((prev) => setInstanceRotation(prev, id, angle))
                }
                onFlip={(id, axis) =>
                  handleManualInstanceUpdate((prev) => toggleInstanceFlip(prev, id, axis))
                }
                onScale={(id, deltaOrAction) =>
                  handleManualInstanceUpdate((prev) => adjustInstanceScale(prev, id, deltaOrAction))
                }
                onAdjustDepth={(id, dir) =>
                  handleManualInstanceUpdate((prev) => adjustInstanceDepth(prev, id, dir))
                }
                onDelete={(id) => {
                  handleManualInstanceUpdate((prev) => {
                    const { updatedInstances, removedFlowerId } = removeInstanceById(prev, id);
                    if (removedFlowerId) {
                      onUpdateQuantity(removedFlowerId, -1);
                    }
                    return updatedInstances;
                  });
                  setSelectedInstanceId(null);
                }}
                onDeselect={() => setSelectedInstanceId(null)}
              />
            )}

            {/* Developer / Engine Debug Info Badge */}
            <div
              id="bouquet-engine-debug-badge"
              className="absolute bottom-3 left-3 z-30 pointer-events-none bg-black/65 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/15 text-white shadow-xs font-mono text-[10px] space-y-0.5"
            >
              <div className="flex items-center gap-1.5 font-bold text-[#A7F3D0]">
                <span className="text-[9px] uppercase tracking-wider text-white/60">Active Shape:</span>
                <span>{currentShapeConfig.name.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-white/80">
                <span className="text-white/50">Layout Engine:</span>
                <span className="text-amber-200 font-semibold">{currentEngineName}</span>
              </div>
            </div>
          </div>

          {/* Stem Roles Breakdown */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#E8E4D9] shadow-xs space-y-2 min-w-0">
            <div className="flex items-center justify-between text-xs font-bold text-[#2D2D2D]">
              <span>Stem Roles Breakdown</span>
              <span className="text-[#2D4F1E] font-serif">{totalStems} Total</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center min-w-0">
              <div className="p-2 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] min-w-0">
                <span className="block text-[10px] text-[#2D2D2D]/60 uppercase font-semibold truncate">Focal</span>
                <span className="text-sm font-bold text-[#2D2D2D]">{focalStemsCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] min-w-0">
                <span className="block text-[10px] text-[#2D2D2D]/60 uppercase font-semibold truncate">Secondary</span>
                <span className="text-sm font-bold text-[#2D2D2D]">
                  {secondaryItems.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] min-w-0">
                <span className="block text-[10px] text-[#2D2D2D]/60 uppercase font-semibold truncate">Filler</span>
                <span className="text-sm font-bold text-[#2D2D2D]">{fillerStemsCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] min-w-0">
                <span className="block text-[10px] text-[#2D2D2D]/60 uppercase font-semibold truncate">Foliage</span>
                <span className="text-sm font-bold text-[#2D2D2D]">{foliageStemsCount}</span>
              </div>
            </div>
          </div>

          {/* Florist Balance Insights */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#E8E4D9] shadow-xs space-y-2 min-w-0">
            <span className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wider block">
              Florist Balance Insights
            </span>
            <div className="space-y-1.5 min-w-0">
              {physicalGuidelines.map((g, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs min-w-0">
                  {g.type === "warning" ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-[#B45309] shrink-0 mt-0.5" />
                  ) : g.type === "success" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2D4F1E] shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-[#2D2D2D]/60 shrink-0 mt-0.5" />
                  )}
                  <span className="text-[#2D2D2D]/80 leading-relaxed break-words">{g.text}</span>
                </div>
              ))}
            </div>

            {/* Full Analysis Link */}
            {totalStems > 0 && (
              <div className="pt-2.5 border-t border-[#E8E4D9] flex items-center justify-end">
                <button
                  type="button"
                  onClick={onProceedToScore}
                  className="flex items-center gap-1 text-xs font-serif font-bold text-[#2D4F1E] hover:text-[#213C16] cursor-pointer shrink-0"
                >
                  <span>View Full Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Selected Stems Inventory Table */}
          {totalStems > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-[#E8E4D9] shadow-xs space-y-3 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wider truncate">
                  Selected Stems ({totalStems})
                </span>
                <button
                  type="button"
                  onClick={onClearBouquet}
                  className="text-xs text-[#8F3326] hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 min-w-0">
                {bouquet.map((item) => {
                  const flower = flowersMap.get(item.flowerId);
                  if (!flower) return null;
                  const selectedColor = item.selectedColor || flower.colors[0];
                  const primaryRole = flower.roles[0];
                  const roleDetail = ROLE_DETAILS[primaryRole];

                  return (
                    <div
                      key={item.flowerId}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] hover:border-[#2D4F1E]/30 transition-all shadow-2xs min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                          style={{
                            backgroundColor: COLOR_HEX_MAP[selectedColor]?.bg || "#ccc",
                          }}
                          title={selectedColor}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#2D2D2D] block truncate">
                            {flower.name}
                          </span>
                          <span className="text-[10px] text-[#2D2D2D]/60 block truncate">
                            {roleDetail?.label || primaryRole} • {selectedColor}
                          </span>
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center rounded-lg border border-[#E8E4D9] bg-white overflow-hidden shrink-0 ml-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.flowerId, -1)}
                          className="px-1.5 py-1 text-[#2D2D2D]/70 hover:bg-[#F3EFE6] transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1.5 text-xs font-bold text-[#2D4F1E] min-w-[18px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.flowerId, 1)}
                          className="px-1.5 py-1 text-[#2D2D2D]/70 hover:bg-[#F3EFE6] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Bouquet Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E8E4D9] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-[#2D4F1E]" />
                <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">
                  Save Bouquet Design
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-1 rounded-lg text-[#2D2D2D]/60 hover:text-[#2D2D2D] hover:bg-[#FAF8F3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#2D2D2D] block mb-1">
                  Bouquet Name
                </label>
                <input
                  type="text"
                  value={saveBouquetName}
                  onChange={(e) => setSaveBouquetName(e.target.value)}
                  placeholder="e.g. Valentine Romance, Birthday Sunshine..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F3] border border-[#E8E4D9] rounded-xl text-sm focus:outline-none focus:border-[#2D4F1E]"
                  autoFocus
                />
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] text-xs text-[#2D2D2D]/70 space-y-1">
                <div className="flex justify-between">
                  <span>Occasion:</span>
                  <span className="font-bold text-[#2D2D2D] capitalize">
                    {selectedOccasion?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Style:</span>
                  <span className="font-bold text-[#2D2D2D] capitalize">
                    {selectedStyle?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stems:</span>
                  <span className="font-bold text-[#2D4F1E]">{totalStems} stems</span>
                </div>
                <div className="flex justify-between">
                  <span>Score:</span>
                  <span className="font-bold text-[#2D4F1E]">
                    {scoreResult.overall}/100
                  </span>
                </div>
              </div>

              {saveSuccessMessage && (
                <div className="p-2.5 rounded-xl bg-[#EAF3E6] border border-[#C8DEC0] text-xs text-[#2D4F1E] font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
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
                  Save to My Bouquets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shape Change Confirmation Modal (Protects manual arrangements) */}
      {showShapeConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#E8E4D9] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
                  Apply New Bouquet Shape?
                </h3>
                <p className="text-xs text-[#2D2D2D]/60 mt-0.5">
                  Your manual flower positions will be reset to match the new shape geometry.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E8E4D9] text-xs space-y-1.5">
              <div className="flex items-center justify-between font-medium text-[#2D2D2D]/80">
                <span>Selected Shape:</span>
                <span className="font-bold text-[#2D4F1E]">
                  {pendingShapeId ? getBouquetShapeById(pendingShapeId).name : ""}
                </span>
              </div>
              <p className="text-[11px] text-[#2D2D2D]/60 leading-relaxed">
                Florist composition rules will arrange all {totalStems} stems into the new shape silhouette.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowShapeConfirmModal(false);
                  setPendingShapeId(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#FAF8F3] hover:bg-[#F3EFE6] text-xs font-serif font-bold text-[#2D2D2D] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmShapeChange}
                className="px-5 py-2 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-xs font-serif font-bold text-white transition-colors cursor-pointer shadow-xs"
              >
                Apply Shape
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shape Picker Modal */}
      {showShapePickerModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#E8E4D9] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D4F1E] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">
                    Choose Bouquet Shape
                  </h3>
                  <p className="text-xs text-[#2D2D2D]/60">
                    Select form & silhouette geometry
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShapePickerModal(false)}
                className="p-1.5 rounded-lg text-[#2D2D2D]/60 hover:text-[#2D2D2D] hover:bg-[#FAF8F3] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto p-0.5">
              {BOUQUET_SHAPES.map((shape) => {
                const isSelected = shape.id === selectedShapeId;
                return (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => handleRequestChangeShape(shape.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "bg-[#F3EFE6] border-[#2D4F1E] ring-2 ring-[#2D4F1E]/20 text-[#2D2D2D] shadow-2xs"
                        : "bg-[#FAF8F3]/70 border-[#E8E4D9] hover:bg-white hover:border-[#2D4F1E]/40 text-[#2D2D2D]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-[#2D2D2D]">
                          {shape.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#EAE5D8] text-[#2D4F1E] font-medium">
                          {shape.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#2D2D2D]/60 font-medium">
                        {shape.vietnamese}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#2D2D2D]/70 leading-relaxed line-clamp-2">
                      {shape.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
