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
  COD: "🇨🇩", CUW: "🇨🇼",
  NZL: "🇳🇿", BIH: "🇧🇦",
};

export const CODE_TO_NAME: Record<string, string> = {
  FWC: "Spéciaux FIFA", SPE: "Spéciaux",
  MEX: "Mexico", RSA: "South Africa", KOR: "Korea Republic", CZE: "Czech Republic",
  CAN: "Canada", BIH: "Bosnia & Herzegovina", QAT: "Qatar", SUI: "Switzerland",
  BRA: "Brazil", MAR: "Morocco", HAI: "Haiti", SCO: "Scotland", USA: "USA",
  PAR: "Paraguay", AUS: "Australia", TUR: "Türkiye", GER: "Germany",
  CUW: "Curaçao", CIV: "Côte d'Ivoire", ECU: "Ecuador", NED: "Netherlands",
  JPN: "Japan", SWE: "Sweden", TUN: "Tunisia", BEL: "Belgium", EGY: "Egypt",
  IRN: "Iran", NZL: "New Zealand", ESP: "Spain", CPV: "Cape Verde",
  KSA: "Saudi Arabia", URU: "Uruguay", FRA: "France", SEN: "Senegal",
  IRQ: "Iraq", NOR: "Norway", ARG: "Argentina", ALG: "Algeria", AUT: "Austria",
  JOR: "Jordan", POR: "Portugal", COD: "DR Congo", UZB: "Uzbekistan",
  COL: "Colombia", ENG: "England", CRO: "Croatia", GHA: "Ghana", PAN: "Panama",
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
