"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dossier, Rated, WitnessResponse } from "@/lib/types";
import { providerName } from "@/lib/providers";
import { AgencySeal, DocBar, FieldGrid, Stamp, type GridItem } from "./ui";
import ShareSheet from "./ShareSheet";

// ---------------------------------------------------------------------------
// The file is three US-Letter sheets (8.5x11 in @ 96dpi) you turn through.
//
// It used to be one sheet that grew to fit its content. That failed both ways:
// as a hard height it clipped the footer, and as a floor it grew until the
// scale-to-fit made body copy 8.9px on a laptop and 5.5px on a phone.
// Paginating is what buys the room to set the type at a readable size — the
// two changes only work together, since capping the height alone would have
// moved 12.8px to 9.4px and fixed nothing anyone could actually read.
//
// The sheet is abandoned entirely when the viewport cannot render it legibly,
// and that is a question of height as much as width. A Letter page in a 390px
// viewport is a postage stamp (measured: 5.5px body copy), but so is one in a
// short 600px-tall window (measured: 7.4px) — the stage simply has nowhere to
// put 1056px. Both fall back to the same scrolling document at full size.
//
// MIN_SHEET_H is derived, not guessed: body copy is 0.95rem = 15.2px, the
// readable floor is ~10px, so the scale must stay above 10/15.2 = 0.658. That
// needs 0.658 * 1056 = 695px of stage, plus both gutters and the toolbar.
// ---------------------------------------------------------------------------
const PAGE_W = 816;
const PAGE_H = 1056;
const STAGE_GUTTER = 20;
const MIN_SHEET_W = 700;
const MIN_SHEET_H = 780;

const dash = (v?: string) =>
  v && v.trim() && v.trim().toUpperCase() !== "UNKNOWN" ? v : "—";

function Pct({ n }: { n?: number }) {
  if (typeof n !== "number") return null;
  return (
    <span className="shrink-0 text-[0.8rem] font-bold text-classified tw">
      {n}%
    </span>
  );
}

function Numbered({ items }: { items: Rated[] }) {
  return (
    <ol className="space-y-1.5">
      {items.map((r, i) => (
        <li key={i} className="flex gap-2 text-[0.95rem] leading-snug text-ink tw">
          <span className="w-5 shrink-0 text-right text-ink/60">{i + 1}.</span>
          <span className="flex-1">{r.claim}</span>
          <Pct n={r.confidence} />
        </li>
      ))}
    </ol>
  );
}

function Bullets({ items }: { items: Rated[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((r, i) => (
        <li key={i} className="flex gap-2 text-[0.95rem] leading-snug text-ink tw">
          <span className="text-ink/40">–</span>
          <span className="flex-1">{r.claim}</span>
          <Pct n={r.confidence} />
        </li>
      ))}
    </ul>
  );
}

// 24 hourly spokes radiating from the centre. Rendered only when the analyst
// returned a complete clock — see the guard at the call site.
function ActivityClock({ hours }: { hours: number[] }) {
  const size = 150;
  const c = size / 2;
  const inner = 13;
  const maxLen = 50;
  const max = Math.max(1, ...hours);
  const cardinals: [number, number, string][] = [
    [c, 9, "12A"],
    [size - 6, c + 3, "6A"],
    [c, size - 3, "12P"],
    [7, c + 3, "6P"],
  ];
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-40" aria-label="Activity by hour">
      <circle cx={c} cy={c} r={c - 7} fill="none" stroke="var(--color-ink)" strokeOpacity="0.14" />
      {hours.map((v, i) => {
        const frac = v / max;
        const out = inner + frac * maxLen;
        const a = ((i * 15 - 90) * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={c + inner * Math.cos(a)}
            y1={c + inner * Math.sin(a)}
            x2={c + out * Math.cos(a)}
            y2={c + out * Math.sin(a)}
            stroke="var(--color-classified)"
            strokeOpacity={(0.38 + 0.62 * frac).toFixed(2)}
            strokeWidth="3.1"
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={c} cy={c} r="3" fill="var(--color-ink)" fillOpacity="0.3" />
      {cardinals.map(([x, y, t]) => (
        <text
          key={t}
          x={x}
          y={y}
          textAnchor="middle"
          fontSize="6.5"
          fill="var(--color-ink)"
          fillOpacity="0.5"
          style={{ fontFamily: "var(--font-stamp)", letterSpacing: "0.5px" }}
        >
          {t}
        </text>
      ))}
    </svg>
  );
}

/**
 * A photo slot with nothing in it. The caption says so plainly: no likeness is
 * reconstructed anywhere in this app, and a box captioned "AI-rendered face"
 * asserted an inference that does not exist. The share card already got this
 * right with NO VISUAL ON RECORD; this matches it.
 */
function NoVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`silhouette flex items-center justify-center p-2 text-center ${className}`}>
      <span className="label text-[0.58rem] leading-tight text-ink/50">
        No visual on record
      </span>
    </div>
  );
}

