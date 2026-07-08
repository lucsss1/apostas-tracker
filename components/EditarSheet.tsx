"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { calcEV, stakeRFromU } from "@/lib/calc";
import { MERCADO_OPTIONS } from "@/lib/mercados";
import Sheet from "./Sheet";

export default function EditarSheet() {
  const { editarOpen, editingId, closeEditar, bets, bancaAtual, updateBet, toast } = useAppStore();
  const bet = bets.find((b) => b.id === editingId);

  const [liga, setLiga] = useState("");
  const [mercado, setMercado] = useState("");
  const [odd, setOdd] = useState("");
  const [stakeU, setStakeU] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editarOpen && bet) {
      setLiga(bet.liga);
      setMercado(bet.mercado);
      setOdd(String(bet.odd));
      setStakeU(String(bet.stakeU));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editarOpen, editingId]);

  const canSave = !!liga.trim() && !!mercado.trim() && !!odd && !!stakeU;

  async function save() {
    if (!bet || !canSave) return;
    const newOdd = parseFloat(odd);
    const newStakeU = parseInt(stakeU, 10) || 0;
    const newStakeR = stakeRFromU(newStakeU, bancaAtual);
    const newEv = calcEV(bet.psua, newOdd);
    const newLucro =
      bet.resultado === "ganhou"
        ? parseFloat((newStakeR * (newOdd - 1)).toFixed(2))
        : bet.resultado === "perdeu"
        ? -newStakeR
        : bet.resultado === "void"
        ? 0
        : null;

    setSaving(true);
    await updateBet({
      ...bet,
      liga: liga.trim(),
      mercado: mercado.trim(),
      odd: newOdd,
      stakeU: newStakeU,
      stakeR: newStakeR,
      ev: newEv != null ? parseFloat(newEv.toFixed(2)) : null,
      lucro: newLucro,
    });
    setSaving(false);
    toast("✓ Aposta atualizada");
    closeEditar();
  }

  return (
    <Sheet open={editarOpen} onClose={closeEditar}>
      <div className="font-serif text-lg font-bold text-ink mb-0.5">Editar aposta</div>
      <div className="font-mono text-xs text-ink4 mb-4">{bet?.jogo ?? ""}</div>

      <div className="mb-3">
        <label className="block font-mono text-[10px] uppercase tracking-wider text-ink3 mb-1.5">Liga</label>
        <input type="text" value={liga} onChange={(e) => setLiga(e.target.value)} />
      </div>

      <div className="mb-3">
        <label className="block font-mono text-[10px] uppercase tracking-wider text-ink3 mb-1.5">Mercado</label>
        <input
          type="text"
          list="editar-mercados-datalist"
          value={mercado}
          onChange={(e) => setMercado(e.target.value)}
        />
        <datalist id="editar-mercados-datalist">
          {MERCADO_OPTIONS.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-1">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-ink3 mb-1.5">Odd</label>
          <input type="number" step="0.01" value={odd} onChange={(e) => setOdd(e.target.value)} />
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-ink3 mb-1.5">Stake (u)</label>
          <input type="number" step="1" min="0" value={stakeU} onChange={(e) => setStakeU(e.target.value)} />
        </div>
      </div>

      {bet && bet.resultado !== "pendente" && (
        <div className="font-mono text-[10px] text-warn mt-2">
          ⚠ Aposta já resolvida — o lucro registrado será recalculado com os novos valores.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-3.5">
        <button
          className="p-3 bg-transparent text-ink3 border border-rule font-mono text-sm"
          onClick={closeEditar}
        >
          Cancelar
        </button>
        <button
          className="p-3 bg-ink text-paper font-mono text-sm font-semibold transition-opacity disabled:opacity-30"
          disabled={!canSave || saving}
          onClick={save}
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </Sheet>
  );
}
