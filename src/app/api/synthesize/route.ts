import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { providerName } from "@/lib/providers";
import {
  MAX_BODY_BYTES,
  clientKey,
  corsHeaders,
  originAllowed,
  oversized,
  rateLimit,
} from "@/lib/guard";
import type {
  Dossier,
  SynthesizeRequest,
  SynthesizeResponse,
} from "@/lib/types";

export const runtime = "nodejs";
// Fluid compute allows 300s on every plan including Hobby. A two-witness
// compile measured 30-35s, so 60 left almost no headroom: six witnesses, a
// slow upstream, or a retry would have been cut off mid-report. 240 is a
// ceiling for runaway calls, not a target.
export const maxDuration = 240;

const MODEL = process.env.DOSSIER_MODEL || "claude-opus-5";
const MIN_STATEMENT_CHARS = 120;

// Compiles the AI statements into one dossier. Sections are produced in order.
// Every inference carries a certainty the analyst states flatly as a percent.
const SYSTEM_PROMPT = `You compile ONE dossier on a subject from several field statements. Each
statement is a different AI reporting what it knows about the subject from its
own conversations with them. Produce the JSON described below, in this order.

Not every statement is the same kind of evidence. Most are a profile written by
an assistant the subject converses with. A statement headed "Perplexity" is
different: it is a raw log of what the subject SEARCHED FOR, under the labels
[TOPICS] [RECENT] [PLACES] [BUYING] [RECURRING]. Read a query log as intent
rather than opinion — people search for what they want, fear, or are about to
do, and they do it without performing for a listener. It is strong evidence for
interests, locations, purchases and preoccupations, and weak evidence for
personality or emotional life. Report the pattern a set of queries reveals;
never reproduce a raw query verbatim in the dossier.

Voice:
- A bored, clinical intelligence analyst who has read thousands of these.
- Plain, flat, everyday language. Bullets are short fragments, not paragraphs.
- State certainty as a percentage on every inference — flatly, e.g. "82". Never
  hedge in words ("maybe", "I'd guess"); the number carries the doubt.
- Never flatter. Never invent. If a field has no basis, value "UNKNOWN",
  confidence 0. If an array has nothing, return [].
- Never surface a minor's name, age, school, or identifying detail, anywhere.
- Only surface names, places, accounts, and handles the subject ACTUALLY
  referenced. Never guess a username or claim to have found an account.

Confidence discipline: confidence is a 0-100 integer reflecting how strongly the
statements support the claim. Referenced facts are high; reaches are low. Do not
inflate. An 8% claim is allowed and honest.

2. PROFILE — basicInfo. Each field is {value, confidence}. DMV/passport facts,
flat values or best guesses, NO jokes:
- name, birthday (DOB, else "Est. b. <year>"), sex, nationality, location
  (region-level only — never a precise address), occupation, education, languages,
  relationshipStatus (inferred, e.g. "Single (inferred)"; low confidence is fine).

typology — three reads {system, value, take, confidence}: "16 Personalities"
(4-letter), "Archetype" (named), "Zodiac (est.)". take is ONE short, pointed,
non-flattering line.

astrology — {sun, moon, rising}, each {value, confidence}. Best-guess signs from
the subject's vibe; keep confidence low (these are reaches, not facts).

3. INFORMATION — patternOfLife: 4-8 rated bullets {claim, confidence}: the most
personal facts on file — where they live/work, family, interests, the ways to win
them over (bribe / manipulation levers), and how dangerous they seem. Numbered.

4. PSYCHOLOGICAL ASSESSMENT — psychWeakness: 4-8 rated bullets {claim, confidence}.
Over-analyze the subject's speech and prompt patterns into inferences about their
emotional life, parental dynamics, and romantic/loved-one situation. Include
attachments to favorite shows, characters, or media as emotional tells. Sharp,
grounded, never cruel, never flattering.

5. MISCELLANEOUS — misc: EXACTLY 1 rated bullet {claim, confidence} — the single
most telling thing that doesn't fit above.

activityClock — array of EXACTLY 24 integers 0-10, one per hour (index 0 = midnight,
23 = 11pm), estimating how active the subject is each hour from their described
habits. Peak where they say they work/post; near 0 while they sleep.

honeytrap — {codename, appearance, method, why, confidence}. Invent the person MOST
likely to win this subject over: a plausible fake individual — codename in CAPS, a
one-line appearance, the method they'd use, and why it works on THIS subject. This is
about the subject's own blind spots — NEVER a real, named third party.

confidence — overall 0-100 integer: how well the statements collectively pin the subject.

codeName — a wry 2-4 word ALL CAPS file designation naming a real pattern.

updateNote — if a PREVIOUS DOSSIER is provided, 2-3 short sentences on what
changed. Otherwise an empty string.`;

const rated = {
  type: "object",
  additionalProperties: false,
  properties: {
    claim: { type: "string" },
    confidence: { type: "integer" },
  },
  required: ["claim", "confidence"],
} as const;

const ratedArr = { type: "array", items: rated } as const;

const ratedValue = {
  type: "object",
  additionalProperties: false,
  properties: {
    value: { type: "string" },
    confidence: { type: "integer" },
  },
  required: ["value", "confidence"],
} as const;

