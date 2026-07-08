"use client";

import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import SyncDot from "./SyncDot";

export default function Header() {
  const { openCalc, openBancaSheet, toast } = useAppStore();
  const { user, signOut } = useAuth();
  return (
    <header
      className="sticky top-0 z-[100] flex flex-shrink-0 items-center gap-2.5 bg-paper border-b-2 border-ink px-[18px]"
      style={{ height: "var(--hdr-h)" }}
    >
      <button
        type="button"
        className="font-serif italic text-lg text-ink tracking-tight"
        onClick={() => user?.email && toast(user.email, 4000)}
      >
        Hegreen
      </button>
      <SyncDot />
      <div className="ml-auto flex items-center gap-1.5">
        {user && (
          <span className="hidden sm:inline font-mono text-[11px] text-ink4 tracking-wide mr-1 max-w-[160px] truncate">
            {user.email}
          </span>
        )}
        <button
          className="font-mono text-[11px] text-ink3 border border-rule2 px-3 py-2 tracking-wider active:border-ink active:text-ink transition-colors"
          onClick={openCalc}
        >
          calc
        </button>
        <button
          className="font-mono text-[11px] text-ink3 border border-rule2 px-3 py-2 tracking-wider active:border-ink active:text-ink transition-colors"
          onClick={openBancaSheet}
        >
          banca
        </button>
        <button
          className="font-mono text-[11px] text-ink3 px-3 py-2 tracking-wider ml-1 border-l border-rule active:text-lose transition-colors"
          onClick={signOut}
        >
          sair
        </button>
      </div>
    </header>
  );
}
