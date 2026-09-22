#!/usr/bin/env node
// Automated checks for the Dossier API surface.
//
//   node scripts/verify.mjs                  # against http://localhost:3000
//   node scripts/verify.mjs --live           # against the production URL
//   node scripts/verify.mjs --paid           # also runs one real synthesis (~$0.05)
//
// Scope: this covers everything reachable over HTTP — the abuse guards, the
// error paths, and optionally one real compile. It deliberately does NOT cover
// the browser half (share-link encoding, the stage flow, canvas share cards),
// because those need a DOM and faking one would test the fake. Drive those
// with a real browser against a running dev server.
//
// Ordering matters: the rate limiter counts every request that clears the
// origin check, so the limiter test runs last and everything before it is
// budgeted to stay under the threshold.

const LIVE = "https://whoaithinkiam.vercel.app";
const args = process.argv.slice(2);
const BASE = args.includes("--live") ? LIVE : "http://localhost:3000";
const PAID = args.includes("--paid");
const ORIGIN = BASE;

let pass = 0;
let fail = 0;
let rateLimited = false;

function ok(name, detail = "") {
  pass++;
  console.log(`  \x1b[32mPASS\x1b[0m  ${name}${detail ? "  — " + detail : ""}`);
}
function bad(name, detail) {
  fail++;
  console.log(`  \x1b[31mFAIL\x1b[0m  ${name}  — ${detail}`);
}
function skip(name, why) {
  console.log(`  \x1b[33mSKIP\x1b[0m  ${name}  — ${why}`);
}

