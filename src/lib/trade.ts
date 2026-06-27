import type { Sticker } from "./sticker-types";

export interface TradeItem {
  number: string;       // ex "MEX2"
  code: string | null;  // team_code
  name: string | null;  // player/sticker name
  qty?: number;         // for doubles
}

export function buildDoublesList(stickers: Sticker[]): TradeItem[] {
  return stickers
    .filter((s) => s.status === "double" && s.doubles_count > 0)
    .map((s) => ({ number: s.number, code: s.team_code, name: s.name, qty: s.doubles_count }));
}

export function buildMissingList(stickers: Sticker[]): TradeItem[] {
  return stickers
    .filter((s) => s.status === "missing")
    .map((s) => ({ number: s.number, code: s.team_code, name: s.name }));
}

/** Compact text format easily pasted in WhatsApp/SMS. */
export function toShareText(items: TradeItem[], opts: { withQty?: boolean } = {}): string {
  return items
    .map((i) => (opts.withQty && i.qty && i.qty > 1 ? `${i.number}×${i.qty}` : i.number))
    .join(", ");
}

/** Parse a pasted text into a set of sticker numbers (uppercased). Accepts ',', ';', ' ', '\n', '/'. */
export function parseNumbers(raw: string): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(/[\s,;/]+/)
        .map((x) => x.trim().toUpperCase().replace(/[×X]\d+$/i, ""))
        .filter(Boolean),
    ),
  );
}

export function randomToken(len = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) s += alphabet[arr[i] % alphabet.length];
  return s;
}

export interface CompareResult {
  iWant: Sticker[];     // they have (doubles) that I'm missing
  theyWant: Sticker[];  // I have in doubles, they're missing
}

export function compareWithOther(
  myStickers: Sticker[],
  theirDoubles: Set<string>,
  theirMissing: Set<string>,
): CompareResult {
  const iWant = myStickers.filter((s) => s.status === "missing" && theirDoubles.has(s.number.toUpperCase()));
  const theyWant = myStickers.filter(
    (s) => s.status === "double" && s.doubles_count > 0 && theirMissing.has(s.number.toUpperCase()),
  );
  return { iWant, theyWant };
}
