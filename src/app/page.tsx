"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  OpenFile,
  SynthesizeRequest,
  SynthesizeResponse,
  WitnessResponse,
} from "@/lib/types";
import { normalizeDossier } from "@/lib/normalize";
import { SAMPLE_DOSSIER } from "@/lib/sample";
import { readSharedCase } from "@/lib/shareLink";
import Landing from "@/components/Landing";
import WitnessPicker from "@/components/WitnessPicker";
import Intake from "@/components/Intake";
import DossierView from "@/components/DossierView";
import DossierBoundary from "@/components/DossierBoundary";

// The whole app is one screen at a time. There is no router and no storage:
// a compiled file lives in `open` for the life of the tab and nowhere else.
// Closing the tab is the delete button.
type Step = "landing" | "picker" | "intake" | "dossier";

const MIN_CHARS = 120;

export default function Page() {
  const [step, setStep] = useState<Step>("landing");
  const [selected, setSelected] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<OpenFile | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A compile can run for minutes and every exit from the intake screen stays
  // clickable throughout, so a request routinely outlives the intent behind
  // it. `run` identifies the attempt the UI is still waiting for; anything
  // else that comes back is discarded.
  //
  // This must be bumped by EVERY route out of a running compile, not just by
  // starting a new case. An earlier version only covered begin(), which left
  // the two original bugs fully intact via the Back button: `compiling` stayed
  // true so the button read "Compiling the file…" forever, and when the stale
  // response landed it dragged the reader into a dossier built from witnesses
  // they had already changed.
  const run = useRef(0);
  const inflight = useRef<AbortController | null>(null);

  /** Give up on whatever compile is running and let the UI go idle. */
  const abandon = useCallback(() => {
    run.current += 1;
    inflight.current?.abort();
    inflight.current = null;
    setCompiling(false);
  }, []);

  useEffect(() => {
    // A shared link carries the entire file in the URL fragment. Fragments are
    // never sent to a server, so this is read entirely in the recipient's tab.
    // It is untrusted input from another device, possibly an older build, so it
    // goes through the same normaliser as a fresh compile.
    void readSharedCase(window.location.hash).then((shared) => {
      if (!shared) return;
      const dossier = normalizeDossier(shared.dossier);
      if (!dossier) return;
      setOpen({
        dossier,
        providers: Array.isArray(shared.providers) ? shared.providers : [],
        date: typeof shared.date === "string" ? shared.date : "",
        responses: [],
        isSample: false,
        fromLink: true,
      });
      setStep("dossier");
    });
  }, []);

  function begin() {
    abandon();
    setSelected([]);
    setResponses({});
    setError(null);
    setStep("picker");
  }

  function toggle(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }

  function viewSample() {
    // Also abandons: without it an in-flight compile lands later and swaps the
    // specimen out from under the reader mid-sentence.
    abandon();
    setOpen({
      dossier: SAMPLE_DOSSIER,
      providers: ["chatgpt", "claude"],
      date: new Date().toISOString(),
      responses: [],
      isSample: true,
      fromLink: false,
    });
    setStep("dossier");
  }

  async function compile() {
    setError(null);
    const usable = selected.filter(
      (id) => (responses[id]?.trim().length ?? 0) >= MIN_CHARS,
    );
    if (usable.length === 0) {
      setError("Collect at least one full statement before compiling.");
      return;
    }

    const collected: WitnessResponse[] = usable.map((id) => ({
      provider: id,
      text: responses[id].trim(),
    }));

    const payload: SynthesizeRequest = { responses: collected };

    const mine = ++run.current;
    const current = () => run.current === mine;

    // fetch has no default timeout. A phone that loses connectivity mid-request
    // — a tunnel, a wifi-to-cellular handoff — leaves the promise pending for
    // ever, and the only escape is a reload, which throws away every statement
    // the user pasted. Bounded to the server's own ceiling.
    const controller = new AbortController();
    inflight.current = controller;
    const timeout = setTimeout(() => controller.abort(), 300_000);

    setCompiling(true);
    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = (await res.json()) as SynthesizeResponse;
      if (!current()) return;
      if (!data.ok) {
        setError(data.error);
        return;
      }
      const dossier = normalizeDossier(data.dossier);
      if (!dossier) {
        setError("The report came back unreadable. Try again.");
        return;
      }
      setOpen({
        dossier,
        providers: usable,
        date: new Date().toISOString(),
        responses: collected,
        isSample: false,
        fromLink: false,
      });
      setStep("dossier");
    } catch {
      if (current()) {
        setError("The Agency did not answer. Check your connection.");
      }
    } finally {
      clearTimeout(timeout);
      if (inflight.current === controller) inflight.current = null;
      if (current()) setCompiling(false);
    }
  }

  return (
    <main className="min-h-dvh">
      {step === "landing" && (
        <Landing onBegin={begin} onViewSample={viewSample} />
      )}

      {step === "picker" && (
        <WitnessPicker
          selected={selected}
          onToggle={toggle}
          onContinue={() => setStep("intake")}
          onBack={() => {
            abandon();
            setStep("landing");
          }}
        />
      )}

      {step === "intake" && (
        <Intake
          selected={selected}
          responses={responses}
          onChange={(id, text) => setResponses((r) => ({ ...r, [id]: text }))}
          onCompile={compile}
          onBack={() => {
            abandon();
            setStep("picker");
          }}
          compiling={compiling}
          error={error}
        />
      )}

      {step === "dossier" && open && (
        <DossierBoundary onReset={() => setStep("landing")}>
          <DossierView
            dossier={open.dossier}
            providers={open.providers}
            date={open.date}
            responses={open.responses}
            isSample={open.isSample}
            fromLink={open.fromLink}
            onNewCase={begin}
            onHome={() => {
              abandon();
              setStep("landing");
            }}
          />
        </DossierBoundary>
      )}
    </main>
  );
}