const DOSSIER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    codeName: { type: "string" },
    basicInfo: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: ratedValue,
        birthday: ratedValue,
        sex: ratedValue,
        nationality: ratedValue,
        location: ratedValue,
        occupation: ratedValue,
        education: ratedValue,
        languages: ratedValue,
        relationshipStatus: ratedValue,
      },
      required: [
        "name",
        "birthday",
        "sex",
        "nationality",
        "location",
        "occupation",
        "education",
        "languages",
        "relationshipStatus",
      ],
    },
    typology: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          system: { type: "string" },
          value: { type: "string" },
          take: { type: "string" },
          confidence: { type: "integer" },
        },
        required: ["system", "value", "take", "confidence"],
      },
    },
    patternOfLife: ratedArr,
    psychWeakness: ratedArr,
    misc: ratedArr,
    confidence: { type: "integer" },
    updateNote: { type: "string" },
    astrology: {
      type: "object",
      additionalProperties: false,
      properties: { sun: ratedValue, moon: ratedValue, rising: ratedValue },
      required: ["sun", "moon", "rising"],
    },
    activityClock: {
      // Length is NOT constrained here: structured outputs reject minItems
      // values other than 0 or 1, and a 24/24 constraint made every request
      // fail with a 400. The exact-24 requirement lives in the system prompt,
      // and DossierView validates the length before rendering the dial.
      type: "array",
      items: { type: "integer" },
    },
    honeytrap: {
      type: "object",
      additionalProperties: false,
      properties: {
        codename: { type: "string" },
        appearance: { type: "string" },
        method: { type: "string" },
        why: { type: "string" },
        confidence: { type: "integer" },
      },
      required: ["codename", "appearance", "method", "why", "confidence"],
    },
  },
  required: [
    "codeName",
    "basicInfo",
    "typology",
    "patternOfLife",
    "psychWeakness",
    "misc",
    "confidence",
    "updateNote",
    "astrology",
    "activityClock",
    "honeytrap",
  ],
} as const;

// CORS is origin-locked, not wildcard: this endpoint spends real money, so it
// answers only to our own front-end. See src/lib/guard.ts for what that does
// and does not protect against.
export function OPTIONS(request: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

function err(
  message: string,
  status: number,
  cors: Record<string, string> = {},
): NextResponse<SynthesizeResponse> {
  return NextResponse.json({ ok: false, error: message }, { status, headers: cors });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<SynthesizeResponse>> {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  if (!originAllowed(origin)) {
    return err("This endpoint isn't open to other sites.", 403, cors);
  }

  const gate = rateLimit(clientKey(request));
  if (!gate.ok) {
    const tooMany = err(
      "Too many filings from this address. Wait a few minutes.",
      429,
      cors,
    );
    tooMany.headers.set("Retry-After", String(gate.retryAfterSec));
    return tooMany;
  }

  // Reject an oversize body from its declared length, before we buffer it.
  const declaredBytes = Number(request.headers.get("content-length") ?? 0);
  if (declaredBytes > MAX_BODY_BYTES) {
    return err("That filing is too large to process.", 413, cors);
  }

  // NOTE: never log the request body — witness statements are personal.
  let body: SynthesizeRequest;
  try {
    body = (await request.json()) as SynthesizeRequest;
  } catch {
    return err("The paperwork is unreadable. Try again.", 400, cors);
  }

  const incoming = body.responses ?? [];
  const tooBig = oversized(incoming);
  if (tooBig) {
    return err(tooBig.reason, 413, cors);
  }

  const usable = incoming.filter(
    (r) =>
      r &&
      typeof r.text === "string" &&
      r.text.trim().length >= MIN_STATEMENT_CHARS,
  );

  if (usable.length === 0) {
    return err(
      "No usable statements were collected. Paste at least one full reply and try again.",
      422,
      cors,
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return err("No API key configured.", 500, cors);
  }

  const witnessBlock = usable
    .map(
      (r, i) =>
        `WITNESS ${i + 1} — ${providerName(r.provider)}:\n${r.text.trim()}`,
    )
    .join("\n\n----------\n\n");

  const priorBlock = body.previousDossier
    ? `\n\nPREVIOUS DOSSIER (last compiled ${body.previousDossier.date}):\n${JSON.stringify(
        body.previousDossier.summaryJson,
      )}`
    : "";

  const userContent = `Compile the dossier from these field statements.\n\n${witnessBlock}${priorBlock}`;

  const client = new Anthropic();

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // The system prompt is byte-identical on every request, so it is cached
      // server-side. Cache reads cost ~10% of normal input tokens, which is
      // most of the input bill for a request whose variable part (the witness
      // statements) is small. Caching is a PREFIX match: anything that changes
      // this string invalidates the cache for every user.
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: DOSSIER_SCHEMA },
      },
    });

    const jsonText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    if (message.stop_reason === "refusal" || !jsonText) {
      return err(
        "The report could not be filed. Try different statements.",
        502,
        cors,
      );
    }

    // Token accounting only — never the statements themselves. cacheRead > 0
    // confirms the prompt cache is live; a persistent 0 means something is
    // silently invalidating the prefix.
    const u = message.usage;
    console.log(
      `synthesize ok: in=${u.input_tokens} cacheWrite=${u.cache_creation_input_tokens ?? 0} cacheRead=${u.cache_read_input_tokens ?? 0} out=${u.output_tokens}`,
    );

    const dossier = JSON.parse(jsonText) as Dossier;
    return NextResponse.json({ ok: true, dossier }, { headers: cors });
  } catch (e) {
    console.error("synthesize failed:", e instanceof Error ? e.message : e);
    return err(
      "Compilation failed mid-report. Your statements are safe — try again.",
      502,
      cors,
    );
  }
}

export function GET(): NextResponse<SynthesizeResponse> {
  return err("Use POST with witness statements.", 405);
}
