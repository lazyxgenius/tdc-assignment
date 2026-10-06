import { describe, expect, it } from "vitest";
import { clients } from "@/data/mock";
import { evaluateCandidate, judgeRule, sendReadyLine } from "@/lib/rules";
import { emptyEvidence, type CandidateFields, type Preference } from "@/lib/types";

const ananya = clients[0];
if (!ananya) throw new Error("Ananya fixture missing");

function fields(partial: Partial<CandidateFields> & Pick<CandidateFields, "age" | "city">): CandidateFields {
  return {
    relocation: null,
    smoking: null,
    wantsChildren: null,
    maritalStatus: null,
    heightInches: null,
    educationLevel: null,
    educationText: null,
    diet: null,
    occupation: null,
    evidence: emptyEvidence(),
    ...partial,
  };
}

const vikram = fields({
  age: 35,
  city: "Noida",
  smoking: "never",
  wantsChildren: "yes",
  maritalStatus: "never_married",
  heightInches: 71,
  educationLevel: "postgraduate",
  educationText: "MBA",
  diet: "vegetarian",
  occupation: "Senior consultant",
});

const rohan = fields({
  age: 34,
  city: "Bengaluru",
  relocation: "plans to move to Delhi NCR in 1–2 years",
  smoking: "never",
  wantsChildren: "yes",
  maritalStatus: "never_married",
  heightInches: 72,
  educationLevel: "postgraduate",
  educationText: "M.Des",
  occupation: "Product designer",
});

const karan = fields({
  age: 32,
  city: "Gurugram",
  smoking: "occasionally",
  wantsChildren: "yes",
  maritalStatus: "never_married",
  heightInches: 70,
  educationLevel: "postgraduate",
  educationText: "MBA",
  occupation: "Investment banker",
});

const sameer = fields({
  age: 36,
  city: "Delhi",
  smoking: "never",
  wantsChildren: null,
  maritalStatus: "never_married",
  heightInches: 69,
  educationLevel: "postgraduate",
  educationText: "M.Arch",
  occupation: "Architect",
});

function withKind(preferences: Preference[], id: string, kind: Preference["kind"]): Preference[] {
  return preferences.map((item) => (item.id === id ? { ...item, kind } : item));
}

describe("Ananya verdicts", () => {
  const prefs = ananya.preferences;

  it("marks Vikram green, Rohan amber, Karan red, and Sameer grey", () => {
    const results = [
      evaluateCandidate(vikram, "Vikram", prefs, ananya.pronoun),
      evaluateCandidate(rohan, "Rohan", prefs, ananya.pronoun),
      evaluateCandidate(karan, "Karan", prefs, ananya.pronoun),
      evaluateCandidate(sameer, "Sameer", prefs, ananya.pronoun),
    ];
    expect(results.map((item) => item.verdict)).toEqual(["green", "amber", "red", "grey"]);
    expect(results[0]?.summary).toBe("Senior consultant · MBA · all 4 deal-breakers met · all 4 wishes met");
    expect(results[1]?.title).toBe("Amber · Misses 1 wish");
    expect(results[1]?.summary).toBe(
      "Product designer · M.Des · all deal-breakers met · location is outside Delhi NCR",
    );
    expect(results[2]?.summary).toBe("Breaks a deal-breaker: smokes occasionally (she said never)");
    expect(results[3]?.summary).toBe(
      "Profile doesn't say whether he wants children (a deal-breaker for her)",
    );
    expect(sendReadyLine(results)).toBe(
      "2 profiles ready to send: Vikram, and Rohan as a stretch. Karan is held back; Sameer waits for a yes on children.",
    );
    const location = results[1]?.rows.find((row) => row.id === "location");
    expect(location?.profileSays).toBe("Bengaluru; plans to move to Delhi NCR in 1–2 years");
  });

  it("makes Rohan red when location is a deal-breaker", () => {
    const next = withKind(prefs, "location", "dealbreaker");
    expect(evaluateCandidate(rohan, "Rohan", next, ananya.pronoun).verdict).toBe("red");
  });

  it("makes Karan amber when smoking is a wish", () => {
    const next = withKind(prefs, "smoking", "wish");
    expect(evaluateCandidate(karan, "Karan", next, ananya.pronoun).verdict).toBe("amber");
  });

  it("keeps a green verdict when a wish is unknown", () => {
    const unknownDiet = { ...vikram, diet: null };
    expect(evaluateCandidate(unknownDiet, "Vikram", prefs, ananya.pronoun).verdict).toBe("green");
  });
});

describe("rule edges", () => {
  const age = ananya.preferences.find((item) => item.id === "age");
  const location = ananya.preferences.find((item) => item.id === "location");
  if (!age || !location) throw new Error("rules missing");

  it("treats age boundaries as inclusive", () => {
    expect(judgeRule(age.rule, { ...vikram, age: 30 })).toBe("met");
    expect(judgeRule(age.rule, { ...vikram, age: 38 })).toBe("met");
    expect(judgeRule(age.rule, { ...vikram, age: 29 })).toBe("missed");
    expect(judgeRule(age.rule, { ...vikram, age: 39 })).toBe("missed");
    expect(judgeRule(age.rule, { ...vikram, age: null })).toBe("unknown");
  });

  it("counts Gurgaon as Delhi NCR", () => {
    expect(judgeRule(location.rule, { ...vikram, city: "Gurgaon" })).toBe("met");
    expect(judgeRule(location.rule, { ...vikram, city: "greater noida" })).toBe("met");
    expect(judgeRule(location.rule, { ...vikram, city: "Bengaluru" })).toBe("missed");
    expect(judgeRule(location.rule, { ...vikram, city: null })).toBe("unknown");
  });
});
