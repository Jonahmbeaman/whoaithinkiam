"use client";

import React from "react";
import { Stamp } from "./ui";

// ---------------------------------------------------------------------------
// A dossier can arrive from a share link written by an older build, so the
// renderer can meet a shape it does not expect. `normalizeDossier` catches
// nearly all of that at the boundary; this catches whatever it doesn't.
//
// The recovery action lives HERE rather than inside the sheet on purpose.
// Every control for abandoning a file used to sit inside the component that
// crashes, so a file that failed to render could not be dismissed from the
// page it broke. The way out has to survive the thing it is escaping.
// ---------------------------------------------------------------------------

interface Props {
  children: React.ReactNode;
  onReset: () => void;
}

export default class DossierBoundary extends React.Component<
  Props,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  // Deliberately no logging: a render error can carry dossier content in its
  // message, and nothing about a subject is written down anywhere.
  componentDidCatch() {}

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="fixed inset-x-0 top-0 z-40 flex h-dvh items-center justify-center bg-ink px-5">
        <div className="paper w-full max-w-md rounded-md p-7 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="label text-[0.6rem] text-teal">
              Records // Damaged
            </span>
            <Stamp className="text-xs">Void</Stamp>
          </div>
          <h2 className="label text-xl text-ink">This file is damaged</h2>
          <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-soft tw">
            Whatever was in it did not survive the trip. Nothing was stored, so
            there is nothing to recover and nothing to clean up.
          </p>
          <button
            onClick={() => {
              this.setState({ failed: false });
              this.props.onReset();
            }}
            className="mt-6 w-full rounded-md bg-signal py-3.5 label text-sm text-ink transition hover:brightness-105 active:scale-[0.99]"
          >
            Open a new file
          </button>
        </div>
      </div>
    );
  }
}
