import { describe, expect, it } from "vitest";
import { clients } from "@/data/mock";
import { splitProfiles } from "@/lib/split";

describe("splitProfiles", () => {
  it("splits on --- lines, trims, and drops empties", () => {
    const raw = `
      Vikram, 35.

      ---

      Rohan, 34.
      ---
      ---
         Karan, 32.
    `;
    expect(splitProfiles(raw)).toEqual(["Vikram, 35.", "Rohan, 34.", "Karan, 32."]);
  });

  it("counts the prefilled Ananya profiles", () => {
    const ananya = clients.find((client) => client.id === "ananya");
    const profiles = splitProfiles(ananya?.sampleProfiles ?? "");
    expect(profiles).toHaveLength(4);
    expect(profiles[0]?.startsWith("Vikram")).toBe(true);
    expect(profiles[3]?.startsWith("Sameer")).toBe(true);
  });

  it("returns an empty list for blank text", () => {
    expect(splitProfiles("  \n---\n  ")).toEqual([]);
  });
});