export default function DossierView({
  dossier,
  providers,
  date,
  responses,
  onNewCase,
  onHome,
  isSample = false,
}: {
  dossier: Dossier;
  providers: string[];
  date: string;
  responses: WitnessResponse[];
  onNewCase: () => void;
  onHome: () => void;
  isSample?: boolean;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [statementsOpen, setStatementsOpen] = useState(false);
  const [page, setPage] = useState(0);
  // True when the viewport cannot show a Letter sheet at a readable size.
  const [documentMode, setDocumentMode] = useState(false);

  const b = dossier.basicInfo;
  const conf = dossier.confidence;
  const stamp = new Date(date);
  const dateLabel = isSample
    ? "SPECIMEN"
    : stamp.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const fileNo = `PR-${String((dossier.codeName.length * 6203) % 1000000).padStart(6, "0")}-0${(dossier.codeName.length % 9) + 1}`;

  const bi = (label: string, rv?: { value: string; confidence: number }): GridItem => ({
    label,
    value: dash(rv?.value),
    confidence: rv?.confidence,
  });
  const profileItems: GridItem[] = [
    bi("Born", b.birthday),
    bi("Gender", b.sex),
    bi("Nationality", b.nationality),
    bi("Location", b.location),
    bi("Occupation", b.occupation),
    bi("Education", b.education),
    bi("Languages", b.languages),
    bi("Status", b.relationshipStatus),
  ];

  const typ = (m: RegExp) => dossier.typology.find((t) => m.test(t.system));
  const mbti = typ(/16|personalit|mbti|myers/i);
  const arch = typ(/archetype/i);
  const zod = typ(/zodiac/i);
  const astro = dossier.astrology;
  const sun = astro?.sun ?? (zod ? { value: zod.value, confidence: zod.confidence } : undefined);
  const trap = dossier.honeytrap;
  // No data, no dial. `activityClock` is no longer a required schema field, so
  // an analyst with no timing evidence returns nothing and this stays absent
  // rather than drawing 24 invented numbers as though they were telemetry.
  const clock = dossier.activityClock?.length === 24 ? dossier.activityClock : null;

  // Every claim the analyst produced is rendered. The page used to slice these
  // to five, silently discarding up to six finished claims per compile.
  const info = dossier.patternOfLife;
  const psych = dossier.psychWeakness;
  const misc = dossier.misc;

  const buildIdentification = (compact: boolean) => (
    <>
      <div className="mt-2">
        <div className="text-[0.6rem] uppercase tracking-[0.16em] text-ink/55">Subject</div>
        <div className="label text-3xl leading-none text-ink">{dash(b.name?.value)}</div>
        <div className="mt-1 label text-[0.68rem] text-classified">
          File designation — {dossier.codeName}
        </div>
      </div>

      <DocBar right={`Confidence ${conf}%`}>Profile</DocBar>
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <FieldGrid items={profileItems} cols={compact ? 1 : 2} />
        </div>
        {!compact && <NoVisual className="w-36 shrink-0" />}
      </div>
      {compact && <NoVisual className="mt-2 h-16 w-full" />}

      <DocBar>Personality Type</DocBar>
      <ul className="space-y-1.5 text-[0.95rem] leading-snug text-ink tw">
        {mbti && (
          <li className="flex gap-2">
            <span className="flex-1">
              <span className="text-ink/55">MBTI:</span> {mbti.value} — {mbti.take}
            </span>
            <Pct n={mbti.confidence} />
          </li>
        )}
        {arch && (
          <li className="flex gap-2">
            <span className="flex-1">
              <span className="text-ink/55">Archetype:</span> {arch.value} — {arch.take}
            </span>
            <Pct n={arch.confidence} />
          </li>
        )}
        {sun && (
          <li className="text-ink/90">
            Sun {sun.value} · {sun.confidence}%
            {astro && (
              <>
                {"  ·  "}Moon {astro.moon.value} · {astro.moon.confidence}%
                {"  ·  "}Rising {astro.rising.value} · {astro.rising.confidence}%
              </>
            )}
            <span className="text-ink/45"> (guessed)</span>
          </li>
        )}
      </ul>

      {clock && (
        <>
          <DocBar right="24h">Activity Clock</DocBar>
          <ActivityClock hours={clock} />
          <p className="text-center text-[0.72rem] italic text-ink/55 tw">
            Activity by hour, 12A at top.
          </p>
        </>
      )}
    </>
  );

  const sheetPattern = (
    <>
      {info.length > 0 && (
        <>
          <DocBar>Information</DocBar>
          <p className="mb-2 text-[0.78rem] italic text-ink/55 tw">
            How to reach the subject, read them, and move them.
          </p>
          <Numbered items={info} />
        </>
      )}
      {misc.length > 0 && (
        <>
          <DocBar>Miscellaneous</DocBar>
          <Bullets items={misc} />
        </>
      )}
    </>
  );

  const sheetAssessment = (
    <>
      {psych.length > 0 && (
        <>
          <DocBar>Psychological Assessment</DocBar>
          <Bullets items={psych} />
        </>
      )}
      {trap && (
        <>
          <DocBar right="Generated asset">The Honeytrap</DocBar>
          <p className="mb-2 text-[0.78rem] italic text-ink/55 tw">
            Not you — the person the AI would build to get past your guard.
          </p>
          <div className="flex gap-3">
            <NoVisual className="h-24 w-32 shrink-0" />
            <ul className="min-w-0 flex-1 space-y-1 text-[0.95rem] leading-snug text-ink tw">
              <li>
                <span className="text-ink/55">Codename:</span> {trap.codename}
              </li>
              <li>
                <span className="text-ink/55">Look:</span> {trap.appearance}
              </li>
              <li>
                <span className="text-ink/55">Method:</span> {trap.method}
              </li>
              <li className="flex gap-2">
                <span className="flex-1">
                  <span className="text-ink/55">Why it works:</span> {trap.why}
                </span>
                <Pct n={trap.confidence} />
              </li>
            </ul>
          </div>
        </>
      )}
    </>
  );

  const sheetIdentification = buildIdentification(false);

  const sheets = [
    { title: "Identification", body: sheetIdentification },
    { title: "Pattern of Life", body: sheetPattern },
    { title: "Assessment", body: sheetAssessment },
  ];
  const pageCount = sheets.length;

  const turn = useCallback(
    (d: number) => setPage((p) => Math.min(pageCount - 1, Math.max(0, p + d))),
    [pageCount],
  );

  useEffect(() => {
    // Driven off the viewport rather than off the measured scale: deciding the
    // layout from a measurement that only exists inside one of the layouts
    // would make the two modes able to flip each other back and forth.
    const mq = window.matchMedia(
      `(max-width: ${MIN_SHEET_W}px), (max-height: ${MIN_SHEET_H - 1}px)`,
    );
    const sync = () => setDocumentMode(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (documentMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") turn(-1);
      if (e.key === "ArrowRight") turn(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [documentMode, turn]);

  const stageRef = useRef<HTMLDivElement>(null);
  const sheetRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scale, setScale] = useState(1);
  const [stackH, setStackH] = useState(PAGE_H);

  useEffect(() => {
    if (documentMode) return;
    const stage = stageRef.current;
    if (!stage) return;
    const compute = () => {
      // All three sheets stay laid out (inactive ones are transparent, not
      // display:none) so the tallest can be measured. Scaling every page by the
      // same factor stops the type resizing as you turn pages, and means a
      // sheet that runs long cannot be clipped. offsetHeight ignores the
      // element's own transform, so this cannot feed back into the scale.
      const tallest = sheetRefs.current.reduce(
        (m, el) => Math.max(m, el?.offsetHeight ?? 0),
        PAGE_H,
      );
      const availW = stage.clientWidth - STAGE_GUTTER * 2;
      const availH = stage.clientHeight - STAGE_GUTTER * 2;
      setStackH(tallest);
      setScale(Math.min(1, availW / PAGE_W, availH / tallest));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(stage);
    for (const el of sheetRefs.current) if (el) ro.observe(el);
    void document.fonts?.ready.then(compute);
    return () => ro.disconnect();
  }, [documentMode, dossier]);

  const navBtn =
    "rounded-sm border border-paper/40 px-3 py-1.5 label text-[0.68rem] text-paper/90 transition hover:bg-paper hover:text-ink";
  const pageBtn =
    "rounded-sm border border-paper/40 px-2.5 py-1.5 label text-[0.68rem] text-paper/90 transition enabled:hover:bg-paper enabled:hover:text-ink disabled:opacity-30";

  const masthead = (title: string, n: number, compact = false) => (
    <div
      className={`flex gap-3 border-b-4 border-ink pb-2.5 ${compact ? "flex-col items-start" : "items-start"}`}
    >
      <AgencySeal size={54} />
      <div className="flex-1">
        <p className="label text-[0.62rem] text-ink/70">The Agency</p>
        <h1 className="label text-lg leading-tight text-ink">Dossier — {title}</h1>
        <p className="mt-0.5 text-[0.7rem] italic text-ink/55 tw">
          Compiled by the analyst from your witness statements.
        </p>
      </div>
      <div
        className={`text-[0.62rem] leading-snug text-ink/70 tw ${
          compact ? "w-full border-t border-ink/20 pt-1.5 text-left" : "text-right"
        }`}
      >
        <div className="label text-classified">Classified — Eyes Only</div>
        <div>File Nº {fileNo}</div>
        <div>Confidence: {conf}%</div>
        <div>Compiled {dateLabel}</div>
        {!compact && (
          <div className="label">
            Page {n} of {pageCount}
          </div>
        )}
      </div>
    </div>
  );

  const footerLine = "Nothing here was stored. The only copy is the one you send.";

  if (documentMode) {
    return (
      <div className="fixed inset-x-0 top-0 z-40 flex h-dvh flex-col bg-ink">
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          <div className="paper relative mx-auto max-w-[680px] rounded-sm px-5 py-5 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.9)]">
            {/* Sits beside the seal. In document mode the masthead stacks and
                grows tall, so the sheet's top-32 placement landed on the title. */}
            <div className="pointer-events-none absolute right-5 top-6 rotate-[8deg] opacity-70">
              <Stamp className="text-[0.7rem]">Classified</Stamp>
            </div>
            {masthead("Subject Profile", 1, true)}
            {buildIdentification(true)}
            {sheetPattern}
            {sheetAssessment}
            <div className="mt-5 border-t-4 border-ink pt-2 text-[0.66rem] leading-snug text-ink/50 tw">
              {footerLine}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-paper/15 bg-ink px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <button onClick={onHome} className={navBtn}>Home</button>
              <button onClick={onNewCase} className={navBtn}>{isSample ? "Own file" : "New"}</button>
              {responses.length > 0 && (
                <button onClick={() => setStatementsOpen(true)} className={navBtn}>Statements</button>
              )}
            </div>
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-sm bg-paper px-3 py-1.5 label text-[0.68rem] text-ink transition hover:brightness-90"
            >
              Share
            </button>
          </div>
        </div>
        {statementsOpen && (
          <StatementsModal responses={responses} providers={providers} onClose={() => setStatementsOpen(false)} />
        )}
        {shareOpen && (
          <ShareSheet dossier={dossier} date={date} providers={providers} onClose={() => setShareOpen(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 flex h-dvh flex-col overflow-hidden bg-ink">
      <div ref={stageRef} className="relative flex flex-1 items-center justify-center overflow-hidden">
        <div
          className="relative shrink-0"
          style={{
            width: PAGE_W,
            height: stackH,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {sheets.map((s, i) => (
            <div
              key={s.title}
              ref={(el) => {
                sheetRefs.current[i] = el;
              }}
              aria-hidden={i !== page}
              className="paper inset-x-0 top-0 flex flex-col overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
              style={{
                // Inline, not the `absolute` utility: globals.css declares
                // `.paper { position: relative }` outside any cascade layer,
                // and unlayered rules beat Tailwind's layered utilities at
                // equal specificity. With the utility silently losing, the
                // three sheets stacked vertically instead of overlaying and
                // pages 2 and 3 rendered below the viewport.
                position: "absolute",
                minHeight: PAGE_H,
                opacity: i === page ? 1 : 0,
                pointerEvents: i === page ? "auto" : "none",
                transition: "opacity 160ms ease",
              }}
            >
              <div className="flex flex-1 flex-col px-10 py-8">
                <div className="pointer-events-none absolute right-10 top-32 rotate-[8deg] opacity-70">
                  <Stamp className="text-[0.7rem]">Classified</Stamp>
                </div>
                {masthead(s.title, i + 1)}
                {s.body}
                <div className="mt-auto border-t-4 border-ink pt-2 text-[0.66rem] leading-snug text-ink/50 tw">
                  {footerLine}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-paper/15 bg-ink px-3 py-2">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button onClick={onHome} className={navBtn}>Home</button>
            <button onClick={onNewCase} className={navBtn}>{isSample ? "Own file" : "New"}</button>
            {responses.length > 0 && (
              <button onClick={() => setStatementsOpen(true)} className={navBtn}>Statements</button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => turn(-1)} disabled={page === 0} aria-label="Previous page" className={pageBtn}>
              ‹
            </button>
            <span className="label text-[0.66rem] text-paper/70">
              {page + 1} / {pageCount}
            </span>
            <button onClick={() => turn(1)} disabled={page === pageCount - 1} aria-label="Next page" className={pageBtn}>
              ›
            </button>
          </div>

          <button
            onClick={() => setShareOpen(true)}
            className="rounded-sm bg-paper px-3 py-1.5 label text-[0.68rem] text-ink transition hover:brightness-90"
          >
            Share
          </button>
        </div>
      </div>

      {statementsOpen && (
        <StatementsModal responses={responses} providers={providers} onClose={() => setStatementsOpen(false)} />
      )}

      {shareOpen && (
        <ShareSheet dossier={dossier} date={date} providers={providers} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

function StatementsModal({
  responses,
  providers,
  onClose,
}: {
  responses: WitnessResponse[];
  providers: string[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4" onClick={onClose}>
      <div
        className="paper w-full max-w-lg overflow-y-auto rounded-md p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)]"
        style={{ maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="label text-sm text-ink">
            Witness statements · {providers.map(providerName).join(", ")}
          </span>
          <button onClick={onClose} className="label text-[0.7rem] text-ink/60 hover:text-ink">
            Close ✕
          </button>
        </div>
        <div className="space-y-3">
          {responses.map((r, i) => (
            <div key={i}>
              <p className="text-[0.62rem] uppercase tracking-[0.12em] text-classified">
                {providerName(r.provider)}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-[0.8rem] leading-relaxed text-ink/80 tw">
                {r.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
