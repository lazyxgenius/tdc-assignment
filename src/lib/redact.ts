const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/** A run of digits long enough to be a phone, with spaces or punctuation between them. */
const PHONE = /\+?\d[\d\s().-]{8,}\d/g;

export function displayNameOf(text: string): string {
  const line = text.trim().split(/\r?\n/, 1)[0] ?? "";
  const beforeComma = line.split(",")[0]?.trim() ?? "";
  if (!beforeComma) return "Candidate";
  if (!line.includes(",") && beforeComma.split(/\s+/).length > 4) {
    return beforeComma.split(/\s+/)[0] ?? "Candidate";
  }
  return beforeComma;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripPhones(text: string): string {
  return text.replace(PHONE, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 15) return " ";
    return match;
  });
}

/**
 * Keep a display name for the matchmaker, and return text that is safe to send
 * to a model: the name becomes "Candidate N", and phones and emails are removed.
 * `candidateNumber` is 1-based.
 */
export function redact(
  text: string,
  candidateNumber: number,
): { displayName: string; cleaned: string } {
  const displayName = displayNameOf(text);
  const label = `Candidate ${candidateNumber}`;
  let cleaned = text;
  if (displayName && displayName !== "Candidate") {
    cleaned = cleaned.replace(new RegExp(`\\b${escapeRegExp(displayName)}\\b`, "gi"), label);
  }
  cleaned = cleaned.replace(EMAIL, " ");
  cleaned = stripPhones(cleaned);
  cleaned = cleaned
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
  return { displayName, cleaned };
}
