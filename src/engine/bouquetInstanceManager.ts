import type { BouquetItem, Flower, FlowerInstance, FlowerRole } from "./types.ts";
import {
  getStyleCompositionProfile,
  type StyleCompositionProfile,
  computeBotanicalStemPath,
  getStemColorByRole,
} from "./styleComposition.ts";
import { computeNormalizedScale } from "./flowerScaleNormalization.ts";
import { generateBouquetLayout } from "./bouquetShapeLayoutEngine.ts";

export {
  getStyleCompositionProfile,
  type StyleCompositionProfile,
  computeBotanicalStemPath as computeStemPath,
  getStemColorByRole as getStemColor,
};

/**
 * Generates initial flower instances based on the explicit Bouquet Shape Engine and Style rules
 */
export function generateInitialInstances(
  bouquet: BouquetItem[],
  flowersMap: Map<string, Flower>,
  styleId: string = "romantic",
  shapeId: string = "round-dome"
): FlowerInstance[] {
  const result = generateBouquetLayout({
    shapeId,
    styleId,
    bouquet,
    flowersMap,
  });
  return result.instances;
}

/**
 * Synchronizes existing instances with the target bouquet quantities.
 * CRITICAL REQUIREMENT:
 * - Never rearranges or resets positions of existing instances!
 * - When quantity increases, generates new instance(s) with deterministic normalized scale and smart placement.
 * - When quantity decreases, removes the newest instance of that flower.
 * - Preserves user-dragged coordinates, scale, flips, and depths.
 */
