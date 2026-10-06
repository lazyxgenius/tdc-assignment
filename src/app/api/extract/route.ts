import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { redact } from "@/lib/redact";
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GROQ_MODEL,
  EXTRACT_SYSTEM,
  extractionSchema,
  type ExtractedCandidate,
} from "@/lib/schema";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const FAIL = "Couldn't read the profiles right now. Please try again.";

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function safeMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  let message = raw;
  for (const secret of [process.env.GOOGLE_GENERATIVE_AI_API_KEY, process.env.GROQ_API_KEY]) {
    if (secret) message = message.split(secret).join("[redacted]");
  }
  return message.slice(0, 300);
}

async function extractWith(
  provider: "gemini" | "groq",
  modelId: string,
  prompt: string,
  expected: number,
): Promise<ExtractedCandidate[]> {
  const model = provider === "gemini" ? google(modelId) : groq(modelId);
  const { output } = await generateText({
    model,
    system: EXTRACT_SYSTEM,
    prompt,
    temperature: 0,
    maxRetries: 0,
    timeout: 20_000,
    maxOutputTokens: 4096,
    output: Output.object({
      schema: extractionSchema,
      name: "profiles",
      description: "Extracted fields for each candidate, in input order",
    }),
    providerOptions:
      provider === "gemini"
        ? { google: { thinkingConfig: { thinkingBudget: 0 } } }
        : undefined,
  });
  if (!output || output.candidates.length !== expected) {
    throw new Error(`Expected ${expected} candidates, got ${output?.candidates.length ?? 0}`);
  }
  return output.candidates.map((candidate) => ({
    ...candidate,
    age: candidate.age == null ? null : Math.round(candidate.age),
    heightInches: candidate.heightInches == null ? null : Math.round(candidate.heightInches),
  }));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Send the profiles as JSON.", 400);
  }

  const profiles = (body as { profiles?: unknown })?.profiles;
  if (!Array.isArray(profiles) || profiles.some((item) => typeof item !== "string")) {
    return error("Send { profiles: string[] }.", 400);
  }

  const trimmed = profiles.map((item) => item.trim()).filter((item) => item.length > 0);
  if (trimmed.length === 0) return error("Paste at least one profile.", 400);
  if (trimmed.length > 10) return error("Please check up to 10 profiles at a time.", 400);
  const characters = trimmed.reduce((total, item) => total + item.length, 0);
  if (characters > 10_000) {
    return error("That text is too long. Please keep it under 10,000 characters.", 400);
  }

  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!geminiKey) return error("GOOGLE_GENERATIVE_AI_API_KEY is not set.", 500);

  const prepared = trimmed.map((text, index) => redact(text, index + 1));
  const prompt = prepared.map((item, index) => `Profile ${index + 1}:\n${item.cleaned}`).join("\n\n");
  const started = Date.now();
  const geminiModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  try {
    const candidates = await extractWith("gemini", geminiModel, prompt, prepared.length);
    return NextResponse.json({
      candidates: candidates.map((fields, index) => ({
        displayName: prepared[index]?.displayName ?? `Candidate ${index + 1}`,
        ...fields,
      })),
      model: geminiModel,
      ms: Date.now() - started,
    });
  } catch (err) {
    console.error("gemini extract failed:", safeMessage(err));
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    const groqModel = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
    try {
      const candidates = await extractWith("groq", groqModel, prompt, prepared.length);
      return NextResponse.json({
        candidates: candidates.map((fields, index) => ({
          displayName: prepared[index]?.displayName ?? `Candidate ${index + 1}`,
          ...fields,
        })),
        model: groqModel,
        ms: Date.now() - started,
      });
    } catch (err) {
      console.error("groq extract failed:", safeMessage(err));
    }
  }

  return error(FAIL, 503);
}
