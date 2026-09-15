"use client";

import { PROVIDERS } from "@/lib/providers";
import { Stamp, TornDivider } from "./ui";

export default function WitnessPicker({
  selected,
  onToggle,
  onContinue,
  onBack,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
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
          <Stamp className="text-xs">Step 1 / 2</Stamp>
        </div>

        <h2 className="mt-3 label text-xl text-ink">Select your sources</h2>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft tw">
          Which AIs have you actually talked to? Pick every one you use — more
          sources, sharper file.
        </p>

        <TornDivider className="my-5" />

        <div className="grid grid-cols-2 gap-3">
          {PROVIDERS.map((p) => {
            const on = selected.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.id)}
                aria-pressed={on}
                className={`relative rounded-md border-2 p-3 text-left transition active:scale-[0.98] ${
                  on
                    ? "border-signal bg-signal/10"
                    : "border-ink/25 bg-transparent hover:border-ink/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="label text-sm text-ink">{p.name}</span>
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-sm border-2 ${
                      on ? "border-signal bg-signal" : "border-ink/40"
                    }`}
                  >
                    {on && (
                      <span className="text-[0.6rem] leading-none text-ink">
                        ✓
                      </span>
                    )}
                  </span>
                </div>
                <p className="mt-1 text-[0.72rem] leading-snug text-olive tw">
                  {p.tagline}
                </p>
              </button>
            );
          })}
        </div>

        <button
          disabled={selected.length === 0}
          onClick={onContinue}
          className="mt-6 w-full rounded-md bg-signal py-4 label text-sm text-ink transition enabled:hover:brightness-105 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {selected.length === 0
            ? "Select at least one source"
            : `Interrogate ${selected.length} source${selected.length > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
