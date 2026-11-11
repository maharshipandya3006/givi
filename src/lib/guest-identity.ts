const GENERIC_GUEST_NAMES = new Set([
  "",
  "kind supporter",
  "supporter",
  "guest",
  "guest giver",
  "anonymous",
  "anonymous giver",
  "judge donor",
  "givi donor",
  "applicant",
  "verified recipient",
  "autonomous giving agent",
  "autonomous donor",
]);

/**
 * Removes agent suffixes and normalizes sentinel names used by the agent ledger.
 */
export function cleanDonorName(rawName: string): string {
  if (!rawName) return "Kind Supporter";
  const cleaned = rawName
    .replace(/'s givi agent$/i, "")
    .replace(/' givi agent$/i, "")
    .replace(/\s*\(givi agent\)$/i, "")
    .replace(/^autonomous giving agent$/i, "Kind Supporter")
    .replace(/^autonomous donor$/i, "Kind Supporter")
    .trim();
  return cleaned || "Kind Supporter";
}

/**
 * Returns true if the name is blank or a generic placeholder rather than a custom username.
 */
export function isGenericGuestName(name?: string | null): boolean {
  const normalized = (name || "").trim().toLowerCase();
  return GENERIC_GUEST_NAMES.has(normalized);
}

/**
 * Returns true when a guest provided a custom username worth persisting across sessions.
 */
export function isCustomGuestUsername(name?: string | null): boolean {
  return !isGenericGuestName(name);
}

/**
 * Encodes a trimmed username into a deterministic, exact case-sensitive guest ID
 * (e.g. "Mahi" and "mahi" produce distinct IDs).
 */
export function guestIdForUsername(name: string): string {
  const trimmed = name.trim();
  const bytes = new TextEncoder().encode(trimmed);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return `guest-u-${hex}`;
}

export function isCanonicalGuestId(id?: string | null): boolean {
  return Boolean(id && id.startsWith("guest-u-"));
}

