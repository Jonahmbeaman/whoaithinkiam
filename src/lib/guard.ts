import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Abuse guards for /api/synthesize.
//
// The endpoint is unauthenticated and every call spends real money on a
// frontier model, so it needs bounds. Three layers, and it is worth being
// precise about what each one actually buys:
//
//   1. Origin allowlist — stops another *website* from embedding a script that
//      bills our key. It does NOT stop `curl`, which simply omits the Origin
//      header. Browser-abuse only.
//   2. Per-IP rate limit — this is the real defence against scripted abuse.
//      See the caveat below: it is best-effort, not durable.
//   3. Size caps — bound the cost of any single accepted call, so even a
//      permitted request cannot be made arbitrarily expensive.
//
// CAVEAT (read before trusting layer 2): Vercel serverless functions are
// ephemeral and horizontally scaled, so this in-memory counter is per-instance.
// A caller spread across instances gets more than RATE_LIMIT_MAX. That is an
// accepted tradeoff for a friends-only launch. Before the URL reaches
// strangers, move this to Vercel KV / Upstash so the window is shared.
// ---------------------------------------------------------------------------

// Tuning knobs. Not exported: route.ts needs only MAX_BODY_BYTES, and a
// caller that could reach in and change a limit isn't a limit.

/** Max witness statements in one filing (there are only six providers). */
const MAX_STATEMENTS = 6;

/** Max combined characters across all statements (~15K tokens of input). */
const MAX_TOTAL_CHARS = 60_000;

/** Hard ceiling on the request body, checked before we parse it. */
export const MAX_BODY_BYTES = 200_000;

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function allowedOrigins(): string[] {
  const list = ["http://localhost:3000", "http://127.0.0.1:3000"];
  // Comma-separated escape hatch for a custom domain.
  const explicit = process.env.DOSSIER_ALLOWED_ORIGIN;
  if (explicit) {
    for (const o of explicit.split(",")) {
      const trimmed = o.trim();
      if (trimmed) list.push(trimmed);
    }
  }
  // Vercel supplies both the stable production host and the per-deploy host.
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) list.push(`https://${prod}`);
  const deployment = process.env.VERCEL_URL;
  if (deployment) list.push(`https://${deployment}`);
  return list;
}

/**
 * A missing Origin means a non-browser caller (curl, a server). We allow it
 * through to the rate limiter rather than 403 it, because blocking on a header
 * the caller controls buys nothing — the rate limit and size caps are what
 * actually bound those requests.
 */
export function originAllowed(origin: string | null): boolean {
  if (!origin) return true;
  return allowedOrigins().includes(origin);
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    // Responses differ by Origin, so caches must not share them.
    Vary: "Origin",
  };
  if (origin && allowedOrigins().includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

/** Best-effort caller identity. Trusts Vercel's proxy headers. */
export function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

const hits = new Map<string, number[]>();

export function rateLimit(key: string): {
  ok: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);

  // Keep the map from growing without bound across a long-lived instance.
  if (hits.size > 5_000) {
    for (const [k, times] of hits) {
      if (times.every((t) => t <= cutoff)) hits.delete(k);
    }
  }

  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(key, recent);
    const oldest = recent[0];
    return {
      ok: false,
      retryAfterSec: Math.max(
        1,
        Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000),
      ),
    };
  }

  recent.push(now);
  hits.set(key, recent);
  return { ok: true, retryAfterSec: 0 };
}

/** Rejects a filing that would be expensive to process. Runs before any API call. */
export function oversized(
  statements: { text?: unknown }[],
): { reason: string } | null {
  if (statements.length > MAX_STATEMENTS) {
    return { reason: `No more than ${MAX_STATEMENTS} statements per filing.` };
  }
  let total = 0;
  for (const s of statements) {
    if (typeof s?.text === "string") total += s.text.length;
  }
  if (total > MAX_TOTAL_CHARS) {
    return { reason: "That is more paperwork than this office will read. Trim it down." };
  }
  return null;
}
