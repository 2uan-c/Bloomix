import { GoogleGenAI, Type } from "@google/genai";
import type { BouquetItem, BouquetScoreResult, Flower } from "../../src/engine/types.ts";

let genAiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiClient;
}

export interface ExplainRequestPayload {
  bouquet: (BouquetItem & { name: string; role: string[]; color: string })[];
  selectedStyle: { id: string; name: string; description: string };
  selectedOccasion: { id: string; name: string; displayName: string };
  scoringResult: BouquetScoreResult;
}

export async function generateBouquetExplanation(payload: ExplainRequestPayload) {
  if (!process.env.GEMINI_API_KEY) {
    const issues = [
      ...payload.scoringResult.color.issues,
      ...payload.scoringResult.compatibility.issues,
      ...payload.scoringResult.style.issues,
      ...payload.scoringResult.occasion.issues,
    ];

    const fallbackRecommendations = [];
    if (payload.bouquet.length > 0) {
      fallbackRecommendations.push({
        action: "KEEP" as const,
        flowerName: payload.bouquet[0].name,
        reason: "Serves as the foundational element of your bouquet.",
      });
    }
    if (payload.scoringResult.compatibility.score < 85) {
      fallbackRecommendations.push({
        action: "ADD" as const,
        flowerName: "Baby's Breath or Eucalyptus",
        reason: "Provides delicate transitions and structural framing for primary blossoms.",
      });
    }

    return {
      summary: `Your arrangement achieved an authoritative score of ${payload.scoringResult.overall}/100 (${payload.scoringResult.rating.label}) tailored for ${payload.selectedOccasion.name} in a ${payload.selectedStyle.name} design aesthetic.`,
      strengths: [
        `Harmonious color palette achieving a ${payload.scoringResult.color.score}/100 color harmony score.`,
        `Curated blend of ${payload.bouquet.map((b) => b.name).join(", ")} matching the ${payload.selectedStyle.name} motif.`,
        `Symbolically well-suited for ${payload.selectedOccasion.name}.`,
      ],
      improvements: issues.length > 0
        ? issues.map((i) => i.message)
        : ["The floral balance and stem proportions meet professional florist standards."],
      recommendations: fallbackRecommendations,
      substitutions: payload.scoringResult.compatibility.score < 90
        ? [
            {
              originalFlower: payload.bouquet[0]?.name || "Focal Flower",
              suggestedFlower: "Baby's Breath or Eucalyptus",
              reason: "Adding delicate filler or green foliage softens transitions between primary focal blooms.",
            },
          ]
        : [],
    };
  }

  const ai = getGenAI();

  const systemInstruction = `You are the Bloomix AI Advisor, an expert floristry consultant.
The Bloomix scoring engine is completely deterministic and authoritative.
CRITICAL RULES:
1. The deterministic scoring engine is the SOLE authority for all numerical scores.
2. Gemini MUST NOT calculate the numerical score.
3. Gemini MUST NOT modify the numerical score.
4. Gemini ONLY explains the deterministic result and provides practical recommendations.
5. All recommendations MUST follow the structured format with explicit actions: KEEP, ADD, REMOVE, REPLACE.
   - KEEP: Praise and justify existing flowers that work harmoniously.
   - ADD: Suggest adding foliage (e.g. Eucalyptus, Ruscus) or fillers (e.g. Baby's Breath, Waxflower) to balance structure.
   - REMOVE: Suggest removing flowers that cause clutter, extreme overcrowding, or severe style mismatch.
   - REPLACE: Suggest replacing a mismatched flower with a more suitable species.
6. Do NOT fabricate flower properties or flower species that are not present in flowers.json. Use standard flowers (Rose, Sunflower, Peony, Hydrangea, Lily, Orchid, Tulip, Carnation, Gerbera, Daisy, Chrysanthemum, Baby's Breath, Waxflower, Statice, Eucalyptus, Ruscus, Italian Ruscus, Fern, Olive Branch, Lisianthus, Calla Lily, Iris, Ranunculus, Lavender).
7. Keep responses concise, practical, approachable, and encouraging.`;

  const userPrompt = `Here is the current bouquet, occasion, style, and authoritative Bloomix scoring result:

Occasion: ${payload.selectedOccasion.name} (${payload.selectedOccasion.displayName})
Style: ${payload.selectedStyle.name} - ${payload.selectedStyle.description}

Selected Flowers & Stems:
${payload.bouquet
  .map(
    (b) =>
      `- ${b.name} (${b.color || "natural"}): Quantity ${b.quantity}, Roles: [${b.role.join(", ")}]`
  )
  .join("\n")}

Authoritative Deterministic Scores:
- Overall Score: ${payload.scoringResult.overall}/100 (${payload.scoringResult.rating.label})
- Color Harmony (Weight 25%): ${payload.scoringResult.color.score}/100
- Flower Compatibility (Weight 30%): ${payload.scoringResult.compatibility.score}/100
- Style Consistency (Weight 20%): ${payload.scoringResult.style.score}/100
- Occasion Suitability (Weight 25%): ${payload.scoringResult.occasion.score}/100

Engine Detected Issues:
${[
  ...payload.scoringResult.color.issues,
  ...payload.scoringResult.compatibility.issues,
  ...payload.scoringResult.style.issues,
  ...payload.scoringResult.occasion.issues,
]
  .map((i) => `• [${i.category.toUpperCase()} - ${i.severity} severity]: ${i.message}`)
  .join("\n") || "• None (Flawless arrangement)"}

Please provide an expert floristry analysis adhering to the structured JSON schema. Explain why this score was received, highlight what works well, identify improvements, and provide structured action recommendations (KEEP, ADD, REMOVE, REPLACE) grounded strictly in real flowers from the catalog.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A 2-3 sentence overview explaining the overall impression and score.",
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-4 key aesthetic or symbolic strengths of this bouquet.",
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "1-3 practical, actionable tips to improve the score or appearance.",
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  action: {
                    type: Type.STRING,
                    enum: ["KEEP", "ADD", "REMOVE", "REPLACE"],
                    description: "Action type: KEEP, ADD, REMOVE, or REPLACE.",
                  },
                  flowerName: {
                    type: Type.STRING,
                    description: "The name of the flower being kept, added, removed, or replaced.",
                  },
                  targetFlowerName: {
                    type: Type.STRING,
                    description: "For REPLACE action: the proposed replacement flower name.",
                  },
                  reason: {
                    type: Type.STRING,
                    description: "Floristry rationale for this recommendation.",
                  },
                },
                required: ["action", "flowerName", "reason"],
              },
              description: "Structured flower recommendations using KEEP, ADD, REMOVE, REPLACE format.",
            },
            substitutions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalFlower: { type: Type.STRING },
                  suggestedFlower: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ["originalFlower", "suggestedFlower", "reason"],
              },
              description: "0-2 recommended flower substitutions if beneficial.",
            },
          },
          required: ["summary", "strengths", "improvements", "recommendations", "substitutions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return parsed;
  } catch (error) {
    console.error("Gemini explanation error:", error);
    // Graceful fallback without crashing
    return {
      summary: `Your bouquet scored ${payload.scoringResult.overall}/100 (${payload.scoringResult.rating.label}) based on Bloomix's deterministic design principles.`,
      strengths: [
        `Good choice of ${payload.bouquet.map((b) => b.name).slice(0, 2).join(" and ")} for a ${payload.selectedStyle.name} look.`,
        `Overall color harmony scored ${payload.scoringResult.color.score}/100.`,
      ],
      improvements: payload.scoringResult.overall < 85 ? [
        "Consider balancing focal flowers with foliage or soft filler blooms for layered depth.",
        "Ensure primary colors align with the occasion's emotional tone.",
      ] : ["The bouquet is already very well balanced!"],
      recommendations: [
        {
          action: "KEEP" as const,
          flowerName: payload.bouquet[0]?.name || "Rose",
          reason: "Maintains primary focal presence for this design.",
        },
      ],
      substitutions: [],
    };
  }
}

