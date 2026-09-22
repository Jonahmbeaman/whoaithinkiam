"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dossier } from "@/lib/types";
import {
  renderShareCard,
  shareOrDownload,
  defaultExcerpt,
  type ShareFormat,
} from "@/lib/shareImage";
import { buildShareUrl } from "@/lib/shareLink";

export default function ShareSheet({
  dossier,
  date,
  providers,
  onClose,
}: {
  dossier: Dossier;
  date: string;
  providers: string[];
  onClose: () => void;
}) {
  const [format, setFormat] = useState<ShareFormat>("9:16");
  const [excerpt, setExcerpt] = useState<string>(defaultExcerpt(dossier));
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  // Built as soon as the sheet opens so the copy handler can write to the
  // clipboard synchronously. WebKit only honours a clipboard write that is
  // still associated with the user gesture, and awaiting buildShareUrl inside
  // the click breaks that association — it would reject with NotAllowedError
  // on iPhone, which is most of the people a link gets sent to.
  const [shareUrl, setShareUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    void buildShareUrl({ dossier, date, providers }).then((url) => {
      if (live) setShareUrl(url);
    });
    return () => {
      live = false;
    };
  }, [dossier, date, providers]);

  // Only non-identifying content is offered for sharing — never privacy hazards.
  const choices = useMemo(() => {
    const list: { label: string; text: string }[] = [];
    dossier.psychWeakness.slice(0, 3).forEach((t, i) =>
      list.push({ label: `Read ${i + 1}`, text: t.claim }),
    );
    dossier.typology.forEach((t) =>
      list.push({ label: t.value, text: t.take }),
    );
    dossier.misc.slice(0, 1).forEach((t) => list.push({ label: "Misc", text: t.claim }));
    return list.filter((c) => c.text && c.text.trim());
  }, [dossier]);

  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    renderShareCard(dossier, format, excerpt)
      .then((blob) => {
        if (!alive) return;
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch(() => setStatus("Couldn't render the card."));
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [dossier, format, excerpt]);

  async function handleShare() {
    setBusy(true);
    setStatus("");
    try {
      const blob = await renderShareCard(dossier, format, excerpt);
      const result = await shareOrDownload(blob, dossier.codeName);
      if (result === "downloaded") setStatus("Saved to your device.");
      else if (result === "failed") setStatus("The handoff failed.");
      else setStatus("");
    } catch {
      // renderShareCard rejects when the canvas is unsupported or toBlob
      // returns null, which a low-end phone will do on a 1080x1920 buffer
      // under memory pressure. Without this the button reset itself and said
      // nothing at all, which reads as a dead control.
      setStatus("Couldn't build the image. Send the link instead.");
    } finally {
      setBusy(false);
    }
  }

  // The link carries the whole dossier compressed into the URL fragment, so
  // nothing is uploaded and there is no server-side copy to leak.
  function handleCopyLink() {
    setStatus("");
    if (shareUrl === undefined) {
      setStatus("Still packing the file. One moment.");
      return;
    }
    if (shareUrl === null) {
      setStatus(
        typeof CompressionStream === "undefined"
          ? "This browser can't build a link. Send the image instead."
          : "This file is too big to travel in a link — send the image.",
      );
      return;
    }
    // No await before this call: see the comment on shareUrl.
    navigator.clipboard.writeText(shareUrl).then(
      () =>
        setStatus("Link copied. It carries the file itself — nothing was uploaded."),
      () => setStatus("Couldn't copy the link."),
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/85 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="paper w-full max-w-md rounded-md p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="label text-sm text-ink">Share this file</span>
          <button
            onClick={onClose}
            className="label text-[0.7rem] text-olive hover:text-ink"
          >
            Close ✕
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          {(["9:16", "1:1"] as ShareFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`flex-1 rounded border-2 py-2 label text-[0.7rem] ${
                format === f
                  ? "border-signal bg-signal/10 text-signal"
                  : "border-ink/30 text-ink"
              }`}
            >
              {f === "9:16" ? "Story 9:16" : "Square 1:1"}
            </button>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {choices.map((c) => (
            <button
              key={c.label}
              onClick={() => setExcerpt(c.text)}
              className={`rounded border-2 px-2.5 py-1.5 label text-[0.6rem] ${
                excerpt === c.text
                  ? "border-signal bg-signal/10 text-signal"
                  : "border-ink/30 text-ink"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex justify-center rounded bg-ink/10 p-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Share card preview"
              className="max-h-[46vh] w-auto rounded shadow-lg"
            />
          ) : (
            <p className="py-10 label text-[0.7rem] text-olive">
              Developing print…
            </p>
          )}
        </div>

        {status && (
          <p className="mb-3 text-center text-[0.72rem] text-olive tw">
            {status}
          </p>
        )}

        <button
          onClick={handleShare}
          disabled={busy}
          className="w-full rounded-md bg-signal py-3.5 label text-sm text-ink transition enabled:hover:brightness-105 disabled:opacity-50"
        >
          {busy ? "Preparing…" : "Send / Save image"}
        </button>
        <button
          onClick={handleCopyLink}
          disabled={busy}
          className="mt-2 w-full rounded-md border-2 border-ink/30 py-3 label text-sm text-ink transition enabled:hover:border-signal enabled:hover:text-signal disabled:opacity-50"
        >
          Copy live link
        </button>
        <p className="mt-2 text-center text-[0.62rem] text-olive tw">
          The link holds the whole file inside the URL itself. Nothing was
          uploaded, and nothing was stored.
        </p>
      </div>
    </div>
  );
}