export function syncInstancesWithBouquet(
  currentInstances: FlowerInstance[],
  targetBouquet: BouquetItem[],
  flowersMap: Map<string, Flower>,
  styleId: string = "romantic",
  shapeId?: string
): FlowerInstance[] {
  const profile = getStyleCompositionProfile(styleId);
  const rule = profile.rule;
  const tie = profile.tiePoint;
  const massCenter = profile.massCenter;

  const updated: FlowerInstance[] = [...currentInstances];

  // Map of target quantities by flowerId
  const targetMap = new Map<string, { quantity: number; color?: string }>();
  targetBouquet.forEach((item) => {
    targetMap.set(item.flowerId, {
      quantity: item.quantity,
      color: item.selectedColor,
    });
  });

  // 1. Remove instances of flowers no longer in target or whose count exceeded
  const groupedByFlower = new Map<string, FlowerInstance[]>();
  currentInstances.forEach((inst) => {
    const list = groupedByFlower.get(inst.flowerId) || [];
    list.push(inst);
    groupedByFlower.set(inst.flowerId, list);
  });

  // Calculate removals
  groupedByFlower.forEach((instList, flowerId) => {
    const target = targetMap.get(flowerId);
    const targetCount = target ? target.quantity : 0;
    if (instList.length > targetCount) {
      // Remove excess instances from the end of the list
      const excessCount = instList.length - targetCount;
      const toRemove = instList.slice(instList.length - excessCount);
      const removeIds = new Set(toRemove.map((i) => i.instanceId));
      for (let i = updated.length - 1; i >= 0; i--) {
        if (removeIds.has(updated[i].instanceId)) {
          updated.splice(i, 1);
        }
      }
    }
  });

  // 2. Add missing instances for flowers whose quantity increased
  targetBouquet.forEach((item) => {
    const flower = flowersMap.get(item.flowerId);
    if (!flower) return;
    const existingList = updated.filter((inst) => inst.flowerId === item.flowerId);
    const currentCount = existingList.length;
    const needed = item.quantity - currentCount;

    if (needed > 0) {
      const primaryRole: FlowerRole = flower.roles[0] || "focal";
      const color = item.selectedColor || flower.colors[0] || "red";

      const roleConfig =
        primaryRole === "foliage"
          ? rule.foliage
          : primaryRole === "filler"
          ? rule.filler
          : primaryRole === "focal"
          ? rule.focal
          : rule.secondary;

      for (let i = 0; i < needed; i++) {
        const instanceNumber = currentCount + i + 1;
        const instanceId = `${item.flowerId}-${instanceNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        // Calculate placement based on bouquetShapes.json role configuration
        let baseX = 0;
        let baseY = massCenter.y;
        let baseRotate = 0;
        let baseDepth = 45;

        // Deterministic normalized scale matching species baseline
        const { baseSize, scale: baseScale, baseScale: origBaseScale } = computeNormalizedScale(
          flower.id,
          primaryRole,
          roleConfig.scaleMultiplier,
          instanceNumber - 1
        );

        if (primaryRole === "foliage") {
          const side = instanceNumber % 2 === 0 ? -1 : 1;
          baseX = side * (50 + instanceNumber * 8) * rule.width;
          baseY = massCenter.y - 30 - instanceNumber * 6;
          baseRotate = side * (12 + instanceNumber * 4);
          baseDepth = 15 + instanceNumber;
        } else if (primaryRole === "filler") {
          const side = instanceNumber % 2 === 0 ? -1 : 1;
          baseX = side * (36 + instanceNumber * 6) * rule.width;
          baseY = massCenter.y - 18 - instanceNumber * 5;
          baseRotate = side * (8 + instanceNumber * 3);
          baseDepth = 30 + instanceNumber;
        } else if (primaryRole === "focal") {
          const side = instanceNumber % 2 === 0 ? 1 : -1;
          baseX = (instanceNumber === 1 ? 0 : side * (18 + instanceNumber * 4)) * rule.width;
          baseY = massCenter.y + (instanceNumber === 1 ? 4 : 10 + instanceNumber * 3);
          baseRotate = side * (4 + instanceNumber * 2);
          baseDepth = 60 + instanceNumber;
        } else {
          const side = instanceNumber % 2 === 0 ? 1 : -1;
          baseX = side * (24 + instanceNumber * 6) * rule.width;
          baseY = massCenter.y - 6 + (instanceNumber % 2 === 0 ? -6 : 6);
          baseRotate = side * (6 + instanceNumber * 2);
          baseDepth = 42 + instanceNumber;
        }

        updated.push({
          instanceId,
          flowerId: item.flowerId,
          flowerName: flower.name,
          role: primaryRole,
          color,
          size: baseSize,
          scale: baseScale,
          baseScale: origBaseScale,
          x: Math.round(baseX),
          y: Math.round(baseY),
          rotate: Math.round(baseRotate),
          rotation: Math.round(baseRotate),
          flipX: false,
          flipY: false,
          depth: baseDepth,
          zIndex: baseDepth,
          stemPath: computeBotanicalStemPath(baseX, baseY, baseSize, baseScale, tie.x, tie.y, rule.stemDirection),
          stemColor: getStemColorByRole(primaryRole),
          isUserPositioned: false,
          isManuallyPositioned: false,
        });
      }
    }

    // Update color if modified
    if (item.selectedColor) {
      updated.forEach((inst) => {
        if (inst.flowerId === item.flowerId) {
          inst.color = item.selectedColor!;
        }
      });
    }
  });

  return updated;
}

/**
 * Re-arranges instances when style or shape changes, strictly preserving user-manually-positioned/edited flowers.
 */
export function reapplyStylePreservingUserPositions(
  currentInstances: FlowerInstance[],
  bouquet: BouquetItem[],
  flowersMap: Map<string, Flower>,
  newStyleId: string,
  newShapeId?: string
): FlowerInstance[] {
  if (currentInstances.length === 0) {
    return generateInitialInstances(bouquet, flowersMap, newStyleId, newShapeId);
  }

  // Generate fresh algorithmic layout for the new style + shape
  const freshLayout = generateInitialInstances(bouquet, flowersMap, newStyleId, newShapeId);

  // For each instance: if user positioned/edited it, preserve exact x, y, rotate, depth, scale, flips.
  // Otherwise, adopt the new style + shape layout position.
  return freshLayout.map((freshInst, idx) => {
    const existing = currentInstances.find((e) => e.instanceId === freshInst.instanceId) || currentInstances[idx];
    if (existing && existing.isUserPositioned) {
      return {
        ...freshInst,
        x: existing.x,
        y: existing.y,
        rotate: existing.rotate,
        rotation: existing.rotate,
        flipX: existing.flipX,
        flipY: existing.flipY,
        scale: existing.scale,
        depth: existing.depth,
        zIndex: existing.depth,
        isUserPositioned: true,
        stemPath: computeBotanicalStemPath(
          existing.x,
          existing.y,
          freshInst.size,
          existing.scale,
          0,
          52
        ),
      };
    }
    return freshInst;
  });
}

/**
 * Updates an instance's position and recalculates its continuous botanical stem path.
 */
export function updateInstancePosition(
  instances: FlowerInstance[],
  instanceId: string,
  newX: number,
  newY: number,
  tieX: number = 0,
  tieY: number = 52
): FlowerInstance[] {
  return instances.map((inst) => {
    if (inst.instanceId === instanceId) {
      // Allow fluid free movement across the entire florist canvas
      const clampedX = Math.max(-165, Math.min(165, newX));
      const clampedY = Math.max(-185, Math.min(115, newY));
      return {
        ...inst,
        x: clampedX,
        y: clampedY,
        stemPath: computeBotanicalStemPath(clampedX, clampedY, inst.size, inst.scale, tieX, tieY),
        isUserPositioned: true,
        isManuallyPositioned: true,
      };
    }
    return inst;
  });
}

/**
 * Adjusts the z-index depth layer of an instance (Bring Forward / Send Backward / To Front / To Back)
 */
export function adjustInstanceDepth(
  instances: FlowerInstance[],
  instanceId: string,
  direction: "forward" | "backward" | "toFront" | "toBack"
): FlowerInstance[] {
  const target = instances.find((i) => i.instanceId === instanceId);
  if (!target) return instances;

  const currentDepth = target.depth;
  let newDepth = currentDepth;

  if (direction === "forward") {
    newDepth = Math.min(95, currentDepth + 4);
  } else if (direction === "backward") {
    newDepth = Math.max(10, currentDepth - 4);
  } else if (direction === "toFront") {
    const maxDepth = Math.max(...instances.map((i) => i.depth), 60);
    newDepth = maxDepth + 2;
  } else if (direction === "toBack") {
    const minDepth = Math.min(...instances.map((i) => i.depth), 20);
    newDepth = Math.max(10, minDepth - 2);
  }

  return instances.map((inst) =>
    inst.instanceId === instanceId
      ? { ...inst, depth: newDepth, zIndex: newDepth, isUserPositioned: true, isManuallyPositioned: true }
      : inst
  );
}

/**
 * Adjusts the rotation angle of an instance (delta or absolute)
 */
export function adjustInstanceRotation(
  instances: FlowerInstance[],
  instanceId: string,
  deltaAngle: number
): FlowerInstance[] {
  return instances.map((inst) => {
    if (inst.instanceId === instanceId) {
      const nextRot = Math.round((inst.rotate + deltaAngle + 360) % 360);
      return { ...inst, rotate: nextRot, rotation: nextRot, isUserPositioned: true, isManuallyPositioned: true };
    }
    return inst;
  });
}

/**
 * Sets the exact rotation angle of an instance
 */
export function setInstanceRotation(
  instances: FlowerInstance[],
  instanceId: string,
  angle: number
): FlowerInstance[] {
  return instances.map((inst) => {
    if (inst.instanceId === instanceId) {
      const normalizedAngle = Math.round((angle % 360 + 360) % 360);
      return { ...inst, rotate: normalizedAngle, rotation: normalizedAngle, isUserPositioned: true, isManuallyPositioned: true };
    }
    return inst;
  });
}

/**
 * Toggles horizontal or vertical flipping for an instance
 */
export function toggleInstanceFlip(
  instances: FlowerInstance[],
  instanceId: string,
  axis: "x" | "y"
): FlowerInstance[] {
  return instances.map((inst) => {
    if (inst.instanceId === instanceId) {
      return {
        ...inst,
        flipX: axis === "x" ? !inst.flipX : inst.flipX,
        flipY: axis === "y" ? !inst.flipY : inst.flipY,
        isUserPositioned: true,
        isManuallyPositioned: true,
      };
    }
    return inst;
  });
}

/**
 * Adjusts the visual scale of a single flower instance (e.g. Size + / Size - / Reset)
 */
export function adjustInstanceScale(
  instances: FlowerInstance[],
  instanceId: string,
  deltaOrAction: number | "reset",
  defaultBaseScale?: number
): FlowerInstance[] {
  return instances.map((inst) => {
    if (inst.instanceId === instanceId) {
      let nextScale = inst.scale;
      if (deltaOrAction === "reset") {
        nextScale = inst.baseScale || defaultBaseScale || 1.0;
      } else {
        // Clamp scale within [0.55, 1.85]
        nextScale = Math.max(0.55, Math.min(1.85, parseFloat((inst.scale + deltaOrAction).toFixed(2))));
      }
      return {
        ...inst,
        scale: nextScale,
        isUserPositioned: true,
        isManuallyPositioned: true,
      };
    }
    return inst;
  });
}

/**
 * Removes a specific flower instance by its unique instanceId
 */
export function removeInstanceById(
  instances: FlowerInstance[],
  instanceId: string
): { updatedInstances: FlowerInstance[]; removedFlowerId: string | null } {
  const target = instances.find((i) => i.instanceId === instanceId);
  if (!target) return { updatedInstances: instances, removedFlowerId: null };

  const updatedInstances = instances.filter((i) => i.instanceId !== instanceId);
  return { updatedInstances, removedFlowerId: target.flowerId };
}
