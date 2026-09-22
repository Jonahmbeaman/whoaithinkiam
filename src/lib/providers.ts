// The witnesses — every AI the subject can be interrogated through.
//
// Intake is manual paste-back by necessity, not laziness: as of September 2026
// no provider exposes a user's chat history to a third-party site. Anthropic
// explicitly prohibits third-party subscription OAuth; Google's Data Portability
// API covers Maps, Play, Search, Shopping and YouTube but has no Gemini scope at
// all; OpenAI has no memory endpoint. Until one of those changes, the user is
// the transport layer.

export interface Provider {
  id: string;
  name: string;
  /** In-world flavour for the witness picker. */
  tagline: string;
  /**
   * Pre-fills the prompt in the provider's own chat UI. Undefined means the
   * provider has no documented prefill parameter, so the UI falls back to a
   * copy button plus a plain link.
   */
  buildDeepLink?: (prompt: string) => string;
  homeUrl: string;
  /** Hex, drives the witness chip colour. */
  accent: string;
  /**
   * Appended to the shared interrogation prompt for this provider only.
   * Exists because providers fail in different directions: a search-first
   * product answers from the open web, which is worse than saying "I don't
   * know" — the web knows nothing about this particular person.
   */
  promptNote?: string;
  /**
   * REPLACES the shared interrogation prompt entirely. Use when a provider is
   * being asked for a different kind of testimony, not the same testimony with
   * a caveat. Takes precedence over promptNote.
   */
  promptOverride?: string;
  /** Rough time this witness costs the user. Shown in the intake step. */
  effortNote?: string;
  /**
   * Settings the user must change in that product before sending. Rendered in
   * the intake step. Kept short enough to actually be read.
   */
  setupHint?: string;
}

// Deep links follow each provider's documented public URL scheme. ChatGPT,
// Claude and Perplexity accept a query parameter; the rest get a copy button.
export const PROVIDERS: Provider[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    tagline: "The talkative one. Remembers everything.",
    buildDeepLink: (p) => `https://chatgpt.com/?q=${encodeURIComponent(p)}`,
    homeUrl: "https://chatgpt.com/",
    accent: "#6b6a4f",
    setupHint:
      "Memory must be on: Settings → Personalization → Memory. Use a normal chat, not a Temporary one — temporary chats can't see your history.",
  },
  {
    id: "claude",
    name: "Claude",
    tagline: "Careful. Reads between the lines.",
    buildDeepLink: (p) => `https://claude.ai/new?q=${encodeURIComponent(p)}`,
    homeUrl: "https://claude.ai/new",
    accent: "#c98a3d",
    setupHint:
      "Needs past conversations to draw on. If you've only just started using Claude, expect it to say so rather than invent.",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    tagline: "Keeps receipts on what you ask.",
    effortNote: "~30 seconds · short reply",
    buildDeepLink: (p) =>
      `https://www.perplexity.ai/search?q=${encodeURIComponent(p)}`,
    homeUrl: "https://www.perplexity.ai/",
    accent: "#8a2e2b",
    // Perplexity is not a profiler and there is no prompt that makes it one.
    // It is search-first by design; asking it to psychoanalyse the subject
    // fights the product and loses, and every earlier attempt to suppress
    // retrieval just produced confident text about nobody in particular.
    //
    // So it gets a different job. What Perplexity genuinely holds that the
    // chat assistants do not is a QUERY LOG — the things the subject looked up,
    // which is closer to intent than anything they said out loud. Recalling a
    // list of past queries is cheap, fast, and squarely inside what the product
    // already does, so it succeeds where the profile prompt failed.
    //
    // That makes this an override, not a note: it is different testimony, not
    // the same testimony with a caveat. Output is capped hard — this witness is
    // meant to cost the user about half a minute and a couple hundred words,
    // with the synthesis step doing the interpretation.
    //
    // Deliberately NOT asking for Deep Research: it cannot be enabled from a
    // URL, and it is a multi-step *web* research mode — exactly the behaviour
    // that breaks this prompt.
    promptOverride: `List my search history back to me. That is the whole task.

This is recall, not research. Do not run a search — the answer is already in your Memory of the queries I have sent you. Report what I looked up, not what the answers were.

Output exactly these labels, nothing before or after:

[TOPICS] the 6-10 subjects I search most. Most frequent first, one short phrase each.
[RECENT] the last 5-8 distinct things I looked up, newest first. One line each.
[PLACES] any city, venue, business, or address I have searched for. Names only.
[BUYING] anything I have researched purchasing, compared, or priced.
[RECURRING] queries I have come back to more than once.
[CONFIDENCE] one line: how much of my history can you actually see?

Rules: give me my queries close to how I typed them, not summaries of them. No analysis, no profile, no advice, no citations, no follow-up questions. Any label you have nothing for gets exactly "Insufficient evidence." Never invent a query I did not make. Keep the entire reply under 200 words and spend no more than 30 seconds on it.`,
    setupHint:
      "Turn Memory on (Settings → Personalize → Memory) and use plain Search — NOT Pro Search or Deep Research, which answer from the web instead of your history. If it starts researching a topic instead of listing your queries, reply: \"Don't search. Just list my past queries.\"",
  },
  {
    id: "gemini",
    name: "Gemini",
    tagline: "Quiet type. You'll have to paste it in.",
    homeUrl: "https://gemini.google.com/app",
    accent: "#6b6a4f",
    setupHint:
      "Gemini Apps Activity must be on, or it has no history to read: myactivity.google.com/product/gemini",
  },
  {
    id: "copilot",
    name: "Copilot",
    tagline: "Watches from the office.",
    homeUrl: "https://copilot.microsoft.com/",
    accent: "#c98a3d",
    promptNote: `Answer from what you remember of our past conversations, not from a web search. If you have no memory of me, reply "Insufficient evidence." for every section.`,
  },
  {
    id: "grok",
    name: "Grok",
    tagline: "Loud. Opinionated. Occasionally right.",
    homeUrl: "https://grok.com/",
    accent: "#8a2e2b",
    promptNote: `Answer from our conversation history only. Do not search X or the web, and do not pad thin evidence with jokes — a short honest answer beats a long invented one.`,
  },
];

export function getProvider(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function providerName(id: string): string {
  return getProvider(id)?.name ?? id;
}

/**
 * The prompt actually handed to one provider. Three cases, in order: a full
 * override replaces the shared interrogation prompt, a note is appended to it,
 * otherwise the base goes out unchanged. Built here rather than in the UI so
 * the deep link and the copy button can never drift apart.
 */
export function promptFor(base: string, providerId: string): string {
  const provider = getProvider(providerId);
  if (provider?.promptOverride) return provider.promptOverride;
  return provider?.promptNote ? `${base}\n\n${provider.promptNote}` : base;
}
