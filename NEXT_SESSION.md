# NEXT SESSION — Dossier MVP launch plan

Written 2026-09-14. Goal for next session: **Dossier publicly deployed and verified working.**

Read section 0, reply with answers, then I run section 2 while you run section 1.

---

## 0. Questions I need answered first

Every one has a default. **If you reply just "defaults" I take all six and start immediately.**
Override only the ones you care about — e.g. "defaults except Q3: hide the button".

| # | Question | Default if you don't say |
|---|---|---|
| **Q1** | **Standing permission to commit and branch?** Right now ~3,900 lines sit uncommitted on one `Initial commit from Create Next App`. I won't commit without your say-so, and asking mid-flow stalls me. | **Yes** — I create a branch, commit in logical chunks, never push to a remote without asking. |
| **Q2** | **Can I spend real API money on verification calls?** The synthesize endpoint has never been run. Verifying it costs cents; verifying per-section prompt quality later costs more. | **Yes, up to ~$5 this session.** I report actual spend. I stop and ask before exceeding it. |
| **Q3** | **`DONATE_URL` is a placeholder** (`https://ko-fi.com/` → Ko-fi's homepage, not yours). A live dead link in the UI. | **Hide the donate button for the MVP.** Ship it when you have a real link. |
| **Q4** | **Did you rotate the `ANTHROPIC_API_KEY`?** It's currently *valid* (I tested it). `README.md:34` says it was pasted into a chat. Valid + compromised is the worst case. | **Assume NOT rotated** — you rotate it in section 1 before we deploy. |
| **Q5** | **After publishing, what's next?** We can't do all three. → **(a)** wire `fieldRegistry` so per-section prompt tuning becomes possible · **(b)** export-ZIP upload to kill copy/paste · **(c)** Framer dossier page. | **(a) then (c).** Reasoning below. |
| **Q6** | **Should I upgrade the Anthropic SDK?** Installed 0.77.0, current 0.125.0 — 48 minor versions behind. Builds fine today. | **Yes, but only AFTER the deploy is verified live**, so there's a known-good state to roll back to. |

**Why (a) before (b) in Q5:** the registry is 984 lines already written and currently orphaned — zero importers. Wiring it is cheap and it's the thing that makes `PROMPT_SPEC.md` executable. Export-ZIP upload is a much bigger build and it needs a real export file from you, which takes time to arrive. Do the cheap unblock first.

---

## 1. Your to-dos

Roughly 10 minutes of actual work. Do them in this order — **step 1 first, because it has a waiting period.**

### 1.1 — Request your AI data exports (DO THIS FIRST)
These arrive by email and can take minutes to hours. Requesting them first means they land while we work on everything else.

- **Claude** — claude.ai → Settings → Privacy → Export Data
- **ChatGPT** — Settings → Data Controls → Export Data
- **Gemini** — takeout.google.com → deselect all → select Gemini / My Activity

Save the ZIPs somewhere stable (not Downloads) and tell me the path. These are the raw material for both the export-upload feature *and* the golden corpus that `PROMPT_SPEC.md` needs.

### 1.2 — Rotate the API key
console.anthropic.com → revoke the current key → create a new one. Then put it in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Skip only if you already rotated it since writing the README warning.

### 1.3 — Log into Vercel
Interactive, so it has to be you. In this session, type:

```
! vercel login
```

### 1.4 — Paste one real witness statement
For end-to-end verification I need actual input, not fixture data. Open Claude or ChatGPT, paste the interrogation prompt from `src/lib/prompt.ts`, and hand me the reply. This is also our first honest read on whether the output glazes.

### 1.5 — Optional, unblocks Framer later
```
npx @framer/agent@latest setup
```
Needed before I can read your live Framer project. Skip if we're not doing Q5(c) this session.

---

## 2. My to-dos

Dependency-labeled. I start everything marked FREE the moment you reply.

### Track A — Publish (blocked on your 1.2 / 1.3)
- **A1** Confirm `vercel whoami` is authenticated.
- **A2** Set `ANTHROPIC_API_KEY` in Vercel production env; confirm it's scoped to production.
- **A3** Fire one live synthesis call against local dev using your statement from 1.4. **This is the real unknown** — `thinking: {type:"adaptive"}` + `output_config.format` are each confirmed supported on Opus 5, but the *combination* is unverified. If it 400s, Compile Dossier is dead in production and I fix it here.
- **A4** Inspect that first real dossier against the north star: any praise language, any Barnum claims, any invented facts? Report honestly even if it's bad.
- **A5** `vercel --prod`.
- **A6** Smoke-test the live URL: landing renders, compile works, share link roundtrips on the real domain, fragment survives a cross-device paste.

### Track B — Runs in parallel (FREE, needs only Q1/Q3)
- **B1** Branch + commit the ~3,900 uncommitted lines in logical chunks. First real checkpoint this repo has ever had.
- **B2** Resolve `DONATE_URL` per Q3.
- **B3** Wire the orphaned registry — the Q5(a) work:
  1. Extend `DossierField` in `fields.ts` with the retrieval / generation / falsifiability / Framer-binding axes from `PROMPT_SPEC.md` (all optional with defaults, so the existing 61 entries still parse).
  2. Add `buildSectionPrompt(field)` — deterministic assembly from axes, no hand-written prose at call time.
  3. Generate `DOSSIER_SCHEMA` from each field's `output_shape` instead of hardcoding it.
  4. Replace the monolithic `SYSTEM_PROMPT` with registry-assembled prompts.
- **B4** SDK 0.77 → 0.125 **after A6 passes**, then re-verify the build.

### Track C — Only if 1.1 exports arrive
- **C1** Client-side ZIP parser + bounded corpus reducer (parse in-browser; raw archive never leaves the device).
- **C2** Validate against your real export — the formats are undocumented enough that I won't guess.

### Track D — Only if you ran 1.5
- **D1** Read live Framer state; settle whether a dossier page exists or whether it's buried inside `DossierApp.tsx` as a code component.
- **D2** If it's buried, that defeats the entire reason Framer is plugged in — surface it as editable sections mapped to `section_id`.

---

## 3. Definition of done

The session succeeded if **all** of these are true:

- [ ] A stranger can open a public URL and compile a real dossier.
- [ ] The dossier that comes back has zero praise language and zero Barnum claims.
- [ ] Copy-live-link produces a URL that renders the dossier on another device.
- [ ] The work is committed, with a rollback point.

Not required: export upload, Framer polish, per-section tuning. Those are next.

---

## 4. Context you'll want if this session is cold

- **OAuth is impossible.** Verified 2026-09-14 across all three providers. See memory `dossier-no-oauth-path.md`. Don't re-litigate it.
- **Your project memories were orphaned** to `~/digital_projects`, a path that no longer exists. Copied to the live key `-Users-jonah-Desktop-digital-projects`. **Start sessions from `~/Desktop/digital_projects`** so they load.
- **`PROMPT_SPEC.md`** holds the per-section prompt optimization method.
- **The live app and the registry disagree on ethics**, not just structure: `route.ts` still generates a `honeytrap` and "manipulation levers", while `fields.ts` says it deliberately reversed that brief. **Still undecided — Jonah has not ruled on this.** My recommendation was (C): keep honeytrap as a read on the subject's own blind spots, adopt the redaction tiers for the share export. Ask before implementing either way.
