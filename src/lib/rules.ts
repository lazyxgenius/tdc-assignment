import type {
  CandidateFields,
  Diet,
  EducationLevel,
  Kind,
  MaritalStatus,
  Preference,
  Pronoun,
  Rule,
  RuleStatus,
  Smoking,
  Verdict,
  WantsChildren,
} from "./types";

const NCR = [
  "delhi",
  "new delhi",
  "gurugram",
  "gurgaon",
  "noida",
  "greater noida",
  "ghaziabad",
  "faridabad",
];

const EDUCATION_RANK: Record<EducationLevel, number> = {
  school: 0,
  graduate: 1,
  postgraduate: 2,
  doctorate: 3,
};

export type Row = {
  id: string;
  label: string;
  kind: Kind;
  wants: string;
  profileSays: string;
  status: RuleStatus;
};

export type Evaluated = {
  key: string;
  displayName: string;
  age: number | null;
  city: string | null;
  verdict: Verdict;
  title: string;
  summary: string;
  emphasis: string | null;
  rows: Row[];
  greyTopic: string | null;
};

function normCity(city: string): string {
  return city.trim().toLowerCase().replace(/\./g, "");
}

function expandCities(allowed: string[]): Set<string> {
  const out = new Set<string>();
  for (const city of allowed) {
    const value = normCity(city);
    if (value === "delhi ncr" || value === "ncr") {
      for (const ncr of NCR) out.add(ncr);
    } else if (value) {
      out.add(value);
    }
  }
  return out;
}

export function judgeRule(rule: Rule, fields: CandidateFields): RuleStatus {
  switch (rule.type) {
    case "smoking":
      if (fields.smoking == null) return "unknown";
      return fields.smoking === "never" ? "met" : "missed";
    case "children":
      if (fields.wantsChildren == null || fields.wantsChildren === "maybe") return "unknown";
      return fields.wantsChildren === "yes" ? "met" : "missed";
    case "ageRange":
      if (fields.age == null) return "unknown";
      return fields.age >= rule.min && fields.age <= rule.max ? "met" : "missed";
    case "marital":
      if (fields.maritalStatus == null) return "unknown";
      return rule.allowed.includes(fields.maritalStatus) ? "met" : "missed";
    case "minHeight":
      if (fields.heightInches == null) return "unknown";
      return fields.heightInches >= rule.inches ? "met" : "missed";
    case "location": {
      if (!fields.city?.trim()) return "unknown";
      return expandCities(rule.allowedCities).has(normCity(fields.city)) ? "met" : "missed";
    }
    case "minEducation":
      if (fields.educationLevel == null) return "unknown";
      return EDUCATION_RANK[fields.educationLevel] >= EDUCATION_RANK[rule.level] ? "met" : "missed";
    case "diet":
      if (fields.diet == null) return "unknown";
      return rule.allowed.includes(fields.diet) ? "met" : "missed";
  }
}

function clip(text: string | null | undefined): string | null {
  if (!text) return null;
  const trimmed = text.trim().replace(/\s+/g, " ").replace(/\.$/, "");
  if (!trimmed) return null;
  const words = trimmed.split(" ");
  return words.length <= 12 ? trimmed : words.slice(0, 12).join(" ");
}

export function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const rest = inches % 12;
  return `${feet}′${rest}″`;
}

function smokingSays(value: Smoking): string {
  if (value === "never") return "Doesn't smoke";
  if (value === "occasionally") return "Smokes occasionally";
  return "Smokes regularly";
}

function childrenSays(value: WantsChildren): string {
  if (value === "yes") return "Wants children";
  if (value === "no") return "Doesn't want children";
  return "Might want children";
}

function maritalSays(value: MaritalStatus): string {
  switch (value) {
    case "never_married":
      return "Never married";
    case "divorced":
      return "Divorced";
    case "widowed":
      return "Widowed";
    case "separated":
      return "Separated";
  }
}

function dietSays(value: Diet): string {
  switch (value) {
    case "vegetarian":
      return "Vegetarian";
    case "vegan":
      return "Vegan";
    case "eggetarian":
      return "Eggetarian";
    case "non_vegetarian":
      return "Non-vegetarian";
  }
}

function educationSays(value: EducationLevel): string {
  switch (value) {
    case "school":
      return "School";
    case "graduate":
      return "Graduate";
    case "postgraduate":
      return "Postgraduate";
    case "doctorate":
      return "Doctorate";
  }
}

function lowerFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function profileSays(preference: Preference, fields: CandidateFields): string {
  const evidence = fields.evidence;
  if (preference.rule.type === "location") {
    const city = fields.city?.trim() || clip(evidence?.city);
    const reloc = clip(evidence?.relocation) || clip(fields.relocation);
    if (city && reloc) return `${city}; ${lowerFirst(reloc)}`;
    if (city) return city;
    if (reloc) return lowerFirst(reloc);
    return "Not mentioned";
  }

  const fromEvidence = (() => {
    switch (preference.rule.type) {
      case "smoking":
        return clip(evidence?.smoking);
      case "children":
        return clip(evidence?.wantsChildren);
      case "ageRange":
        return clip(evidence?.age);
      case "marital":
        return clip(evidence?.maritalStatus);
      case "minHeight":
        return clip(evidence?.heightInches);
      case "minEducation":
        return clip(evidence?.educationText) || clip(evidence?.educationLevel);
      case "diet":
        return clip(evidence?.diet);
    }
  })();
  if (fromEvidence) return fromEvidence;

  switch (preference.rule.type) {
    case "smoking":
      return fields.smoking ? smokingSays(fields.smoking) : "Not mentioned";
    case "children":
      return fields.wantsChildren ? childrenSays(fields.wantsChildren) : "Not mentioned";
    case "ageRange":
      return fields.age == null ? "Not mentioned" : String(fields.age);
    case "marital":
      return fields.maritalStatus ? maritalSays(fields.maritalStatus) : "Not mentioned";
    case "minHeight":
      return fields.heightInches == null ? "Not mentioned" : formatHeight(fields.heightInches);
    case "minEducation":
      return fields.educationText || (fields.educationLevel ? educationSays(fields.educationLevel) : "Not mentioned");
    case "diet":
      return fields.diet ? dietSays(fields.diet) : "Not mentioned";
  }
}

function clientWords(pronoun: Pronoun): { sub: string; cap: string; obj: string } {
  if (pronoun === "she") return { sub: "she", cap: "She", obj: "her" };
  return { sub: "he", cap: "He", obj: "him" };
}

function candidateWords(pronoun: Pronoun): { sub: "he" | "she"; pos: "his" | "her" } {
  if (pronoun === "she") return { sub: "he", pos: "his" };
  return { sub: "she", pos: "her" };
}

function said(preference: Preference): string {
  if (preference.rule.type === "smoking") return preference.asks.toLowerCase();
  return preference.asks;
}

function missedDealPhrase(
  preference: Preference,
  fields: CandidateFields,
  pronoun: Pronoun,
): { text: string; emphasis: string } {
  const who = clientWords(pronoun);
  let emphasis: string;
  switch (preference.rule.type) {
    case "smoking":
      emphasis = fields.smoking === "regularly" ? "smokes regularly" : "smokes occasionally";
      break;
    case "children":
      emphasis = "doesn't want children";
      break;
    case "ageRange":
      emphasis = `is ${fields.age}`;
      break;
    case "marital":
      emphasis = fields.maritalStatus ? lowerFirst(maritalSays(fields.maritalStatus)) : "marital status does not match";
      break;
    case "location":
      emphasis = `lives in ${fields.city}`;
      break;
    case "minHeight":
      emphasis = fields.heightInches == null ? "height is too short" : `is ${formatHeight(fields.heightInches)}`;
      break;
    case "minEducation":
      emphasis = "education is below the line";
      break;
    case "diet":
      emphasis = fields.diet ? `eats ${dietSays(fields.diet).toLowerCase()}` : "diet does not match";
      break;
  }
  return {
    emphasis,
    text: `Breaks a deal-breaker: ${emphasis} (${who.sub} said ${said(preference)})`,
  };
}

function unknownDealPhrase(preference: Preference, pronoun: Pronoun): { text: string; emphasis: string } {
  const client = clientWords(pronoun);
  const candidate = candidateWords(pronoun);
  let emphasis: string;
  let gap: string;
  switch (preference.rule.type) {
    case "children":
      emphasis = "wants children";
      gap = `whether ${candidate.sub} wants children`;
      break;
    case "smoking":
      emphasis = "smokes";
      gap = `whether ${candidate.sub} smokes`;
      break;
    case "ageRange":
      emphasis = "age";
      gap = `${candidate.pos} age`;
      break;
    case "marital":
      emphasis = "marital status";
      gap = `${candidate.pos} marital status`;
      break;
    case "location":
      emphasis = "city";
      gap = `which city ${candidate.sub} lives in`;
      break;
    default:
      emphasis = preference.label.toLowerCase();
      gap = `${candidate.pos} ${preference.label.toLowerCase()}`;
  }
  return {
    emphasis,
    text: `Profile doesn't say ${gap} (a deal-breaker for ${client.obj})`,
  };
}

function wishMissReason(preference: Preference): string {
  const rule = preference.rule;
  if (rule.type === "location") {
    const ncr = rule.allowedCities.some((city) => normCity(city) === "delhi ncr");
    return `location is outside ${ncr ? "Delhi NCR" : preference.asks}`;
  }
  if (rule.type === "minHeight") return `height is under ${preference.asks}`;
  if (rule.type === "minEducation") return `education is below ${preference.asks.toLowerCase()}`;
  if (rule.type === "diet") return `diet is not ${preference.asks.toLowerCase()}`;
  if (rule.type === "smoking") return "smoking does not match";
  if (rule.type === "children") return "children does not match";
  if (rule.type === "ageRange") return "age is outside the range";
  return `${preference.label.toLowerCase()} does not match`;
}

function lead(fields: CandidateFields): string {
  return [fields.occupation, fields.educationText].filter((part): part is string => Boolean(part)).join(" · ");
}

