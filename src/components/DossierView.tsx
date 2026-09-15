"use client";

import { useEffect, useRef, useState } from "react";
import type { Dossier, Rated, WitnessResponse } from "@/lib/types";
import { providerName } from "@/lib/providers";
import { AgencySeal, DocBar, FieldGrid, Stamp, type GridItem } from "./ui";
import ShareSheet from "./ShareSheet";

// Donate button is hidden until there's a real link to point at. Restore the
// <a> in the nav row alongside the other navBtn buttons when you have one.

// The dossier is a fixed US-Letter sheet (8.5×11 in @ 96dpi). It never scrolls;
// it scales to fit the viewport.
const PAGE_W = 816;
const PAGE_H = 1056;

const dash = (v?: string) =>
  v && v.trim() && v.trim().toUpperCase() !== "UNKNOWN" ? v : "—";

function Pct({ n }: { n?: number }) {
  if (typeof n !== "number") return null;
  return <span className="shrink-0 text-[0.7rem] font-bold text-classified tw">{n}%</span>;
}

function Numbered({ items }: { items: Rated[] }) {
  return (
    <ol className="space-y-1">
      {items.map((r, i) => (
        <li key={i} className="flex gap-2 text-[0.8rem] leading-snug text-ink tw">
          <span className="w-4 shrink-0 text-right text-ink/60">{i + 1}.</span>
          <span className="flex-1">{r.claim}</span>
          <Pct n={r.confidence} />
        </li>
      ))}
    </ol>
  );
}

function Bullets({ items }: { items: Rated[] }) {
  return (
    <ul className="space-y-1">
      {items.map((r, i) => (
        <li key={i} className="flex gap-2 text-[0.8rem] leading-snug text-ink tw">
          <span className="text-ink/40">–</span>
          <span className="flex-1">{r.claim}</span>
          <Pct n={r.confidence} />
        </li>
      ))}
    </ul>
  );
}

// stats.fm-style listening clock: 24 hourly spokes radiating from the center.
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
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-36" aria-label="Activity by hour">
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

