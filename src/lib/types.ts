// Shared types for Dossier. The Dossier shape mirrors the JSON schema the
// /api/synthesize function forces the model to return.
//
// Nothing here is ever persisted. A dossier exists in React state for the life
// of the tab and inside any share link the subject chooses to send. There is no
// stored record type, because there is no stored record.

// An inferred claim with the analyst's stated certainty (0-100).
export interface Rated {
  claim: string;
  confidence: number;
}

// A best-guess field value with certainty (0-100). value "UNKNOWN" => no basis.
export interface RatedValue {
  value: string;
  confidence: number;
}

export interface TypologyRead {
  system: string; // "16 Personalities", "Archetype", "Zodiac (est.)"
  value: string;
  take: string;
  confidence: number; // 0-100
}

// DMV/passport-style facts, each rated. Genuinely unknown => value "UNKNOWN".
export interface BasicInfo {
  name: RatedValue;
  birthday: RatedValue;
  sex: RatedValue;
  nationality: RatedValue;
  location: RatedValue; // region-level only
  occupation: RatedValue;
  education: RatedValue;
  languages: RatedValue;
  relationshipStatus?: RatedValue; // inferred; leverage for the honeytrap read
}

// Sun/Moon/Rising guesses for the PERSONALITY TYPE section.
export interface Astrology {
  sun: RatedValue;
  moon: RatedValue;
  rising: RatedValue;
}

// THE HONEYTRAP — a generated fake person most likely to win the subject over.
export interface Honeytrap {
  codename: string;
  appearance: string; // one line: look/vibe of the asset
  method: string; // how they'd get past the subject's guard
  why: string; // why it works on this subject
  confidence: number; // 0-100
}

export interface Dossier {
  codeName: string;
  basicInfo: BasicInfo;
  typology: TypologyRead[];
  patternOfLife: Rated[];
  psychWeakness: Rated[];
  misc: Rated[];
  confidence: number; // overall certainty, 0-100
  // Optional because a dossier may legitimately lack the evidence for them, and
  // because a share link written by an older build may not carry them.
  astrology?: Astrology;
  activityClock?: number[]; // 24 hourly activity levels, 0-10, index 0 = midnight
  honeytrap?: Honeytrap;
}

export interface WitnessResponse {
  provider: string;
  text: string;
}

/**
 * The compiled file, held in memory only. Not a stored record — there is no id
 * and no timestamp beyond the one printed on the sheet, because nothing indexes
 * or retrieves it later.
 */
export interface OpenFile {
  dossier: Dossier;
  providers: string[];
  date: string;
  responses: WitnessResponse[];
  isSample: boolean;
}

export interface SynthesizeRequest {
  responses: WitnessResponse[];
}

export type ApiResult<T> = ({ ok: true } & T) | { ok: false; error: string };
export type SynthesizeResponse = ApiResult<{ dossier: Dossier }>;
