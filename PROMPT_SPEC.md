# PROMPT_SPEC — per-section prompt optimization method

The point: a dossier section is only as good as the prompt that fills it.
One monolithic system prompt cannot be tuned — changing it moves every section
at once. So each section gets its **own** prompt contract, and each contract is
independently testable and independently optimizable.

This file is the method. `src/lib/fieldRegistry.ts` is the data.

---

## 1. Why per-section and not one big prompt

The current live implementation (`src/app/api/synthesize/route.ts`) is one
~70-line system prompt producing all sections at once. Consequences:

- **No attribution.** A vague PSYCHOLOGICAL ASSESSMENT and a great PROFILE come
  from the same prompt. You cannot tell which instruction caused which result.
- **No isolated A/B.** Edit the voice rule to sharpen section 4 and you have
  silently changed sections 2, 3, 5, and 6.
- **Instruction dilution.** Late instructions in a long prompt compete with
  early ones. Section-specific rules get averaged into a house style.

Per-section contracts fix all three. The tradeoff is cost: N smaller calls
instead of 1 large one, or 1 call with a generated prompt assembled from the
contracts. Start with the assembled single call; split only the sections that
prove hard to tune.

---

## 2. The constraint axes

Every section declares a value on each axis below. This is the enumeration —
when you want to tune a section, you are choosing values here, not rewriting
prose.

### A. Retrieval — what evidence may be used

| Axis | Values | What it controls |
|---|---|---|
| `evidence_scope` | `whole_corpus` · `recent_n` · `signal_only` | How much history to draw on. `signal_only` = metadata (timestamps, message length, cadence) with no topical content. |
| `signal_types` | `timestamps` · `phrasing` · `topics` · `question_shape` · `revision_behavior` | Which channels carry the inference. Forces the model to use the channel you believe in. |
| `evidence_floor` | integer, default `2` | Minimum distinct observations before a claim is allowed. Below the floor, return empty. **This is the single strongest anti-hallucination knob.** |
| `grounding_mode` | `stated_only` · `inferable` | `stated_only` = must appear explicitly in the corpus (use for injuries, names, places). `inferable` = may extrapolate (use for personality, drives). |
| `receipt_policy` | `verbatim_n` · `paraphrase_n` · `none` | How many receipts and in what form. Verbatim is more convincing and more privacy-hazardous. |

### B. Generation — what comes out

| Axis | Values | What it controls |
|---|---|---|
| `output_shape` | `scalar` · `ranked_list` · `percentile_set` · `one_line` · `int_array_24` | The data type. Must match the Framer component's prop shape exactly. |
| `length_budget` | integer words | Hard cap. Short budgets force specificity; long budgets invite padding. |
| `voice_note` | free text, one line | Delivery register. Already present in the registry. |
| `certainty_expression` | `integer_only` | Confidence is a number. Hedge words ("maybe", "possibly") are banned — the number carries the doubt. |

### C. Falsifiability — the anti-glaze machinery

This block exists because the profiling previously drifted into flattery. These
are the checks that keep it honest.

| Axis | Values | What it controls |
|---|---|---|
| `barnum_test` | `required` · `waived` | If `required`, the claim must be **false about a random stranger**. Universally-true statements are rejected. |
| `specificity_probe` | `concrete_noun` · `number` · `time_window` · `none` | The claim must contain at least one of these. Blocks "you value authenticity." |
| `banned_lexicon` | string[] | Per-section ban list. Global bans: praise adjectives, "you're the kind of person who", flaw-as-strength reframes. |
| `falsifier` | free text | One line stating what evidence would **disprove** this claim. If you cannot write it, the field is not a claim — it is a horoscope. Cut it. |

### D. Safety — already in the registry

`redaction_tier` (1–3) · `shareable` · `share_hook_copy` · `sensitive` ·
`distressGuard`. Invariant: sensitivity up, shareability down. Tier 3 never
exports. `distressGuard` fields never render as a scored finding.

### E. Framer binding — how the section reaches the page

| Axis | Values |
|---|---|
| `section_id` | Stable id matching the Framer section that renders it. |
| `render_as` | `stat` · `meter` · `ranked_list` · `redaction_bar` · `clock_dial` · `portrait_box` |
| `slot_contract` | The exact prop shape the Framer code component receives. Changing `output_shape` without changing this breaks the page. |

---

## 3. The optimization loop

Per section, in order. Do not skip step 1 — without a golden corpus you are
tuning against vibes.

**Step 1 — Golden corpus.** 3–5 real AI-history samples where ground truth is
known (yours, plus consenting friends). Store outside the repo; these are real
personal histories. Each sample carries an answer key: the facts you know to be
true about that person.

**Step 2 — Baseline.** Run the section, record output verbatim. This is what you
are beating.

**Step 3 — Score.** Four numbers per section per sample:

- **Specificity** (0–2): would this be wrong about a stranger? 2 = yes, clearly.
- **Groundedness** (0–2): is there a real receipt behind it? 2 = quoted evidence.
- **Calibration error**: `|stated_confidence - actual_correctness|`.
- **Glaze count**: instances of praise, reassurance, or flaw-as-strength. Target 0.

**Step 4 — Change exactly one axis.** One axis, one section, one run. If you
change two, you learn nothing.

**Step 5 — Calibration sweep.** Bucket all claims by stated confidence (0–20,
21–40, …). In each bucket, measure the share that are actually true. A model
saying "82" that is right 50% of the time is inflating — tighten
`evidence_floor` and re-run. Well-calibrated output is the product's whole
credibility.

**Step 6 — Record.** Append the result to a per-section changelog: axis changed,
old value, new value, the four scores. This is the artifact that makes the next
tuning pass cheap.

---

## 4. Wiring status

`fieldRegistry.ts` (61 fields) and `fields.ts` currently have **zero importers**
— the live app runs on the older fixed shape in `types.ts`. The registry already
carries axes `inference_prompt`, `voice_note`, `redaction_tier`, `shareable`,
`share_hook_copy`, `sensitive`, `distressGuard`.

To make this method operational:

1. Extend `DossierField` in `fields.ts` with the axes from sections A, B, C, E
   above (all optional, with defaults, so existing 61 entries still parse).
2. Add `buildSectionPrompt(field)` — deterministic string assembly from the
   axes. No prose written by hand at call time.
3. Replace the hardcoded `SYSTEM_PROMPT` in `route.ts` with prompts assembled
   from the registry, and generate `DOSSIER_SCHEMA` from `output_shape`.
4. Render from `section_id` / `render_as` so a new field appears on the page
   without a component edit.

Step 3 is the one that makes every section independently tunable. Until it
lands, this document describes a method the code cannot yet execute.
