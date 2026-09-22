import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { BouquetItem, FlowerInstance } from "../engine/types.ts";
import { getFlowerImageUrl, resolveWrappingOption, resolveRibbonOption } from "./botanicalImages.ts";
import { getTransparentFlowerCutout } from "./flowerCutoutProcessor.ts";
import { BouquetWrapping } from "../components/BouquetWrapping.tsx";
import { BouquetStemNetwork } from "../components/BouquetStemNetwork.tsx";
import { getStyleCompositionProfile } from "../engine/bouquetInstanceManager.ts";
import { computeBouquetBoundingBox, computeBouquetFit } from "./bouquetFitEngine.ts";

export interface FlowerSummaryItem {
  flowerId: string;
  flowerName: string;
  quantity: number;
  role: string[];
  color: string;
}

export interface FlowerInstanceSpec {
  instanceId: string;
  flowerId: string;
  flowerName: string;
  role: string;
  color: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  relativePosition: string;
}

export interface FlowerGroupedSummary {
  flowerId: string;
  flowerName: string;
  quantity: number;
  role: string;
  color: string;
}

/**
 * Deterministically analyzes the customer's actual bouquet instances to generate
 * an authentic, human-readable composition description.
 */
export function generateDynamicCompositionDescription(
  instances: FlowerInstance[] | undefined,
  shapeName: string,
  totalStems: number
): string {
  if (!instances || instances.length === 0) {
    return `Structured in a classic ${shapeName} silhouette with balanced floral placement.`;
  }

  const descriptions: string[] = [];

  // 1. Focal bloom positioning
  const focalBlooms = instances.filter((i) =>
    (i.role || "").toLowerCase().includes("focal")
  );
  if (focalBlooms.length > 0) {
    const avgFocalDist =
      focalBlooms.reduce(
        (sum, i) => sum + Math.sqrt(i.x * i.x + (i.y + 15) * (i.y + 15)),
        0
      ) / focalBlooms.length;

    if (avgFocalDist < 50) {
      descriptions.push("Focal flowers are clustered near the visual center.");
    } else {
      descriptions.push(
        "Dominant focal blooms form the prominent anchor across the central and upper tiers."
      );
    }
  }

  // 2. Symmetry / Asymmetry detection
  const avgX =
    instances.reduce((sum, i) => sum + i.x, 0) / instances.length;
  const leftCount = instances.filter((i) => i.x < -18).length;
  const rightCount = instances.filter((i) => i.x > 18).length;
  const isAsymmetric =
    Math.abs(avgX) > 16 || Math.abs(leftCount - rightCount) >= 3;

  if (isAsymmetric) {
    descriptions.push("The bouquet uses a gently asymmetric arrangement.");
  } else {
    descriptions.push(
      `The arrangement maintains a balanced ${shapeName} silhouette with cohesive radial harmony.`
    );
  }

  // 3. Foliage distribution
  const foliageBlooms = instances.filter((i) =>
    (i.role || "").toLowerCase().includes("foliage")
  );
  if (foliageBlooms.length > 0) {
    const hasPerimeterFoliage = foliageBlooms.some(
      (i) => Math.abs(i.x) > 40 || i.y < -40 || i.y > 35
    );
    if (hasPerimeterFoliage) {
      descriptions.push(
        "Foliage frames the bouquet and extends slightly beyond the flower mass."
      );
    } else {
      descriptions.push(
        "Foliage provides an organic botanical backing and grounding foundation."
      );
    }
  }

  // 4. Filler flower distribution
  const fillerBlooms = instances.filter((i) =>
    (i.role || "").toLowerCase().includes("filler")
  );
  if (fillerBlooms.length > 0) {
    descriptions.push(
      "Small filler flowers occupy the spaces between the main blooms."
    );
  }

  // 5. Depth and layering
  const depths = new Set(instances.map((i) => i.depth || 0));
  if (depths.size > 2) {
    descriptions.push(
      `Stems are arranged across ${depths.size} depth layers for natural volume and botanical overlap.`
    );
  }

  return descriptions.join("\n");
}

