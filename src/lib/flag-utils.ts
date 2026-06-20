// ISO 3166-1 alpha-3 (and a few Panini codes) -> flag emoji
const CODE_TO_FLAG: Record<string, string> = {
  // Special / non-country
  SPE: "✨", FWC: "✨",
  // Common Panini 3-letter codes
  FRA: "🇫🇷", ESP: "🇪🇸", GER: "🇩🇪", ITA: "🇮🇹", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", POR: "🇵🇹",
  NED: "🇳🇱", BEL: "🇧🇪", CRO: "🇭🇷", DEN: "🇩🇰", SUI: "🇨🇭", AUT: "🇦🇹",
  POL: "🇵🇱", SRB: "🇷🇸", UKR: "🇺🇦", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", WAL: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  NOR: "🇳🇴", SWE: "🇸🇪", TUR: "🇹🇷", CZE: "🇨🇿", IRL: "🇮🇪",
  BRA: "🇧🇷", ARG: "🇦🇷", URU: "🇺🇾", COL: "🇨🇴", CHI: "🇨🇱", PER: "🇵🇪",
  ECU: "🇪🇨", PAR: "🇵🇾", VEN: "🇻🇪", BOL: "🇧🇴",
  USA: "🇺🇸", MEX: "🇲🇽", CAN: "🇨🇦", CRC: "🇨🇷", PAN: "🇵🇦", HON: "🇭🇳",
  JAM: "🇯🇲", SLV: "🇸🇻", CUB: "🇨🇺", HAI: "🇭🇹",
  JPN: "🇯🇵", KOR: "🇰🇷", KSA: "🇸🇦", IRN: "🇮🇷", IRQ: "🇮🇶", AUS: "🇦🇺",
  QAT: "🇶🇦", UAE: "🇦🇪", UZB: "🇺🇿", JOR: "🇯🇴",
  MAR: "🇲🇦", SEN: "🇸🇳", TUN: "🇹🇳", EGY: "🇪🇬", ALG: "🇩🇿", CMR: "🇨🇲",
  GHA: "🇬🇭", NGA: "🇳🇬", CIV: "🇨🇮", RSA: "🇿🇦", CPV: "🇨🇻", MLI: "🇲🇱",
  NZL: "🇳🇿",
};

function isoToFlag(iso2: string): string {
  if (iso2.length !== 2) return "";
  return iso2
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export function flagFor(code?: string | null, iso2?: string | null): string {
  if (code && CODE_TO_FLAG[code.toUpperCase()]) return CODE_TO_FLAG[code.toUpperCase()];
  if (iso2 && iso2.length === 2) return isoToFlag(iso2);
  return "🏳️";
}
