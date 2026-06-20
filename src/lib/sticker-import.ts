import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";

export interface ImportRow {
  number: string;
  name?: string;
  category?: string;
}

function pickField(r: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = r[k] ?? r[k.toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function normalizeRow(raw: Record<string, unknown>): ImportRow | null {
  // Normalize all keys to lowercase
  const r: Record<string, unknown> = {};
  Object.keys(raw).forEach((k) => (r[k.trim().toLowerCase()] = raw[k]));

  const number = pickField(r, ["number", "numero", "n°", "num", "no", "id", "code"]);
  if (!number) return null;
  const name = pickField(r, ["name", "nom", "player", "joueur", "title"]);
  const category = pickField(r, ["category", "categorie", "catégorie", "equipe", "équipe", "team", "country", "pays", "group"]);

  return {
    number,
    name: name || undefined,
    category: category || undefined,
  };
}

async function upsertRows(rows: ImportRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const payload = rows.map((r, idx) => ({
    number: r.number,
    name: r.name ?? null,
    category: r.category ?? null,
    sort_order: idx,
  }));
  const { error, count } = await supabase
    .from("stickers")
    .upsert(payload, { onConflict: "number", ignoreDuplicates: false, count: "exact" });
  if (error) throw error;
  return count ?? payload.length;
}

export async function importStickersFromFile(file: File): Promise<{ inserted: number }> {
  const text = await file.text();
  const name = file.name.toLowerCase();
  const isJson = name.endsWith(".json") || text.trim().startsWith("{") || text.trim().startsWith("[");

  let rows: ImportRow[] = [];

  if (isJson) {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("JSON invalide : " + (e as Error).message);
    }

    // Support multiple shapes: array of objects, { stickers: [...] }, { data: [...] }, or object keyed by number
    let arr: unknown[] = [];
    if (Array.isArray(data)) {
      arr = data;
    } else if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.stickers)) arr = obj.stickers as unknown[];
      else if (Array.isArray(obj.data)) arr = obj.data as unknown[];
      else if (Array.isArray(obj.items)) arr = obj.items as unknown[];
      else {
        // Object keyed by number -> values
        arr = Object.entries(obj).map(([k, v]) => {
          if (v && typeof v === "object") return { number: k, ...(v as Record<string, unknown>) };
          return { number: k, name: String(v) };
        });
      }
    }

    arr.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const norm = normalizeRow(item as Record<string, unknown>);
      if (norm) rows.push(norm);
    });
  } else {
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });
    parsed.data.forEach((r) => {
      const norm = normalizeRow(r);
      if (norm) rows.push(norm);
    });
  }

  if (rows.length === 0) throw new Error("Aucun sticker valide trouvé (champ 'number' requis).");

  const inserted = await upsertRows(rows);
  return { inserted };
}

// Backwards-compatible alias
export const importStickersFromCsv = importStickersFromFile;
