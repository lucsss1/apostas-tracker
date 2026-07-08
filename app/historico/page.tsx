"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { evColor, fmt, fmtR, lucroColor, resCol, resLbl, roiColor } from "@/lib/calc";
import type { Aposta } from "@/lib/types";
import StatusDot from "@/components/StatusDot";

type Filtro = "todos" | "pendente" | "ganhou" | "perdeu";

const filtros: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Todas" },
  { key: "pendente", label: "Pend." },
  { key: "ganhou", label: "Ganhou" },
  { key: "perdeu", label: "Perdeu" },
];

export default function HistoricoPage() {
  const { bets, deleteBet, openResolver, openEditar, loading } = useAppStore();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  const resolved = bets.filter((b) => b.resultado !== "pendente" && b.resultado !== "void");
  const filtered = useMemo(
    () =>
      [...bets]
        .filter((b) => filtro === "todos" || b.resultado === filtro)
        .sort((a, b) => b.id - a.id),
    [bets, filtro]
  );

  let roi: number | null = null;
  let bestMarketLabel = "—";
  let bestMarketPct = "";
  if (resolved.length > 0) {
    const totAp = resolved.reduce((s, b) => s + b.stakeR, 0);
    const lucro = resolved.reduce((s, b) => s + (b.lucro || 0), 0);
    roi = totAp > 0 ? (lucro / totAp) * 100 : null;
    const mM: Record<string, { w: number; t: number }> = {};
    resolved.forEach((b) => {
      if (!mM[b.mercado]) mM[b.mercado] = { w: 0, t: 0 };
      mM[b.mercado].t++;
      if (b.resultado === "ganhou") mM[b.mercado].w++;
    });
    const bm = Object.entries(mM)
      .filter(([, v]) => v.t >= 3)
      .sort((a, b) => b[1].w / b[1].t - a[1].w / a[1].t)[0];
    bestMarketLabel = bm ? bm[0].split("—")[0].trim().split(" ").slice(0, 2).join(" ") : "—";
    bestMarketPct = bm ? `${Math.round((bm[1].w / bm[1].t) * 100)}% win` : "";
  }

  function toggleOpen(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="font-mono text-[11px] text-ink4 uppercase tracking-wide">Carregando…</div>
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8 lg:items-start">
      <div className="lg:sticky lg:top-[calc(var(--hdr-h)+20px)]">
        <div className="flex lg:flex-col border border-rule mb-4 overflow-hidden">
          {filtros.map((f) => (
            <button
              key={f.key}
              className={`flex-1 py-[7px] px-1 text-center text-[11px] font-semibold font-mono border-r lg:border-r-0 lg:border-b border-rule last:border-r-0 lg:last:border-b-0 uppercase tracking-wide transition-colors ${
                filtro === f.key ? "bg-ink text-paper" : "bg-paper text-ink4"
              }`}
              onClick={() => setFiltro(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {resolved.length > 0 && (
          <div className="grid grid-cols-3 lg:grid-cols-1 border border-rule mb-3.5">
            <div className="px-3 py-2.5 border-r lg:border-r-0 lg:border-b border-rule text-center lg:text-left">
              <div className="font-mono text-[8px] uppercase tracking-wide text-ink4 mb-1">ROI</div>
              <div className="font-serif text-base font-bold" style={{ color: roiColor(roi) }}>
                {roi != null ? (roi >= 0 ? "+" : "") + fmt(roi) + "%" : "—"}
              </div>
            </div>
            <div className="px-3 py-2.5 border-r lg:border-r-0 lg:border-b border-rule text-center lg:text-left">
              <div className="font-mono text-[8px] uppercase tracking-wide text-ink4 mb-1">Melhor merc.</div>
              <div className="font-serif text-xs font-bold">{bestMarketLabel}</div>
              {bestMarketPct && <div className="font-mono text-[9px] text-ink3 mt-px">{bestMarketPct}</div>}
            </div>
            <div className="px-3 py-2.5 text-center lg:text-left">
              <div className="font-mono text-[8px] uppercase tracking-wide text-ink4 mb-1">Apostas</div>
              <div className="font-serif text-base font-bold">{resolved.length}</div>
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-11 text-ink4 font-mono text-[13px]">Nenhuma aposta aqui.</div>
      ) : (
        <div>
          {filtered.map((b) => (
            <BetCard
              key={b.id}
              bet={b}
              open={openIds.has(b.id)}
              onToggle={() => toggleOpen(b.id)}
              onResolve={() => openResolver(b.id)}
              onEdit={() => openEditar(b.id)}
              onDelete={() => deleteBet(b.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BetCard({
  bet,
  open,
  onToggle,
  onResolve,
  onEdit,
  onDelete,
}: {
  bet: Aposta;
  open: boolean;
  onToggle: () => void;
  onResolve: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const clv = bet.oddFech && bet.odd ? (bet.oddFech / bet.odd - 1) * 100 : null;
  const lucroDisplay =
    bet.resultado !== "pendente" && bet.lucro != null
      ? fmtR(bet.lucro)
      : clv != null
      ? (clv >= 0 ? "+" : "") + fmt(clv) + "%"
      : "—";
  const lucroClr = lucroColor(bet.resultado, bet.lucro);

  return (
    <div className={`border mb-1.5 overflow-hidden bg-paper transition-colors ${open ? "border-ink" : "border-rule"}`}>
      <div className="flex items-center px-3.5 py-3 gap-2.5 cursor-pointer" onClick={onToggle}>
        <StatusDot resultado={bet.resultado} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis text-ink">
            {bet.jogo}
          </div>
          <div className="text-[11px] text-ink3 mt-px font-mono">
            {bet.liga} · {bet.data}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-mono text-xs font-medium" style={{ color: evColor(bet.ev) }}>
            {bet.ev != null ? (bet.ev >= 0 ? "+" : "") + fmt(bet.ev) + "%" : "—"}
          </div>
          <div className="font-mono text-[10px] text-ink3 mt-px">{bet.stakeU}u</div>
        </div>
        <span
          className="font-mono text-[10px] text-ink4 ml-1 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          ▾
        </span>
      </div>

      {open && (
        <div className="px-3.5 pb-3.5 border-t border-rule">
          {bet.multipla && (
            <span className="inline-block font-mono text-[8px] px-2 py-0.5 border border-warn text-warn uppercase tracking-wide mb-1.5 mt-3">
              Múltipla
            </span>
          )}
          {bet.selecoes && (
            <div className="font-mono text-[11px] text-ink3 whitespace-pre-line px-2.5 py-2 border border-rule mb-2.5 leading-relaxed bg-paper2 mt-3">
              {bet.selecoes}
            </div>
          )}
          <div className="grid grid-cols-2 border border-rule my-3 overflow-hidden">
            <GridItem label="Odd" value={String(bet.odd)} />
            <GridItem
              label="EV"
              value={bet.ev != null ? (bet.ev >= 0 ? "+" : "") + fmt(bet.ev) + "%" : "—"}
              color={evColor(bet.ev)}
              noBorderRight
            />
            <GridItem label="Stake" value={`${bet.stakeU}u · R$${bet.stakeR}`} />
            <GridItem
              label={bet.resultado !== "pendente" ? "Lucro" : "CLV"}
              value={lucroDisplay}
              color={lucroClr}
              noBorderRight
            />
            <GridItem label="Mercado" value={bet.mercado || "—"} small noBorderBottom />
            <GridItem
              label="Status"
              value={resLbl(bet.resultado)}
              color={resCol(bet.resultado)}
              small
              noBorderRight
              noBorderBottom
            />
          </div>
          {bet.ajustes && <div className="text-xs text-ink4 italic mb-2">⚙ {bet.ajustes}</div>}
          {bet.notas && <div className="text-xs text-ink4 italic mb-2">💬 {bet.notas}</div>}
          <div className="flex gap-2 mt-1">
            {bet.resultado === "pendente" ? (
              <>
                <button
                  className="flex-1 p-2.5 bg-ink text-paper text-xs font-semibold font-mono uppercase tracking-wide"
                  onClick={onResolve}
                >
                  Resolver resultado
                </button>
                <button
                  className="px-3 py-2.5 border border-rule2 text-ink3 text-xs font-mono bg-transparent"
                  onClick={onEdit}
                >
                  Editar
                </button>
                <button
                  className="px-3 py-2.5 border border-rule2 text-ink3 text-xs font-mono bg-transparent"
                  onClick={onDelete}
                >
                  Apagar
                </button>
              </>
            ) : (
              <>
                <button
                  className="flex-1 p-2.5 border border-rule2 text-ink3 text-xs font-mono bg-transparent text-center"
                  onClick={onEdit}
                >
                  Editar
                </button>
                <button
                  className="flex-1 p-2.5 border border-rule2 text-ink3 text-xs font-mono bg-transparent text-center"
                  onClick={onDelete}
                >
                  Apagar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GridItem({
  label,
  value,
  color,
  small,
  noBorderRight,
  noBorderBottom,
}: {
  label: string;
  value: string;
  color?: string;
  small?: boolean;
  noBorderRight?: boolean;
  noBorderBottom?: boolean;
}) {
  return (
    <div
      className={`px-2.5 py-2 ${noBorderRight ? "" : "border-r border-rule"} ${
        noBorderBottom ? "" : "border-b border-rule"
      }`}
    >
      <div className="font-mono text-[8px] uppercase tracking-wide text-ink4 mb-0.5">{label}</div>
      <div className={`font-mono text-ink ${small ? "text-[10px]" : "text-xs"}`} style={{ color }}>
        {value}
      </div>
    </div>
  );
}
