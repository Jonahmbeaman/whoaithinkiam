# DOSSIER — find out what AI thinks of you

A single-page web app styled as a 1940s–50s noir detective case file. Every AI
you talk to has quietly built a theory of who you are. Dossier interrogates them
all — one at a time — and compiles the findings into one confidential case file
on you, ready to share.

## The mechanic (why there's no login)

There is **no public OAuth scope** that exposes your ChatGPT/Claude/Gemini memory
to a third-party site. So the flow is deliberately manual and privacy-clean:

1. Pick your "witnesses" (the AIs you use).
2. For each, open it with the interrogation prompt pre-loaded (deep link) or
   copy the prompt in. Send it there, then **paste the reply back** into Dossier.
3. Hit **Compile Dossier** — one serverless call to the Claude API synthesizes
   all statements into a single case file.
4. Read it, share a hand-drawn image card, and it's saved to your **Case History**
   (localStorage only — nothing is stored server-side).

The intake step is a pluggable module (`IntakeModule.collectResponse` in
`src/lib/providers.ts`); if a real "read my AI memory" API ever ships, implement
that one method and slot it in.

## Setup

```bash
npm install
cp .env.example .env.local   # then add your own ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Environment variables (`.env.local`):

- `ANTHROPIC_API_KEY` — **required**, read only by the serverless function.
- `DOSSIER_MODEL` — optional. Defaults to `claude-opus-5`. Set to
  `claude-sonnet-5` for a cheaper, faster compile.

The key is read only by the serverless function and never reaches the browser.
`.env*` is gitignored, and no key has ever been committed to this repository.

## Deploy (Vercel free tier)

```bash
vercel                       # link the project
vercel env add ANTHROPIC_API_KEY   # paste the key when prompted
vercel --prod
```

The single serverless function is `src/app/api/synthesize/route.ts`. It never
logs request bodies (witness statements are personal) and forces the model to
return schema-validated JSON via structured outputs.

## Structure

```
src/
├── app/
│   ├── layout.tsx              # fonts (typewriter/stamp) + OG meta
│   ├── globals.css             # noir palette, paper grain, stamp/typewriter/redaction
│   ├── page.tsx                # single-page orchestrator (landing→picker→intake→dossier)
│   └── api/synthesize/route.ts # the one serverless function (Claude structured output)
├── components/                 # Landing, WitnessPicker, Intake, DossierView, ShareSheet, CaseHistory, ui
└── lib/
    ├── types.ts                # Dossier / CaseFile / request contract
    ├── prompt.ts               # the interrogation prompt (bracketed sections)
    ├── providers.ts            # witnesses + deep links + pluggable intake interface
    ├── storage.ts              # localStorage case history + export/import
    ├── shareImage.ts           # <canvas> share cards (9:16 + 1:1) + Web Share API
    └── sample.ts               # hardcoded sample dossier (design + offline preview)
```

## Design system

Aged paper, manila, ink, oxblood stamp red, faded olive, desk-lamp amber.
Typewriter body (Special Elite / Courier Prime), condensed grotesque stamps
(Oswald). Paper grain via SVG noise, torn dividers, click-to-declassify redaction
bars, a slamming CONFIDENTIAL stamp, and a typewriter-revealed verdict. Respects
`prefers-reduced-motion`. Mobile-first.
