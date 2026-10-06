export type Pronoun = "she" | "he";

export type Smoking = "never" | "occasionally" | "regularly";
export type WantsChildren = "yes" | "no" | "maybe";
export type MaritalStatus = "never_married" | "divorced" | "widowed" | "separated";
export type EducationLevel = "school" | "graduate" | "postgraduate" | "doctorate";
export type Diet = "vegetarian" | "vegan" | "eggetarian" | "non_vegetarian";
export type Kind = "dealbreaker" | "wish";
export type RuleStatus = "met" | "missed" | "unknown";
export type Verdict = "green" | "amber" | "red" | "grey";

export type Rule =
  | { type: "smoking" }
  | { type: "children" }
  | { type: "ageRange"; min: number; max: number }
  | { type: "marital"; allowed: MaritalStatus[] }
  | { type: "minHeight"; inches: number }
  | { type: "location"; allowedCities: string[] }
  | { type: "minEducation"; level: EducationLevel }
  | { type: "diet"; allowed: Diet[] };

export type Evidence = {
  age: string | null;
  city: string | null;
  relocation: string | null;
  smoking: string | null;
  wantsChildren: string | null;
  maritalStatus: string | null;
  heightInches: string | null;
  educationLevel: string | null;
  educationText: string | null;
  diet: string | null;
  occupation: string | null;
};

export type CandidateFields = {
  age: number | null;
  city: string | null;
  relocation: string | null;
  smoking: Smoking | null;
  wantsChildren: WantsChildren | null;
  maritalStatus: MaritalStatus | null;
  heightInches: number | null;
  educationLevel: EducationLevel | null;
  educationText: string | null;
  diet: Diet | null;
  occupation: string | null;
  evidence: Evidence;
};

export type Preference = {
  id: string;
  label: string;
  /** Full line on the preference card. */
  wantsText: string;
  /** Shorter line in the results table and in "she said …". */
  asks: string;
  /** Chip on the check page. */
  chip: string;
  kind: Kind;
  rule: Rule;
};

export type Glance = {
  checked: number;
  accepted: number;
  percent: number;
};

export type Client = {
  id: string;
  name: string;
  shortName: string;
  age: number;
  city: string;
  pronoun: Pronoun;
  since: string;
  cardNote: string;
  sampleProfiles: string;
  glance?: Glance;
  preferences: Preference[];
};

export function emptyEvidence(): Evidence {
  return {
    age: null,
    city: null,
    relocation: null,
    smoking: null,
    wantsChildren: null,
    maritalStatus: null,
    heightInches: null,
    educationLevel: null,
    educationText: null,
    diet: null,
    occupation: null,
  };
}
