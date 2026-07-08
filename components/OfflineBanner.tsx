"use client";

import { useAppStore } from "@/lib/store";

export default function OfflineBanner() {
  const { sync } = useAppStore();
  if (sync !== "err") return null;
  return (
    <div className="border-b-2 border-lose bg-lose-bg px-[18px] py-2 text-center flex-shrink-0">
      <span className="font-mono text-[11px] text-lose">
        Sem conexão — mostrando dados salvos localmente
      </span>
    </div>
  );
}
