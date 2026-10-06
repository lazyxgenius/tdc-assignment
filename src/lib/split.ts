/** Split pasted text on lines that are only `---`. Trim each piece and drop empties. */
export function splitProfiles(raw: string): string[] {
  return raw
    .split(/^\s*---\s*$/m)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
