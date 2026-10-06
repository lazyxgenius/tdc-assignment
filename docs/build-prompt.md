# Build prompt: TDC Pre-Send Check prototype

You are building a small working prototype for a job assessment (The Date Crew, "Product & Tech Generalist"). You are running with full permissions. Do the whole job yourself: build, test, commit, merge, push to GitHub and deploy to Vercel. Stop only if something truly needs Aditya (for example a missing API key), and then say exactly what you need.

Repo: https://github.com/lazyxgenius/tdc-assignment (you are inside a local clone; GitHub and the Vercel CLI are already logged in). The repo had no commits before this.

## 1. What the product is (read this first)

Matchmakers at The Date Crew send clients profiles of possible partners. About 1 in 4 profiles they send breaks a preference the client already gave (for example, she said "non-smoker" and he smokes). The **Pre-Send Check** catches this before sending.

- Each client has a **preference card**. Every item on it is either a **deal-breaker** (never break) or a **wish** (can stretch).
- The matchmaker pastes candidate profiles in any messy format (biodata text, WhatsApp forward), separated by a line of `---`.
- **AI only reads the messy text and pulls out standard fields** (age, city, smoking, children, etc.).
- **Plain code rules decide the verdict.** The AI never decides pass/fail. This is the key design idea: results are explainable and the AI cannot invent a "pass".
- Verdicts:
  - **Red** = breaks a deal-breaker → don't send
  - **Amber** = all deal-breakers met, but misses a wish → send only as a deliberate stretch
  - **Green** = fits
  - **Grey** = a deal-breaker field is not mentioned → confirm first
- Clients never see any AI. This is a tool for matchmakers only.

The prototype shows the core flow only. Mock data is fine. Do not build anything listed in section 6 as "do not build".

## 2. Design reference

Three screen designs are in `docs/design/` (plain HTML with inline styles; they reference a `support.js` and `<x-dc>` tags from a design tool. Ignore those; read them only for layout, copy, colours, spacing and icons):

- `screen3-check-profiles.html` → the **Check profiles** page
- `screen4-check-results.html` → the **Check results** page
- `screen2-preference-card.html` → the **Preference card** page

Match them closely: same layout, wording, chips, icons, colours. Where a design shows hard-coded results (e.g. "took 6 seconds", "1 Green"), make it real and computed.

Design tokens (Material Design 3, light scheme). Put them as CSS variables in one place:

```
primary #8B4A62 · onPrimary #FFFFFF · primaryContainer #FFD9E3 · onPrimaryContainer #3A0720
secondaryContainer #FFD9E2 · onSecondaryContainer #2B151C
tertiary #7C5635 · tertiaryContainer #FFDCC1
error #BA1A1A · errorContainer #FFDAD6
surface #FFF8F8 · surfaceContainerLow #FFF0F2 · surfaceContainer #FAEAED
surfaceContainerHigh #F4E4E7 · surfaceContainerHighest #EEDFE1
onSurface #22191C · onSurfaceVariant #514347 · outline #837377 · outlineVariant #D5C2C6
Verdicts (always icon + label, never colour alone):
  Green  container #CDEBCB / icon #2E6B3A (check_circle)
  Amber  container #FFDDB3 / icon #8A5300 (warning)
  Red    container #FFDAD6 / icon #BA1A1A (block)
  Grey   container #EEDFE1 / icon #514347 (help)
```

Type: Roboto Flex (load with `next/font/google`). Icons: Material Symbols Outlined (Google Fonts stylesheet). Shapes: buttons fully round (40–48px tall), chips 8px radius, cards 12px. Touch targets at least 44px. Real `<button>`, `<a>`, `<label>` + inputs. The layout must also work at phone width (390px): the left nav rail becomes a bottom bar or top bar, the side panel stacks under the main column, the results table scrolls sideways inside its card.

## 3. Tech stack (fixed, do not change)

