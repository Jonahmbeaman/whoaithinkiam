import type {
  Astrology,
  BasicInfo,
  Dossier,
  Honeytrap,
  Rated,
  RatedValue,
  TypologyRead,
} from "./types";

// ---------------------------------------------------------------------------
// One gate for every dossier that did not come straight out of this build.
//
// Two inputs are untrusted: the API response, and a share link, which is a
// payload built on someone else's device by a possibly older version of this
// app. Both used to be cast straight to `Dossier` and handed to the renderer,
// which dereferenced `basicInfo`, `codeName.length`, `typology.find` and
// `patternOfLife.slice` without guards — so one missing key blanked the page.
//
// The fix belongs here rather than as optional chaining at each render site:
// there were eight such sites and the next new one would have been forgotten.
// Coerce once, at the boundary, and let the renderer trust its own types.
//
// This function NEVER throws. A malformed dossier degrades to a sparse one.
// ---------------------------------------------------------------------------

const UNKNOWN: RatedValue = { value: "UNKNOWN", confidence: 0 };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

/** Confidence is a 0-100 integer everywhere it appears. Anything else is 0. */
function pct(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function ratedValue(v: unknown): RatedValue {
  if (!isRecord(v)) return { ...UNKNOWN };
  return { value: str(v.value, "UNKNOWN"), confidence: pct(v.confidence) };
}

function rated(v: unknown): Rated | null {
  if (!isRecord(v)) return null;
  const claim = str(v.claim).trim();
  if (!claim) return null; // a claim with no text is not a claim
  return { claim, confidence: pct(v.confidence) };
}

/**
 * Hard ceiling on any claim list. The analyst is asked for 4-8, so this is far
 * above anything legitimate — it exists because a hand-crafted share link can
 * carry an array of any length, and every entry becomes a DOM node. Without
 * it, a crafted fragment locks the recipient's tab on render, which nothing
 * throws on and no error boundary can catch.
 */
const MAX_LIST = 64;

function ratedList(v: unknown): Rated[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, MAX_LIST)
    .map(rated)
    .filter((r): r is Rated => r !== null);
}

function basicInfo(v: unknown): BasicInfo {
  const o = isRecord(v) ? v : {};
  return {
    name: ratedValue(o.name),
    birthday: ratedValue(o.birthday),
    sex: ratedValue(o.sex),
    nationality: ratedValue(o.nationality),
    location: ratedValue(o.location),
    occupation: ratedValue(o.occupation),
    education: ratedValue(o.education),
    languages: ratedValue(o.languages),
    relationshipStatus: o.relationshipStatus
      ? ratedValue(o.relationshipStatus)
      : undefined,
  };
}

function typology(v: unknown): TypologyRead[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, MAX_LIST).filter(isRecord).map((t) => ({
    system: str(t.system),
    value: str(t.value),
    take: str(t.take),
    confidence: pct(t.confidence),
  }));
}

function astrology(v: unknown): Astrology | undefined {
  if (!isRecord(v)) return undefined;
  return {
    sun: ratedValue(v.sun),
    moon: ratedValue(v.moon),
    rising: ratedValue(v.rising),
  };
}

function honeytrap(v: unknown): Honeytrap | undefined {
  if (!isRecord(v)) return undefined;
  const codename = str(v.codename).trim();
  if (!codename) return undefined;
  return {
    codename,
    appearance: str(v.appearance),
    method: str(v.method),
    why: str(v.why),
    confidence: pct(v.confidence),
  };
}

/**
 * The dial renders only for a complete 24-hour array. A partial or non-numeric
 * clock is dropped rather than padded: a half-invented rhythm drawn as a dial
 * reads as measurement, which is the one thing it must never do.
 */
function activityClock(v: unknown): number[] | undefined {
  if (!Array.isArray(v) || v.length !== 24) return undefined;
  if (!v.every((n) => typeof n === "number" && Number.isFinite(n))) {
    return undefined;
  }
  return v.map((n) => Math.max(0, Math.min(10, Math.round(n as number))));
}

/**
 * Returns a renderable dossier, or null when the input is not an object at all.
 * Everything short of that is coerced — a sparse file still tells the subject
 * something, and a blank page tells them nothing.
 */
export function normalizeDossier(input: unknown): Dossier | null {
  if (!isRecord(input)) return null;
  return {
    codeName: str(input.codeName).trim() || "UNTITLED FILE",
    basicInfo: basicInfo(input.basicInfo),
    typology: typology(input.typology),
    patternOfLife: ratedList(input.patternOfLife),
    psychWeakness: ratedList(input.psychWeakness),
    misc: ratedList(input.misc),
    confidence: pct(input.confidence),
    astrology: astrology(input.astrology),
    activityClock: activityClock(input.activityClock),
    honeytrap: honeytrap(input.honeytrap),
  };
}
