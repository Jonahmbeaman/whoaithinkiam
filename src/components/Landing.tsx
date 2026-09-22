"use client";

import { Stamp, TornDivider } from "./ui";

export default function Landing({
  onBegin,
  onViewSample,
}: {
  onBegin: () => void;
  onViewSample: () => void;
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
            <Stamp className="text-xs">Classified</Stamp>
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
            yourself. The Agency interrogates them all and compiles one
            operative profile on you.
          </p>

          <p className="mt-4 text-center label text-[0.64rem] text-olive">
            It will not flatter you. That is the point.
          </p>

          <button
            onClick={onBegin}
            className="mt-7 w-full rounded-md bg-signal py-4 text-center label text-sm text-ink transition active:scale-[0.99] hover:brightness-105"
          >
            Open your file
          </button>

          <div className="mt-4 flex items-center justify-center text-[0.72rem]">
            <button
              onClick={onViewSample}
              className="label text-teal underline decoration-dotted underline-offset-4 hover:text-ink"
            >
              See a specimen
            </button>
          </div>
        </div>
      </div>

      {/* The one canonical privacy statement. It is repeated verbatim wherever
          the subject needs it, and it is precise rather than absolute: the
          ten-minute clause is real and is the reason this can be stated at all. */}
      <p className="mt-6 px-2 text-center text-[0.72rem] leading-relaxed text-paper/50 tw">
        No account, no cookies, no database. We never ask for an AI password —
        you paste each reply yourself. Your statements pass through once and are
        never written down. Your address is held for ten minutes to stop abuse,
        then dropped. The only copy is the one you choose to send.
      </p>
    </div>
  );
}