/**
 * Formats the dynamic flower list according to the specified prompt template format:
 *
 * Rose ×3
 * Role: Focal
 * Color: Red
 */
export function formatDynamicFlowerList(
  bouquet: BouquetItem[],
  flowersMap: Map<string, any>
): string {
  if (!bouquet || bouquet.length === 0) {
    return "No flowers selected.";
  }

  return bouquet
    .map((item) => {
      const flower = flowersMap.get(item.flowerId);
      const name = flower?.name || item.flowerId;
      const roleStr = flower?.roles
        ? flower.roles
            .map((r: string) => r.charAt(0).toUpperCase() + r.slice(1))
            .join(", ")
        : "Secondary";
      const color =
        item.selectedColor ||
        (flower?.colors && flower.colors[0]) ||
        "Natural";

      return `${name} ×${item.quantity}\nRole: ${roleStr}\nColor: ${color}`;
    })
    .join("\n\n");
}

/**
 * Generates an authoritative, deterministic Gemini prompt dynamically from the final bouquet state,
 * specifically structured for realistic florist photography of a person holding the custom bouquet.
 * Translates the customer's Bloomix digital design blueprint into a physical hand-tied bouquet.
 */
export function generateGeminiRealisticBouquetPrompt(params: {
  occasion: { name: string; displayName?: string };
  style: { name: string; description?: string };
  shape: { name: string };
  wrapping: { name: string; paperColor?: string; wrapCoverage?: "top" | "full" };
  ribbon: { name: string; color?: string };
  bouquet: BouquetItem[];
  flowersMap: Map<string, any>;
  instances?: FlowerInstance[];
}): string {
  const dynamicFlowerList = formatDynamicFlowerList(
    params.bouquet,
    params.flowersMap
  );
  const totalStems = params.bouquet.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const dynamicComposition = generateDynamicCompositionDescription(
    params.instances,
    params.shape.name,
    totalStems
  );

  return `Use the attached Bloomix bouquet image as a DIGITAL DESIGN BLUEPRINT,
NOT as a literal photographic object.

The attached image represents a bouquet designed by the customer
inside a digital bouquet builder.

Your task is to transform that DIGITAL DESIGN into a
PHYSICALLY REALISTIC HAND-TIED FLORIST BOUQUET.

==================================================
MOST IMPORTANT RULE
==================================================

DO NOT reproduce the digital mockup literally.

The digital reference is used to determine:

- flower species
- approximate flower quantity
- flower colors
- focal flowers
- secondary flowers
- filler flowers
- foliage
- relative flower placement
- overall bouquet composition
- overall bouquet proportions

The digital reference is NOT a literal reference for:

- UI graphics
- geometric wrapping shapes
- rectangular or triangular image containers
- artificial stems
- digital shadows
- graphic outlines
- card-like elements
- interface decorations

Reconstruct the design as if a PROFESSIONAL FLORIST physically
made the bouquet in real life.

==================================================
CUSTOMER BOUQUET SPECIFICATION
==================================================

Occasion: ${params.occasion.name}${params.occasion.displayName ? ` (${params.occasion.displayName})` : ""}
Style Theme: ${params.style.name}${params.style.description ? ` — ${params.style.description}` : ""}
Bouquet Shape: ${params.shape.name}
Wrapping Paper: ${params.wrapping.name} (${params.wrapping.wrapCoverage === "full" ? "Full florist cone enclosing stems down to the base with bow tied at the handle" : "Top cone wrapping with fresh stems exposed below"})
Tied Ribbon: ${params.ribbon.name}

==================================================
SELECTED FLOWERS & SPECIES
==================================================

${dynamicFlowerList}

==================================================
BOUQUET COMPOSITION & ARRANGEMENT
==================================================

${dynamicComposition}

Preserve the customer's flower selection and overall composition.

Do not redesign the flower arrangement unnecessarily.

Maintain the visual hierarchy shown in the reference.

Focal flowers should remain the dominant flowers.

Supporting flowers should remain secondary.

Filler flowers should remain smaller and fill natural gaps.

Foliage should support and frame the bouquet.

The result should feel like one physically assembled bouquet.

==================================================
FLOWER REALISM
==================================================

Render real botanical flowers with:

- realistic petals
- natural petal irregularity
- realistic texture
- realistic leaves
- natural stems
- natural flower proportions
- subtle natural color variation
- realistic depth

Do NOT make the flowers look like:
- stickers
- PNG cutouts
- CGI objects
- plastic flowers
- illustrations
- icons

The flowers should visually belong to the same real-world
photographic environment.

==================================================
PHYSICAL BOUQUET CONSTRUCTION
==================================================

Construct the bouquet as a real florist would.

Flowers should naturally emerge from a common gathered stem area.

Stems should converge naturally toward the hand/binding point.

Flowers should overlap one another naturally.

Foliage should sit between and behind flowers.

Filler flowers should weave naturally through the bouquet.

Do NOT create artificial lines connecting individual flowers.

Do NOT create floating flowers.

==================================================
WRAPPING
==================================================

IMPORTANT:

The wrapping shown in the digital reference is only a DESIGN INDICATOR.

Translate it into realistic physical florist wrapping.

Do NOT reproduce the digital triangular geometry literally.

Use real wrapping paper with:

- natural folds
- layered paper sheets
- believable overlapping edges
- soft creases
- natural paper thickness
- realistic shadows
- natural taper toward the binding point

The wrapping should support the bouquet,
not dominate it.

Use a tasteful paper color (${params.wrapping.name}) compatible with the customer's design.

==================================================
HUMAN PRESENTATION
==================================================

Create a realistic lifestyle/product photograph of
ONE PERSON NATURALLY HOLDING THE BOUQUET.

The person should be secondary to the bouquet.

The bouquet must be the primary visual subject.

Show:

- realistic hands
- natural grip
- believable arm position
- natural posture
- realistic human proportions

The pose should feel similar to a real florist or customer
holding a bouquet for a photograph.

Do not make the person the focus.

The face can be partially outside the frame or softly cropped.

==================================================
PHOTOGRAPHY
==================================================

Use:

- realistic natural daylight
- clean indoor florist/lifestyle environment
- warm neutral surroundings
- natural camera perspective
- realistic depth of field
- subtle background blur
- realistic shadows
- professional but approachable photography

Do NOT create:
- dramatic cinematic lighting
- fantasy environments
- excessive bokeh
- luxury advertising aesthetics
- artificial studio CGI
- extreme color grading

The result should look like an authentic photograph
taken by a florist or customer.

==================================================
REFERENCE PRIORITY
==================================================

PRIORITY 1 — BLOOMIX DESIGN IMAGE

Controls:
- flowers
- flower identity
- flower quantity
- dominant colors
- flower hierarchy
- approximate composition
- bouquet structure

PRIORITY 2 — HUMAN/LIFESTYLE REFERENCE

Controls:
- person holding bouquet
- hand placement
- general pose
- camera framing
- photographic presentation

PRIORITY 3 — TEXT INSTRUCTIONS

Provides:
- additional context
- realism requirements
- photography requirements

If any conflict occurs:

The Bloomix bouquet design ALWAYS has priority
for the flowers and bouquet itself.

==================================================
FLOWER IDENTITY
==================================================

Do NOT replace selected flowers with visually similar flowers.

For example:

Rose must remain Rose.
Peony must remain Peony.
Sunflower must remain Sunflower.
Baby's Breath must remain Baby's Breath.
Eucalyptus must remain Eucalyptus.

Do not invent unrelated flower species.

==================================================
FLOWER QUANTITY
==================================================

Preserve the customer's intended flower quantities as closely
as visually possible.

Do not dramatically increase the number of flowers.

Do not dramatically reduce the number of focal flowers.

If exact counting becomes visually difficult,
preserve the intended flower hierarchy and composition.

==================================================
COLOR
==================================================

Preserve the customer's selected flower colors.

Do not recolor flowers to match the environment.

Use realistic natural color.

==================================================
DESIGN TRANSLATION
==================================================

Think of the Bloomix image as:

"An architect's sketch of a bouquet."

You are the florist constructing the real physical object
from that sketch.

Therefore:

KEEP:
- flower selection
- flower hierarchy
- color palette
- approximate arrangement
- bouquet proportions
- wrapping intent

TRANSFORM:
- digital wrapping → physical wrapping
- digital stems → natural stems
- flat flower images → realistic flowers
- digital shadows → photographic lighting
- 2D layering → physical depth

==================================================
FINAL IMAGE
==================================================

The result should look like:

A real person holding a professionally arranged florist bouquet
that was physically made according to the customer's Bloomix design.

It should look believable enough that a customer could imagine:

"This is what my bouquet could actually look like."

NOT:

"This is an edited screenshot turned into a photo."

No text.
No UI.
No labels.
No logos.
No circular flower cards.
No rectangular flower tiles.
No digital outlines.
No emoji.
No cartoon effects.

==================================================
FINAL QUALITY CHECK
==================================================

Before producing the final image, verify:

1. The bouquet is physically believable.
2. Flowers are realistic.
3. The customer's selected flower types are preserved.
4. The overall flower arrangement resembles the Bloomix reference.
5. The wrapping looks like real florist paper.
6. The wrapping does not copy the digital geometric mockup literally.
7. Stems converge naturally.
8. Foliage integrates naturally.
9. The person is holding the bouquet naturally.
10. The bouquet is the main subject.
11. The result looks like a real photograph.`;
}

