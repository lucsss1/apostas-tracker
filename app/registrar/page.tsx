"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { calcEV, calcPMkt, fmt, stakeFrom, today } from "@/lib/calc";
import { MERCADOS } from "@/lib/mercados";
import type { Aposta } from "@/lib/types";
import StatsPanel from "@/components/StatsPanel";

type Tipo = "s" | "m";
interface Selecao {
  jogo: string;
  mercado: string;
}

const stageColors: Record<string, { border: string; bg: string; text: string }> = {
  pos: { border: "var(--win)", bg: "var(--win-bg)", text: "var(--win)" },
  neg: { border: "var(--lose)", bg: "var(--lose-bg)", text: "var(--lose)" },
  warn: { border: "var(--warn)", bg: "var(--warn-bg)", text: "var(--warn)" },
  "": { border: "var(--ink)", bg: "transparent", text: "var(--ink4)" },
};

function MercadoSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {MERCADOS.map((g) => (
        <optgroup key={g.label} label={g.label}>
          {g.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export default function RegistrarPage() {
  const { banca, insertBet, calcTransfer, consumeCalcTransfer, toast } = useAppStore();
  const router = useRouter();

  const [tipo, setTipo] = useState<Tipo>("s");
  const [data, setData] = useState(today());
  const [liga, setLiga] = useState("");
  const [jogo, setJogo] = useState("");
  const [mercado, setMercado] = useState(MERCADOS[0].options[0]);
  const [selecoes, setSelecoes] = useState<Selecao[]>([
    { jogo: "", mercado: MERCADOS[0].options[0] },
    { jogo: "", mercado: MERCADOS[0].options[0] },
  ]);
  const [odd, setOdd] = useState("");
  const [oddC, setOddC] = useState("");
  const [prob, setProb] = useState("");
  const [ajustes, setAjustes] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  useEffect(() => {
    const t = consumeCalcTransfer();
    if (t) {
      if (t.odd) setOdd(t.odd);
      if (t.oddC) setOddC(t.oddC);
      if (t.prob) setProb(t.prob);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  void calcTransfer;

  const pMkt = tipo === "s" ? calcPMkt(odd, oddC) : null;
  const ev = calcEV(prob, odd);
  const cls = ev === null ? "" : ev < 0 ? "neg" : ev < 5 ? "warn" : "pos";
  const stake = stakeFrom(ev);
  const valR = (stake.u * banca * 0.01).toFixed(2);
  const adj = pMkt != null && prob ? parseFloat(prob) - pMkt : null;
  const stageColor = stageColors[cls];

  const jogoValido = tipo === "s" ? !!jogo.trim() : !!selecoes[0]?.jogo.trim();
  const canSave = !!liga.trim() && jogoValido && !!odd && !!prob && ev !== null;

  function addSelecao() {
    setSelecoes((prev) => [...prev, { jogo: "", mercado: MERCADOS[0].options[0] }]);
  }
  function removeSelecao(i: number) {
    setSelecoes((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateSelecao(i: number, patch: Partial<Selecao>) {
    setSelecoes((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function setTipoAndReset(t: Tipo) {
    setTipo(t);
    if (t === "m") {
      setSelecoes([
        { jogo: "", mercado: MERCADOS[0].options[0] },
        { jogo: "", mercado: MERCADOS[0].options[0] },
      ]);
    }
  }

  async function saveAposta() {
    const evVal = calcEV(prob, odd);
    const sk = stakeFrom(evVal);
    const sel = tipo === "m" ? selecoes.map((m) => `${m.jogo} — ${m.mercado}`).filter((s) => s.trim() !== " —").join("\n") : null;
    const bet: Aposta = {
      id: Date.now(),
      data: data || today(),
      liga: liga.trim(),
      jogo: tipo === "m" ? selecoes.map((m) => m.jogo).filter(Boolean).join(" + ") : jogo.trim(),
      mercado: tipo === "m" ? "Múltipla" : mercado,
      multipla: tipo === "m",
      selecoes: sel,
      odd: parseFloat(odd),
      pMkt: tipo === "s" ? calcPMkt(odd, oddC) : null,
      ajustes: ajustes.trim() || null,
      psua: parseFloat(prob),
      ev: evVal != null ? parseFloat(fmt(evVal)) : null,
      stakeU: sk.u,
      stakeR: parseFloat((sk.u * banca * 0.01).toFixed(2)),
      notas: notas.trim() || null,
      resultado: "pendente",
      oddFech: null,
      lucro: null,
    };
    setSaving(true);
    await insertBet(bet);
    setSaving(false);
    toast("✓ Aposta registrada");
    router.push("/");
  }

  return (
    <div>
      <div
        className="border-2 px-5 pt-7 pb-[22px] text-center mb-5 transition-colors duration-300"
        style={{ borderColor: stageColor.border, background: stageColor.bg }}
      >
        <div
          className="font-serif italic font-bold text-[72px] leading-none tracking-tighter transition-colors duration-200"
          style={{ color: stageColor.text }}
        >
          {ev != null ? (ev >= 0 ? "+" : "") + fmt(ev) + "%" : "—"}
        </div>
        <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-ink4 mt-1.5">Valor Esperado</div>
        <div
          className="mt-3.5 inline-block font-mono text-[11px] px-3 py-1 border tracking-wide transition-colors duration-200"
          style={{
            borderColor: ev == null ? "var(--rule2)" : stageColor.border,
            color: ev == null ? "var(--ink4)" : stageColor.text,
          }}
        >
          {ev != null && ev >= 5
            ? `${stake.l} = R$ ${valR}`
            : ev != null && ev < 0
            ? "EV negativo — não apostar"
            : ev != null
            ? "EV insuficiente — mínimo 5%"
            : "preencha odd e probabilidade"}
        </div>
        <div className="grid grid-cols-3 gap-0 mt-4 border-t border-rule">
          <div className="p-2.5 border-r border-rule text-center">
            <div className="font-mono text-[8px] uppercase tracking-wide text-ink4 mb-1">P. Mercado</div>
            <div className="font-mono text-[13px] font-medium text-ink3">{pMkt != null ? fmt(pMkt) + "%" : "—"}</div>
          </div>
          <div className="p-2.5 border-r border-rule text-center">
            <div className="font-mono text-[8px] uppercase tracking-wide text-ink4 mb-1">Ajuste</div>
            <div
              className="font-mono text-[13px] font-medium"
              style={{ color: adj != null ? (adj > 0 ? "var(--win)" : "var(--lose)") : "var(--ink3)" }}
            >
              {adj != null ? (adj >= 0 ? "+" : "") + fmt(adj) + "%" : "—"}
            </div>
          </div>
          <div className="p-2.5 text-center">
            <div className="font-mono text-[8px] uppercase tracking-wide text-ink4 mb-1">Stake</div>
            <div className="font-mono text-[13px] font-medium text-ink3">{stake.u > 0 ? stake.u + "u" : "—"}</div>
          </div>
        </div>
      </div>

      <div className="mb-[18px]">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink4 mb-2.5">tipo de aposta</div>
        <div className="grid grid-cols-2 gap-2 mb-3.5">
          <button
            className={`p-[11px] text-[13px] font-semibold border transition-colors ${
              tipo === "s" ? "border-2 border-ink bg-ink text-paper" : "border-rule2 bg-paper2 text-ink3"
            }`}
            onClick={() => setTipoAndReset("s")}
          >
            ⚡ Simples
          </button>
          <button
            className={`p-[11px] text-[13px] font-semibold border transition-colors ${
              tipo === "m" ? "border-2 border-ink bg-ink text-paper" : "border-rule2 bg-paper2 text-ink3"
            }`}
            onClick={() => setTipoAndReset("m")}
          >
            🔗 Múltipla
          </button>
        </div>
      </div>

      <div className="mb-[18px]">
        <div className="flex justify-between items-center font-mono text-[9px] uppercase tracking-[0.14em] text-ink4 mb-2.5 pb-1.5 border-b border-rule">
          <span>o jogo</span>
          <button
            className="font-mono text-[9px] text-ink3 border border-rule2 px-2 py-[3px] uppercase tracking-wide"
            onClick={() => setStatsOpen((v) => !v)}
          >
            + stats
          </button>
        </div>

        {statsOpen && <StatsPanel onClose={() => setStatsOpen(false)} />}

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wide text-ink3 mb-1.5">Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wide text-ink3 mb-1.5">Liga *</label>
            <input
              type="text"
              placeholder="Brasileirão A"
              value={liga}
              onChange={(e) => setLiga(e.target.value)}
            />
          </div>
        </div>

        {tipo === "s" ? (
          <div>
            <div className="mb-3">
              <label className="block font-mono text-[10px] uppercase tracking-wide text-ink3 mb-1.5">Jogo *</label>
              <input
                type="text"
                placeholder="Flamengo vs Palmeiras"
                value={jogo}
                onChange={(e) => setJogo(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block font-mono text-[10px] uppercase tracking-wide text-ink3 mb-1.5">Mercado *</label>
              <MercadoSelect value={mercado} onChange={setMercado} />
            </div>
          </div>
        ) : (
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wide text-ink3 mb-2.5">Seleções *</div>
            {selecoes.map((s, i) => (
              <div key={i} className="border border-rule p-3 mb-2 bg-paper2">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="font-mono text-[8px] uppercase tracking-wide text-ink3">Seleção {i + 1}</span>
                  <button
                    className="text-[11px] text-lose font-mono tracking-wide"
                    onClick={() => removeSelecao(i)}
                  >
                    remover
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Jogo"
                  className="mb-2"
                  value={s.jogo}
                  onChange={(e) => updateSelecao(i, { jogo: e.target.value })}
                />
                <MercadoSelect value={s.mercado} onChange={(v) => updateSelecao(i, { mercado: v })} />
              </div>
            ))}
            <button
              className="w-full p-2.5 border border-dashed border-rule2 bg-transparent text-ink4 text-[13px] font-semibold mt-1"
              onClick={addSelecao}
            >
              + Adicionar seleção
            </button>
          </div>
        )}
      </div>

      <div className="mb-[18px]">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink4 mb-2.5 pb-1.5 border-b border-rule">
          a análise
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wide text-ink3 mb-1.5">Odd apostada *</label>
            <input type="number" step="0.01" placeholder="2.10" value={odd} onChange={(e) => setOdd(e.target.value)} />
          </div>
          {tipo === "s" && (
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wide text-ink3 mb-1.5">Odd contrária</label>
              <input type="number" step="0.01" placeholder="1.75" value={oddC} onChange={(e) => setOddC(e.target.value)} />
              <div className="font-mono text-[10px] text-ink4 mt-1">Para calcular P. Mercado</div>
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="block font-mono text-[10px] uppercase tracking-wide text-ink3 mb-1.5">
            Probabilidade estimada % *
          </label>
          <input
            type="number"
            step="0.1"
            min={1}
            max={99}
            placeholder="ex: 58.0"
            value={prob}
            onChange={(e) => setProb(e.target.value)}
          />
          <div className="font-mono text-[10px] text-ink4 mt-1">
            Use &quot;calc&quot; no header se precisar de ajuda para chegar no número.
          </div>
        </div>

        <div className="mb-3">
          <label className="block font-mono text-[10px] uppercase tracking-wide text-ink3 mb-1.5">
            Ajustes aplicados <span className="font-normal normal-case tracking-normal text-ink4">(opcional)</span>
          </label>
          <input
            type="text"
            placeholder="ex: necessidade vitória +7%, defesa porosa +5%"
            value={ajustes}
            onChange={(e) => setAjustes(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="block font-mono text-[10px] uppercase tracking-wide text-ink3 mb-1.5">
            Notas <span className="font-normal normal-case tracking-normal text-ink4">(opcional)</span>
          </label>
          <input type="text" placeholder="contexto extra…" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>

        <button
          id="btn-save"
          className="w-full p-[15px] bg-ink text-paper text-sm font-semibold tracking-wide font-mono uppercase transition-opacity disabled:opacity-30 mt-1.5"
          disabled={!canSave || saving}
          onClick={saveAposta}
        >
          {saving ? "Salvando…" : "Registrar aposta"}
        </button>
      </div>
    </div>
  );
}
