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
  updateInstancePosition,
  adjustInstanceDepth,
  adjustInstanceRotation,
  toggleInstanceFlip,
  adjustInstanceScale,
  removeInstanceById,
  getStyleCompositionProfile,
  type StyleCompositionProfile,
} from "../engine/bouquetInstanceManager.ts";
import { BouquetComposition } from "./BouquetComposition.tsx";
import { computeBouquetBoundingBox, computeBouquetFit } from "../utils/bouquetFitEngine.ts";
import {
  WRAPPING_OPTIONS,
  RIBBON_OPTIONS,
  resolveWrappingOption,
  resolveRibbonOption,
  getFlowerImageUrl,
} from "../utils/botanicalImages.ts";
import { preloadFloralCutouts } from "../utils/flowerCutoutProcessor.ts";
import { BOUQUET_SHAPES, getBouquetShapeById } from "../data/bouquetShapesConfig.ts";
import { DEMO_PRESETS, type PresetBouquet } from "../data/presets.ts";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Minus,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Sparkles,
  Calendar,
  Package,
  Layers,
  Check,
  Shapes,
  AlertTriangle,
} from "lucide-react";

interface MobileStudioProps {
  bouquet: BouquetItem[];
  flowersList: Flower[];
  flowersMap: Map<string, Flower>;
  scoreResult: ScoreResult;
  selectedOccasion: Occasion;
  selectedStyle: BouquetStyle;
  selectedShapeId: string;
  selectedWrappingId: string;
  selectedRibbonId: string;
  wrapCoverage?: "top" | "full";
  occasionsList: { occasions: Occasion[] };
  stylesList: { styles: BouquetStyle[] };
  flowerInstances?: FlowerInstance[];
  initialInstances?: FlowerInstance[];
  onSelectOccasion: (id: string) => void;
  onSelectStyle: (id: string) => void;
  onSelectShape: (id: string) => void;
  onSelectWrapping: (id: string) => void;
  onSelectRibbon: (id: string) => void;
  onSelectWrapCoverage?: (coverage: "top" | "full") => void;
  onAddFlower: (flowerId: string, color?: string) => void;
  onUpdateQuantity: (flowerId: string, delta: number) => void;
  onRemoveFlower: (flowerId: string) => void;
  onChangeColor: (flowerId: string, color: string) => void;
  onClearBouquet: () => void;
  onProceedToAnalyze: () => void;
  onInstancesChange?: (instances: FlowerInstance[]) => void;
  onManualEditChange?: (hasManual: boolean) => void;
  onSelectPreset?: (preset: PresetBouquet) => void;
  onReset?: () => void;
}

