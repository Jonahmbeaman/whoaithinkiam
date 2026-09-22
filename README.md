# DOSSIER — the file AI has been keeping on you

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
4. Read it. Share it as an image card, or as a link that carries the whole
   file inside its URL fragment.

Each witness is asked for what it actually holds. A chat assistant is asked
about conversation; Perplexity is asked for its query log, because a search
history is closer to intent than anything a person says out loud, and because
no prompt turns a search product into a profiler. Per-provider prompts live in
`src/lib/providers.ts`.

## Privacy

**No account, no cookies, no database, no history.** A dossier lives in the tab
and in whatever link you choose to send. Nothing is written to `localStorage`,
`sessionStorage`, or a cookie; there is no analytics, no telemetry, and no
third-party script. Webfonts are self-hosted at build time, so a page load
makes no request to any domain but this one.

Your statements are POSTed once to `/api/synthesize`, forwarded once to the
Anthropic API, and never written down on either hop — the route logs token
counts and error names, never content.

Three carve-outs, stated rather than glossed:

- The rate limiter keeps your IP in memory — never on disk — purely to count
  requests against a ten-minute window. Entries are swept on each request once
  their window lapses, and nothing survives the server process. It is not a
  ten-minute deletion guarantee: a serverless instance that freezes between
  invocations cannot run a sweep. See `src/lib/guard.ts`.
- Vercel keeps its own platform access logs, as any host does.
- The share image is a file you save yourself.

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

## Deploy

Live at <https://whoaithinkiam.vercel.app>.

The Vercel project is **not** connected to this GitHub repository — no
deployment or commit status has ever been recorded against a commit here — so
pushing to `main` does not ship. Deploys go out from a linked working copy:

```bash
vercel login
vercel --prod
```

Connecting the repo in the Vercel dashboard (Settings → Git) would make pushes
deploy automatically, which is worth doing.

`ANTHROPIC_API_KEY` is set in the project's production environment. To change
it: Vercel dashboard → project → Settings → Environment Variables.

The single serverless function is `src/app/api/synthesize/route.ts`. It never
logs request bodies (witness statements are personal) and forces the model to
return schema-validated JSON via structured outputs.

## Structure

```
src/
├── app/
│   ├── layout.tsx              # fonts (typewriter/stamp) + OG meta
│   ├── globals.css             # noir palette, paper grain, stamps, torn dividers
│   ├── error.tsx               # route-level fallback; recovery lives outside the crash
│   ├── page.tsx                # single-page orchestrator (landing→picker→intake→dossier)
│   └── api/synthesize/route.ts # the one serverless function (Claude structured output)
├── components/                 # Landing, WitnessPicker, Intake, DossierView,
│                               # ShareSheet, DossierBoundary, ui
└── lib/
    ├── types.ts                # Dossier + request contract
    ├── normalize.ts            # boundary coercer for untrusted dossiers; never throws
    ├── prompt.ts               # the interrogation prompt (bracketed sections)
    ├── providers.ts            # witnesses, per-provider prompts, deep links
    ├── guard.ts                # origin allowlist, rate limit, size caps
    ├── shareLink.ts            # gzip + base64url the file into the URL fragment
    ├── shareImage.ts           # <canvas> share cards (9:16 + 1:1) + Web Share API
    └── sample.ts               # the specimen dossier (also the only shape check)
```

There is no storage layer. That is the point — see Privacy above.

## Design system

Aged paper, manila, ink, oxblood stamp red, faded olive, desk-lamp amber.
Typewriter body (Courier Prime), condensed grotesque stamps (Oswald). Paper
grain via SVG noise, torn dividers, and a CLASSIFIED stamp. Respects
`prefers-reduced-motion`.

The dossier is three US-Letter sheets you turn through, scaled to fit the
window. Below 700px wide or 780px tall it becomes a scrolling document at full
size instead — a Letter page shrunk into a phone is unreadable, and that is a
function of viewport height as much as width.
