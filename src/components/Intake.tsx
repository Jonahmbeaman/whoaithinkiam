"use client";

import { useState } from "react";
import { getProvider, promptFor } from "@/lib/providers";
import { INTERROGATION_PROMPT } from "@/lib/prompt";
import { Stamp, TornDivider } from "./ui";

const MIN_CHARS = 120;

const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Catches a user pasting the prompt back instead of the reply.
 *
 * Matches against the opening of the prompt that provider was actually handed,
 * rather than hardcoded section labels. The previous version looked for
 * "profiling me" AND two bracketed labels; no prompt has ever contained that
 * phrase, so the check could never fire and the warning was unreachable.
 * Deriving it from the prompt means it cannot drift again — and it works for
 * providers whose prompt is an override with different labels entirely.
 */
function looksLikePrompt(text: string, prompt: string): boolean {
  const body = normalize(text);
  if (body.length < 60) return false;
  return body.includes(normalize(prompt).slice(0, 60));
}

export default function Intake({
  selected,
  responses,
  onChange,
  onCompile,
  onBack,
  compiling,
  error,
}: {
  selected: string[];
  responses: Record<string, string>;
  onChange: (id: string, text: string) => void;
  onCompile: () => void;
  onBack: () => void;
  compiling: boolean;
  error: string | null;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const usableCount = selected.filter(
    (id) => (responses[id]?.trim().length ?? 0) >= MIN_CHARS,
  ).length;

  async function copyPrompt(id: string) {
    try {
      await navigator.clipboard.writeText(
        promptFor(INTERROGATION_PROMPT, id),
      );
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1800);
    } catch {
      // Clipboard blocked — the deep link still carries the prompt.
    }
  }

  return (
    <div className="rise mx-auto w-full max-w-xl px-5 py-10">
      <div className="paper rounded-md p-7 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]">
        <div className="mb-1 flex items-center justify-between">
          <button
            onClick={onBack}
            className="label text-[0.7rem] text-olive hover:text-ink"
          >
            ← Back
          </button>
          <Stamp className="text-xs">Step 2 / 2</Stamp>
        </div>

        <h2 className="mt-3 label text-xl text-ink">Collect the statements</h2>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft tw">
          For each source: open it, send the loaded prompt, then paste its full
          reply back here.
        </p>

        <TornDivider className="my-5" />

        <div className="space-y-7">
          {selected.map((id) => {
            const p = getProvider(id);
            if (!p) return null;
            const val = responses[id] ?? "";
            const len = val.trim().length;
            // Every provider gets the prompt tailored to it. This used to send
            // the shared prompt verbatim, which silently discarded every
            // per-provider note and override in providers.ts.
            const prompt = promptFor(INTERROGATION_PROMPT, id);
            const warnPrompt = looksLikePrompt(val, prompt);
            const tooShort = len > 0 && len < MIN_CHARS && !warnPrompt;
            const good = len >= MIN_CHARS && !warnPrompt;
            const href = p.buildDeepLink ? p.buildDeepLink(prompt) : p.homeUrl;

            return (
              <div
                key={id}
                className="rounded-md border-2 border-dashed border-ink/30 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="label text-base text-ink">{p.name}</span>
                  {good ? (
                    <span className="stamp text-[0.65rem]">On the record</span>
                  ) : (
                    p.effortNote && (
                      <span className="text-[0.66rem] italic text-olive tw">
                        {p.effortNote}
                      </span>
                    )
                  )}
                </div>

                {/* Settings the user has to change before sending. Previously
                    defined on every provider and rendered nowhere, so nobody
                    was ever told to switch Memory on. */}
                {p.setupHint && (
                  <p className="mt-2 border-l-2 border-signal/60 pl-2 text-[0.72rem] leading-snug text-ink-soft tw">
                    {p.setupHint}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-ink px-3 py-2 text-[0.72rem] label text-paper hover:brightness-125"
                  >
                    {p.buildDeepLink
                      ? `Open ${p.name} (prompt loaded) ↗`
                      : `Open ${p.name} ↗`}
                  </a>
                  <button
                    onClick={() => copyPrompt(id)}
                    className="rounded border-2 border-ink/40 px-3 py-2 text-[0.72rem] label text-ink hover:border-ink"
                  >
                    {copiedId === id ? "Copied ✓" : "Copy prompt"}
                  </button>
                </div>

                <textarea
                  value={val}
                  onChange={(e) => onChange(id, e.target.value)}
                  placeholder={`Paste ${p.name}'s statement here, verbatim…`}
                  rows={5}
                  className="mt-3 w-full resize-y rounded border-2 border-ink/25 bg-paper-dark/40 p-3 text-[0.85rem] leading-relaxed text-ink outline-none placeholder:text-olive/70 focus:border-signal"
                />

                <div className="mt-1 min-h-[1rem] text-[0.7rem] tw">
                  {warnPrompt && (
                    <span className="text-classified">
                      That looks like the prompt, not the reply. Paste the
                      source&rsquo;s answer.
                    </span>
                  )}
                  {tooShort && (
                    <span className="text-olive">
                      Too thin to file. Paste the whole reply ({MIN_CHARS}+
                      characters).
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="mt-5 rounded border-2 border-classified bg-classified/10 p-3 text-[0.82rem] leading-relaxed text-classified tw">
            {error}
          </p>
        )}

        <button
          disabled={usableCount === 0 || compiling}
          onClick={onCompile}
          className="mt-6 w-full rounded-md bg-signal py-4 label text-sm text-ink transition enabled:hover:brightness-105 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {compiling
            ? "Compiling the file…"
            : usableCount === 0
              ? "Collect at least one statement"
              : `Compile dossier from ${usableCount} source${usableCount > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
