"use client";

import { useEffect, useState } from "react";
import type {
  CaseFile,
  Dossier,
  SynthesizeRequest,
  SynthesizeResponse,
  WitnessResponse,
} from "@/lib/types";
import {
  deleteCase,
  exportHistory,
  getMostRecent,
  importHistory,
  loadHistory,
  saveCase,
} from "@/lib/storage";
import { SAMPLE_DOSSIER } from "@/lib/sample";
import { readSharedCase } from "@/lib/shareLink";
import Landing from "@/components/Landing";
import WitnessPicker from "@/components/WitnessPicker";
import Intake from "@/components/Intake";
import DossierView from "@/components/DossierView";
import CaseHistory from "@/components/CaseHistory";

type Step = "landing" | "picker" | "intake" | "dossier";

interface Viewing {
  id: string; // stored CaseFile id ("" for the specimen)
  dossier: Dossier;
  providers: string[];
  date: string;
  responses: WitnessResponse[];
  isSample: boolean;
}

const MIN_CHARS = 120;

export default function Page() {
  const [step, setStep] = useState<Step>("landing");
  const [selected, setSelected] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CaseFile[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    // A shared link carries the entire case file in the URL fragment. Render it
    // read-only — someone else's dossier never enters this device's history.
    void readSharedCase(window.location.hash).then((shared) => {
      if (!shared) return;
      setViewing({
        id: "",
        dossier: shared.dossier,
        providers: shared.providers,
        date: shared.date,
        responses: [],
        isSample: false,
      });
      setStep("dossier");
    });
  }, []);

  function refreshHistory() {
    setHistory(loadHistory());
  }

  function begin() {
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
    setViewing({
      id: "",
      dossier: SAMPLE_DOSSIER,
      providers: ["chatgpt", "claude"],
      date: new Date().toISOString(),
      responses: [],
      isSample: true,
    });
    setStep("dossier");
  }

  function openCase(file: CaseFile) {
    setShowHistory(false);
    setViewing({
      id: file.id,
      dossier: file.dossier,
      providers: file.providers,
      date: file.date,
      responses: file.responses,
      isSample: false,
    });
    setStep("dossier");
  }

  function destroyCurrent() {
    if (viewing?.id) {
      deleteCase(viewing.id);
      refreshHistory();
    }
    setViewing(null);
    setStep("landing");
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
      collectedAt: new Date().toISOString(),
    }));

    const prev = getMostRecent();
    const payload: SynthesizeRequest = {
      responses: collected.map((r) => ({ provider: r.provider, text: r.text })),
      previousDossier: prev
        ? { date: prev.date, summaryJson: prev.dossier }
        : null,
    };

    setCompiling(true);
    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as SynthesizeResponse;
      if (!data.ok) {
        setError(data.error);
        return;
      }
      const saved = saveCase({
        dossier: data.dossier,
        providers: usable,
        responses: collected,
      });
      refreshHistory();
      setViewing({
        id: saved.id,
        dossier: saved.dossier,
        providers: saved.providers,
        date: saved.date,
        responses: saved.responses,
        isSample: false,
      });
      setStep("dossier");
    } catch {
      setError(
        "Couldn't reach The Agency. Check your connection and try again.",
      );
    } finally {
      setCompiling(false);
    }
  }

  async function handleImport(file: File) {
    try {
      await importHistory(file);
      refreshHistory();
    } catch {
      // Malformed file — silently ignore.
    }
  }

  function handleDelete(id: string) {
    deleteCase(id);
    refreshHistory();
  }

  return (
    <main className="min-h-dvh">
      {step === "landing" && (
        <Landing
          onBegin={begin}
          onViewSample={viewSample}
          onOpenHistory={() => setShowHistory(true)}
          historyCount={history.length}
        />
      )}

      {step === "picker" && (
        <WitnessPicker
          selected={selected}
          onToggle={toggle}
          onContinue={() => setStep("intake")}
          onBack={() => setStep("landing")}
        />
      )}

      {step === "intake" && (
        <Intake
          selected={selected}
          responses={responses}
          onChange={(id, text) => setResponses((r) => ({ ...r, [id]: text }))}
          onCompile={compile}
          onBack={() => setStep("picker")}
          compiling={compiling}
          error={error}
        />
      )}

      {step === "dossier" && viewing && (
        <DossierView
          dossier={viewing.dossier}
          providers={viewing.providers}
          date={viewing.date}
          responses={viewing.responses}
          isSample={viewing.isSample}
          onNewCase={begin}
          onHome={() => setStep("landing")}
          onDestroy={destroyCurrent}
        />
      )}

      {showHistory && (
        <CaseHistory
          files={history}
          onOpen={openCase}
          onDelete={handleDelete}
          onExport={exportHistory}
          onImport={handleImport}
          onClose={() => setShowHistory(false)}
        />
      )}
    </main>
  );
}