/**
 * Backward compatibility alias for generateGeminiRealisticBouquetPrompt
 */
export const generateGeminiBouquetPrompt = generateGeminiRealisticBouquetPrompt;


/**
 * Computes a unique deterministic hash/fingerprint of the bouquet configuration.
 */
export function computeBouquetFingerprint(
  bouquet: BouquetItem[],
  instances: FlowerInstance[] | undefined,
  occasionId: string,
  styleId: string,
  shapeId: string,
  wrappingId: string,
  ribbonId: string,
  wrapCoverage: string = "top"
): string {
  const sortedBouquet = [...bouquet]
    .sort((a, b) => a.flowerId.localeCompare(b.flowerId))
    .map((b) => `${b.flowerId}:${b.quantity}:${b.selectedColor || ""}`)
    .join("|");

  const instancesStr = instances
    ? instances
        .map(
          (i) =>
            `${i.instanceId}:${i.flowerId}:${Math.round(i.x)}:${Math.round(i.y)}:${Math.round(i.rotate || 0)}:${(i.scale || 1).toFixed(2)}:${i.depth || 0}`
        )
        .join(";")
    : "";

  return `${occasionId}_${styleId}_${shapeId}_${wrappingId}_${ribbonId}_${wrapCoverage}_${sortedBouquet}_${instancesStr}`;
}

