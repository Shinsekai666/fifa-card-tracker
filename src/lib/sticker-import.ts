import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { flagFor, CODE_TO_NAME } from "./flag-utils";

interface ParsedSticker {
  number: string;
  name: string | null;
  category: string | null;
  team_code: string | null;
  team_name: string | null;
  team_flag: string | null;
  team_order: number;
  position: number;
  is_special: boolean;
  is_foil: boolean;
  sort_order: number;
}

function getStr(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k] ?? o[k.toLowerCase()];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function getBool(o: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = o[k] ?? o[k.toLowerCase()];
    if (v === true || v === "true" || v === 1 || v === "1") return true;
    if (v === false || v === "false" || v === 0 || v === "0") return false;
  }
  return false;
}

function lower(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(o)) out[k.trim().toLowerCase()] = o[k];
  return out;
}

interface ParseContext {
  rows: ParsedSticker[];
  globalIdx: number;
}

function parseTeam(rawTeam: Record<string, unknown>, teamOrder: number, isSpecial: boolean, ctx: ParseContext) {
  const t = lower(rawTeam);
  const team_code = getStr(t, "code", "team_code", "abbr", "abbreviation") || (isSpecial ? "SPE" : "");
  const team_name = getStr(t, "name", "team_name", "country", "team") || (isSpecial ? "Spéciaux" : team_code);
  const iso2 = getStr(t, "iso2", "country_code", "iso");
  const explicitFlag = getStr(t, "flag", "emoji");
  const team_flag = explicitFlag || flagFor(team_code, iso2);

  const items = (t.stickers ?? t.items ?? t.players ?? []) as unknown[];
  if (!Array.isArray(items)) return;

  items.forEach((rawItem, i) => {
    if (!rawItem || typeof rawItem !== "object") return;
    const s = lower(rawItem as Record<string, unknown>);
    const number =
      getStr(s, "code", "number", "numero", "n°", "id") ||
      (team_code ? `${team_code}${i + 1}` : `${teamOrder}-${i + 1}`);
    const name = getStr(s, "name", "nom", "player", "joueur", "title") || null;
    const positionStr = getStr(s, "position", "pos", "num");
    const position = positionStr ? parseInt(positionStr, 10) : i + 1;
    const is_foil = getBool(s, "foil", "is_foil", "shiny", "holo");
    const type = getStr(s, "type");
    const sticker_is_special = isSpecial || type === "special";

    ctx.rows.push({
      number,
      name,
      category: team_name || null,
      team_code: team_code || null,
      team_name: team_name || null,
      team_flag: team_flag || null,
      team_order: teamOrder,
      position,
      is_special: sticker_is_special,
      is_foil,
      sort_order: ctx.globalIdx++,
    });
  });
}

function parseFlatItems(items: unknown[], ctx: ParseContext, isSpecial: boolean) {
  // Items without team grouping; treat each as standalone or grouped by category
  items.forEach((rawItem, i) => {
    if (!rawItem || typeof rawItem !== "object") return;
    const s = lower(rawItem as Record<string, unknown>);
    const number = getStr(s, "code", "number", "numero", "n°", "id") || `X${i + 1}`;
    const name = getStr(s, "name", "nom", "player") || null;
    const team_name = getStr(s, "team", "category", "categorie", "country") || (isSpecial ? "Spéciaux" : "Autres");
    const team_code = getStr(s, "team_code") || (isSpecial ? "SPE" : team_name.slice(0, 3).toUpperCase());
    ctx.rows.push({
      number,
      name,
      category: team_name,
      team_code,
      team_name,
      team_flag: flagFor(team_code),
      team_order: isSpecial ? 0 : 999,
      position: i + 1,
      is_special: isSpecial,
      is_foil: getBool(s, "foil", "is_foil"),
      sort_order: ctx.globalIdx++,
    });
  });
}

function parsePanini(data: unknown): ParsedSticker[] {
  const ctx: ParseContext = { rows: [], globalIdx: 0 };

  if (Array.isArray(data)) {
    parseFlatItems(data, ctx, false);
    return ctx.rows;
  }

  if (!data || typeof data !== "object") return ctx.rows;
  const root = lower(data as Record<string, unknown>);

  let teamOrder = 0;

  // Special stickers first
  const special = root.special_stickers ?? root.special ?? root.specials;
  if (special && typeof special === "object") {
    const sp = lower(special as Record<string, unknown>);
    const items = sp.items ?? sp.stickers ?? sp.list;
    if (Array.isArray(items)) {
      parseTeam(
        { code: "SPE", name: "Spéciaux", flag: "✨", items },
        teamOrder++,
        true,
        ctx,
      );
    }
  } else if (Array.isArray(root.special_items)) {
    parseTeam({ code: "SPE", name: "Spéciaux", flag: "✨", items: root.special_items }, teamOrder++, true, ctx);
  }

  // Teams
  const teams = root.teams ?? root.equipes ?? root.countries;
  if (Array.isArray(teams)) {
    for (const rawTeam of teams) {
      if (rawTeam && typeof rawTeam === "object") {
        parseTeam(rawTeam as Record<string, unknown>, teamOrder++, false, ctx);
      }
    }
  }

  // Fallback : flat items array under "stickers" / "items" / "data"
  if (ctx.rows.length === 0) {
    const flat = root.stickers ?? root.items ?? root.data;
    if (Array.isArray(flat)) parseFlatItems(flat, ctx, false);
  }

  return ctx.rows;
}

async function upsertRows(rows: ParsedSticker[]): Promise<number> {
  if (rows.length === 0) return 0;
  // Chunk to avoid request size limits
  const chunkSize = 500;
  let total = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error, count } = await supabase
      .from("stickers")
      .upsert(chunk, { onConflict: "number", ignoreDuplicates: false, count: "exact" });
    if (error) throw error;
    total += count ?? chunk.length;
  }
  return total;
}

export async function importStickersFromFile(file: File): Promise<{ inserted: number }> {
  const text = await file.text();
  const name = file.name.toLowerCase();
  const isJson = name.endsWith(".json") || text.trim().startsWith("{") || text.trim().startsWith("[");

  let rows: ParsedSticker[] = [];

  if (isJson) {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("JSON invalide : " + (e as Error).message);
    }
    rows = parsePanini(data);
  } else {
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });
    const ctx: ParseContext = { rows: [], globalIdx: 0 };
    parseFlatItems(parsed.data as unknown[], ctx, false);
    rows = ctx.rows;
  }

  if (rows.length === 0) throw new Error("Aucun sticker trouvé dans le fichier.");

  const inserted = await upsertRows(rows);
  return { inserted };
}

export const importStickersFromCsv = importStickersFromFile;