async function post(body, origin = ORIGIN, raw = false) {
  const res = await fetch(`${BASE}/api/synthesize`, {
    method: "POST",
    headers: { "content-type": "application/json", Origin: origin },
    body: raw ? body : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body is itself a finding the caller can assert on */
  }
  if (res.status === 429) rateLimited = true;
  return { status: res.status, json, headers: res.headers };
}

const statement = (text) => ({ responses: [{ provider: "claude", text }] });
const LONG = "a".repeat(200); // clears the 120-char minimum

// A statement shaped like a real interrogation reply, so --paid exercises the
// same code path a user does.
const REAL_STATEMENT = `[NAME] Test subject, goes by a shortened first name.
[LOCATION] A mid-sized US city, mountain time zone.
[AGE] Late teens.
[WORK] Aspiring software engineer starting an internship at a hardware company.
[EDUCATION] First-year CS coursework plus a lot of self-teaching by building.
[HEADSPACE] Shipping a side project before the internship starts.
[ROUTINE & PLACES] Works late, often past midnight. Codes in a terminal.
[HOW I THINK] Wants the reasoning behind a choice, not just the answer.
[CONFIDENCE] Moderate. Several long sessions about one project.`;

/**
 * One assertion. Written as a statement rather than the ternary this file used
 * to use — `cond ? ok(..) : bad(..)` evaluates a expression purely for its side
 * effects, which is what no-unused-expressions exists to catch.
 */
function check(condition, name, failDetail = "", passDetail = "") {
  if (condition) ok(name, passDetail);
  else bad(name, failDetail);
}

console.log(`\nDossier verification — ${BASE}\n`);

// ---------------------------------------------------------------- page serves
console.log("Page");
try {
  const res = await fetch(BASE);
  const html = await res.text();
  check(res.status === 200, "homepage responds 200", `got ${res.status}`);
  check(
    /DOSSIER/i.test(html),
    "homepage renders the app shell",
    "no DOSSIER marker in HTML",
  );
  check(
    !/vercel\.com\/sso|Authentication Required/i.test(html),
    "publicly reachable",
    "gated behind deployment protection",
    "no auth wall",
  );
} catch (e) {
  bad("homepage responds", `${e.message} — is the dev server running?`);
}

// ------------------------------------------------------------- method routing
console.log("\nMethod routing");
{
  const res = await fetch(`${BASE}/api/synthesize`);
  check(res.status === 405, "GET is rejected 405", `got ${res.status}`);
}
{
  const res = await fetch(`${BASE}/api/synthesize`, {
    method: "OPTIONS",
    headers: { Origin: ORIGIN },
  });
  check(res.status === 204, "OPTIONS preflight returns 204", `got ${res.status}`);
}

// --------------------------------------------------------------- abuse guards
console.log("\nAbuse guards");
{
  // Does NOT consume a rate-limit slot: the origin check runs first.
  const r = await post(statement(LONG), "https://evil.example");
  check(r.status === 403, "cross-origin POST blocked 403", `got ${r.status}`);
}
{
  const r = await post("x".repeat(250_000), ORIGIN, true);
  check(
    r.status === 413,
    "oversize body rejected 413",
    `got ${r.status}`,
    "before any model call",
  );
}
{
  const many = { responses: Array.from({ length: 9 }, () => ({ provider: "claude", text: LONG })) };
  const r = await post(many);
  check(r.status === 413, "too many statements rejected 413", `got ${r.status}`);
}
{
  const r = await post(statement("too short"));
  check(r.status === 422, "below-minimum statement rejected 422", `got ${r.status}`);
}
{
  const r = await post({});
  check(r.status === 422, "missing responses array rejected 422", `got ${r.status}`);
}

// ------------------------------------------------------------ real compile
console.log("\nSynthesis");
if (!PAID) {
  skip("real synthesis", "pass --paid to spend ~$0.05 and run it");
} else if (rateLimited) {
  skip("real synthesis", "already rate-limited; restart the server and retry");
} else {
  const t0 = Date.now();
  const r = await post(statement(REAL_STATEMENT));
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (r.status !== 200 || !r.json?.ok) {
    bad("compiles a dossier", `status ${r.status}: ${r.json?.error ?? "no body"}`);
  } else {
    ok("compiles a dossier", `${secs}s`);
    const d = r.json.dossier;
    check(d.codeName, "has a code name", "missing", d.codeName);
    check(
      Number.isInteger(d.confidence),
      "has an integer confidence",
      String(d.confidence),
      String(d.confidence),
    );
    check(
      [0, 24].includes(d.activityClock?.length ?? 0),
      "activity clock is 24 hours or absent",
      `got ${d.activityClock?.length ?? 0}`,
    );
    check(d.misc?.length === 1, "misc trimmed to one bullet", `got ${d.misc?.length}`);
    check(
      !("privacyHazards" in d),
      "privacyHazards no longer generated",
      "still present — wasted tokens",
    );
    const bio = ["height", "eyeColor", "hairColor"].filter((k) => k in (d.basicInfo ?? {}));
    check(bio.length === 0, "no invented biometrics", `present: ${bio.join(", ")}`);

    // Calibration: every claim carries a number, and they shouldn't all be high.
    const claims = [...(d.patternOfLife ?? []), ...(d.psychWeakness ?? [])];
    const scored = claims.filter((c) => Number.isInteger(c.confidence));
    check(
      scored.length === claims.length,
      "every claim carries a confidence",
      `${claims.length - scored.length} missing`,
      `${claims.length} claims`,
    );
    const spread = Math.max(...scored.map((c) => c.confidence)) - Math.min(...scored.map((c) => c.confidence));
    check(
      spread >= 20,
      "confidence is spread, not clustered",
      `range only ${spread} — likely inflated`,
      `range ${spread} points`,
    );

    // Anti-glaze: the whole reason this product exists.
    const GLAZE = /\b(impressive|remarkable|admirable|inspiring|exceptional|refreshing|commendable|thoughtful|insightful)\b/i;
    const glazed = claims.filter((c) => GLAZE.test(c.claim));
    check(
      glazed.length === 0,
      "no praise language in findings",
      `"${glazed[0].claim.slice(0, 60)}…"`,
    );
  }
}

// -------------------------------------------------------------- rate limiting
// Last, because it deliberately exhausts the window.
console.log("\nRate limiting");
{
  let saw429 = false;
  let retryAfter = null;
  for (let i = 0; i < 8 && !saw429; i++) {
    const r = await post(statement("too short")); // cheap: fails validation, no model call
    if (r.status === 429) {
      saw429 = true;
      retryAfter = r.headers.get("retry-after");
    }
  }
  check(
    saw429,
    "rate limiter engages",
    "never returned 429 across 8 rapid requests",
    `429 with Retry-After: ${retryAfter}s`,
  );
}

// ---------------------------------------------------------------------- report
console.log(`\n${pass} passed, ${fail} failed`);
if (rateLimited) {
  console.log(
    "\nNote: the rate-limit window is now consumed. Restart `npm run dev`" +
      "\n(or wait 10 minutes) before re-running, or later checks will 429.",
  );
}
console.log("\nBrowser-side checks need a real browser and are not covered here.\n");
process.exit(fail > 0 ? 1 : 0);
