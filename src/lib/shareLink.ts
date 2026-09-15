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

export const SHARE_PREFIX = "#d=";

// Browsers tolerate far longer, but past this a link stops being pasteable and
// some chat apps truncate it. Past the cap we refuse rather than hand back a
// link that silently breaks.
const MAX_ENCODED_CHARS = 8000;

export interface SharedCase {
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

async function gzip(text: string): Promise<Uint8Array<ArrayBuffer>> {
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  await writer.write(new TextEncoder().encode(text));
  await writer.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(buf);
}

async function gunzip(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  await writer.write(bytes);
  await writer.close();
  const buf = await new Response(ds.readable).arrayBuffer();
  return new TextDecoder().decode(buf);
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
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
  try {
    const parsed = JSON.parse(await gunzip(fromBase64Url(encoded))) as SharedCase;
    if (parsed?.v !== 1 || !parsed.dossier?.codeName) return null;
    return parsed;
  } catch {
    return null;
  }
}