function ordered(preferences: Preference[], fields: CandidateFields): Array<Preference & { status: RuleStatus }> {
  return preferences
    .map((preference, index) => ({ preference, index, status: judgeRule(preference.rule, fields) }))
    .sort((a, b) => {
      if (a.preference.kind !== b.preference.kind) return a.preference.kind === "dealbreaker" ? -1 : 1;
      return a.index - b.index;
    })
    .map(({ preference, status }) => ({ ...preference, status }));
}

export function evaluateCandidate(
  fields: CandidateFields,
  displayName: string,
  preferences: Preference[],
  pronoun: Pronoun,
  key = displayName,
): Evaluated {
  const rowsSource = ordered(preferences, fields);
  const rows: Row[] = rowsSource.map((preference) => ({
    id: preference.id,
    label: preference.label,
    kind: preference.kind,
    wants: preference.asks,
    profileSays: profileSays(preference, fields),
    status: preference.status,
  }));

  const dealMissed = rowsSource.filter((row) => row.kind === "dealbreaker" && row.status === "missed");
  const dealUnknown = rowsSource.filter((row) => row.kind === "dealbreaker" && row.status === "unknown");
  const wishMissed = rowsSource.filter((row) => row.kind === "wish" && row.status === "missed");
  const dealCount = rowsSource.filter((row) => row.kind === "dealbreaker").length;
  const wishCount = rowsSource.filter((row) => row.kind === "wish").length;
  const wishesMet = rowsSource.filter((row) => row.kind === "wish" && row.status === "met").length;
  const wishesUnknown = rowsSource.filter((row) => row.kind === "wish" && row.status === "unknown").length;

  let verdict: Verdict = "green";
  if (dealMissed.length) verdict = "red";
  else if (dealUnknown.length) verdict = "grey";
  else if (wishMissed.length) verdict = "amber";

  let title = "Green · Fits";
  let summary = "";
  let emphasis: string | null = null;
  let greyTopic: string | null = null;

  if (verdict === "red" && dealMissed[0]) {
    title = "Red · Don't send";
    const phrase = missedDealPhrase(dealMissed[0], fields, pronoun);
    summary = phrase.text;
    emphasis = phrase.emphasis;
  } else if (verdict === "grey" && dealUnknown[0]) {
    title = "Grey · Confirm first";
    const phrase = unknownDealPhrase(dealUnknown[0], pronoun);
    summary = phrase.text;
    emphasis = phrase.emphasis;
    greyTopic = dealUnknown[0].label.toLowerCase();
  } else if (verdict === "amber") {
    const count = wishMissed.length;
    title = `Amber · Misses ${count} ${count === 1 ? "wish" : "wishes"}`;
    const reason = wishMissed.map((row) => wishMissReason(row)).join(" and ");
    summary = [lead(fields), "all deal-breakers met", reason].filter(Boolean).join(" · ");
  } else {
    title = "Green · Fits";
    const wishPart =
      wishCount === 0
        ? ""
        : wishesUnknown > 0
          ? `${wishesMet} of ${wishCount} wishes met`
          : `all ${wishCount} wishes met`;
    summary = [lead(fields), `all ${dealCount} deal-breakers met`, wishPart].filter(Boolean).join(" · ");
  }

  return {
    key,
    displayName,
    age: fields.age,
    city: fields.city,
    verdict,
    title,
    summary,
    emphasis,
    rows,
    greyTopic,
  };
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function sendReadyLine(items: Evaluated[]): string {
  const greens = items.filter((item) => item.verdict === "green").map((item) => item.displayName);
  const ambers = items.filter((item) => item.verdict === "amber").map((item) => item.displayName);
  const reds = items.filter((item) => item.verdict === "red");
  const greys = items.filter((item) => item.verdict === "grey");
  const readyCount = greens.length + ambers.length;

  let sentence: string;
  if (readyCount === 0) {
    sentence = "No profiles ready to send";
  } else {
    let who: string;
    if (greens.length && ambers.length) {
      who = `${joinNames(greens)}, and ${joinNames(ambers)} as a stretch`;
    } else if (ambers.length) {
      who = `${joinNames(ambers)} as a stretch`;
    } else {
      who = joinNames(greens);
    }
    sentence = `${readyCount} ${readyCount === 1 ? "profile" : "profiles"} ready to send: ${who}`;
  }

  const tails: string[] = [];
  if (reds.length === 1) tails.push(`${reds[0]?.displayName} is held back`);
  else if (reds.length > 1) tails.push(`${joinNames(reds.map((item) => item.displayName))} are held back`);
  for (const item of greys) {
    tails.push(`${item.displayName} waits for a yes on ${item.greyTopic ?? "a deal-breaker"}`);
  }

  if (tails.length === 0) return `${sentence}.`;
  return `${sentence}. ${tails.join("; ")}.`;
}

export function countKinds(preferences: Preference[]): { dealbreakers: number; wishes: number } {
  return {
    dealbreakers: preferences.filter((item) => item.kind === "dealbreaker").length,
    wishes: preferences.filter((item) => item.kind === "wish").length,
  };
}
