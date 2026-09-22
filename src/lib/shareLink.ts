import type { Dossier } from "./types";

// ---------------------------------------------------------------------------
// Shareable dossier links with ZERO server-side storage.
//
// The whole case file is gzipped, base64url-encoded, and carried in the URL
// *fragment* (`#d=...`). Fragments are never transmitted to the server — the
// browser strips them before the request — so a shared dossier exists only in
// the link itself and in the recipient's tab. Nothing is stored, nothing is
// logged, and there is no record to subpoena or leak.
//
// Deliberately EXCLUDED from the payload: the raw witness statements. Those are
// the rawest personal material in the app (an AI's unfiltered read of someone).
// A share link carries the compiled dossier only.
// ---------------------------------------------------------------------------

const SHARE_PREFIX = "#d=";

// Browsers tolerate far longer, but past this a link stops being pasteable and
// some chat apps truncate it. Past the cap we refuse rather than hand back a
// link that silently breaks.
const MAX_ENCODED_CHARS = 8000;

interface SharedCase {
  v: 1;
  codeName: string;
  date: string;
  providers: string[];
  dossier: Dossier;
}

function supported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof CompressionStream !== "undefined" &&
    typeof DecompressionStream !== "undefined"
  );
}

// Both of these pipe through a Blob stream rather than driving the writer by
// hand. The hand-rolled version awaited writer.write() and writer.close()
// BEFORE anything consumed the readable end, which deadlocks on backpressure:
// once the payload exceeds the transform's internal queue, the write promise
// can only settle after a reader drains it, and the only reader ran after the
// await. Small dossiers fit in the queue and worked; realistic ones hung
// forever, which silently broke both copy-a-link and open-a-link — the entire
// sharing path — with no error anywhere.
async function gzip(text: string): Promise<Uint8Array> {
  const source = new Blob([new TextEncoder().encode(text)]).stream();
  const compressed = source.pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(compressed).arrayBuffer());
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  const source = new Blob([bytes as BlobPart]).stream();
  const expanded = source.pipeThrough(new DecompressionStream("gzip"));
  return new Response(expanded).text();
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Builds a full shareable URL for a dossier. Returns null when the browser
 * lacks compression support or the payload is too large to travel in a link —
 * callers should fall back to the image share card.
 */
export async function buildShareUrl(input: {
  dossier: Dossier;
  date: string;
  providers: string[];
}): Promise<string | null> {
  if (!supported()) return null;
  const payload: SharedCase = {
    v: 1,
    codeName: input.dossier.codeName,
    date: input.date,
    providers: input.providers,
    dossier: input.dossier,
  };
  try {
    const encoded = toBase64Url(await gzip(JSON.stringify(payload)));
    if (encoded.length > MAX_ENCODED_CHARS) return null;
    const { origin, pathname } = window.location;
    return `${origin}${pathname}${SHARE_PREFIX}${encoded}`;
  } catch {
    return null;
  }
}

/**
 * Reads a shared case out of the current URL fragment. Returns null when the
 * fragment is absent, malformed, or not a v1 payload — a bad link should land
 * the visitor on the normal landing page, never on an error screen.
 */
export async function readSharedCase(hash: string): Promise<SharedCase | null> {
  if (!supported() || !hash.startsWith(SHARE_PREFIX)) return null;
  const encoded = hash.slice(SHARE_PREFIX.length);
  if (!encoded) return null;
  // The read side must be at least as strict as the write side. Without this
  // the cap was enforced only when BUILDING a link, so a hand-crafted fragment
  // could carry a megabyte of gzip that expands to hundreds of megabytes and
  // hangs the recipient's tab. An OOM is not a catchable rejection, so the
  // try/catch below would not have helped.
  if (encoded.length > MAX_ENCODED_CHARS) return null;
  try {
    const parsed = JSON.parse(await gunzip(fromBase64Url(encoded))) as SharedCase;
    if (parsed?.v !== 1 || !parsed.dossier?.codeName) return null;
    return parsed;
  } catch {
    return null;
  }
}
