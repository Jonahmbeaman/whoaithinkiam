import type { WitnessResponse } from "./types";

// Each AI is an optional "witness." Provider metadata + how we hand off the
// interrogation prompt to it.
export interface Provider {
  id: string;
  name: string;
  tagline: string; // in-world flavor for the picker
  // Builds a deep link that pre-fills the prompt in the provider's chat UI.
  // Undefined = no known prefill param; we show copy-to-clipboard + a plain link.
  buildDeepLink?: (prompt: string) => string;
  // Plain link when there's no prefill (Gemini, Copilot, Grok).
  homeUrl: string;
  accent: string; // hex, used for the witness chip
}

// Prefill deep links verified against each provider's public URL scheme.
// ChatGPT / Claude / Perplexity accept a query param; the rest get a copy button.
export const PROVIDERS: Provider[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    tagline: "The talkative one. Remembers everything.",
    buildDeepLink: (p) => `https://chatgpt.com/?q=${encodeURIComponent(p)}`,
    homeUrl: "https://chatgpt.com/",
    accent: "#6b6a4f",
  },
  {
    id: "claude",
    name: "Claude",
    tagline: "Careful. Reads between the lines.",
    buildDeepLink: (p) => `https://claude.ai/new?q=${encodeURIComponent(p)}`,
    homeUrl: "https://claude.ai/new",
    accent: "#c98a3d",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    tagline: "Keeps receipts on what you ask.",
    buildDeepLink: (p) =>
      `https://www.perplexity.ai/search?q=${encodeURIComponent(p)}`,
    homeUrl: "https://www.perplexity.ai/",
    accent: "#8a2e2b",
  },
  {
    id: "gemini",
    name: "Gemini",
    tagline: "Quiet type. You'll have to paste it in.",
    homeUrl: "https://gemini.google.com/app",
    accent: "#6b6a4f",
  },
  {
    id: "copilot",
    name: "Copilot",
    tagline: "Watches from the office.",
    homeUrl: "https://copilot.microsoft.com/",
    accent: "#c98a3d",
  },
  {
    id: "grok",
    name: "Grok",
    tagline: "Loud. Opinionated. Occasionally right.",
    homeUrl: "https://grok.com/",
    accent: "#8a2e2b",
  },
];

export function getProvider(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function providerName(id: string): string {
  return getProvider(id)?.name ?? id;
}

/**
 * Pluggable intake interface. In v1 the ONLY implementation is manual
 * paste-back (the user copies the AI's reply into a textarea) — this is the
 * product mechanic, not a stopgap: no public OAuth scope exposes a user's
 * ChatGPT/Claude/Gemini memory to third-party sites (verified 2026-07).
 *
 * If a real "read my AI memory" API ever ships, implement this one method and
 * slot it into the Intake component without touching the rest of the app.
 */
export interface IntakeModule {
  collectResponse(providerId: string): Promise<WitnessResponse | null>;
}
