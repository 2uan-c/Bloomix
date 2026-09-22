import type {
  BouquetItem,
  BouquetScoreResult,
  Flower,
  GeminiExplanationResponse,
} from "../engine/types.ts";

export interface ExplainPayload {
  bouquet: (BouquetItem & { name: string; role: string[]; color: string })[];
  selectedStyle: { id: string; name: string; description: string };
  selectedOccasion: { id: string; name: string; displayName: string };
  scoringResult: BouquetScoreResult;
}

export async function fetchBouquetExplanation(
  payload: ExplainPayload,
  signal?: AbortSignal
): Promise<GeminiExplanationResponse> {
  const res = await fetch("/api/gemini/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server returned ${res.status}`);
  }

  return res.json();
}

export async function sendChatMessage(
  message: string,
  history: { role: "user" | "model"; text: string }[],
  context: ExplainPayload,
  signal?: AbortSignal
): Promise<{ text: string }> {
  const res = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, context }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server returned ${res.status}`);
  }

  return res.json();
}

