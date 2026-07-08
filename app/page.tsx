"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { evColor, fmt, fmtBRL, fmtR, roiColor, today } from "@/lib/calc";
import type { Aposta } from "@/lib/types";
import StatusDot from "@/components/StatusDot";

export default function HomePage() {
  const { bets, banca, bancaAtual, loading } = useAppStore();

  const resolved = bets.filter((b) => b.resultado !== "pendente" && b.resultado !== "void");
  const won = bets.filter((b) => b.resultado === "ganhou");
  const lucro = resolved.reduce((s, b) => s + (b.lucro || 0), 0);
  const totAp = resolved.reduce((s, b) => s + b.stakeR, 0);
  const roi = totAp > 0 ? (lucro / totAp) * 100 : null;
  const evMed = bets.length > 0 ? bets.reduce((s, b) => s + (b.ev || 0), 0) / bets.length : null;
  const wr = resolved.length > 0 ? (won.length / resolved.length) * 100 : null;
  const showDdown = bancaAtual < banca * 0.7;

  let bestMarket: [string, { w: number; t: number }] | null = null;
  let bestLeague: [string, { l: number; t: number }] | null = null;
  if (resolved.length >= 5) {
    const mM: Record<string, { w: number; t: number }> = {};
    const lM: Record<string, { l: number; t: number }> = {};
    resolved.forEach((b) => {
      if (!mM[b.mercado]) mM[b.mercado] = { w: 0, t: 0 };
      mM[b.mercado].t++;
      if (b.resultado === "ganhou") mM[b.mercado].w++;
      if (!lM[b.liga]) lM[b.liga] = { l: 0, t: 0 };
      lM[b.liga].t++;
      lM[b.liga].l += b.lucro || 0;
    });
    bestMarket = Object.entries(mM).sort((a, b) => b[1].w / b[1].t - a[1].w / a[1].t)[0] ?? null;
    bestLeague = Object.entries(lM).sort((a, b) => b[1].l - a[1].l)[0] ?? null;
  }

  const todayBets = bets.filter((b) => b.data === today()).sort((a, b) => b.id - a.id);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="font-mono text-[11px] text-ink4 uppercase tracking-wide">Carregando…</div>
      </div>
    );
  }

  return (
    <div>
      <div className="pb-5 border-b border-rule">
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink4 mb-2.5">
          banca atual
        </div>
        <div className="font-serif text-[52px] font-bold text-ink leading-none tracking-tight">
          {fmtBRL(bancaAtual)}
        </div>
        {lucro !== 0 && (
          <div
            className="inline-flex items-center gap-1.5 mt-2.5 font-mono text-xs px-2.5 py-[3px] tracking-wide border"
            style={{
              borderColor: lucro >= 0 ? "var(--win)" : "var(--lose)",
              color: lucro >= 0 ? "var(--win)" : "var(--lose)",
            }}
          >
            {fmtR(lucro)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 border-b border-rule">
        <div className="py-3.5 border-r border-rule">
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink4 mb-1 pl-3.5">ROI</div>
          <div className="font-serif text-[22px] font-bold pl-3.5" style={{ color: roiColor(roi) }}>
            {roi != null ? (roi >= 0 ? "+" : "") + fmt(roi) + "%" : "—"}
          </div>
        </div>
        <div className="py-3.5 border-r border-rule">
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink4 mb-1 pl-3.5">Win%</div>
          <div
            className="font-serif text-[22px] font-bold pl-3.5"
            style={{ color: wr != null ? "var(--ink)" : "var(--ink4)" }}
          >
            {wr != null ? fmt(wr, 0) + "%" : "—"}
          </div>
        </div>
        <div className="py-3.5">
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink4 mb-1 pl-3.5">EV méd.</div>
          <div
            className="font-serif text-[22px] font-bold pl-3.5"
            style={{ color: evColor(evMed) }}
          >
            {evMed != null ? (evMed >= 0 ? "+" : "") + fmt(evMed) + "%" : "—"}
          </div>
        </div>
      </div>

      {showDdown && (
        <div className="border border-lose bg-lose-bg px-3.5 py-3 mt-4">
          <div className="text-lose font-semibold text-sm mb-0.5">⚠ Drawdown &gt; 30%</div>
          <div className="text-ink3 text-xs">Pausa de 7 dias. Revise o processo.</div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
        <div className="mt-[22px]">
          <div className="flex justify-between items-baseline mb-3 pb-1.5 border-b border-rule">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink3">Insights</span>
          </div>
          {resolved.length >= 5 ? (
            <div className="grid grid-cols-2 border border-rule mb-5">
              <div className="px-3.5 py-[13px] border-r border-rule">
                <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink4 mb-1">Melhor mercado</div>
                <div className="font-serif italic text-lg text-ink mb-px">
                  {bestMarket ? bestMarket[0].split("—")[0].trim() : "—"}
                </div>
                <div className="font-mono text-[10px] text-ink4">
                  {bestMarket ? `${Math.round((bestMarket[1].w / bestMarket[1].t) * 100)}% win` : ""}
                </div>
              </div>
              <div className="px-3.5 py-[13px]">
                <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink4 mb-1">Liga mais lucrativa</div>
                <div className="font-serif italic text-lg text-ink mb-px">{bestLeague ? bestLeague[0] : "—"}</div>
                <div className="font-mono text-[10px] text-ink4">{bestLeague ? fmtR(bestLeague[1].l) : ""}</div>
              </div>
            </div>
          ) : (
            <div className="py-3.5 font-mono text-[11px] text-ink4">Disponível após 5 apostas resolvidas.</div>
          )}
        </div>

        <div className="mt-[22px]">
          <div className="flex justify-between items-baseline mb-3 pb-1.5 border-b border-rule">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink3">Hoje</span>
            <Link href="/historico" className="font-mono text-[9px] text-ink3 tracking-wide underline">
              ver todas
            </Link>
          </div>
          {todayBets.length === 0 ? (
            <div className="py-6 text-ink4 text-[13px] font-mono">Nenhuma aposta registrada hoje.</div>
          ) : (
            <div>
              {todayBets.map((b) => (
                <TodayRow key={b.id} bet={b} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TodayRow({ bet }: { bet: Aposta }) {
  return (
    <Link href="/historico" className="flex items-center gap-2.5 py-[11px] border-b border-rule last:border-b-0">
      <StatusDot resultado={bet.resultado} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis text-ink">
          {bet.jogo}
        </div>
        <div className="text-[11px] text-ink3 mt-px font-mono">
          {bet.mercado}
          {bet.multipla ? " · múltipla" : ""}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-mono text-xs font-medium" style={{ color: evColor(bet.ev) }}>
          {bet.ev != null ? (bet.ev >= 0 ? "+" : "") + fmt(bet.ev) + "%" : "—"}
        </div>
        <div className="font-mono text-[10px] text-ink3 mt-px">
          {bet.stakeU}u · R${bet.stakeR}
        </div>
      </div>
    </Link>
  );
}
