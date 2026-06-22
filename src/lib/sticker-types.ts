export type StickerStatus = "missing" | "owned" | "double";

export interface Sticker {
  id: string;
  number: string;
  name: string | null;
  category: string | null;
  status: StickerStatus;
  doubles_count: number;
  sort_order: number;
  team_code: string | null;
  team_name: string | null;
  team_flag: string | null;
  team_order: number;
  position: number;
  is_special: boolean;
  is_foil: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamGroup {
  code: string;
  name: string;
  flag: string;
  order: number;
  isSpecial: boolean;
  stickers: Sticker[];
  owned: number;
  doubles: number;
  missing: number;
  total: number;
  pct: number;
}

export const STATUS_LABEL: Record<StickerStatus, string> = {
  missing: "Manquant",
  owned: "J'en ai 1",
  double: "J'en ai plusieurs",
};

export function groupByTeam(stickers: Sticker[]): TeamGroup[] {
  const map = new Map<string, TeamGroup>();
  for (const s of stickers) {
    if (!s.team_code) continue;
    const code = s.team_code;
    let g = map.get(code);
    if (!g) {
      g = {
        code,
        name: s.team_name ?? "Autres",
        flag: s.team_flag ?? "",
        order: s.team_order ?? 999,
        isSpecial: s.is_special,
        stickers: [],
        owned: 0,
        doubles: 0,
        missing: 0,
        total: 0,
        pct: 0,
      };
      map.set(code, g);
    }
    g.stickers.push(s);
  }
  for (const g of map.values()) {
    g.stickers.sort((a, b) => a.position - b.position || a.number.localeCompare(b.number, "fr", { numeric: true }));
    g.total = g.stickers.length;
    g.owned = g.stickers.filter((x) => x.status !== "missing").length;
    g.missing = g.stickers.filter((x) => x.status === "missing").length;
    g.doubles = g.stickers.reduce((acc, x) => acc + (x.status === "double" ? x.doubles_count : 0), 0);
    g.pct = g.total ? Math.round((g.owned / g.total) * 100) : 0;
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.isSpecial !== b.isSpecial) return a.isSpecial ? -1 : 1;
    return a.order - b.order || a.name.localeCompare(b.name, "fr");
  });
}

export function cycleStatus(s: Sticker): { status: StickerStatus; doubles_count: number } {
  if (s.status === "missing") return { status: "owned", doubles_count: 0 };
  if (s.status === "owned") return { status: "double", doubles_count: 1 };
  return { status: "missing", doubles_count: 0 };
}
