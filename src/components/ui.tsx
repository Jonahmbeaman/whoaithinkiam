import React from "react";

// Presentational primitives for the case-file aesthetic. Every one is pure:
// props in, markup out, no state and no data access. Visual language lives in
// globals.css under the `stamp`, `torn`, and `label` classes.
//
// This file holds only what the dossier actually renders. Seven further
// primitives (SignalBar, SectionBar, FieldCell, SilhouetteBox, TagRow,
// ProfileBlock, Fingerprints) were built for an earlier multi-page layout and
// deleted once the design collapsed to a single sheet.

/** Rubber-stamp text. */
export function Stamp({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`stamp inline-block text-sm ${className}`}>{children}</span>
  );
}

/** Ragged horizontal rule — a torn paper edge between sections. */
export function TornDivider({ className = "" }: { className?: string }) {
  return <div className={`torn ${className}`} aria-hidden="true" />;
}

/**
 * Invented agency crest: a 16-point compass star in a double ring. Deliberately
 * generic — it must not resemble any real intelligence service's insignia.
 * Drawn as SVG rather than shipped as an image so it stays sharp at any size
 * and costs no extra network request.
 */
export function AgencySeal({ size = 58 }: { size?: number }) {
  const starPoints: string[] = [];
  for (let i = 0; i < 32; i++) {
    const angle = (i * Math.PI) / 16 - Math.PI / 2;
    const radius = i % 2 === 0 ? 22 : 8; // alternating long/short points
    starPoints.push(
      `${(50 + radius * Math.cos(angle)).toFixed(1)},${(50 + radius * Math.sin(angle)).toFixed(1)}`,
    );
  }
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="text-ink"
      aria-hidden
    >
      <defs>
        {/* Invisible arcs that the curved caption text rides along. */}
        <path id="seal-top" d="M15,50 A35,35 0 0 1 85,50" fill="none" />
        <path id="seal-bot" d="M18,50 A32,32 0 0 0 82,50" fill="none" />
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="30" fill="currentColor" />
      <polygon points={starPoints.join(" ")} fill="var(--color-paper)" />
      <circle cx="50" cy="50" r="3.5" fill="currentColor" />
      <text
        fill="currentColor"
        fontSize="6.4"
        fontWeight="700"
        letterSpacing="1.1"
        style={{ fontFamily: "var(--font-stamp)" }}
      >
        <textPath href="#seal-top" startOffset="5%">
          THE AGENCY
        </textPath>
      </text>
      <text
        fill="currentColor"
        fontSize="5.6"
        fontWeight="700"
        letterSpacing="0.8"
        style={{ fontFamily: "var(--font-stamp)" }}
      >
        <textPath href="#seal-bot" startOffset="26%">
          BEHAVIORAL INTELLIGENCE
        </textPath>
      </text>
    </svg>
  );
}

/** Inverted section header, e.g. PROFILE. `right` holds a small annotation. */
export function DocBar({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between bg-ink px-3 py-1 text-paper">
      <span className="label text-[0.72rem]">{children}</span>
      {right && <span className="label text-[0.58rem] opacity-80">{right}</span>}
    </div>
  );
}

export interface GridItem {
  label: string;
  value: string;
  /** 0-100. Rendered only when present AND the value isn't the em-dash placeholder. */
  confidence?: number;
}

/**
 * The PROFILE table. Each cell carries its own certainty percentage, which is
 * the point: a dossier that states how sure it is about each line is honest in
 * a way one overall score isn't. Unknown values arrive as "—" and suppress the
 * percentage, so a blank field never masquerades as a confident one.
 */
export function FieldGrid({
  items,
  cols = 2,
}: {
  items: GridItem[];
  cols?: 1 | 2 | 3;
}) {
  const colClass =
    cols === 3 ? "grid-cols-3" : cols === 1 ? "grid-cols-1" : "grid-cols-2";
  return (
    <div className={`grid ${colClass} border-l border-t border-ink/70`}>
      {items.map((item, i) => (
        <div key={i} className="border-b border-r border-ink/70 px-2 py-1">
          <div className="flex items-baseline justify-between gap-1">
            <span className="min-w-0 truncate text-[0.62rem] uppercase tracking-[0.14em] text-ink/55">
              {item.label}
            </span>
            {typeof item.confidence === "number" && item.value !== "—" && (
              <span className="text-[0.62rem] font-bold text-classified tw">
                {item.confidence}%
              </span>
            )}
          </div>
          <div className="text-[0.95rem] font-bold leading-tight text-ink tw">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
