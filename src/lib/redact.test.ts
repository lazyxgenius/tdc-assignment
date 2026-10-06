import { describe, expect, it } from "vitest";
import { redact } from "@/lib/redact";

describe("redact", () => {
  it("keeps the display name and removes it from the model text", () => {
    const { displayName, cleaned } = redact(
      "Vikram, 35, Noida. Email Vikram at vikram.shah@example.com or call +91 98765 43210.",
      1,
    );
    expect(displayName).toBe("Vikram");
    expect(cleaned.startsWith("Candidate 1")).toBe(true);
    expect(cleaned.toLowerCase()).not.toContain("vikram");
    expect(cleaned).not.toContain("@");
    expect(cleaned).not.toMatch(/98765/);
    expect(cleaned).not.toMatch(/43210/);
  });

  it("strips a bare 10-digit phone and numbers the second candidate", () => {
    const { displayName, cleaned } = redact("Priya Shah, 29, Mumbai. Phone 9876543210.", 2);
    expect(displayName).toBe("Priya Shah");
    expect(cleaned.startsWith("Candidate 2")).toBe(true);
    expect(cleaned).not.toContain("Priya");
    expect(cleaned).not.toContain("9876543210");
    expect(cleaned).toContain("29");
  });

  it("does not treat an age or a height as a phone number", () => {
    const { cleaned } = redact("Vikram, 35, Noida. 5′11″.", 1);
    expect(cleaned).toContain("35");
    expect(cleaned).toContain("5′11″");
  });
});
