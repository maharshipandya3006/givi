// ==============================================================================
// Givi — Location & State Matcher for Local Neighbor Routing
// ==============================================================================

const US_STATE_MAP: Record<string, string> = {
  alabama: "al",
  alaska: "ak",
  arizona: "az",
  arkansas: "ar",
  california: "ca",
  colorado: "co",
  connecticut: "ct",
  delaware: "de",
  florida: "fl",
  georgia: "ga",
  hawaii: "hi",
  idaho: "id",
  illinois: "il",
  indiana: "in",
  iowa: "ia",
  kansas: "ks",
  kentucky: "ky",
  louisiana: "la",
  maine: "me",
  maryland: "md",
  massachusetts: "ma",
  michigan: "mi",
  minnesota: "mn",
  mississippi: "ms",
  missouri: "mo",
  montana: "mt",
  nebraska: "ne",
  nevada: "nv",
  "new hampshire": "nh",
  "new jersey": "nj",
  "new mexico": "nm",
  "new york": "ny",
  "north carolina": "nc",
  "north dakota": "nd",
  ohio: "oh",
  oklahoma: "ok",
  oregon: "or",
  pennsylvania: "pa",
  "rhode island": "ri",
  "south carolina": "sc",
  "south dakota": "sd",
  tennessee: "tn",
  texas: "tx",
  utah: "ut",
  vermont: "vt",
  virginia: "va",
  washington: "wa",
  "west virginia": "wv",
  wisconsin: "wi",
  wyoming: "wy",
};

const US_CITY_TO_STATE: Record<string, string> = {
  austin: "tx",
  houston: "tx",
  dallas: "tx",
  "san antonio": "tx",
  detroit: "mi",
  "highland park": "mi",
  flint: "mi",
  "ann arbor": "mi",
  atlanta: "ga",
  savannah: "ga",
  chicago: "il",
  aurora: "il",
  cleveland: "oh",
  columbus: "oh",
  cincinnati: "oh",
  philadelphia: "pa",
  pittsburgh: "pa",
  "new orleans": "la",
  "baton rouge": "la",
  "new york": "ny",
  brooklyn: "ny",
  "los angeles": "ca",
  "san francisco": "ca",
  seattle: "wa",
  miami: "fl",
  boston: "ma",
};

export function extractStateCode(loc: string): string | null {
  if (!loc) return null;
  const clean = loc.toLowerCase().replace(/[^a-z\s]/g, " ").trim();
  const tokens = clean.split(/\s+/);

  for (const t of tokens) {
    if (t.length === 2 && Object.values(US_STATE_MAP).includes(t)) {
      return t;
    }
  }

  for (const [name, code] of Object.entries(US_STATE_MAP)) {
    if (clean.includes(name)) {
      return code;
    }
  }

  for (const [city, code] of Object.entries(US_CITY_TO_STATE)) {
    if (clean.includes(city)) {
      return code;
    }
  }

  return null;
}

export function isLocationMatch(causeLocation: string, donorLocation: string): boolean {
  if (!causeLocation || !donorLocation) return false;
  const cLower = causeLocation.toLowerCase().trim();
  const dLower = donorLocation.toLowerCase().trim();

  // Direct match or word matching for multi-character locations (>3 chars to avoid "us"/"in" false positives)
  if (cLower === dLower) {
    return true;
  }
  if (cLower.length > 3 && dLower.length > 3) {
    if (cLower.includes(dLower) || dLower.includes(cLower)) {
      return true;
    }
  }

  // State code match
  const donorState = extractStateCode(donorLocation);
  const causeState = extractStateCode(causeLocation);

  if (donorState && causeState && donorState === causeState) {
    return true;
  }

  return false;
}

