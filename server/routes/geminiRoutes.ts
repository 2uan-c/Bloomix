import { Router } from "express";
import {
  chatWithBloomix,
  generateBouquetExplanation,
  type ChatRequestPayload,
  type ExplainRequestPayload,
} from "../services/geminiService.ts";

export const geminiRouter = Router();

geminiRouter.post("/explain", async (req, res) => {
  try {
    const payload = req.body as ExplainRequestPayload;
    if (!payload || !payload.bouquet || !payload.scoringResult) {
      res.status(400).json({ error: "Missing bouquet or scoring result payload" });
      return;
    }

    const explanation = await generateBouquetExplanation(payload);
    res.json(explanation);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in /api/gemini/explain:", message);
    res.status(500).json({ error: "Failed to generate explanation", details: message });
  }
});

geminiRouter.post("/chat", async (req, res) => {
  try {
    const payload = req.body as ChatRequestPayload;
    if (!payload || !payload.message || !payload.context) {
      res.status(400).json({ error: "Missing message or bouquet context" });
      return;
    }

    const result = await chatWithBloomix(payload);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in /api/gemini/chat:", message);
    res.status(500).json({ error: "Failed to process chat message", details: message });
  }
});

