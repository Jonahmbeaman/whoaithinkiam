import React from "react";

// Shared espionage primitives.

export function Stamp({
  children,
  slam = false,
  className = "",
}: {
  children: React.ReactNode;
  slam?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`stamp inline-block text-sm ${slam ? "stamp-slam" : ""} ${className}`}
    >
      {children}
    </span>
  );
}

// Orange classification banner (top of the file).
export function SignalBar({
  left,
  right,
}: {
  left: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="bar-signal flex items-center justify-between px-4 py-1.5 pr-6 text-[0.7rem]">
      <span>{left}</span>
      {right && <span className="text-[0.62rem] opacity-80">{right}</span>}
    </div>
  );
}

// Plain typed section heading with a hairline rule — reads like a document.
export function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center gap-3">
      <span className="label whitespace-nowrap text-[0.66rem] text-ink">
        {children}
      </span>
      <span className="h-px flex-1 bg-ink/25" aria-hidden />
    </div>
  );
}

export function TornDivider({ className = "" }: { className?: string }) {
  return <div className={`torn ${className}`} aria-hidden="true" />;
}

const REDACTED = "REDACTED";

// A single labeled field cell. `flavor` marks playful, cannot-actually-know
// values so they read as in-character flourishes (orange italic) rather than
// facts. A value of "REDACTED" renders a black bar.
export function FieldCell({
  label,
  value,
  flavor = false,
  className = "",
}: {
  label: string;
  value: string;
  flavor?: boolean;
  className?: string;
}) {
  const isRedacted = value.trim().toUpperCase() === REDACTED;
  return (
    <div className={`field-cell px-2.5 py-1.5 ${className}`}>
      <div className="field-label text-[0.55rem] leading-tight">{label}</div>
      {isRedacted ? (
        <div className="mt-1 inline-block rounded-sm bg-ink px-6 py-0.5 text-[0.7rem] leading-tight text-ink select-none">
          ░░░░░
        </div>
      ) : (
        <div
          className={`field-value mt-0.5 text-[0.82rem] leading-tight ${
            flavor ? "italic text-signal" : ""
          }`}
        >
          {value}
        </div>
      )}
    </div>
  );
}

// Silhouette / "no visual on record" photo box.
export function SilhouetteBox({ label }: { label?: string }) {
  return (
    <div className="silhouette relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 64 80"
        className="h-3/5 w-auto opacity-25"
        aria-hidden="true"
      >
        <circle cx="32" cy="24" r="14" fill="#14120e" />
        <path d="M8 78 C8 52 24 44 32 44 C40 44 56 52 56 78 Z" fill="#14120e" />
      </svg>
      <span className="absolute bottom-1 left-0 right-0 text-center label text-[0.5rem] text-ink/50">
        {label ?? "No visual on record"}
      </span>
    </div>
  );
}

// Chip list for specialist fields / associations.
export function TagRow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <span
          key={i}
          className="rounded-sm border border-ink/40 bg-ink/5 px-2 py-0.5 text-[0.72rem] text-ink-soft tw"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

// A labeled prose block used inside the psychological profile.
export function ProfileBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="field-label mb-1 text-[0.6rem]">{label}</div>
      <p className="text-[0.92rem] leading-relaxed text-ink-soft tw">
        {children}
      </p>
    </div>
  );
}

// ===== CIA-form document primitives (one-page dossier) =====

// Generic agency seal — a compass-star crest, not a real-world logo.
export function AgencySeal({ size = 58 }: { size?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI) / 16 - Math.PI / 2;
    const r = i % 2 === 0 ? 22 : 8;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
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
        <path id="seal-top" d="M15,50 A35,35 0 0 1 85,50" fill="none" />
        <path id="seal-bot" d="M18,50 A32,32 0 0 0 82,50" fill="none" />
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="30" fill="currentColor" />
      <polygon points={pts.join(" ")} fill="var(--color-paper)" />
      <circle cx="50" cy="50" r="3.5" fill="currentColor" />
      <text
        fill="currentColor"
        fontSize="6.4"
        fontWeight="700"
        letterSpacing="1.1"
        style={{ fontFamily: "var(--font-stamp)" }}
      >
        <textPath href="#seal-top" startOffset="5%">
          CONFIDENTIAL RECORDS
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
          DOSSIER DIVISION
        </textPath>
      </text>
    </svg>
  );
}

// Black section bar, e.g. "PROFILE" / "INFORMATION".
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
  confidence?: number; // 0-100; shown when present and value is known
}

// Bordered label/value grid (the PROFILE table). Shows a certainty % per cell.
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
      {items.map((it, i) => (
        <div key={i} className="border-b border-r border-ink/70 px-2 py-1">
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-[0.5rem] uppercase tracking-[0.14em] text-ink/55">
              {it.label}
            </span>
            {typeof it.confidence === "number" && it.value !== "—" && (
              <span className="text-[0.5rem] font-bold text-classified tw">
                {it.confidence}%
              </span>
            )}
          </div>
          <div className="text-[0.85rem] font-bold leading-tight text-ink tw">
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// Decorative fingerprint strip.
export function Fingerprints({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 border border-ink/40 p-1">
          <svg viewBox="0 0 40 54" className="w-full opacity-70" aria-hidden>
            {Array.from({ length: 7 }).map((_, j) => (
              <ellipse
                key={j}
                cx="20"
                cy="27"
                rx={3.5 + j * 2.3}
                ry={4.5 + j * 3}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="0.7"
              />
            ))}
          </svg>
        </div>
      ))}
    </div>
  );
}
