import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";

export interface ImportRow {
  number: string;
  name?: string;
  category?: string;
}

export async function importStickersFromCsv(file: File): Promise<{ inserted: number; skipped: number }> {
  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const rows: ImportRow[] = [];
  parsed.data.forEach((r, i) => {
    const num = (r.number ?? r["numero"] ?? r["n°"] ?? r["num"] ?? "").toString().trim();
    if (!num) return;
    rows.push({
      number: num,
      name: (r.name ?? r["nom"] ?? "").toString().trim() || undefined,
      category: (r.category ?? r["categorie"] ?? r["catégorie"] ?? r["equipe"] ?? r["équipe"] ?? r["team"] ?? "").toString().trim() || undefined,
    });
    void i;
  });

  if (rows.length === 0) return { inserted: 0, skipped: 0 };

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
  return { inserted: count ?? payload.length, skipped: 0 };
}