export const MobileStudio: React.FC<MobileStudioProps> = ({
  bouquet,
  flowersList,
  flowersMap,
  scoreResult,
  selectedOccasion,
  selectedStyle,
  selectedShapeId,
  selectedWrappingId,
  selectedRibbonId,
  wrapCoverage = "top",
  occasionsList,
  stylesList,
  flowerInstances,
  initialInstances,
  onSelectOccasion,
  onSelectStyle,
  onSelectShape,
  onSelectWrapping,
  onSelectRibbon,
  onSelectWrapCoverage,
  onAddFlower,
  onUpdateQuantity,
  onRemoveFlower,
  onChangeColor,
  onClearBouquet,
  onProceedToAnalyze,
  onInstancesChange,
  onManualEditChange,
  onSelectPreset,
  onReset,
}) => {
  // Category tab for bottom flower selector: Flowers vs Leaves (Greenery)
  const [catalogCategory, setCatalogCategory] = useState<"flowers" | "leaves">("flowers");

  // Selected flower instance ID on canvas
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  // Active bottom sheet modal: null | 'occasion' | 'style' | 'shape' | 'wrapping' | 'layers' | 'presets'
  const [activeSheet, setActiveSheet] = useState<
    "occasion" | "style" | "shape" | "wrapping" | "layers" | "presets" | null
  >(null);

  // Shape confirmation modal for user manual arrangements
  const [showShapeConfirmModal, setShowShapeConfirmModal] = useState(false);
  const [pendingShapeId, setPendingShapeId] = useState<string | null>(null);

  // Canvas interaction state
  type FlowerInteractionState = "IDLE" | "SELECTED" | "PRESSED" | "DRAGGING";
  const [interactionState, setInteractionState] = useState<FlowerInteractionState>("IDLE");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 360,
    height: 380,
  });

  // Authoritative flower instances directly from parent props
  const instances = flowerInstances ?? initialInstances ?? [];

  // Ephemeral live dragging state for smooth touch response
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

  // Style composition profile
  const styleProfile = useMemo<StyleCompositionProfile>(() => {
    return getStyleCompositionProfile(selectedStyle?.id);
  }, [selectedStyle?.id]);

  const currentWrapping = useMemo(
    () => resolveWrappingOption(selectedWrappingId),
    [selectedWrappingId]
  );
  const currentRibbon = useMemo(
    () => resolveRibbonOption(selectedRibbonId),
    [selectedRibbonId]
  );
  const currentShape = useMemo(
    () => getBouquetShapeById(selectedShapeId),
    [selectedShapeId]
  );

  const totalStems = useMemo(
    () => bouquet.reduce((sum, item) => sum + item.quantity, 0),
    [bouquet]
  );

  // Sync stage container dimensions with ResizeObserver
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
    const ro = new ResizeObserver(updateSize);
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  // Calculate bouquet bounding box and normalized auto-fit scaling & translation for mobile
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
      stageSize.width || 360,
      stageSize.height || 380,
      {
        targetWidthRatio: 0.65,
        targetHeightRatio: 0.74,
        minScale: 0.85,
        maxScale: 2.20,
        verticalBiasFactor: 0.025,
      }
    );
  }, [bouquetBbox, stageSize.width, stageSize.height]);

  const canvasScale = bouquetFit.scale;

  // Preload flower cutouts
  useEffect(() => {
    const flowerIds = Array.from(flowersMap.keys());
    if (flowerIds.length > 0) {
      preloadFloralCutouts(flowerIds);
    }
  }, [flowersMap]);

  // Currently selected instance object
  const selectedInstance = useMemo(() => {
    if (!selectedInstanceId) return null;
    return renderedInstances.find((i) => i.instanceId === selectedInstanceId) || null;
  }, [renderedInstances, selectedInstanceId]);

  // Categorize flowers into Flowers and Leaves (Greenery)
  const categorizedFlowers = useMemo(() => {
    const leaves: Flower[] = [];
    const flowers: Flower[] = [];

    flowersList.forEach((f) => {
      if (
        f.roles.includes("foliage") ||
        f.id.includes("ruscus") ||
        f.id.includes("eucalyptus") ||
        f.id.includes("fern") ||
        f.id.includes("olive")
      ) {
        leaves.push(f);
      } else {
        flowers.push(f);
      }
    });

    return { flowers, leaves };
  }, [flowersList]);

  const activeCatalogList =
    catalogCategory === "flowers" ? categorizedFlowers.flowers : categorizedFlowers.leaves;

  // Safe helper to notify parent of manual arrangement changes
  const notifyParent = useCallback(
    (updated: FlowerInstance[]) => {
      onManualEditChange?.(updated.some((i) => i.isUserPositioned || i.isManuallyPositioned));
      onInstancesChange?.(updated);
    },
    [onManualEditChange, onInstancesChange]
  );

  // ----------------------------------------------------
  // Touch / Drag Interaction Handlers
  // ----------------------------------------------------
  const DRAG_THRESHOLD = 7;

  interface DragSessionState {
    instanceId: string;
    pointerId: number;
    startX: number;
    startY: number;
    initialBloomX: number;
    initialBloomY: number;
    dragOffsetX: number;
    dragOffsetY: number;
    mode: "PRESSED" | "DRAGGING";
    targetElement: HTMLElement | null;
  }

  const dragSessionRef = useRef<DragSessionState | null>(null);

  const handleFlowerDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, instanceId: string) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.stopPropagation();

      const targetInst = instances.find((i) => i.instanceId === instanceId);
      if (!targetInst) return;

      // Select flower immediately (Tap mode)
      setSelectedInstanceId(instanceId);
      setInteractionState("PRESSED");

      const targetEl = e.currentTarget;
      try {
        targetEl.setPointerCapture?.(e.pointerId);
      } catch {
        // Safe fallback
      }

      const session: DragSessionState = {
        instanceId,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        initialBloomX: targetInst.x,
        initialBloomY: targetInst.y,
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
          const currentEphemeral = ephemeralDrag;
          if (currentEphemeral && currentEphemeral.instanceId === activeSession.instanceId) {
            const tie = styleProfile.tiePoint || { x: 0, y: 52 };
            const updated = updateInstancePosition(
              instances,
              activeSession.instanceId,
              currentEphemeral.x,
              currentEphemeral.y,
              tie.x,
              tie.y
            );
            notifyParent(updated);
          }
        }

        if (activeSession.targetElement && pointerId !== undefined) {
          try {
            if (activeSession.targetElement.hasPointerCapture?.(pointerId)) {
              activeSession.targetElement.releasePointerCapture?.(pointerId);
            }
          } catch {
            // Safe fallback
          }
        }

        setEphemeralDrag(null);
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

        const deltaX = moveEvent.clientX - activeSession.startX;
        const deltaY = moveEvent.clientY - activeSession.startY;
        const distance = Math.hypot(deltaX, deltaY);

        if (activeSession.mode === "PRESSED") {
          if (distance >= DRAG_THRESHOLD) {
            activeSession.mode = "DRAGGING";
            setInteractionState("DRAGGING");
            setDraggingId(activeSession.instanceId);
          } else {
            return;
          }
        }

        if (activeSession.mode === "DRAGGING") {
          moveEvent.preventDefault();
          const deltaX = (moveEvent.clientX - activeSession.startX) / canvasScale;
          const deltaY = (moveEvent.clientY - activeSession.startY) / canvasScale;
          const newX = activeSession.initialBloomX + deltaX;
          const newY = activeSession.initialBloomY + deltaY;

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
    [instances, styleProfile, notifyParent, ephemeralDrag]
  );

  // Background Canvas Click: Deselect when tapping empty canvas background
  const handleCanvasBackgroundClick = useCallback(() => {
    setSelectedInstanceId(null);
    setInteractionState("IDLE");
  }, []);

  // Flower instance editing actions
  const handleRotate = useCallback(
    (instanceId: string, delta: number) => {
      const next = adjustInstanceRotation(instances, instanceId, delta);
      notifyParent(next);
    },
    [instances, notifyParent]
  );

  const handleFlip = useCallback(
    (instanceId: string, axis: "x" | "y") => {
      const next = toggleInstanceFlip(instances, instanceId, axis);
      notifyParent(next);
    },
    [instances, notifyParent]
  );

  const handleScale = useCallback(
    (instanceId: string, deltaOrAction: number | "reset") => {
      const next = adjustInstanceScale(instances, instanceId, deltaOrAction);
      notifyParent(next);
    },
    [instances, notifyParent]
  );

  const handleAdjustDepth = useCallback(
    (instanceId: string, direction: "forward" | "backward" | "toFront" | "toBack") => {
      const next = adjustInstanceDepth(instances, instanceId, direction);
      notifyParent(next);
    },
    [instances, notifyParent]
  );

  const handleDeleteInstance = useCallback(
    (instanceId: string) => {
      const targetInst = instances.find((i) => i.instanceId === instanceId);
      if (!targetInst) return;

      onUpdateQuantity(targetInst.flowerId, -1);
      const { updatedInstances } = removeInstanceById(instances, instanceId);
      notifyParent(updatedInstances);
      setSelectedInstanceId(null);
      setInteractionState("IDLE");
    },
    [instances, onUpdateQuantity, notifyParent]
  );

  // Add flower from mobile carousel
  const handleAddFlowerFromPicker = useCallback(
    (flowerId: string) => {
      const flower = flowersMap.get(flowerId);
      const defaultColor = flower?.colors[0] || "red";
      onAddFlower(flowerId, defaultColor);
    },
    [flowersMap, onAddFlower]
  );

  // Handle shape change with warning if manual edits exist
  const handleRequestChangeShape = useCallback(
    (newShapeId: string) => {
      if (newShapeId === selectedShapeId) {
        setActiveSheet(null);
        return;
      }
      const hasManual = instances.some((i) => i.isUserPositioned);
      if (hasManual) {
        setPendingShapeId(newShapeId);
        setShowShapeConfirmModal(true);
      } else {
        onSelectShape(newShapeId);
        const fresh = generateInitialInstances(
          bouquet,
          flowersMap,
          selectedStyle?.id,
          newShapeId
        );
        onManualEditChange?.(false);
        onInstancesChange?.(fresh);
        setActiveSheet(null);
      }
    },
    [
      instances,
      selectedShapeId,
      onSelectShape,
      bouquet,
      flowersMap,
      selectedStyle?.id,
      onManualEditChange,
      onInstancesChange,
    ]
  );

  const handleConfirmShapeChange = useCallback(() => {
    if (pendingShapeId) {
      onSelectShape(pendingShapeId);
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
    setActiveSheet(null);
    setPendingShapeId(null);
  }, [
    pendingShapeId,
    onSelectShape,
    bouquet,
    flowersMap,
    selectedStyle?.id,
    onManualEditChange,
    onInstancesChange,
  ]);

  return (
    <div
      id="bloomix-mobile-studio"
      className="flex flex-col h-[100dvh] bg-[#F9F7F2] text-[#2D2D2D] select-none overflow-hidden"
    >
      {/* ======================================================== */}
      {/* 1. COMPACT TOUCH-OPTIMIZED MOBILE HEADER                 */}
      {/* ======================================================== */}
      <header
        id="mobile-studio-header"
        className="h-13 bg-[#FDFCF9]/95 backdrop-blur-md border-b border-[#E8E4D9] px-3.5 flex items-center justify-between shrink-0 z-30"
      >
        {/* Left: Back / Reset */}
        <button
          id="mobile-header-btn-back"
          type="button"
          onClick={onReset}
          className="w-10 h-10 -ml-1 flex items-center justify-center text-[#2D2D2D]/70 hover:text-[#2D2D2D] active:scale-95 transition-transform rounded-xl cursor-pointer"
          title="Back to start"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Center: Title & Step Indicator */}
        <div className="flex flex-col items-center text-center">
          <span className="font-serif font-bold text-sm text-[#2D2D2D] tracking-tight leading-tight">
            Design Bouquet
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-sans font-semibold text-[#2D4F1E] bg-[#2D4F1E]/10 px-2 py-0.5 rounded-full border border-[#2D4F1E]/20">
              Step 1 of 2
            </span>
          </div>
        </div>

        {/* Right: Presets & Stems Badge */}
        <div className="flex items-center gap-1">
          <button
            id="mobile-header-btn-presets"
            type="button"
            onClick={() => setActiveSheet("presets")}
            className="h-8 px-2.5 rounded-xl bg-[#FAF8F3] hover:bg-[#F3EFE6] border border-[#E8E4D9] text-[#2D4F1E] text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs"
            title="Curated collections"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            <span className="text-[11px]">Presets</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. LARGE BOUQUET CANVAS PREVIEW (55-58% Screen Height)   */}
      {/* ======================================================== */}
      <main
        id="mobile-canvas-container"
        ref={stageRef}
        onClick={handleCanvasBackgroundClick}
        className="relative flex-1 min-h-[300px] max-h-[58vh] bg-radial from-[#FFFFFF] via-[#FAF7F0] to-[#F1ECE1] flex items-center justify-center overflow-hidden touch-none"
      >
        {/* Subtle Canvas Dot Pattern */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#2D4F1E 1.2px, transparent 1.2px), radial-gradient(#2D4F1E 1.2px, #FAF7F0 1.2px)",
            backgroundSize: "24px 24px",
            backgroundPosition: "0 0, 12px 12px",
          }}
        />

        {/* Top Floating Status Pill: Shape & Style */}
        <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1.5 bg-[#FAF8F5]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#E8E4D9] text-[11px] font-medium text-[#2D3B22] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D4F1E]" />
            <span>{currentShape?.name || "Round Dome"}</span>
            <span className="text-[#2D2D2D]/40">•</span>
            <span className="text-[#2D2D2D]/70">{selectedStyle?.name || "Romantic"}</span>
          </div>

          <div className="bg-[#FAF8F5]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#E8E4D9] text-[11px] font-semibold text-[#2D4F1E] shadow-2xs">
            {totalStems} stems
          </div>
        </div>

        {/* Center Live Botanical Composition (Normalized Auto-Fit Scaling) */}
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
            onSelectInstance={(id) => {
              setSelectedInstanceId(id);
              setInteractionState("SELECTED");
            }}
            onDragStart={handleFlowerDragStart}
            showLabels={true}
          />
        </div>

        {/* Floating Touch Guidance Hint (Visible when idle) */}
        {!selectedInstanceId && totalStems > 0 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-[#1E241A]/80 text-[#FDFCF9] text-[10px] font-sans font-medium px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none z-10 shadow-xs animate-in fade-in duration-300 flex items-center gap-1.5">
            <span className="text-[#A3E635]">●</span>
            <span>Tap stem to edit • Hold & drag to move</span>
          </div>
        )}

        {/* Empty Bouquet State Guidance */}
        {totalStems === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-white/80 border border-dashed border-[#D2CCBF] flex items-center justify-center text-2xl shadow-xs mb-3">
              🌸
            </div>
            <p className="font-serif font-bold text-sm text-[#2D2D2D]">Your bouquet is empty</p>
            <p className="text-xs text-[#2D2D2D]/60 mt-1 max-w-[240px]">
              Tap any flower or foliage from the picker below to start crafting your arrangement.
            </p>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 3. CONTEXTUAL FLOWER EDITING BOTTOM SHEET / DOCKED PANEL */}
      {/* ======================================================== */}
      {selectedInstance && (
        <div
          id="mobile-flower-context-panel"
          onClick={(e) => e.stopPropagation()}
          className="bg-[#FAF8F5] border-t border-[#E8E4D9] p-3 shrink-0 shadow-[0_-8px_20px_rgba(45,79,30,0.08)] z-30 animate-in slide-in-from-bottom-2 duration-150"
        >
          {/* Header: Flower Name + Deselect Button */}
          <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DA]">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs"
                style={{ backgroundColor: selectedInstance.color || "#2D4F1E" }}
              />
              <span className="text-xs font-serif font-bold text-[#2D3B22]">
                {selectedInstance.flowerName}
              </span>
              <span className="text-[10px] text-[#2D2D2D]/60 uppercase tracking-wider bg-[#EFECE3] px-1.5 py-0.5 rounded-md">
                {selectedInstance.role}
              </span>
            </div>

            <button
              id="mobile-edit-btn-close"
              type="button"
              onClick={() => {
                setSelectedInstanceId(null);
                setInteractionState("IDLE");
              }}
              className="p-1 rounded-lg text-[#73806B] hover:text-[#2D3B22] hover:bg-[#EAE4D7] active:scale-95 transition-all cursor-pointer"
              title="Close editing"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons Grid (Min 44px touch targets) */}
          <div className="grid grid-cols-5 gap-2 pt-2.5">
            {/* 1. Rotate */}
            <div className="flex gap-1 col-span-1">
              <button
                id="mobile-btn-rotate-left"
                type="button"
                onClick={() => handleRotate(selectedInstance.instanceId, -15)}
                className="flex-1 h-10 flex flex-col items-center justify-center bg-[#F0ECE1] active:bg-[#D9D0BF] rounded-xl text-[#2D3B22] font-semibold transition-all cursor-pointer shadow-2xs"
                title="Rotate -15°"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[9px] mt-0.5 font-sans">-15°</span>
              </button>
              <button
                id="mobile-btn-rotate-right"
                type="button"
                onClick={() => handleRotate(selectedInstance.instanceId, 15)}
                className="flex-1 h-10 flex flex-col items-center justify-center bg-[#F0ECE1] active:bg-[#D9D0BF] rounded-xl text-[#2D3B22] font-semibold transition-all cursor-pointer shadow-2xs"
                title="Rotate +15°"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[9px] mt-0.5 font-sans">+15°</span>
              </button>
            </div>

            {/* 2. Flip */}
            <div className="flex gap-1 col-span-1">
              <button
                id="mobile-btn-flip-h"
                type="button"
                onClick={() => handleFlip(selectedInstance.instanceId, "x")}
                className={`flex-1 h-10 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer shadow-2xs ${
                  selectedInstance.flipX
                    ? "bg-[#2D4F1E] text-white font-bold"
                    : "bg-[#F0ECE1] active:bg-[#D9D0BF] text-[#2D3B22]"
                }`}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span className="text-[9px] mt-0.5 font-sans">Flip H</span>
              </button>
              <button
                id="mobile-btn-flip-v"
                type="button"
                onClick={() => handleFlip(selectedInstance.instanceId, "y")}
                className={`flex-1 h-10 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer shadow-2xs ${
                  selectedInstance.flipY
                    ? "bg-[#2D4F1E] text-white font-bold"
                    : "bg-[#F0ECE1] active:bg-[#D9D0BF] text-[#2D3B22]"
                }`}
                title="Flip Vertical"
              >
                <FlipVertical className="w-3.5 h-3.5" />
                <span className="text-[9px] mt-0.5 font-sans">Flip V</span>
              </button>
            </div>

            {/* 3. Scale Size */}
            <div className="flex gap-1 col-span-1">
              <button
                id="mobile-btn-scale-down"
                type="button"
                onClick={() => handleScale(selectedInstance.instanceId, -0.06)}
                className="flex-1 h-10 flex flex-col items-center justify-center bg-[#F0ECE1] active:bg-[#D9D0BF] rounded-xl text-[#2D3B22] font-semibold transition-all cursor-pointer shadow-2xs"
                title="Smaller Size"
              >
                <Minus className="w-3.5 h-3.5" />
                <span className="text-[9px] mt-0.5 font-sans">Size −</span>
              </button>
              <button
                id="mobile-btn-scale-up"
                type="button"
                onClick={() => handleScale(selectedInstance.instanceId, 0.06)}
                className="flex-1 h-10 flex flex-col items-center justify-center bg-[#F0ECE1] active:bg-[#D9D0BF] rounded-xl text-[#2D3B22] font-semibold transition-all cursor-pointer shadow-2xs"
                title="Larger Size"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[9px] mt-0.5 font-sans">Size +</span>
              </button>
            </div>

            {/* 4. Layer Ordering */}
            <div className="flex gap-1 col-span-1">
              <button
                id="mobile-btn-layer-up"
                type="button"
                onClick={() => handleAdjustDepth(selectedInstance.instanceId, "forward")}
                className="flex-1 h-10 flex flex-col items-center justify-center bg-[#F0ECE1] active:bg-[#D9D0BF] rounded-xl text-[#2D3B22] font-semibold transition-all cursor-pointer shadow-2xs"
                title="Bring Layer Forward"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="text-[9px] mt-0.5 font-sans">Up</span>
              </button>
              <button
                id="mobile-btn-layer-down"
                type="button"
                onClick={() => handleAdjustDepth(selectedInstance.instanceId, "backward")}
                className="flex-1 h-10 flex flex-col items-center justify-center bg-[#F0ECE1] active:bg-[#D9D0BF] rounded-xl text-[#2D3B22] font-semibold transition-all cursor-pointer shadow-2xs"
                title="Send Layer Backward"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="text-[9px] mt-0.5 font-sans">Down</span>
              </button>
            </div>

            {/* 5. Delete Stem */}
            <div className="col-span-1">
              <button
                id="mobile-btn-delete-stem"
                type="button"
                onClick={() => handleDeleteInstance(selectedInstance.instanceId)}
                className="w-full h-10 flex flex-col items-center justify-center bg-rose-50 active:bg-rose-200 border border-rose-200 text-rose-700 rounded-xl font-semibold transition-all cursor-pointer shadow-2xs"
                title="Delete Stem"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[9px] mt-0.5 font-sans">Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. COMPACT HORIZONTAL CONFIG CHIPS (Occasion/Style/Shape)*/}
      {/* ======================================================== */}
      <div
        id="mobile-quick-chips-bar"
        className="bg-[#FAF8F3] border-t border-[#E8E4D9] px-3 py-1.5 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0 z-20"
      >
        {/* Occasion Chip */}
        <button
          id="chip-btn-occasion"
          type="button"
          onClick={() => setActiveSheet("occasion")}
          className="h-7 px-2.5 rounded-full bg-white hover:bg-[#F4EFE6] border border-[#E8E4D9] text-[11px] font-medium text-[#2D2D2D] flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs active:scale-95"
        >
          <Calendar className="w-3 h-3 text-[#2D4F1E]" />
          <span>Occasion:</span>
          <strong className="text-[#2D4F1E] font-semibold">{selectedOccasion.name}</strong>
        </button>

        {/* Style Chip */}
        <button
          id="chip-btn-style"
          type="button"
          onClick={() => setActiveSheet("style")}
          className="h-7 px-2.5 rounded-full bg-white hover:bg-[#F4EFE6] border border-[#E8E4D9] text-[11px] font-medium text-[#2D2D2D] flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs active:scale-95"
        >
          <Sparkles className="w-3 h-3 text-[#D97706]" />
          <span>Style:</span>
          <strong className="text-[#2D4F1E] font-semibold">{selectedStyle.name}</strong>
        </button>

        {/* Shape Chip */}
        <button
          id="chip-btn-shape"
          type="button"
          onClick={() => setActiveSheet("shape")}
          className="h-7 px-2.5 rounded-full bg-white hover:bg-[#F4EFE6] border border-[#E8E4D9] text-[11px] font-medium text-[#2D2D2D] flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs active:scale-95"
        >
          <Shapes className="w-3 h-3 text-[#2D4F1E]" />
          <span>Shape:</span>
          <strong className="text-[#2D4F1E] font-semibold">{currentShape?.name || "Round"}</strong>
        </button>

        {/* Wrapping Chip */}
        <button
          id="chip-btn-wrapping"
          type="button"
          onClick={() => setActiveSheet("wrapping")}
          className="h-7 px-2.5 rounded-full bg-white hover:bg-[#F4EFE6] border border-[#E8E4D9] text-[11px] font-medium text-[#2D2D2D] flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs active:scale-95"
        >
          <Package className="w-3 h-3 text-[#2D4F1E]" />
          <span>Wrap:</span>
          <strong className="text-[#2D4F1E] font-semibold">{currentWrapping.name}</strong>
        </button>

        {/* Layers Chip */}
        <button
          id="chip-btn-layers"
          type="button"
          onClick={() => setActiveSheet("layers")}
          className="h-7 px-2.5 rounded-full bg-white hover:bg-[#F4EFE6] border border-[#E8E4D9] text-[11px] font-medium text-[#2D2D2D] flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs active:scale-95"
        >
          <Layers className="w-3 h-3 text-[#2D4F1E]" />
          <span>Layers</span>
          <span className="text-[10px] bg-[#2D4F1E]/10 text-[#2D4F1E] px-1 rounded-full font-bold">
            {totalStems}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 5. FLOWER & LEAF SELECTOR (Segmented + Horizontal Scroll)*/}
      {/* ======================================================== */}
      <div
        id="mobile-flower-selector-section"
        className="bg-white border-t border-[#E8E4D9] flex flex-col shrink-0 z-20 pb-1"
      >
        {/* Segmented Control: Flowers vs Leaves */}
        <div className="px-3 pt-2 pb-1.5 flex items-center justify-between">
          <div className="bg-[#F0ECE1] p-0.5 rounded-xl flex items-center w-full max-w-[260px]">
            <button
              id="tab-btn-flowers"
              type="button"
              onClick={() => setCatalogCategory("flowers")}
              className={`flex-1 py-1 text-xs font-serif font-bold rounded-lg transition-all text-center cursor-pointer ${
                catalogCategory === "flowers"
                  ? "bg-white text-[#2D4F1E] shadow-xs"
                  : "text-[#2D2D2D]/60 hover:text-[#2D2D2D]"
              }`}
            >
              🌸 Flowers ({categorizedFlowers.flowers.length})
            </button>
            <button
              id="tab-btn-leaves"
              type="button"
              onClick={() => setCatalogCategory("leaves")}
              className={`flex-1 py-1 text-xs font-serif font-bold rounded-lg transition-all text-center cursor-pointer ${
                catalogCategory === "leaves"
                  ? "bg-white text-[#2D4F1E] shadow-xs"
                  : "text-[#2D2D2D]/60 hover:text-[#2D2D2D]"
              }`}
            >
              🌿 Leaves ({categorizedFlowers.leaves.length})
            </button>
          </div>

          <span className="text-[10px] text-[#2D2D2D]/50 font-sans hidden sm:inline">
            Tap to add stem
          </span>
        </div>

        {/* Horizontal Scrolling Flower Cards */}
        <div
          id="mobile-flower-carousel"
          className="overflow-x-auto scrollbar-none px-3 pb-2 pt-0.5 flex gap-2"
        >
          {activeCatalogList.map((flower) => {
            const countInBouquet =
              bouquet.find((item) => item.flowerId === flower.id)?.quantity || 0;
            const defaultColor = flower.colors[0] || "red";
            const imageUrl = getFlowerImageUrl(flower.id, defaultColor);

            return (
              <button
                key={flower.id}
                id={`mobile-flower-card-${flower.id}`}
                type="button"
                onClick={() => handleAddFlowerFromPicker(flower.id)}
                className="relative w-18 sm:w-20 shrink-0 bg-[#FAF8F3] hover:bg-[#F3EFE6] active:scale-95 border border-[#E8E4D9] rounded-xl p-1.5 flex flex-col items-center text-center cursor-pointer transition-all shadow-2xs"
              >
                {/* Quantity in Bouquet Badge */}
                {countInBouquet > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#2D4F1E] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {countInBouquet}
                  </span>
                )}

                {/* Flower Botanical Cutout Image */}
                <div className="relative w-11 h-11 rounded-lg bg-[#F0EEE6] border border-[#D6CFC0] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center overflow-hidden mb-1 p-0.5">
                  <div
                    className="absolute inset-0 pointer-events-none rounded-[inherit]"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 50%, #F8F6F0 15%, #ECE5D7 68%, #DFD6C3 100%)",
                    }}
                  />
                  <img
                    src={imageUrl}
                    alt={flower.name}
                    className="relative z-10 w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]"
                    loading="lazy"
                  />
                </div>

                {/* Flower Name */}
                <span className="text-[10px] font-serif font-bold text-[#2D2D2D] truncate w-full leading-tight">
                  {flower.name}
                </span>

                {/* Subtitle / DisplayName */}
                <span className="text-[8px] text-[#2D2D2D]/60 truncate w-full font-sans mt-0.5">
                  {flower.displayName || flower.roles[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. STICKY BOTTOM CTA BAR (Continue to Analyze)           */}
      {/* ======================================================== */}
      <footer
        id="mobile-studio-footer"
        className="bg-white border-t border-[#E8E4D9] px-4 py-2.5 pb-safe flex items-center justify-between gap-3 shrink-0 z-30 shadow-xs"
      >
        {/* Composition Score Summary */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#2D2D2D]/60 uppercase tracking-wider font-semibold">
              Harmony Score
            </span>
            <span className="text-xs font-serif font-bold text-[#2D4F1E]">
              {scoreResult.overall}/100
            </span>
          </div>
          <span className="text-[10px] text-[#2D2D2D]/50">
            {totalStems} stems in arrangement
          </span>
        </div>

        {/* Continue Button */}
        <button
          id="mobile-btn-continue"
          type="button"
          onClick={onProceedToAnalyze}
          disabled={totalStems === 0}
          className={`h-11 px-5 rounded-2xl font-serif font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95 ${
            totalStems > 0
              ? "bg-[#2D4F1E] hover:bg-[#233F17] text-white"
              : "bg-[#EAE5DA] text-[#2D2D2D]/40 cursor-not-allowed"
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>

      {/* ======================================================== */}
      {/* 7. COMPACT MOBILE BOTTOM SHEETS FOR PICKERS              */}
      {/* ======================================================== */}

      {/* OCCASION PICKER SHEET */}
      {activeSheet === "occasion" && (
        <div
          id="sheet-backdrop-occasion"
          onClick={() => setActiveSheet(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            id="sheet-content-occasion"
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] rounded-t-3xl border-t border-[#E8E4D9] p-4 max-h-[75vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250"
          >
            <div className="w-10 h-1 bg-[#D2CCBF] rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4D9]">
              <h3 className="font-serif font-bold text-base text-[#2D2D2D]">Select Occasion</h3>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="p-1 rounded-lg text-[#2D2D2D]/50 hover:text-[#2D2D2D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 overflow-y-auto py-3">
              {occasionsList.occasions.map((occ) => {
                const isSelected = occ.id === selectedOccasion.id;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => {
                      onSelectOccasion(occ.id);
                      setActiveSheet(null);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#2D4F1E] text-white border-[#2D4F1E] shadow-sm"
                        : "bg-white text-[#2D2D2D] border-[#E8E4D9] hover:bg-[#F3EFE6]"
                    }`}
                  >
                    <div className="font-serif font-bold text-xs">{occ.name}</div>
                    <div
                      className={`text-[10px] truncate mt-0.5 ${
                        isSelected ? "text-white/80" : "text-[#2D2D2D]/60"
                      }`}
                    >
                      {occ.displayName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STYLE PICKER SHEET */}
      {activeSheet === "style" && (
        <div
          id="sheet-backdrop-style"
          onClick={() => setActiveSheet(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            id="sheet-content-style"
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] rounded-t-3xl border-t border-[#E8E4D9] p-4 max-h-[75vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250"
          >
            <div className="w-10 h-1 bg-[#D2CCBF] rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4D9]">
              <h3 className="font-serif font-bold text-base text-[#2D2D2D]">Select Style</h3>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="p-1 rounded-lg text-[#2D2D2D]/50 hover:text-[#2D2D2D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 overflow-y-auto py-3">
              {stylesList.styles.map((style) => {
                const isSelected = style.id === selectedStyle.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      onSelectStyle(style.id);
                      setActiveSheet(null);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#2D4F1E] text-white border-[#2D4F1E] shadow-sm"
                        : "bg-white text-[#2D2D2D] border-[#E8E4D9] hover:bg-[#F3EFE6]"
                    }`}
                  >
                    <div className="font-serif font-bold text-xs">{style.name}</div>
                    <div
                      className={`text-[10px] line-clamp-1 mt-0.5 ${
                        isSelected ? "text-white/80" : "text-[#2D2D2D]/60"
                      }`}
                    >
                      {style.displayName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SHAPE PICKER SHEET */}
      {activeSheet === "shape" && (
        <div
          id="sheet-backdrop-shape"
          onClick={() => setActiveSheet(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            id="sheet-content-shape"
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] rounded-t-3xl border-t border-[#E8E4D9] p-4 max-h-[75vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250"
          >
            <div className="w-10 h-1 bg-[#D2CCBF] rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4D9]">
              <h3 className="font-serif font-bold text-base text-[#2D2D2D]">Bouquet Shape</h3>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="p-1 rounded-lg text-[#2D2D2D]/50 hover:text-[#2D2D2D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto py-3">
              {BOUQUET_SHAPES.map((shape) => {
                const isSelected = shape.id === selectedShapeId;
                return (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => handleRequestChangeShape(shape.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#2D4F1E] text-white border-[#2D4F1E] shadow-sm"
                        : "bg-white text-[#2D2D2D] border-[#E8E4D9] hover:bg-[#F3EFE6]"
                    }`}
                  >
                    <div>
                      <div className="font-serif font-bold text-xs">{shape.name}</div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          isSelected ? "text-white/80" : "text-[#2D2D2D]/60"
                        }`}
                      >
                        {shape.vietnamese} — {shape.description}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WRAPPING & RIBBON PICKER SHEET */}
      {activeSheet === "wrapping" && (
        <div
          id="sheet-backdrop-wrapping"
          onClick={() => setActiveSheet(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            id="sheet-content-wrapping"
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] rounded-t-3xl border-t border-[#E8E4D9] p-4 max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250"
          >
            <div className="w-10 h-1 bg-[#D2CCBF] rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4D9]">
              <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
                Wrapping Paper & Ribbon
              </h3>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="p-1 rounded-lg text-[#2D2D2D]/50 hover:text-[#2D2D2D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto py-3">
              {/* Wrapping Coverage Style (Top Wrap vs Full Wrap) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-[#2D2D2D]/60 block">
                    Wrapping Style • Kiểu bọc
                  </span>
                  <span className="text-[10px] font-semibold text-[#2D4F1E] bg-[#EAF3E6] px-2 py-0.5 rounded-md">
                    {wrapCoverage === "full" ? "Bọc toàn phần (Full Wrap)" : "Bọc trên (Top Wrap)"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectWrapCoverage?.("top")}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      wrapCoverage === "top"
                        ? "bg-[#2D4F1E] text-white border-[#2D4F1E] shadow-xs"
                        : "bg-white text-[#2D2D2D] border-[#E8E4D9] hover:bg-[#F3EFE6]"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                      wrapCoverage === "top" ? "bg-white/20 text-white" : "bg-[#FAF8F3] text-[#2D4F1E] border border-[#E8E4D9]"
                    }`}>
                      Top
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-serif font-bold truncate block">Top Wrap</span>
                      <span className={`text-[10px] truncate block ${wrapCoverage === "top" ? "text-white/80" : "text-[#2D2D2D]/60"}`}>
                        Bọc trên
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectWrapCoverage?.("full")}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      wrapCoverage === "full"
                        ? "bg-[#2D4F1E] text-white border-[#2D4F1E] shadow-xs"
                        : "bg-white text-[#2D2D2D] border-[#E8E4D9] hover:bg-[#F3EFE6]"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                      wrapCoverage === "full" ? "bg-white/20 text-white" : "bg-[#FAF8F3] text-[#2D4F1E] border border-[#E8E4D9]"
                    }`}>
                      Full
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-serif font-bold truncate block">Full Wrap</span>
                      <span className={`text-[10px] truncate block ${wrapCoverage === "full" ? "text-white/80" : "text-[#2D2D2D]/60"}`}>
                        Bọc toàn phần
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Wrapping Papers */}
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#2D2D2D]/60 mb-2 block">
                  Wrapping Paper
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {WRAPPING_OPTIONS.map((wrap) => {
                    const isSelected = wrap.id === selectedWrappingId;
                    return (
                      <button
                        key={wrap.id}
                        type="button"
                        onClick={() => onSelectWrapping(wrap.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2D4F1E] text-white border-[#2D4F1E] shadow-xs"
                            : "bg-white text-[#2D2D2D] border-[#E8E4D9] hover:bg-[#F3EFE6]"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: wrap.paperColor }}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-serif font-bold truncate block">
                            {wrap.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tied Ribbons */}
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#2D2D2D]/60 mb-2 block">
                  Ribbon & Bow
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {RIBBON_OPTIONS.map((rib) => {
                    const isSelected = rib.id === selectedRibbonId;
                    return (
                      <button
                        key={rib.id}
                        type="button"
                        onClick={() => onSelectRibbon(rib.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2D4F1E] text-white border-[#2D4F1E] shadow-xs"
                            : "bg-white text-[#2D2D2D] border-[#E8E4D9] hover:bg-[#F3EFE6]"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: rib.color }}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-serif font-bold truncate block">
                            {rib.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAYERS SHEET */}
      {activeSheet === "layers" && (
        <div
          id="sheet-backdrop-layers"
          onClick={() => setActiveSheet(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            id="sheet-content-layers"
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] rounded-t-3xl border-t border-[#E8E4D9] p-4 max-h-[75vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250"
          >
            <div className="w-10 h-1 bg-[#D2CCBF] rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4D9]">
              <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
                Bouquet Stems ({renderedInstances.length})
              </h3>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="p-1 rounded-lg text-[#2D2D2D]/50 hover:text-[#2D2D2D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1.5 overflow-y-auto py-3">
              {[...renderedInstances]
                .sort((a, b) => b.depth - a.depth)
                .map((inst, index) => (
                  <div
                    key={inst.instanceId}
                    onClick={() => {
                      setSelectedInstanceId(inst.instanceId);
                      setInteractionState("SELECTED");
                      setActiveSheet(null);
                    }}
                    className="bg-white p-2.5 rounded-xl border border-[#E8E4D9] flex items-center justify-between cursor-pointer hover:bg-[#F3EFE6] transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#2D2D2D]/40 font-mono">#{index + 1}</span>
                      <span
                        className="w-3 h-3 rounded-full border border-black/10"
                        style={{ backgroundColor: inst.color || "#2D4F1E" }}
                      />
                      <span className="text-xs font-serif font-bold text-[#2D2D2D]">
                        {inst.flowerName}
                      </span>
                      <span className="text-[9px] uppercase bg-[#FAF8F3] px-1.5 py-0.5 rounded text-[#2D2D2D]/60">
                        {inst.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleAdjustDepth(inst.instanceId, "forward")}
                        className="p-1 rounded-lg hover:bg-[#FAF8F3] text-[#2D2D2D]/70 cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustDepth(inst.instanceId, "backward")}
                        className="p-1 rounded-lg hover:bg-[#FAF8F3] text-[#2D2D2D]/70 cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* PRESETS SHEET */}
      {activeSheet === "presets" && (
        <div
          id="sheet-backdrop-presets"
          onClick={() => setActiveSheet(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            id="sheet-content-presets"
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] rounded-t-3xl border-t border-[#E8E4D9] p-4 max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250"
          >
            <div className="w-10 h-1 bg-[#D2CCBF] rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4D9]">
              <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
                Curated Preset Bouquets
              </h3>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="p-1 rounded-lg text-[#2D2D2D]/50 hover:text-[#2D2D2D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2.5 overflow-y-auto py-3">
              {DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset?.(preset);
                    setActiveSheet(null);
                  }}
                  className="bg-white p-3 rounded-2xl border border-[#E8E4D9] hover:bg-[#F3EFE6] text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-bold text-xs text-[#2D2D2D]">
                        {preset.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#2D2D2D]/60 mt-0.5 line-clamp-1">
                      {preset.subtitle}
                    </p>
                  </div>
                  <span className="text-xs text-[#2D4F1E] font-semibold group-hover:translate-x-0.5 transition-transform">
                    Apply →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SHAPE CHANGE CONFIRMATION MODAL */}
      {showShapeConfirmModal && (
        <div
          id="modal-shape-confirm"
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full space-y-4 shadow-2xl border border-[#E8E4D9]">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-serif font-bold text-sm text-[#2D2D2D]">
                Reset Manual Stem Arrangement?
              </h4>
              <p className="text-xs text-[#2D2D2D]/70">
                Changing the bouquet shape will re-arrange your flower positions to match the selected layout profile.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowShapeConfirmModal(false);
                  setPendingShapeId(null);
                }}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-[#E8E4D9] text-[#2D2D2D] hover:bg-[#FAF8F3] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmShapeChange}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-[#2D4F1E] text-white hover:bg-[#233F17] cursor-pointer shadow-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