export interface ChatRequestPayload {
  message: string;
  history: { role: "user" | "model"; text: string }[];
  context: ExplainRequestPayload;
}

export async function chatWithBloomix(payload: ChatRequestPayload) {
  if (!process.env.GEMINI_API_KEY) {
    const q = payload.message.toLowerCase();
    const score = payload.context.scoringResult;
    if (q.includes("why") || q.includes("score")) {
      return {
        text: `Your bouquet scored **${score.overall}/100 (${score.rating.label})** based on 4 deterministic criteria: Color Harmony (${score.color.score}/100), Flower Compatibility (${score.compatibility.score}/100), Style Consistency (${score.style.score}/100), and Occasion Suitability (${score.occasion.score}/100). The composition highlights ${payload.context.bouquet.map((b) => b.name).join(" and ")} beautifully.`,
      };
    }
    if (q.includes("replace") || q.includes("add") || q.includes("improve")) {
      return {
        text: `To further refine this arrangement for ${payload.context.selectedOccasion.name}, try pairing your primary focal blooms with airy fillers like Baby's Breath or Eucalyptus greens to create depth and softness.`,
      };
    }
    if (q.includes("valentine") || q.includes("girlfriend") || q.includes("romantic")) {
      return {
        text: `For a romantic occasion like Valentine's Day, classic Red Roses paired with gentle white Baby's Breath and greenery express timeless affection and passion.`,
      };
    }
    return {
      text: `Your bouquet features ${payload.context.bouquet.map((b) => `${b.quantity}x ${b.name}`).join(", ")} with an authoritative Bloomix Score of ${score.overall}/100 (${score.rating.label}) for ${payload.context.selectedOccasion.name}.`,
    };
  }

  const ai = getGenAI();

  const systemInstruction = `You are the Bloomix AI Advisor, an expert floristry consultant.
You help users understand flower bouquet design, flower meanings, color combinations, and gift-giving advice.

CRITICAL RULES:
1. The Bloomix scoring engine is deterministic and authoritative. NEVER calculate or modify numerical scores.
2. If asked "Why did my bouquet get this score?", explain the deterministic breakdown (Color, Compatibility, Style, Occasion) and specific issues detected by the engine.
3. If asked "What flower should I replace?" or "What flower should I add?", suggest practical substitutions or additions with floral rationale (e.g. adding airy Baby's Breath/Eucalyptus for transition, or replacing conflicting focal blooms).
4. If asked about occasion suitability or style elegance, explain traditional flower symbolism and aesthetic guidelines.
5. Keep responses concise, practical, approachable, and encouraging.

Context:
- Selected Occasion: ${payload.context.selectedOccasion.name} (${payload.context.selectedOccasion.displayName})
- Selected Style: ${payload.context.selectedStyle.name} (${payload.context.selectedStyle.description})
- Current Bouquet: ${payload.context.bouquet.map((b) => `${b.quantity}x ${b.name} (${b.color || "natural"}) [${b.role.join(", ")}]`).join(", ")}
- Deterministic Scores: Overall ${payload.context.scoringResult.overall}/100 (${payload.context.scoringResult.rating.label})
  • Color Harmony (25%): ${payload.context.scoringResult.color.score}/100
  • Flower Compatibility (30%): ${payload.context.scoringResult.compatibility.score}/100
  • Style Consistency (20%): ${payload.context.scoringResult.style.score}/100
  • Occasion Suitability (25%): ${payload.context.scoringResult.occasion.score}/100
- Engine Detected Issues:
${[
  ...payload.context.scoringResult.color.issues,
  ...payload.context.scoringResult.compatibility.issues,
  ...payload.context.scoringResult.style.issues,
  ...payload.context.scoringResult.occasion.issues,
]
  .map((i) => `  • [${i.category}]: ${i.message}`)
  .join("\n") || "  • None (Flawless arrangement)"}`;

  try {
    const contents = [
      ...payload.history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      {
        role: "user",
        parts: [{ text: payload.message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return { text: response.text || "I'm here to help you refine your bouquet!" };
  } catch (error) {
    console.error("Gemini chat error:", error);
    return {
      text: `I'm having a brief connection delay, but regarding your bouquet (Score: ${payload.context.scoringResult.overall}/100): It combines ${payload.context.bouquet.length} flower types for ${payload.context.selectedOccasion.name}. You can try adjusting flower quantities or adding foliage to boost balance!`,
    };
  }
}

