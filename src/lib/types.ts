// Shared types for Dossier. The Dossier shape mirrors the JSON schema the
// /api/synthesize function forces the model to return.

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
  // Dropped from the schema: the prompt forbade inventing biometrics, so these
  // were always "UNKNOWN"/0 — dead weight that pushed the grammar over its
  // size limit. Optional so dossiers compiled before the cut still parse.
  height?: RatedValue;
  eyeColor?: RatedValue;
  hairColor?: RatedValue;
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

export interface HazardPerson {
  relation: string;
  detail: string; // never a minor's identifying info
}

// Concrete NOUNS the subject actually referenced — near-certain, so unrated.
// Never fabricated, never minors, never in the shareable export.
export interface PrivacyHazards {
  people: HazardPerson[];
  pets: string[];
  places: string[];
  accounts: string[];
  other: string[];
}

export interface Dossier {
  codeName: string;
  basicInfo: BasicInfo; // 2. PROFILE
  typology: TypologyRead[];
  patternOfLife: Rated[]; // 3. INFORMATION
  psychWeakness: Rated[]; // 4. PSYCHOLOGICAL ASSESSMENT
  // Dropped from the synthesis schema (never rendered, so it only burned tokens).
  // Optional so dossiers compiled before the cut still parse.
  privacyHazards?: PrivacyHazards;
  misc: Rated[]; // 5. MISCELLANEOUS — now a single bullet
  confidence: number; // overall certainty, 0-100
  updateNote: string;
  // --- redesign additions (optional so older payloads still parse) ---
  astrology?: Astrology; // PERSONALITY TYPE: sun/moon/rising
  activityClock?: number[]; // 24 hourly activity levels, 0-10, index 0 = midnight
  honeytrap?: Honeytrap; // THE HONEYTRAP
}

export interface WitnessResponse {
  provider: string;
  text: string;
  collectedAt: string;
}

export interface CaseFile {
  id: string;
  date: string;
  codeName: string;
  providers: string[];
  dossier: Dossier;
  responses: WitnessResponse[];
}

export interface SynthesizeRequest {
  responses: Pick<WitnessResponse, "provider" | "text">[];
  previousDossier?: { date: string; summaryJson: Dossier } | null;
}

export type ApiResult<T> = ({ ok: true } & T) | { ok: false; error: string };
export type SynthesizeResponse = ApiResult<{ dossier: Dossier }>;
