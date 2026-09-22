import type { BouquetItem, FlowerInstance } from "../engine/types.ts";

export interface SavedBouquetRecord {
  id: string;
  name: string;
  createdAt: number;
  occasionId: string;
  styleId: string;
  shapeId?: string;
  items: BouquetItem[];
  instances?: FlowerInstance[];
  wrappingId?: string;
  ribbonId?: string;
  wrapCoverage?: "top" | "full";
  score?: number;
  notes?: string;
}

const STORAGE_KEY = "bloomix.savedBouquets.v1";
const LEGACY_STORAGE_KEY = "bloomix_saved_bouquets_v1";

export function getSavedBouquets(): SavedBouquetRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw === null) {
      const defaultSamples = getDefaultSampleSavedBouquets();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSamples));
      } catch (err) {
        console.warn("[SavedBouquets] Could not seed initial samples:", err);
      }
      return defaultSamples;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[SavedBouquets] Failed to read from localStorage:", err);
    return [];
  }
}

export function saveBouquetToStorage(
  record: Omit<SavedBouquetRecord, "id" | "createdAt"> & { id?: string }
): SavedBouquetRecord {
  const existing = getSavedBouquets();
  const id = record.id || `bq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const fullRecord: SavedBouquetRecord = {
    ...record,
    id,
    createdAt: Date.now(),
  };

  const filtered = existing.filter((b) => b.id !== id);
  const updated = [fullRecord, ...filtered];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.error("[SavedBouquets] Failed to save to localStorage:", err);
  }

  return fullRecord;
}

export interface DeleteResult {
  success: boolean;
  data: SavedBouquetRecord[];
  error?: string;
}

export function deleteSavedBouquet(id: string): DeleteResult {
  try {
    const existing = getSavedBouquets();
    const updated = existing.filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return {
      success: true,
      data: updated,
    };
  } catch (err) {
    console.error("[SavedBouquets] Failed to delete from localStorage:", err);
    return {
      success: false,
      data: getSavedBouquets(),
      error: "Unable to delete this bouquet. Please try again.",
    };
  }
}

function getDefaultSampleSavedBouquets(): SavedBouquetRecord[] {
  return [
    {
      id: "sample-devotion-1",
      name: "Crimson & Silver Romance",
      createdAt: Date.now() - 86400000 * 2,
      occasionId: "valentines",
      styleId: "romantic",
      score: 96,
      wrappingId: "kraft_cone",
      ribbonId: "rustic-twine",
      items: [
        { flowerId: "rose", quantity: 3, selectedColor: "red" },
        { flowerId: "baby-breath", quantity: 2, selectedColor: "white" },
        { flowerId: "eucalyptus", quantity: 2, selectedColor: "green" },
      ],
    },
    {
      id: "sample-birthday-1",
      name: "Pastel Meadow Birthday",
      createdAt: Date.now() - 86400000 * 5,
      occasionId: "birthday",
      styleId: "playful",
      score: 92,
      wrappingId: "pastel_blush",
      ribbonId: "satin-pink",
      items: [
        { flowerId: "sunflower", quantity: 2, selectedColor: "yellow" },
        { flowerId: "gerbera", quantity: 2, selectedColor: "orange" },
        { flowerId: "chamomile", quantity: 2, selectedColor: "white" },
        { flowerId: "eucalyptus", quantity: 2, selectedColor: "green" },
      ],
    },
  ];
}