function GenBox({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 border border-ink/40 bg-ink/5 p-2 text-center">
      <div className="text-[0.55rem] uppercase tracking-[0.14em] text-ink/60">{title}</div>
      <div className="text-[0.58rem] leading-snug text-ink/50 tw">{sub}</div>
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
  onDestroy,
  isSample = false,
}: {
  dossier: Dossier;
  providers: string[];
  date: string;
  responses: WitnessResponse[];
  onNewCase: () => void;
  onHome: () => void;
  onDestroy?: () => void;
  isSample?: boolean;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [bribeOpen, setBribeOpen] = useState(false);
  const [statementsOpen, setStatementsOpen] = useState(false);

  // Scale the fixed Letter sheet to fit the viewport (never upscale past 1:1).
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setScale(Math.min(1, Math.min((w - 12) / PAGE_W, (h - 12) / PAGE_H)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    bi("Est. Age", b.birthday),
    bi("Gender", b.sex),
    bi("Nationality", b.nationality),
    bi("Location", b.location),
    bi("Occupation", b.occupation),
    bi("Education", b.education),
    bi("Languages", b.languages),
    bi("Status", b.relationshipStatus),
  ];

  const typ = (m: RegExp) => dossier.typology.find((t) => m.test(t.system));
  const mbti = typ(/16|personalit|mbti/i);
  const arch = typ(/archetype/i);
  const zod = typ(/zodiac/i);
  const astro = dossier.astrology;
  const sun = astro?.sun ?? (zod ? { value: zod.value, confidence: zod.confidence } : undefined);
  const trap = dossier.honeytrap;
  // Render the dial ONLY when the analyst actually returned 24 hours. This used
  // to fall back to a hardcoded night-owl pattern, which showed an invented
  // daily rhythm as though it had been inferred — the exact failure the brief
  // forbids. No data, no dial.
  const clock =
    dossier.activityClock?.length === 24 ? dossier.activityClock : null;

  // Cap list lengths so the document always fits one page.
  const info = dossier.patternOfLife.slice(0, 5);
  const psych = dossier.psychWeakness.slice(0, 5);

  const navBtn = "rounded-sm border border-paper/40 px-3 py-1.5 label text-[0.68rem] text-paper/90 transition hover:bg-paper hover:text-ink";

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-ink">
      {/* Letter stage — scales the fixed sheet to fit, no scrolling */}
      <div ref={stageRef} className="relative flex flex-1 items-center justify-center overflow-hidden">
        <div
          className="paper relative shrink-0 overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
          style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "center center" }}
        >
          <div className="flex h-full flex-col px-10 py-8">
            <div className="pointer-events-none absolute right-10 top-32 rotate-[8deg] opacity-70">
              <Stamp className="text-[0.7rem]">Confidential</Stamp>
            </div>

            {/* Masthead */}
            <div className="flex items-start gap-3 border-b-4 border-ink pb-2.5">
              <AgencySeal size={54} />
              <div className="flex-1">
                <p className="label text-[0.6rem] text-ink/70">Confidential Records Bureau</p>
                <h1 className="label text-lg leading-tight text-ink">Dossier — Subject Profile</h1>
                <p className="mt-0.5 text-[0.62rem] italic text-ink/55 tw">
                  Synthesized by the Inspector from your witness statements.
                </p>
              </div>
              <div className="text-right text-[0.55rem] leading-snug text-ink/70 tw">
                <div className="label text-classified">Confidential — Eyes Only</div>
                <div>File Nº {fileNo}</div>
                <div>Confidence: {conf}%</div>
                <div>Compiled {dateLabel}</div>
              </div>
            </div>

            {/* Subject */}
            <div className="mt-2">
              <div className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/55">Subject</div>
              <div className="label text-3xl leading-none text-ink">{dash(b.name?.value)}</div>
            </div>

            {/* Profile + PFP */}
            <DocBar right={`Confidence ${conf}%`}>Profile</DocBar>
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <FieldGrid items={profileItems} cols={2} />
              </div>
              <div className="w-36 shrink-0">
                <GenBox title="Reconstructed PFP" sub="Best-guess likeness assembled from memory." />
              </div>
            </div>

            {/* Two-column body */}
            <div className="mt-1 grid grid-cols-2 gap-x-6">
              <div>
                {info.length > 0 && (
                  <>
                    <DocBar>Information</DocBar>
                    <p className="mb-1.5 text-[0.66rem] italic text-ink/55 tw">
                      How to reach him, read him, or move him.
                    </p>
                    <Numbered items={info} />
                  </>
                )}
                {psych.length > 0 && (
                  <>
                    <DocBar>Psychological Assessment</DocBar>
                    <Bullets items={psych} />
                  </>
                )}
              </div>

              <div>
                <DocBar>Personality Type</DocBar>
                <ul className="space-y-1 text-[0.8rem] leading-snug text-ink tw">
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
                    <p className="text-center text-[0.62rem] italic text-ink/55 tw">
                      Activity by hour, 12A at top.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Honeytrap */}
            {trap && (
              <>
                <DocBar right="Generated asset">The Honeytrap</DocBar>
                <p className="mb-1.5 text-[0.66rem] italic text-ink/55 tw">
                  Not you — the person the AI would build to get past your guard.
                </p>
                <div className="flex gap-3">
                  <div className="h-24 w-32 shrink-0">
                    <GenBox title="Generated Portrait" sub="AI-rendered face." />
                  </div>
                  <ul className="min-w-0 flex-1 space-y-0.5 text-[0.8rem] leading-snug text-ink tw">
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

            {/* Footer — pinned to bottom of the sheet */}
            <div className="mt-auto border-t-4 border-ink pt-2 text-[0.56rem] leading-snug text-ink/50 tw">
              Read on your device. We store none of this. Destroy it when done.
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar (on the black margin, outside the letter) */}
      <div className="shrink-0 border-t border-paper/15 bg-ink px-3 py-2">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button onClick={onHome} className={navBtn}>Home</button>
            <button onClick={onNewCase} className={navBtn}>{isSample ? "Own file" : "New"}</button>
            {responses.length > 0 && (
              <button onClick={() => setStatementsOpen(true)} className={navBtn}>Statements</button>
            )}
            {onDestroy && (
              <button
                onClick={onDestroy}
                className="rounded-sm border border-classified px-3 py-1.5 label text-[0.68rem] text-classified transition hover:bg-classified hover:text-paper"
              >
                Burn file
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setBribeOpen(true)}
              className="rounded-sm border border-classified bg-classified/10 px-3 py-1.5 label text-[0.68rem] text-classified transition hover:bg-classified hover:text-paper"
            >
              🔍 Pay the investigator
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-sm bg-paper px-3 py-1.5 label text-[0.68rem] text-ink transition hover:brightness-90"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Pay-the-investigator modal */}
      {bribeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4"
          onClick={() => setBribeOpen(false)}
        >
          <div className="paper w-full max-w-md rounded-md p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <span className="label text-sm text-classified">Pay the investigator</span>
              <button onClick={() => setBribeOpen(false)} className="label text-[0.7rem] text-ink/60 hover:text-ink">Close ✕</button>
            </div>
            <p className="mb-3 text-[0.8rem] leading-snug text-ink/80 tw">
              A deep web investigation built from what your bots revealed. Off by default.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-sm border-2 border-ink/30 p-3">
                <div className="label text-[0.68rem] text-ink">Use my own AI — free</div>
                <p className="mt-1 text-[0.7rem] leading-snug text-ink/60 tw">
                  Run it in a chatbot you already pay for, paste the result back.
                </p>
                <button className="mt-2 w-full rounded-sm bg-ink px-2 py-1.5 label text-[0.6rem] text-paper">Choose my AI ↗</button>
              </div>
              <div className="rounded-sm border-2 border-ink/30 p-3">
                <div className="label text-[0.68rem] text-ink">Pay the fee — Apple Pay</div>
                <p className="mt-1 text-[0.7rem] leading-snug text-ink/60 tw">
                  We run it server-side. Charge = cost of research + $0.05.
                </p>
                <button className="mt-2 w-full rounded-sm bg-classified px-2 py-1.5 label text-[0.6rem] text-paper">Pay &amp; investigate</button>
              </div>
            </div>
            <p className="mt-2 text-[0.58rem] italic text-ink/45 tw">
              Feature in progress — these buttons aren&apos;t wired to the backend yet.
            </p>
          </div>
        </div>
      )}

      {/* Original statements modal */}
      {statementsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4"
          onClick={() => setStatementsOpen(false)}
        >
          <div className="paper w-full max-w-lg overflow-y-auto rounded-md p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)]" style={{ maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <span className="label text-sm text-ink">Original statements · {providers.map(providerName).join(", ")}</span>
              <button onClick={() => setStatementsOpen(false)} className="label text-[0.7rem] text-ink/60 hover:text-ink">Close ✕</button>
            </div>
            <div className="space-y-3">
              {responses.map((r, i) => (
                <div key={i}>
                  <p className="text-[0.6rem] uppercase tracking-[0.12em] text-classified">{providerName(r.provider)}</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-[0.74rem] leading-relaxed text-ink/80 tw">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {shareOpen && <ShareSheet
          dossier={dossier}
          date={date}
          providers={providers}
          onClose={() => setShareOpen(false)}
        />}
    </div>
  );
}
