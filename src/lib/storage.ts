import type { CaseFile, Dossier, WitnessResponse } from "./types";

// All persistence is client-side. Your file, your filing cabinet, we keep
// nothing. Case history lives under one localStorage key as a dated array.
const KEY = "dossier.caseHistory.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadHistory(): CaseFile[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CaseFile[];
    if (!Array.isArray(parsed)) return [];
    // Newest first.
    return parsed.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export function getMostRecent(): CaseFile | null {
  return loadHistory()[0] ?? null;
}

function makeId(date: string): string {
  return `${date}-${Math.random().toString(36).slice(2, 8)}`;
}

export function saveCase(input: {
  dossier: Dossier;
  providers: string[];
  responses: WitnessResponse[];
}): CaseFile {
  const date = new Date().toISOString();
  const file: CaseFile = {
    id: makeId(date),
    date,
    codeName: input.dossier.codeName,
    providers: input.providers,
    dossier: input.dossier,
    responses: input.responses,
  };
  if (isBrowser()) {
    const next = [file, ...loadHistory()];
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Quota or serialization failure — non-fatal; the dossier still renders.
    }
  }
  return file;
}

export function deleteCase(id: string): void {
  if (!isBrowser()) return;
  const next = loadHistory().filter((c) => c.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

// ---- export / import (the privacy story + portability) ----

export function exportHistory(): void {
  if (!isBrowser()) return;
  const data = JSON.stringify(loadHistory(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dossier-case-history-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importHistory(file: File): Promise<number> {
  if (!isBrowser()) return 0;
  const text = await file.text();
  const incoming = JSON.parse(text) as CaseFile[];
  if (!Array.isArray(incoming)) throw new Error("Not a case-history file.");
  // Merge by id, incoming wins, newest first.
  const existing = loadHistory();
  const byId = new Map<string, CaseFile>();
  for (const c of [...existing, ...incoming]) byId.set(c.id, c);
  const merged = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
  window.localStorage.setItem(KEY, JSON.stringify(merged));
  return incoming.length;
}
