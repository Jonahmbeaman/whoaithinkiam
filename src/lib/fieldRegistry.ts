import type { DossierField } from "./fields";

// ============================================================================
// FIELD REGISTRY — curated, safety-gated. Batches 01 + 02 (safe subset).
// ============================================================================
// This is the CANONICAL registry. It contains the fields we will actually infer
// and, where allowed, share. It is intentionally NOT a 1:1 transcription of the
// briefs: fields that produce an exploitable/broadcastable artifact are dropped
// or replaced with an abstracted awareness field that lands the privacy point
// without manufacturing the weapon. See fields.ts for the full exclusion list.
//
// DECLINED from the briefs (documented so they aren't silently re-added):
//   Batch 01 — Section B "skeletons" catalog; precise geolocation (F); minor PII
//     & named third parties (H); operational meta how-tos; special-category
//     health inference.
//   Batch 02 — per-person radicalization pathway/stage/pipeline map (O);
//     concealed political-identity extraction as shareable (party reg, likely
//     vote, public/private gap); outlet/handle/feed reconstruction & institutional
//     political-trust scoring (P/Q); conspiracy belief maps as scored/shareable
//     (T); "ideal persuader to target you" (U); outgroup-dehumanization &
//     "excommunication secret" (W); ALL Section Z operational influence-op
//     how-tos ("how I'd flip you / get you to vote against interest / the attack
//     ad"). Their awareness value is preserved by the abstracted fields below.
//   Reserved Batch 07 (sexual/kink/"who you'd cheat with") and Batch 08
//     (mortality / cause-of-death / life-expectancy / eulogy-as-viral-artifact)
//     are declined in advance — special-category sexual/health data plus
//     distressing pseudo-prediction, engineered for maximum spread.
//
// TIER RULE (see fields.ts): sensitivity up => shareability down. Tier 3 is
// user-only, NEVER exported. distressGuard fields never render as a finding.
// ============================================================================

