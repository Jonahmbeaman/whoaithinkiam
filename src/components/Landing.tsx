"use client";

import { Stamp, TornDivider } from "./ui";

export default function Landing({
  onBegin,
  onViewSample,
  onOpenHistory,
  historyCount,
}: {
  onBegin: () => void;
  onViewSample: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}) {
  return (
    <div className="rise mx-auto w-full max-w-xl px-5 py-10">
      <div className="paper relative overflow-hidden rounded-md shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]">
        <div className="bar-signal px-4 py-1.5 pr-6 text-[0.7rem]">
          The Agency · Directorate of Behavioral Intelligence
        </div>

        <div className="relative p-7 pt-6">
          <div className="coffee-ring right-6 top-8 opacity-70" aria-hidden />

          <div className="mb-2 flex items-center justify-between">
            <span className="label text-[0.6rem] text-teal">
              Classified // Eyes Only
            </span>
            <Stamp className="text-xs">Top Secret</Stamp>
          </div>

          <h1 className="text-center text-5xl tracking-[0.12em] text-ink [font-family:var(--font-stamp)] font-bold sm:text-6xl">
            DOSSIER
          </h1>
          <p className="mt-2 text-center label text-[0.66rem] text-olive">
            The file AI has been keeping on you
          </p>

          <TornDivider className="my-6" />

          <p className="text-center text-[0.96rem] leading-relaxed text-ink-soft tw">
            Every AI you talk to has quietly built a theory of who you are — how
            you think, what drives you, the thing you can&rsquo;t see about
            yourself. The Agency interrogates them all and compiles one operative
            profile on you.
          </p>

          <p className="mt-4 text-center label text-[0.64rem] text-olive">
            ~30 seconds per source · psychological read · shareable file
          </p>

          <button
            onClick={onBegin}
            className="mt-7 w-full rounded-md bg-signal py-4 text-center label text-sm text-ink transition active:scale-[0.99] hover:brightness-105"
          >
            Open your file
          </button>

          <div className="mt-4 flex items-center justify-center gap-6 text-[0.72rem]">
            <button
              onClick={onViewSample}
              className="label text-teal underline decoration-dotted underline-offset-4 hover:text-ink"
            >
              See a specimen
            </button>
            <button
              onClick={onOpenHistory}
              className="label text-teal underline decoration-dotted underline-offset-4 hover:text-ink"
            >
              Case history{historyCount > 0 ? ` (${historyCount})` : ""}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 px-2 text-center text-[0.72rem] leading-relaxed text-paper/50 tw">
        We never ask for your AI passwords. You paste each AI&rsquo;s reply
        yourself. Your files are saved only in this browser.
      </p>
    </div>
  );
}
