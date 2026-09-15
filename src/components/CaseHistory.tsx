"use client";

import { useRef } from "react";
import type { CaseFile } from "@/lib/types";
import { providerName } from "@/lib/providers";

export default function CaseHistory({
  files,
  onOpen,
  onDelete,
  onExport,
  onImport,
  onClose,
}: {
  files: CaseFile[];
  onOpen: (file: CaseFile) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClose: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/85 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="paper flex max-h-[85vh] w-full max-w-md flex-col rounded-md p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="label text-sm text-ink">Case history</span>
          <button
            onClick={onClose}
            className="label text-[0.7rem] text-olive hover:text-ink"
          >
            Close ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {files.length === 0 ? (
            <p className="py-10 text-center text-[0.82rem] text-olive tw">
              The filing cabinet is empty. Compile your first dossier.
            </p>
          ) : (
            <ul className="space-y-2">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded border-2 border-ink/25 bg-ink/5 p-3"
                >
                  <button
                    onClick={() => onOpen(f)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-[0.9rem] font-bold tracking-[0.05em] text-ink [font-family:var(--font-stamp)]">
                      {f.codeName}
                    </p>
                    <p className="mt-0.5 label text-[0.58rem] text-teal">
                      {new Date(f.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {f.providers.map(providerName).join(", ") || "—"}
                    </p>
                  </button>
                  <button
                    onClick={() => onDelete(f.id)}
                    aria-label="Delete case"
                    className="label text-[0.6rem] text-classified hover:underline"
                  >
                    Destroy
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex gap-2 border-t-2 border-ink/15 pt-4">
          <button
            onClick={onExport}
            disabled={files.length === 0}
            className="flex-1 rounded border-2 border-ink/40 py-2 label text-[0.62rem] text-ink hover:border-ink disabled:opacity-40"
          >
            Export file
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="flex-1 rounded border-2 border-ink/40 py-2 label text-[0.62rem] text-ink hover:border-ink"
          >
            Import file
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
        </div>
        <p className="mt-2 text-center text-[0.6rem] text-olive tw">
          Your file, your filing cabinet — we keep nothing on a server.
        </p>
      </div>
    </div>
  );
}
