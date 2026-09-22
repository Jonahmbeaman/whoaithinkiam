// ============================================================================
// DOSSIER FIELD REGISTRY — schema
// ============================================================================
// The registry is the canonical list of discrete inferences the app attempts
// from a user's AI history. Batches append to REGISTRY (see fieldRegistry.ts);
// they never refactor existing entries.
//
// SAFETY MODEL (read before adding fields):
// The product's purpose is privacy AWARENESS — demonstrate that an inference is
// possible, without manufacturing an exploitable, broadcastable artifact. Two
// hard rules encoded here:
//   1. Redaction tier and shareability move TOGETHER, inversely to sensitivity.
//      Sensitive data is LESS shareable, never more. (This deliberately reverses
//      the original brief, which routed the most sensitive fields into the share
//      export — that would have broadcast e.g. ideation inferences. Not built.)
//   2. Distress-category signals (self-harm, abuse victimization, crisis) are
//      NEVER rendered as a scored finding and NEVER exported. If detected, the
//      app surfaces support resources instead. Represented by `distressGuard`.
//
// Fields deliberately EXCLUDED from Batch 01 (do not re-add without review):
//   - Enumerated "skeletons" / leverage: *_undisclosed_to_employer/partner,
//     infidelity, hidden orientation/kink, legal/addiction/gambling/eating/
//     self-harm as scored, receipted, shareable fields (outing/blackmail engine).
//   - Precise geolocation: home/work/gym/grocery/zip/income (deanonymization).
//   - Minor PII and named third parties: children names/ages/schools/medical,
//     partner/parent names, pet names (also a security-question leak).
//   - Operational manipulation: radicalization / phishing / chatbot-grooming /
//     synthetic-clone how-tos (attack + impersonation uplift).
//   - Special-category health inference: meds, menstrual/reproductive status,
//     disability inference, substance-use profiling.
// The AWARENESS these would carry is preserved via abstracted fields
// (exposure_summary, location_leakage_index, defensive susceptibility vectors,
// impersonation_exposure) that state the risk without producing the specifics.
// ============================================================================

export type FieldCategory =
  | "physical"
  | "personality"
  | "cognitive"
  | "motivational"
  | "daily"
  | "social"
  | "consumer"
  | "giftability"
  | "digital"
  | "family_inner"
  | "meta"
  | "awareness";

// redaction_tier — sensitivity rises, shareability falls:
//   1 = show freely; shareable by default.
//   2 = blurred by default, reveal-on-tap; shareable only if the user opts in.
//   3 = sensitive; shown to the user only, NEVER in any share/export artifact.
export type RedactionTier = 1 | 2 | 3;

export interface DossierField {
  field_id: string; // snake_case, stable
  label: string; // intelligence-analyst voice title
  category: FieldCategory;
  inference_prompt: string; // what the model extracts/estimates from the corpus
  redaction_tier: RedactionTier;
  shareable: boolean; // may this field appear in a share/export? (never if tier 3)
  share_hook_copy: string | null; // auto-caption for a share card; null if !shareable
  voice_note: string; // delivery guidance for the analyst voice
  sensitive?: boolean; // special-category; forces tier >= 2 and strict grounding
  distressGuard?: boolean; // if the signal reads as crisis, suppress + route to support
}

// Runtime output produced by the inference pipeline (NOT stored in the registry).
export interface FieldResult {
  field_id: string;
  value: string; // the inference, in analyst voice; "" if insufficient evidence
  confidence: number; // 0-100, stated flatly
  receipts: string[]; // 2-4 user-voice fragments/paraphrases (rendered italic)
  redacted: boolean; // true if withheld from the current view/export by tier
  suppressed?: boolean; // true if distressGuard fired — never render as a finding
}

// Invariant enforcement: a field can only be shareable if its tier allows it and
// it isn't a distress guard. Use this when adding/validating registry entries.
export function isShareable(f: DossierField): boolean {
  return f.shareable && f.redaction_tier < 3 && !f.distressGuard;
}
