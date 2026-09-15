"use client";

import { useState } from "react";
import { getProvider } from "@/lib/providers";
import { INTERROGATION_PROMPT } from "@/lib/prompt";
import { Stamp, TornDivider } from "./ui";

const MIN_CHARS = 120;

function looksLikePrompt(text: string): boolean {
  return (
    text.includes("[THE LENS]") &&
    text.includes("[BLIND SPOT]") &&
    text.toLowerCase().includes("profiling me")
  );
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
      await navigator.clipboard.writeText(INTERROGATION_PROMPT);
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
            const warnPrompt = looksLikePrompt(val);
            const tooShort = len > 0 && len < MIN_CHARS && !warnPrompt;
            const good = len >= MIN_CHARS && !warnPrompt;
            const href = p.buildDeepLink
              ? p.buildDeepLink(INTERROGATION_PROMPT)
              : p.homeUrl;

            return (
              <div
                key={id}
                className="rounded-md border-2 border-dashed border-ink/30 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="label text-base text-ink">{p.name}</span>
                  {good && (
                    <span className="stamp text-[0.65rem]">On the record</span>
                  )}
                </div>

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
                      A little thin — paste the full statement ({MIN_CHARS}+
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
