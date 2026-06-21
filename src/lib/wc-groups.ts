// Groupes officiels Coupe du Monde FIFA 2026 (tirage final, mai 2026)
export const WC_GROUPS: Record<string, string[]> = {
  A: ["MEX", "KOR", "RSA", "CZE"],
  B: ["CAN", "SUI", "QAT", "BIH"],
  C: ["BRA", "MAR", "SCO", "HAI"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "ECU", "CIV", "CUW"],
  F: ["NED", "JPN", "TUN", "SWE"],
  G: ["BEL", "IRN", "EGY", "NZL"],
  H: ["ESP", "URU", "KSA", "CPV"],
  I: ["FRA", "SEN", "NOR", "IRQ"],
  J: ["ARG", "AUT", "ALG", "JOR"],
  K: ["POR", "COL", "UZB", "COD"],
  L: ["ENG", "CRO", "PAN", "GHA"],
};

export const GROUP_LETTERS = Object.keys(WC_GROUPS);

export const CODE_TO_GROUP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [letter, codes] of Object.entries(WC_GROUPS)) {
    for (const c of codes) m[c] = letter;
  }
  return m;
})();

export function groupOf(code: string | null | undefined): string | null {
  if (!code) return null;
  return CODE_TO_GROUP[code.toUpperCase()] ?? null;
}
