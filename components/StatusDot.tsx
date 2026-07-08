import { resCol } from "@/lib/calc";
import type { Resultado } from "@/lib/types";

const SYMBOL: Record<Resultado, string> = {
  ganhou: "✓",
  perdeu: "✕",
  void: "⊘",
  pendente: "⏳",
};

export default function StatusDot({ resultado }: { resultado: Resultado }) {
  return (
    <span
      className="w-4 flex items-center justify-center flex-shrink-0 font-mono text-[10px] font-bold leading-none"
      style={{ color: resCol(resultado) }}
    >
      {SYMBOL[resultado]}
    </span>
  );
}