- **Next.js** (latest stable, App Router, TypeScript, `src/` dir), plain CSS or CSS modules with the tokens above. Tailwind is allowed if you prefer, but keep the tokens as CSS variables.
- **Vercel AI SDK** (`ai` package) with **`@ai-sdk/google`** (Gemini Flash) as the main model and **`@ai-sdk/groq`** as the backup. Use the SDK's structured output with a **Zod schema** (use whatever the installed `ai` version recommends: `generateObject` or `generateText` with `Output.object`; check the installed package's docs/types, don't guess).
- Model names come from env vars with defaults: `GEMINI_MODEL` (default `gemini-2.5-flash`), `GROQ_MODEL` (default `openai/gpt-oss-20b`). Before finishing, confirm these defaults are valid model ids for the current provider APIs (check the providers' docs or make a tiny live call); if one is not, pick the current Flash / open model and update the default.
- Keys: `GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY`, read from `.env.local` locally. Never commit them. Never print their values in logs or output.
- **Do not use Claude / Anthropic anywhere in the product.**
- Mock data lives in a TypeScript/JSON file in the repo (no database for the prototype).
- Tests: **Vitest**.

## 4. How it works (exact behaviour)

### 4.1 Privacy step (before any AI call, on the server)

For each pasted profile:
1. Take the display name locally: the first word(s) before the first comma (e.g. "Vikram"). Keep it for the UI only.
2. Remove the name from the text sent to the AI (replace with "Candidate 1", "Candidate 2"…), and strip phone numbers and email addresses with regex.
3. Only the cleaned text goes to the AI. Put this in a pure function `redact()` with unit tests.

### 4.2 AI extraction: `POST /api/extract`

Input: `{ profiles: string[] }` (already split on lines of `---`; trim; drop empty). Limit: max 10 profiles, max 10,000 characters total; reject with a friendly error otherwise.

Ask the AI to return, for each candidate, these fields (use `null` when the text does not say; never guess):

| field | type |
|---|---|
| `age` | number or null |
| `city` | string or null (as written, e.g. "Noida") |
| `relocation` | string or null (e.g. "plans to move to Delhi NCR in 1–2 years") |
| `smoking` | `"never" \| "occasionally" \| "regularly" \| null` |
| `wantsChildren` | `"yes" \| "no" \| "maybe" \| null` |
| `maritalStatus` | `"never_married" \| "divorced" \| "widowed" \| "separated" \| null` |
| `heightInches` | integer or null (5′11″ → 71) |
| `educationLevel` | `"school" \| "graduate" \| "postgraduate" \| "doctorate" \| null` |
| `educationText` | string or null (e.g. "MBA") |
| `diet` | `"vegetarian" \| "vegan" \| "eggetarian" \| "non_vegetarian" \| null` |
| `occupation` | string or null |
| `evidence` | object: for each field above, a short snippet of what the profile says (≤ 12 words), or null |

The system prompt must say plainly: extract only, do not judge fit, use null when not stated ("would love to have kids someday" = yes; children not mentioned = null; "doesn't smoke" = never).

Call Gemini first. If it fails (error, rate limit, timeout ~20 s), retry once with Groq. If both fail or no key is set, return a clear error (`"Couldn't read the profiles right now. Please try again."`; if no key is configured, say which env var is missing). Return `{ candidates: [...], model: "<which model answered>", ms: <time taken> }`.

### 4.3 Rules: `src/lib/rules.ts` (pure functions, run in the browser)

The rules run on the client, on the extracted fields + the current preference card. This means: if the matchmaker changes the card and goes back to the results, verdicts update instantly **without calling the AI again**. This is an important demo moment.

Each preference item has: `id`, `label` (e.g. "Smoking"), `wantsText` (e.g. "Never"), `kind: "dealbreaker" | "wish"`, and a `rule`. Rule types and how each returns `met | missed | unknown`:

- `smoking`: met if `never`; missed if `occasionally` or `regularly`; unknown if null.
- `children`: met if `yes`; missed if `no`; unknown if `maybe` or null.
- `ageRange {min, max}`: met if min ≤ age ≤ max; missed otherwise; unknown if null.
- `marital {allowed: [...]}`: met if in list; missed otherwise; unknown if null.
- `minHeight {inches}`: met if ≥; missed if <; unknown if null.
- `location {allowedCities: [...]}`: compare lower-cased `city` against the list. "Delhi NCR" = Delhi, New Delhi, Gurugram, Gurgaon, Noida, Greater Noida, Ghaziabad, Faridabad. Missed if outside (the table's "Profile says" shows city + relocation note, e.g. "Bengaluru; plans to move to NCR in 1–2 years"); unknown if null.
- `minEducation {level}`: order school < graduate < postgraduate < doctorate.
- `diet {allowed: [...]}`.

Verdict for a candidate:
1. Any **deal-breaker missed** → **Red**
2. else any **deal-breaker unknown** → **Grey**
3. else any **wish missed** → **Amber**
4. else **Green**

A wish that is unknown does not change the verdict (it shows "Unknown" in the table).

Also produce a one-line summary per candidate, like the design:
- Green: "Senior consultant · MBA · all 4 deal-breakers met · all 4 wishes met"
- Amber: "Product designer · M.Des · all deal-breakers met · location is outside Delhi NCR" (title: "Amber · Misses 1 wish")
- Red: "Breaks a deal-breaker: smokes occasionally (she said never)"
- Grey: "Profile doesn't say whether he wants children (a deal-breaker for her)"

Use the client's pronoun field for "she/he" and "She wants / He wants".

### 4.4 Mock data: `src/data/mock.ts`

Matchmaker: **Kavya**. Clients in the dropdown (in this order):

1. **Ananya S. · 31 · Gurugram** (she). "Partner Search client since July". Card note: "Built from her intake form and portal preferences (updated 12 Sep)."
   - Deal-breakers: Smoking = Never · Children = Wants children · Age = 30 to 38 · Marital status = Never married
   - Wishes: Height = 5′9″ or taller · Location = Delhi NCR (open to moving later) · Education = Postgraduate · Diet = Vegetarian preferred
   - Sample profiles (prefilled in the paste box, exactly this text):
     ```
     Vikram, 35, Noida. Senior consultant, MBA. Non-smoker, vegetarian. Never married. 5′11″. Would love to have kids someday.
     ---
     Rohan, 34, Bengaluru. Product designer, M.Des. Doesn't smoke. Never married. 6′0″. Wants children. Plans to move to Delhi NCR in 1–2 years.
     ---
     Karan, 32, Gurugram. Investment banker, MBA. Smokes occasionally. Never married. 5′10″. Wants a family.
     ---
     Sameer, 36, Delhi. Architect, M.Arch. Non-smoker. Never married. 5′9″. Loves travel and cooking.
     ```
   - **Expected verdicts: Vikram = Green, Rohan = Amber (location), Karan = Red (smoking), Sameer = Grey (children not mentioned).**
   - If Location is switched to a deal-breaker: **Rohan = Red.**
2. **Ishita K. · 29 · Singapore** (she). Make a sensible card (e.g. deal-breakers: non-smoker, age 29–37, never married; wishes: Singapore or open to relocating there, postgraduate, 5′8″+) and 3 sample profiles giving a mix of verdicts.
3. **Dev P. · 36 · Bengaluru** (he). Sensible card (e.g. deal-breakers: wants children, age 29–36, non-smoker; wishes: Bengaluru, graduate+, vegetarian) and 3 sample profiles giving a mix of verdicts.

Switching the client in the dropdown loads that client's sample profiles into the paste box.

The "Card at a glance" stats on the preference card (Profiles checked 23, Accepted 9 (39%)) are mock numbers: keep them for Ananya and label the box "Sample data".

## 5. Pages and navigation

- `/` → redirect to `/check`.
- **`/check` (screen 3)**: client dropdown, big paste box, helper text, primary button **"Check N profiles"** (N = live count of profiles in the box; disabled when 0), side panel "Checking against {Name}'s card" with deal-breaker and wish chips and an **Edit** link to the card, the "What you'll get" legend, and the privacy note. While checking, show a loading state on the button. On success go to `/results`. On error, show the message inline.
- **`/results` (screen 4)**: header "{N} profiles checked for {Client}", subline "Against X deal-breakers and Y wishes · took Z seconds". Filter chips: All / Green / Amber / Red / Grey with counts. One card per candidate in the order pasted, with verdict icon + label, name, age, city, summary line, and **Show details / Hide details** that reveals the field table: Preference (label · deal-breaker/wish) | She wants | Profile says (evidence) | Result (✓ Met / ✕ Missed / ? Unknown). Expand the first Amber card by default. Back arrow → `/check` (keep the pasted text). If someone opens `/results` with no results, redirect to `/check`.
- **`/clients/[id]` (screen 2, preference card)**: two groups, Deal-breakers and Wishes; each item has a segmented button **Deal-breaker | Wish**. Changing a toggle moves the item to the other group (visually) but nothing is saved until **Save card**. **Discard** reverts. If there are unsaved changes, show that clearly. Back arrow → `/check`. After saving, a small confirmation ("Card saved. Results will update.") and if results exist, a link "Back to results".
- State (cards + last check results + pasted text) lives in a React context. Also save cards to `localStorage` (wrapped in try/catch so the app still works if storage is blocked). Add a small, quiet "Reset demo data" text button somewhere on the card page.
- **Nav rail** (left): the round **Check** button (active on /check and /results) and **Clients** (goes to the current client's card). **Home, Feedback, Numbers** are shown greyed out, not clickable, with tooltip "Not in the prototype".

## 6. Do NOT build (show greyed out / disabled exactly as in the designs)

Screens 1, 5, 6, 7, 8 (Home, Profile email, Client feedback, Feedback inbox, Weekly numbers). "Upload biodata PDF" button. "Add a preference". The "Pattern from her feedback" card (show it greyed, disabled buttons). All actions after a verdict on the results page: Add to email, Send as a stretch, the "why meet anyway" note (show the box read-only with the sample text and the hint "Stretch note: not in the prototype."), Skip, Override (logged), Mark as confirmed, Create email (show the bottom bar, button disabled). Disabled items: `disabled` attribute or `aria-disabled`, 38% opacity, tooltip "Not in the prototype".

## 7. Tests (must pass before deploying)

Vitest, no network:
- `rules.test.ts`: using fixed extracted fields for the 4 Ananya candidates (write these fixtures by hand), verdicts are Green, Amber, Red, Grey; flipping Location to deal-breaker makes Rohan Red; flipping Smoking to a wish makes Karan Amber; unknown wish keeps Green; age boundary values (30 and 38 met, 29 and 39 missed); "Gurgaon" counts as Delhi NCR.
- `redact.test.ts`: phone numbers (e.g. +91 98765 43210, 9876543210) and emails are removed; name is replaced; display name is kept.
- `split.test.ts`: splitting on `---` lines, trimming, dropping empties, counting.

Also run `npm run build` and `npm run lint` cleanly.

## 8. Git, GitHub, Vercel (do all of it yourself)

Never force-push. Never rewrite history. Never commit `.env*` files except `.env.example`. Do not touch anything outside this repo folder.

1. On `main`: first commit with `.gitignore` (Node/Next, `.env*.local`, `.vercel`), `README.md` stub, and the `docs/` folder (this prompt and the designs). Push `main` to `origin`.
2. Create branch `feat/pre-send-check`. Build everything there in small, clear commits (scaffold → mock data + rules + tests → API route → pages → polish).
3. When tests, lint and build pass: `git checkout main`, then `git merge --no-ff feat/pre-send-check`, then push `main`.
4. Vercel: link the project (`vercel link --yes --project tdc-pre-send-check`, or a close name if taken). Add the env vars to the Vercel project for Production (and Preview) from the values in `.env.local`, without echoing them (e.g. `printf '%s' "$VALUE" | vercel env add NAME production`). Add `GEMINI_MODEL` and `GROQ_MODEL` too. If `.env.local` has no Gemini key, still deploy, then tell Aditya clearly at the end.
5. Deploy: `vercel deploy --prod --yes`. If possible, also connect the Vercel project to the GitHub repo (`vercel git connect`) so pushes to `main` auto-deploy; if that fails, skip it and say so.
6. Make sure the production URL is public (no Vercel login wall / deployment protection on production). If protection is on, turn it off for production via the CLI or API if possible; otherwise tell Aditya the exact setting to change.

## 9. Check the live app (after deploying)

1. `curl` the production `/check` and `/clients/ananya` pages: status 200.
2. `POST` the Ananya sample profiles to the production `/api/extract` and run the rules on the response (a small script is fine): confirm Green / Amber / Red / Grey for Vikram / Rohan / Karan / Sameer. If the AI extraction gets a field wrong, improve the prompt/schema, redeploy and re-check (max 3 rounds; then report what is still wrong).
3. Screenshots with Playwright (install it as a dev dependency; Chromium only) of the **production** site at 1440×900, saved to `docs/screenshots/`:
   - `01-check.png` (/check with Ananya's profiles)
   - `02-results.png` (/results after checking, Rohan's Amber card expanded)
   - `03-card-location-dealbreaker.png` (/clients/ananya with Location switched to Deal-breaker, saved)
   - `04-results-rohan-red.png` (/results after that change: Rohan now Red)
   - `05-mobile-results.png` (/results at 390×844)
   Commit the screenshots (via a short branch + `git checkout main` + `git merge --no-ff`, or directly on main) and push.

## 10. README

Write a short, plain-English `README.md`: what the Pre-Send Check is (2–3 lines), live link, screenshots, "AI reads, rules decide" explained in 3 bullets, the four verdicts, how to run locally (`npm install`, `.env.local` from `.env.example`, `npm run dev`, `npm test`), the stack, and what is mocked / not built. Keep it under ~80 lines.

## 11. When you are done, report back

- Production URL and GitHub URL
- Test results (pass counts), build status
- The live check result for the 4 Ananya candidates (and which model answered)
- Whether GitHub auto-deploy is connected and whether production is public
- Anything you could not do, and the exact step Aditya should take
