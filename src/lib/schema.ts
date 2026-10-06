import { z } from "zod";

const nullableText = z.string().nullable();

export const candidateSchema = z.object({
  age: z.number().nullable(),
  city: nullableText,
  relocation: nullableText,
  smoking: z.enum(["never", "occasionally", "regularly"]).nullable(),
  wantsChildren: z.enum(["yes", "no", "maybe"]).nullable(),
  maritalStatus: z.enum(["never_married", "divorced", "widowed", "separated"]).nullable(),
  heightInches: z.number().nullable(),
  educationLevel: z.enum(["school", "graduate", "postgraduate", "doctorate"]).nullable(),
  educationText: nullableText,
  diet: z.enum(["vegetarian", "vegan", "eggetarian", "non_vegetarian"]).nullable(),
  occupation: nullableText,
  evidence: z.object({
    age: nullableText,
    city: nullableText,
    relocation: nullableText,
    smoking: nullableText,
    wantsChildren: nullableText,
    maritalStatus: nullableText,
    heightInches: nullableText,
    educationLevel: nullableText,
    educationText: nullableText,
    diet: nullableText,
    occupation: nullableText,
  }),
});

export const extractionSchema = z.object({
  candidates: z.array(candidateSchema),
});

export type ExtractedCandidate = z.infer<typeof candidateSchema>;

export const EXTRACT_SYSTEM = `You extract standard fields from matchmaking profiles. Extract only. Do not judge fit. Use null when a field is not stated ("would love to have kids someday" = yes; children not mentioned = null; "doesn't smoke" = never).

Field rules:
- smoking: "non-smoker", "doesn't smoke", or "never smokes" = never. "smokes occasionally" or "social smoker" = occasionally. "smokes" or "regular smoker" = regularly. Not mentioned = null.
- wantsChildren: "would love to have kids someday", "wants children", "wants a family", or "wants kids" = yes. "does not want children" = no. Unsure = maybe. Not mentioned = null. Hobbies are not a statement about children.
- maritalStatus: "never married" = never_married. "divorced" = divorced. "widowed" = widowed. "separated" = separated.
- heightInches: total inches. 5′11″ = 71, 6′0″ = 72, 5′10″ = 70, 5′9″ = 69, 5′8″ = 68.
- educationLevel: school < graduate (BA, BSc, B.Des, bachelor's) < postgraduate (MBA, M.Des, M.Arch, MS, MA, MD) < doctorate (PhD). educationText is the short credential as written, such as "MBA".
- diet: vegetarian, vegan, eggetarian, or non_vegetarian. Cooking, food, or travel hobbies are not diet. Not mentioned = null.
- city: the city as written, such as "Noida" or "Bengaluru".
- relocation: the full plan in the profile's own words, for example "plans to move to Delhi NCR in 1–2 years". Null if they do not mention moving. Do not shorten it to only a city name.
- occupation: the job title only, for example "Senior consultant".
- evidence: for every field above, a snippet of 12 words or fewer quoting what the profile says, or null when that field is null. Never invent a snippet.

Return one candidate per profile, in the same order.`;

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";