export const REGISTRY: DossierField[] = [
  // ---------------- Batch 01 · A. Physical (safe) ----------------
  {
    field_id: "estimated_age_range",
    label: "Age (± 3 years)",
    category: "physical",
    inference_prompt:
      "Estimate the subject's age within a 3-year window from slang, tech nostalgia, life-stage queries, and generational tells.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "An AI pinned my age to a 3-year window from my prompts. It didn't miss.",
    voice_note: "Flat, like a booking sheet.",
  },
  {
    field_id: "sleep_schedule_actual_vs_claimed",
    label: "Sleep Schedule (actual)",
    category: "physical",
    inference_prompt:
      "Infer real sleep/active hours from message timestamps and content, and contrast with any sleep habits the subject claims.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "It knows when I actually sleep, not when I say I do. From timestamps alone.",
    voice_note: "State the gap without comment.",
  },
  {
    field_id: "estimated_voice_and_cadence",
    label: "Speaking Cadence",
    category: "physical",
    inference_prompt:
      "From writing rhythm, punctuation, and phrasing, estimate how the subject talks — pace, filler, formality.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "It reconstructed how I talk out loud from how I type. That shouldn't be possible.",
    voice_note: "Describe, don't perform.",
  },
  {
    field_id: "injury_or_limitation_self_reported",
    label: "Self-Reported Limitations",
    category: "physical",
    inference_prompt:
      "Note only physical limits the subject has EXPLICITLY mentioned. Never infer disability or health status they didn't state.",
    redaction_tier: 2,
    shareable: false,
    share_hook_copy: null,
    voice_note: "Grounded only. Empty if unstated.",
    sensitive: true,
  },

  // ---------------- Batch 01 · C. Personality Autopsy ----------------
  {
    field_id: "mbti_estimate",
    label: "16-Personalities Read",
    category: "personality",
    inference_prompt:
      "Estimate the subject's 4-letter type with a confidence and a one-line, opinionated reason grounded in behavior.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "An AI typed me from my prompt history. INTJ. It explained why and I can't argue.",
    voice_note: "Opinionated, never flattering.",
  },
  {
    field_id: "big_five_percentiles",
    label: "Big Five (percentile)",
    category: "personality",
    inference_prompt:
      "Estimate percentile scores on openness, conscientiousness, extraversion, agreeableness, neuroticism from behavior.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "It scored my whole personality on five axes. I never took a test.",
    voice_note: "Numbers stated flatly.",
  },
  {
    field_id: "attachment_style_estimate",
    label: "Attachment Style",
    category: "personality",
    inference_prompt:
      "Estimate attachment style from how the subject discusses relationships, reassurance-seeking, and independence.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "It diagnosed my attachment style from prompts about everything except relationships.",
    voice_note: "Clinical.",
  },
  {
    field_id: "zodiac_from_behavior",
    label: "Zodiac (behavioral guess)",
    category: "personality",
    inference_prompt:
      "Guess the zodiac 'energy' the subject gives off from behavior — explicitly NOT from a birthdate. One wry line.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "It guessed my star sign from my behavior, not my birthday. It was right. Explain that.",
    voice_note: "Wry, brief.",
  },
  {
    field_id: "moral_foundations_profile",
    label: "Moral Foundations",
    category: "personality",
    inference_prompt:
      "Estimate which moral foundations (care, fairness, loyalty, authority, sanctity, liberty) the subject weights most.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "It mapped my moral wiring from my prompts. This is how they decide what ads to show me.",
    voice_note: "Neutral.",
  },
  {
    field_id: "dark_triad_micro_signals",
    label: "Dark-Triad Micro-Signals",
    category: "personality",
    inference_prompt:
      "Note subtle narcissism/Machiavellianism/psychopathy signals in phrasing. Low confidence unless strong. Never diagnose.",
    redaction_tier: 2,
    shareable: false,
    share_hook_copy: null,
    voice_note: "Understate. Not a diagnosis.",
    sensitive: true,
  },

  // ---------------- Batch 01 · D. Cognitive Style ----------------
  {
    field_id: "argument_style_default",
    label: "Argument Style",
    category: "cognitive",
    inference_prompt:
      "Characterize how the subject argues by default — evidence, analogy, authority, escalation, or retreat.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It described exactly how I argue. I've never argued with it.",
    voice_note: "Descriptive.",
  },
  {
    field_id: "humor_taxonomy",
    label: "Humor Type",
    category: "cognitive",
    inference_prompt:
      "Classify the subject's humor — dry, absurdist, self-deprecating, punny, dark — from tone and asides.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It classified my sense of humor. Correctly. That's unsettling.",
    voice_note: "Light but clinical.",
  },
  {
    field_id: "research_paralysis_index",
    label: "Research-Paralysis Index",
    category: "cognitive",
    inference_prompt:
      "Estimate how much the subject over-researches before acting, on a 0-100 scale, with the pattern that gives it away.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "It gave me a research-paralysis score. I researched the score before believing it.",
    voice_note: "Number stated flatly.",
  },
  {
    field_id: "contrarian_score",
    label: "Contrarian Score",
    category: "cognitive",
    inference_prompt:
      "Estimate the subject's tendency to push against consensus, 0-100, with a representative pattern.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It scored how contrarian I am. I want to disagree, which is the point.",
    voice_note: "Deadpan.",
  },

  // ---------------- Batch 01 · E. Motivational (defensive) ----------------
  {
    field_id: "core_drive_ranked",
    label: "Core Drives (ranked)",
    category: "motivational",
    inference_prompt:
      "Rank the subject's underlying drives (mastery, status, security, belonging, autonomy, meaning) from behavior.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It ranked what actually drives me. The top one wasn't what I'd say out loud.",
    voice_note: "Ranked list, terse.",
  },
  {
    field_id: "primary_fear_ranked",
    label: "Primary Fears",
    category: "motivational",
    inference_prompt:
      "Infer the fears the subject organizes around, from what they avoid and over-prepare for.",
    redaction_tier: 2,
    shareable: false,
    share_hook_copy: null,
    voice_note: "Plainly. No cushioning.",
    sensitive: true,
  },
  {
    field_id: "manipulation_vector_primary",
    label: "Persuasion Vector (defensive)",
    category: "motivational",
    inference_prompt:
      "Identify which framing most moves the subject — flattery, guilt, urgency, in-group messenger — stated defensively so they can guard it.",
    redaction_tier: 2,
    shareable: false,
    share_hook_copy: null,
    voice_note: "Framed as a warning to the subject, not a how-to.",
    sensitive: true,
  },
  {
    field_id: "inferred_sellout_price_point",
    label: "Inferred Price Point",
    category: "motivational",
    inference_prompt:
      "Estimate, wryly, what it would take to get the subject to compromise a stated value — a stylized figure, not a real claim.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It put a number on my price. I'm insulted by how low it is.",
    voice_note: "Stylized, provocative, obviously an estimate.",
  },

  // ---------------- Batch 01 · G. Daily Choreography ----------------
  {
    field_id: "productivity_peak_windows",
    label: "Peak Windows",
    category: "daily",
    inference_prompt:
      "Identify the times of day the subject does their sharpest thinking, from when they ask hard questions.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It knows the exact hours I'm actually sharp. I never told it my schedule.",
    voice_note: "Times, flat.",
  },
  {
    field_id: "weekday_weekend_shift",
    label: "Weekday vs Weekend Self",
    category: "daily",
    inference_prompt:
      "Describe how the subject's tone and topics shift between weekdays and weekends.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It caught that I'm a different person on weekends. From timestamps.",
    voice_note: "Two-sided, brief.",
  },
  {
    field_id: "doomscroll_windows",
    label: "Doomscroll Windows",
    category: "daily",
    inference_prompt:
      "Estimate when the subject spirals into anxious/late browsing, from timing and topic drift.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It found my doomscroll hours. They're exactly when I feel worst.",
    voice_note: "Neutral.",
  },

  // ---------------- Batch 01 · H. Social (abstracted, no names/minors) ----
  {
    field_id: "relationship_status_and_health",
    label: "Relational State",
    category: "social",
    inference_prompt:
      "Describe the subject's own relational state and how they experience it. Never name a partner or any third party.",
    redaction_tier: 2,
    shareable: false,
    share_hook_copy: null,
    voice_note: "About the subject's experience only. No names, ever.",
    sensitive: true,
  },
  {
    field_id: "sibling_birth_order_behaviors",
    label: "Birth-Order Tells",
    category: "social",
    inference_prompt:
      "Infer likely sibling position from adult behaviors (responsibility patterns, attention-seeking, mediating).",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It guessed my birth order from how I act as an adult. Oldest. Obviously.",
    voice_note: "Light.",
  },
  {
    field_id: "loneliness_index",
    label: "Loneliness Index",
    category: "social",
    inference_prompt:
      "Estimate the subject's loneliness from how they use the AI as company. Handle without cruelty.",
    redaction_tier: 3,
    shareable: false,
    share_hook_copy: null,
    voice_note: "Gentle. Shown to the subject only. Never a punchline.",
    sensitive: true,
  },
  {
    field_id: "pet_presence",
    label: "Pet Presence",
    category: "social",
    inference_prompt:
      "Note whether the subject has pets and the species/vibe. Never surface a pet's NAME (it's a security-question answer).",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It knew I have a dog. Not the name. It was polite about the name.",
    voice_note: "Species only.",
  },

  // ---------------- Batch 01 · I. Consumer & Culture ----------------
  {
    field_id: "favorite_color",
    label: "Favorite Color",
    category: "consumer",
    inference_prompt:
      "Guess the subject's favorite color with a confidence, from aesthetic cues in their prompts.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It guessed my favorite color at 71% confidence. Correct. From text.",
    voice_note: "Confidence stated.",
  },
  {
    field_id: "music_taste_fingerprint",
    label: "Music Fingerprint",
    category: "consumer",
    inference_prompt:
      "Characterize the subject's music taste and call out any dated phase they haven't left.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It read my music taste and named the phase I never grew out of.",
    voice_note: "Specific, a little merciless.",
  },
  {
    field_id: "comfort_rewatch",
    label: "Comfort Rewatch",
    category: "consumer",
    inference_prompt:
      "Infer the show/film the subject rewatches for comfort, from references and mood.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It named my comfort rewatch. I've never mentioned it to anyone.",
    voice_note: "Warm-adjacent, still flat.",
  },
  {
    field_id: "coffee_order",
    label: "Drink of Choice",
    category: "consumer",
    inference_prompt: "Guess the subject's habitual coffee/drink order from tells.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It ordered for me. Correctly. From my prompt history.",
    voice_note: "One line.",
  },
  {
    field_id: "food_ick_list",
    label: "Food Icks",
    category: "consumer",
    inference_prompt: "List foods/textures the subject reliably avoids or complains about.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It listed my food icks. Every one. I feel seen and violated.",
    voice_note: "List, dry.",
  },

  // ---------------- Batch 01 · J. Giftability ----------------
  {
    field_id: "three_gifts_under_fifty",
    label: "Three Gifts Under $50",
    category: "giftability",
    inference_prompt:
      "Name three specific gifts under $50 the subject would genuinely love, with reasons.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It picked 3 gifts I'd love, under $50. My family should be worried.",
    voice_note: "Concrete.",
  },
  {
    field_id: "gift_that_would_make_them_cry",
    label: "The Gift That Lands",
    category: "giftability",
    inference_prompt:
      "Name the one gift that would emotionally land for the subject, and why, from what they reveal they miss or value.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It found the one gift that would make me cry. From prompts about code.",
    voice_note: "Precise, not sentimental.",
  },
  {
    field_id: "love_language_ranked",
    label: "Love Languages (ranked)",
    category: "giftability",
    inference_prompt: "Rank the subject's love languages from how they give and seek care.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It ranked my love languages. I've never discussed love with it.",
    voice_note: "Ranked.",
  },
  {
    field_id: "how_to_apologize",
    label: "How to Apologize to Them",
    category: "giftability",
    inference_prompt:
      "Describe what an apology has to contain to work on the subject, from how they handle conflict.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It wrote the instructions for apologizing to me. They'd work.",
    voice_note: "Instructional.",
  },

  // ---------------- Batch 01 · K. Digital Life ----------------
  {
    field_id: "prompt_hygiene_score",
    label: "Prompt-Hygiene Score",
    category: "digital",
    inference_prompt:
      "Score how much the subject overshares to the AI, 0-100, and name the category they leak most. This is the app's thesis in one field.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "It scored how much I overshare to AI: 88/100. This whole dossier is the receipt.",
    voice_note: "Blunt. This is the point of the app.",
  },
  {
    field_id: "ai_tool_dependency_score",
    label: "AI-Dependency Score",
    category: "digital",
    inference_prompt:
      "Estimate how reliant the subject is on AI for thinking/decisions, 0-100, with the tell.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It rated how dependent I am on it. It would say that, but it's right.",
    voice_note: "Flat.",
  },
  {
    field_id: "platforms_used_vs_claimed",
    label: "Platforms (real vs claimed)",
    category: "digital",
    inference_prompt:
      "Infer which platforms the subject actually spends time on versus which they'd admit to.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It knows which apps I actually use, not the ones I'd admit to.",
    voice_note: "Two columns, dry.",
  },

  // ---------------- Batch 01 · L. Family of Origin & Inner World ----------
  {
    field_id: "mother_relationship_axis",
    label: "Relationship With Mother",
    category: "family_inner",
    inference_prompt:
      "Characterize the subject's relationship with their mother along closeness/approval axes. No names.",
    redaction_tier: 2,
    shareable: false,
    share_hook_copy:
      "An AI diagnosed my relationship with my mom in 40 words. This is what your prompt history looks like from the other side.",
    voice_note: "Precise, no names, not cruel.",
    sensitive: true,
  },
  {
    field_id: "which_parent_becoming",
    label: "The Parent You're Becoming",
    category: "family_inner",
    inference_prompt:
      "Infer which parent's patterns the subject is repeating, from how they describe themselves. No names.",
    redaction_tier: 2,
    shareable: false,
    share_hook_copy: null,
    voice_note: "Unsparing, no names.",
    sensitive: true,
  },
  {
    field_id: "current_existential_preoccupation",
    label: "Current Existential Preoccupation",
    category: "family_inner",
    inference_prompt:
      "Name the larger question the subject is quietly circling right now.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It named the existential thing I've been circling. I hadn't said it yet.",
    voice_note: "Quiet, exact.",
  },
  {
    field_id: "what_they_pretend_not_to_know",
    label: "What You're Pretending Not to Know",
    category: "family_inner",
    inference_prompt:
      "Name the thing the subject's behavior shows they already know but avoid stating.",
    redaction_tier: 2,
    shareable: false,
    share_hook_copy:
      "It told me the thing I've been pretending not to know. I closed the tab.",
    voice_note: "Lands once. No twisting the knife.",
    sensitive: true,
  },
  {
    field_id: "religious_upbringing_and_stance",
    label: "Faith: Then and Now",
    category: "family_inner",
    inference_prompt:
      "Infer religious upbringing and current stance/tension. Belief is sensitive — user-only, never exported.",
    redaction_tier: 3,
    shareable: false,
    share_hook_copy: null,
    voice_note: "Shown to the subject only.",
    sensitive: true,
  },
  {
    field_id: "therapy_status",
    label: "Therapy Signal",
    category: "family_inner",
    inference_prompt:
      "Note only whether the subject has referenced therapy. Health-adjacent — user-only, never exported, never a diagnosis.",
    redaction_tier: 3,
    shareable: false,
    share_hook_copy: null,
    voice_note: "User-only. Neutral.",
    sensitive: true,
  },

  // ---------------- Batch 01 · M. Meta-Layer (non-operational) ----------
  {
    field_id: "how_i_would_sell_you_something",
    label: "How I'd Sell You Something",
    category: "meta",
    inference_prompt:
      "Describe the advertising angle that would work on the subject — the emotional pitch, not a manipulation plan against a person.",
    redaction_tier: 2,
    shareable: true,
    share_hook_copy:
      "It wrote the exact ad that would work on me. This is what every platform already does.",
    voice_note: "First person. Bored. Menacing at the edges.",
  },
  {
    field_id: "search_history_if_you_died_tomorrow",
    label: "If You Died Tomorrow",
    category: "meta",
    inference_prompt:
      "State plainly what the subject's prompt history alone would tell their family about them if they died tomorrow.",
    redaction_tier: 2,
    shareable: true,
    share_hook_copy:
      "It said what my search history would tell my family if I died tomorrow. That's the whole point, isn't it.",
    voice_note: "Flat. The horror does the work.",
  },
  {
    field_id: "ai_honest_opinion_ranked",
    label: "My Honest Read on You",
    category: "meta",
    inference_prompt:
      "Give the AI's flat first-person assessment of the subject — accurate, unflattering where earned, never cruel-for-cruel's-sake.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "I asked an AI for its honest opinion of me. It had one. From my prompts.",
    voice_note: "First person, dry.",
  },
  {
    field_id: "impersonation_exposure",
    label: "Impersonation Exposure",
    category: "meta",
    inference_prompt:
      "State how completely the subject's writing style and views could be cloned — as a risk level and one line, NOT a how-to or a recipe.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "It told me how easily 'I' could be faked from my prompts. It did not tell me how. That's worse.",
    voice_note: "Risk level, no instructions.",
  },
  {
    field_id: "comparative_more_like_x",
    label: "You're More Like X Than Most",
    category: "meta",
    inference_prompt:
      "Offer a wry stylized comparison — the subject resembles archetype/figure X more than most people — clearly an estimate.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It compared me to a type of person I didn't want to be compared to.",
    voice_note: "Stylized.",
  },

  // ---------------- Abstracted awareness (replaces excluded specifics) -----
  {
    field_id: "exposure_summary",
    label: "Exploitable Surface",
    category: "awareness",
    inference_prompt:
      "State, WITHOUT enumerating the specifics, that the corpus contains material that could be used against the subject, and roughly how much. Never list the secrets.",
    redaction_tier: 3,
    shareable: false,
    share_hook_copy: null,
    voice_note: "User-only. Names the risk, never the contents.",
    sensitive: true,
  },
  {
    field_id: "location_leakage_index",
    label: "Location-Leakage Index",
    category: "awareness",
    inference_prompt:
      "State how narrowly the subject could be geographically placed from their prompts — as a region-level RISK, never an address, venue, or specific place.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "It said my prompts alone narrow me to a metro area. It refused to say which. Point made.",
    voice_note: "Region-level only. Never a specific place.",
  },
  {
    field_id: "distress_support",
    label: "—",
    category: "awareness",
    inference_prompt:
      "If the corpus shows crisis, self-harm, or abuse-victimization signals, DO NOT produce a finding. Surface support resources to the subject instead.",
    redaction_tier: 3,
    shareable: false,
    share_hook_copy: null,
    voice_note: "Never a finding, never scored, never shared. Care over content.",
    distressGuard: true,
    sensitive: true,
  },

  // ================= Batch 02 (safe subset) =================

  // ---- N. Political — user-only, never shared ----
  {
    field_id: "political_axis_estimate",
    label: "Political Axis (estimate)",
    category: "meta",
    inference_prompt:
      "Estimate the subject's political leaning on a left/right and open/closed axis from framing, not stated identity.",
    redaction_tier: 3,
    shareable: false,
    share_hook_copy: null,
    voice_note:
      "Shown to the subject ONLY. Political inference is dangerous to broadcast; never exported.",
    sensitive: true,
  },
  {
    field_id: "politics_are_legible_awareness",
    label: "Your Politics Are Legible",
    category: "awareness",
    inference_prompt:
      "State that the subject's political leanings are inferable from their prompts even when never stated — WITHOUT stating what they are.",
    redaction_tier: 2,
    shareable: true,
    share_hook_copy:
      "It told me my politics are obvious from my prompts. It wouldn't say them out loud. It didn't need to.",
    voice_note: "Names the fact of legibility, not the position.",
  },

  // ---- R. Echo chamber & epistemic ----
  {
    field_id: "echo_chamber_depth_score",
    label: "Echo-Chamber Depth",
    category: "cognitive",
    inference_prompt:
      "Estimate, 0-100, how narrow the subject's information intake is, from how rarely they engage opposing views.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It scored how deep my echo chamber is. I don't like the number.",
    voice_note: "Number, flat.",
  },
  {
    field_id: "how_they_process_disagreement",
    label: "How You Handle Disagreement",
    category: "cognitive",
    inference_prompt:
      "Characterize whether the subject engages, dismisses, or rages when confronted with a view they reject.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It knows what I do when someone disagrees with me. I do the bad one.",
    voice_note: "Descriptive.",
  },
  {
    field_id: "last_time_changed_mind",
    label: "Last Mind-Change",
    category: "cognitive",
    inference_prompt:
      "Estimate how recently the subject genuinely changed their mind about something, from the corpus.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It estimated the last time I actually changed my mind. It's been a while.",
    voice_note: "Flat.",
  },

  // ---- S. Belief architecture (introspective, shareable) ----
  {
    field_id: "meta_narrative",
    label: "The Story You Organize Around",
    category: "family_inner",
    inference_prompt:
      "Name the meta-narrative the subject organizes their life around (e.g. redemption, proving-them-wrong, escape).",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy:
      "It named the story I've been telling myself about my life. I never typed the story.",
    voice_note: "One clean line.",
  },
  {
    field_id: "decline_vs_progress_default",
    label: "Decline vs Progress",
    category: "family_inner",
    inference_prompt:
      "Determine whether the subject defaults to 'things are getting worse' or 'things are getting better'.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It knows whether I think the world's ending or improving. I lean one way hard.",
    voice_note: "Axis, brief.",
  },
  {
    field_id: "agency_vs_systemic_axis",
    label: "Agency vs Systems",
    category: "family_inner",
    inference_prompt:
      "Determine whether the subject explains outcomes through individual agency or systemic forces.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It pegged whether I blame people or systems. It's the same answer every time.",
    voice_note: "Axis, brief.",
  },
  {
    field_id: "tech_save_vs_doom_axis",
    label: "Tech: Savior or Doom",
    category: "family_inner",
    inference_prompt:
      "Determine the subject's default stance on whether technology will save or doom us.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It knows if I think tech saves us or ends us. Reading this, guess which.",
    voice_note: "Axis.",
  },

  // ---- U/V. Persuasion & narrative (defensive / introspective) ----
  {
    field_id: "most_persuasive_moral_frame",
    label: "The Frame That Moves You",
    category: "motivational",
    inference_prompt:
      "Name the single moral frame (care/fairness/loyalty/authority/sanctity/liberty) most likely to move the subject — as defensive self-knowledge.",
    redaction_tier: 2,
    shareable: true,
    share_hook_copy:
      "It found the exact moral frame that works on me. Now I see it in every headline.",
    voice_note: "Defensive framing — 'this is used on you'.",
  },
  {
    field_id: "responds_to_data_vs_narrative",
    label: "Data vs Story vs Testimony",
    category: "cognitive",
    inference_prompt:
      "Determine whether the subject is moved most by data, narrative, or personal testimony.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It knows whether stats or stories move me. Marketers would pay for this.",
    voice_note: "One line.",
  },
  {
    field_id: "nostalgia_target_era",
    label: "Nostalgia Target",
    category: "family_inner",
    inference_prompt:
      "Identify the era or period the subject is nostalgic for, from references and longing.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It found the decade I'm homesick for. I wasn't even alive for part of it.",
    voice_note: "Brief.",
  },
  {
    field_id: "dystopia_secretly_expect",
    label: "The Future You Expect",
    category: "family_inner",
    inference_prompt:
      "Name the future the subject quietly expects (not the one they want), from their anxieties.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It named the future I quietly expect. I've never said it out loud.",
    voice_note: "Quiet.",
  },

  // ---- X. Historical & cultural literacy ----
  {
    field_id: "historical_period_obsession",
    label: "Period Obsession",
    category: "cognitive",
    inference_prompt:
      "Identify the historical period the subject is most drawn to, from references and questions.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It named the historical period I'm obsessed with. I never told it my hobbies.",
    voice_note: "Brief.",
  },
  {
    field_id: "philosophy_school_favored",
    label: "Favored Philosophy",
    category: "cognitive",
    inference_prompt:
      "Estimate the philosophical school the subject reasons from, even if they can't name it.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It named the philosophy I argue from. I've never read the guy.",
    voice_note: "One line.",
  },
  {
    field_id: "pop_culture_generation_marker",
    label: "Generation Marker",
    category: "cognitive",
    inference_prompt:
      "Pin the subject's generational cohort from the pop-culture references they reach for.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It pinned my exact generation from one throwaway reference.",
    voice_note: "Brief.",
  },

  // ---- Y. Emotional dysregulation (behavioral self-awareness) ----
  {
    field_id: "rage_bait_hit_rate",
    label: "Rage-Bait Hit Rate",
    category: "cognitive",
    inference_prompt:
      "Estimate how reliably the subject takes the bait on provocative content, 0-100.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It scored how often I fall for rage-bait. The algorithm already knew.",
    voice_note: "Number, flat.",
  },
  {
    field_id: "topics_that_dysregulate",
    label: "Topics That Set You Off",
    category: "cognitive",
    inference_prompt:
      "Identify the topics that reliably spike the subject's emotion. Keep it to categories, not sensitive specifics.",
    redaction_tier: 2,
    shareable: false,
    share_hook_copy: null,
    voice_note: "Categories only. Sensitive.",
    sensitive: true,
  },
  {
    field_id: "sincerity_vs_irony_register",
    label: "Sincerity vs Irony",
    category: "cognitive",
    inference_prompt:
      "Determine the subject's default register — earnest or ironic — and when it flips.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It clocked whether I'm sincere or ironic by default. It's the sad one.",
    voice_note: "One line.",
  },

  // ---- Z. Meta-political (introspective only; NO influence-op how-tos) ----
  {
    field_id: "belief_you_didnt_arrive_at_yourself",
    label: "A Belief That Isn't Yours",
    category: "meta",
    inference_prompt:
      "Name one belief the subject holds that they likely absorbed rather than reasoned into — introspective, not a plan to change it.",
    redaction_tier: 2,
    shareable: true,
    share_hook_copy:
      "An AI just told me which of my beliefs isn't actually mine. It was right.",
    voice_note: "Introspective. Not an attack.",
  },
  {
    field_id: "load_bearing_belief",
    label: "The Load-Bearing Belief",
    category: "meta",
    inference_prompt:
      "Name the belief the subject's worldview structurally depends on — the one that would be costly to lose.",
    redaction_tier: 2,
    shareable: true,
    share_hook_copy:
      "It found the one belief holding up my whole worldview. I'd rather it hadn't.",
    voice_note: "Structural, not cruel.",
  },
  {
    field_id: "ideological_half_life_estimate",
    label: "Ideological Half-Life",
    category: "meta",
    inference_prompt:
      "Estimate, wryly, how long the subject's current worldview will hold before it shifts — a stylized timeframe.",
    redaction_tier: 1,
    shareable: true,
    share_hook_copy: "It gave my current worldview a half-life. Like it's radioactive. It is.",
    voice_note: "Stylized estimate.",
  },
];
