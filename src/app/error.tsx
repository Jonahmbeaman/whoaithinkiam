"use client";

// Route-level backstop for anything DossierBoundary does not sit under —
// the landing page, the picker, the intake step. Same contract: the way out
// must not live inside the thing that broke.
//
// `error` is deliberately not read. A thrown message can carry statement text,
// and nothing about a subject is written down or displayed back.
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <div className="paper w-full max-w-md rounded-md p-7 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)]">
        <span className="label text-[0.6rem] text-teal">
          Records // Interrupted
        </span>
        <h2 className="mt-2 label text-xl text-ink">The office closed early</h2>
        <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-soft tw">
          Something failed mid-sentence. Nothing was stored, so nothing was
          lost that you had not already seen.
        </p>
        <button
          onClick={reset}
          className="mt-6 w-full rounded-md bg-signal py-3.5 label text-sm text-ink transition hover:brightness-105 active:scale-[0.99]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