/**
 * Converts a React SVG element into a decoded HTMLImageElement via an SVG Blob URL.
 */
async function svgElementToImage(element: React.ReactElement): Promise<HTMLImageElement> {
  const svgMarkup = renderToStaticMarkup(element);
  let cleanSvg = svgMarkup;
  if (!cleanSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    cleanSvg = cleanSvg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  }
  const blob = new Blob([cleanSvg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Renders an offscreen canvas snapshot of the deterministic bouquet composition
 * to serve as the PRIMARY VISUAL REFERENCE for the Gemini image generation model.
 * 
 * Consumes the EXACT single source of truth composition state and layers
 * with 100% mathematical congruence to the Live Preview.
 */
export async function generateBouquetCanvasSnapshot(
  instances: FlowerInstance[],
  wrappingId: string,
  ribbonId: string,
  shapeId: string,
  width = 1024,
  height = 1024,
  styleId?: string,
  wrapCoverage: "top" | "full" = "top"
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 2D context not available");
  }

  // 1. Studio Backdrop: Clean, warm neutral florist studio lighting matching the Preview Stage
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, "#F8F6F0");
  bgGradient.addColorStop(0.5, "#FAF8F3");
  bgGradient.addColorStop(1, "#F2EFE8");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle ambient lighting glow from the top
  const topGlow = ctx.createRadialGradient(
    width / 2,
    height * 0.15,
    30,
    width / 2,
    height * 0.15,
    width * 0.55
  );
  topGlow.addColorStop(0, "rgba(255, 255, 255, 0.70)");
  topGlow.addColorStop(1, "rgba(255, 255, 255, 0.0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, width, height);

  // 2. Geometry Scale & Coordinate Anchor System
  // Unified with live BouquetVisualizer using computeBouquetFit engine
  const BASE_WIDTH = 340;
  const BASE_HEIGHT = 300;

  const bouquetBbox = computeBouquetBoundingBox(
    instances,
    shapeId,
    wrappingId,
    ribbonId
  );

  const bouquetFit = computeBouquetFit(
    bouquetBbox,
    width,
    height,
    {
      targetWidthRatio: 0.65,
      targetHeightRatio: 0.74,
      minScale: 0.85,
      maxScale: 5.0,
      verticalBiasFactor: 0.025,
    }
  );

  const scale = bouquetFit.scale;
  const centerX = width / 2 + bouquetFit.offsetX;
  const centerY = height / 2 + bouquetFit.offsetY;

  const destX = centerX - (BASE_WIDTH / 2) * scale;
  const destY = centerY - (BASE_HEIGHT / 2) * scale;
  const destWidth = BASE_WIDTH * scale;
  const destHeight = BASE_HEIGHT * scale;

  // 3. Grounding Studio Floor Shadow
  ctx.save();
  const shadowCenterY = centerY + (150 - 24) * scale;
  const shadowRadX = 112 * scale; // w-56 = 224px -> radius 112px
  const shadowRadY = 14 * scale;  // h-7 = 28px -> radius 14px
  const shadowGrad = ctx.createRadialGradient(
    centerX,
    shadowCenterY,
    0,
    centerX,
    shadowCenterY,
    shadowRadX
  );
  shadowGrad.addColorStop(0, "rgba(28, 38, 22, 0.20)");
  shadowGrad.addColorStop(0.55, "rgba(28, 38, 22, 0.06)");
  shadowGrad.addColorStop(0.75, "transparent");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(centerX, shadowCenterY, shadowRadX, shadowRadY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const wrapOption = resolveWrappingOption(wrappingId);
  const ribbonOption = resolveRibbonOption(ribbonId);
  const styleProfile = getStyleCompositionProfile(styleId);
  const tiePoint = styleProfile?.tiePoint || { x: 0, y: 52 };
  const totalStems = instances.length;

  // 4. Render Exact SVG Layers using shared React SVG Components
  const [backWrapImg, bottomStemsImg, stemNetworkImg, frontWrapImg, ribbonImg] = await Promise.all([
    svgElementToImage(
      React.createElement(BouquetWrapping, {
        layer: "back",
        wrapping: wrapOption,
        ribbon: ribbonOption,
        totalStemsCount: totalStems,
        shapeId: shapeId,
        wrapCoverage: wrapCoverage,
      })
    ),
    svgElementToImage(
      React.createElement(BouquetWrapping, {
        layer: "stems-bottom",
        wrapping: wrapOption,
        ribbon: ribbonOption,
        totalStemsCount: totalStems,
        shapeId: shapeId,
        wrapCoverage: wrapCoverage,
      })
    ),
    svgElementToImage(
      React.createElement(BouquetStemNetwork, {
        instances: instances,
        tiePoint: tiePoint,
      })
    ),
    svgElementToImage(
      React.createElement(BouquetWrapping, {
        layer: "front",
        wrapping: wrapOption,
        ribbon: ribbonOption,
        totalStemsCount: totalStems,
        shapeId: shapeId,
        wrapCoverage: wrapCoverage,
      })
    ),
    svgElementToImage(
      React.createElement(BouquetWrapping, {
        layer: "ribbon",
        wrapping: wrapOption,
        ribbon: ribbonOption,
        totalStemsCount: totalStems,
        shapeId: shapeId,
        wrapCoverage: wrapCoverage,
      })
    ),
  ]);

  // 5. Preload all transparent botanical cutout images concurrently
  const cutoutImageMap = new Map<string, HTMLImageElement>();
  await Promise.all(
    instances.map(async (inst) => {
      try {
        const rawUrl = getFlowerImageUrl(inst.flowerId, inst.color);
        const cutoutUrl = await getTransparentFlowerCutout(rawUrl, inst.flowerId, inst.color);
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          img.onload = () => {
            cutoutImageMap.set(inst.instanceId, img);
            resolve();
          };
          img.onerror = () => {
            // Fallback direct species image
            const fallbackImg = new Image();
            fallbackImg.crossOrigin = "anonymous";
            fallbackImg.onload = () => {
              cutoutImageMap.set(inst.instanceId, fallbackImg);
              resolve();
            };
            fallbackImg.onerror = () => resolve();
            fallbackImg.src = rawUrl;
          };
          img.src = cutoutUrl;
        });
      } catch {
        // Safe fallback
      }
    })
  );

  // Helper to draw an individual flower instance with exact geometry and botanical drop shadow
  const drawFlower = (inst: FlowerInstance) => {
    const img = cutoutImageMap.get(inst.instanceId);
    if (!img) return;

    const flowerX = centerX + inst.x * scale;
    const flowerY = centerY + inst.y * scale;
    const pixelSize = Math.round(inst.size * (inst.scale || 1.0)) * scale;

    ctx.save();
    ctx.translate(flowerX, flowerY);

    const angle = inst.rotate ?? inst.rotation ?? 0;
    if (angle) {
      ctx.rotate((angle * Math.PI) / 180);
    }
    if (inst.flipX || inst.flipY) {
      ctx.scale(inst.flipX ? -1 : 1, inst.flipY ? -1 : 1);
    }

    // Depth-responsive natural botanical drop-shadow matching BouquetBloom
    const shadowDepth = Math.max(10, Math.min(inst.depth || 40, 80));
    const shadowBlur = (shadowDepth / 16 + 2.5) * scale;
    const shadowOffsetY = (shadowDepth / 28 + 1.2) * scale;
    const shadowOpacity = 0.12 + (shadowDepth / 100) * 0.12;

    ctx.shadowColor = `rgba(22, 32, 18, ${shadowOpacity.toFixed(2)})`;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetY = shadowOffsetY;
    ctx.shadowOffsetX = 0;

    ctx.drawImage(img, -pixelSize / 2, -pixelSize / 2, pixelSize, pixelSize);
    ctx.restore();
  };

  // 6. Draw layers in exact florist visual stacking hierarchy
  // LAYER 1: Back Paper Shell Foundation
  ctx.drawImage(backWrapImg, destX, destY, destWidth, destHeight);

  // LAYER 2: Bottom Exposed Trimmed Stems
  ctx.drawImage(bottomStemsImg, destX, destY, destWidth, destHeight);

  // LAYER 3: Organic Stem Network
  ctx.drawImage(stemNetworkImg, destX, destY, destWidth, destHeight);

  // LAYER 4: Deep Background Foliage (depth < 25)
  const sortedInstances = [...instances].sort(
    (a, b) => (a.zIndex ?? a.depth ?? 20) - (b.zIndex ?? b.depth ?? 20)
  );
  const backInstances = sortedInstances.filter(
    (inst) => (inst.zIndex ?? inst.depth ?? 20) < 25
  );
  const frontInstances = sortedInstances.filter(
    (inst) => (inst.zIndex ?? inst.depth ?? 20) >= 25
  );

  backInstances.forEach(drawFlower);

  // LAYER 5: Front Wrapping Paper Collar & Flaps (z-index 25)
  ctx.drawImage(frontWrapImg, destX, destY, destWidth, destHeight);

  // LAYER 6: Foreground Blooms, Secondary, Focal & Arranged Flowers (depth >= 25)
  frontInstances.forEach(drawFlower);

  // LAYER 7: Florist Hand-Tied Ribbon & Bow (z-index 60)
  ctx.drawImage(ribbonImg, destX, destY, destWidth, destHeight);

  // 7. Output lossless high-resolution PNG
  return canvas.toDataURL("image/png");
}
