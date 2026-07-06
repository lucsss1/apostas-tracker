"use client";

import { useAppStore } from "@/lib/store";
import SyncDot from "./SyncDot";

export default function Header() {
  const { openCalc, openBancaSheet } = useAppStore();
  return (
    <header
      className="sticky top-0 z-[100] flex flex-shrink-0 items-center gap-2.5 bg-paper border-b-2 border-ink px-[18px]"
      style={{ height: "var(--hdr-h)" }}
    >
      <div className="font-serif italic text-lg text-ink tracking-tight">Hegreen</div>
      <SyncDot />
      <div className="ml-auto flex gap-1.5">
        <button
          className="font-mono text-[11px] text-ink3 border border-rule2 px-2.5 py-1 tracking-wider active:border-ink active:text-ink transition-colors"
          onClick={openCalc}
        >
          calc
        </button>
        <button
          className="font-mono text-[11px] text-ink3 border border-rule2 px-2.5 py-1 tracking-wider active:border-ink active:text-ink transition-colors"
          onClick={openBancaSheet}
        >
          banca
        </button>
      </div>
    </header>
  );
}
