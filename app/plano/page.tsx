"use client";

import { useAppStore } from "@/lib/store";
import { today } from "@/lib/calc";
import type { Aposta } from "@/lib/types";

const rules = [
  "Para recuperar perdas",
  "Só porque um tipster recomendou",
  "Sem análise própria",
  "Em ligas que não acompanha",
  "EV abaixo de 5%",
  "Mais de 3 apostas por dia",
];

export default function PlanoPage() {
  const { bets, banca, toast, importBets } = useAppStore();

  function exportar() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), banca, bets }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `apostas_${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("✓ Exportado");
  }

  function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target?.result as string) as { banca?: number; bets?: Aposta[] };
        if (!Array.isArray(d.bets)) throw new Error("invalid");
        const existingIds = new Set(bets.map((b) => b.id));
        const dupCount = d.bets.filter((b) => existingIds.has(b.id)).length;
        const msg =
          dupCount > 0
            ? `${dupCount} dessas ${d.bets.length} apostas parecem já existir no seu histórico — importar mesmo assim pode duplicá-las. Continuar?`
            : `Importar ${d.bets.length} apostas?`;
        if (typeof window !== "undefined" && !window.confirm(msg)) return;
        await importBets(d.bets, d.banca || 100);
      } catch {
        toast("✗ Arquivo inválido");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  }

  return (
    <div>
      <div className="mb-[22px]">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] mb-2.5 pb-1.5 border-b-2" style={{ color: "var(--win)", borderColor: "var(--win)" }}>
          Stakes por EV
        </div>
        <PlRow k="EV 5 – 10%" v="1u — Padrão" color="var(--win)" />
        <PlRow k="EV 10 – 15%" v="2u — Forte" color="var(--warn)" />
        <PlRow k="EV > 15%" v="3u — Máxima" color="var(--win)" last />
      </div>

      <div className="mb-[22px]">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] mb-2.5 pb-1.5 border-b-2" style={{ color: "var(--lose)", borderColor: "var(--lose)" }}>
          Nunca apostar
        </div>
        {rules.map((r, i) => (
          <div key={r} className={`flex items-start gap-2.5 py-2 ${i < rules.length - 1 ? "border-b border-rule" : ""}`}>
            <span className="text-xs flex-shrink-0 mt-0.5 text-ink4">—</span>
            <span className="text-[13px] text-ink leading-relaxed">{r}</span>
          </div>
        ))}
        <div className="flex items-start gap-2.5 py-2">
          <span className="text-xs flex-shrink-0 mt-0.5 text-ink4">—</span>
          <span className="text-[13px] text-ink leading-relaxed">
            Banca abaixo de 70%
            <small className="block text-[11px] text-ink4 mt-px">Pausa obrigatória de 7 dias</small>
          </span>
        </div>
      </div>

      <div className="mb-[22px]">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] mb-2.5 pb-1.5 border-b-2 text-ink3 border-ink3">
          Referência de ROI
        </div>
        <PlRow k="Negativo" v="Revisar modelo" color="var(--lose)" />
        <PlRow k="0% a 3%" v="Neutro" color="var(--ink4)" />
        <PlRow k="3% a 8%" v="Bom" color="var(--win)" />
        <PlRow k="> 8%" v="Excelente" color="var(--win)" last />
      </div>

      <div className="mb-[22px]">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] mb-2.5 pb-1.5 border-b-2 text-ink4 border-ink4">
          Backup
        </div>
        <button
          className="w-full p-3 bg-transparent border border-rule text-ink text-[13px] font-semibold flex items-center gap-2.5 mb-1.5 text-left"
          onClick={exportar}
        >
          <span className="text-[17px] font-mono flex-shrink-0">↓</span>
          <span>
            <span className="block">Exportar apostas</span>
            <span className="block text-[11px] text-ink4 font-normal font-mono mt-px">Baixa .json com todos os dados</span>
          </span>
        </button>
        <label className="w-full p-3 bg-transparent border border-rule text-ink text-[13px] font-semibold flex items-center gap-2.5 cursor-pointer">
          <span className="text-[17px] font-mono flex-shrink-0">↑</span>
          <span>
            <span className="block">Importar apostas</span>
            <span className="block text-[11px] text-ink4 font-normal font-mono mt-px">Restaura de um .json exportado</span>
          </span>
          <input type="file" accept=".json" className="hidden" onChange={importar} />
        </label>
      </div>
    </div>
  );
}

function PlRow({ k, v, color, last }: { k: string; v: string; color: string; last?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2.5 ${last ? "" : "border-b border-rule"}`}>
      <span className="text-[13px] text-ink">{k}</span>
      <span className="font-mono text-xs font-medium text-right" style={{ color }}>
        {v}
      </span>
    </div>
  );
}
