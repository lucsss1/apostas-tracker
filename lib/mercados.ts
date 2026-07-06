export interface MercadoGroup {
  label: string;
  options: string[];
}

export const MERCADOS: MercadoGroup[] = [
  {
    label: "── Gols",
    options: [
      "Over 1.5",
      "Under 1.5",
      "Over 2.5",
      "Under 2.5",
      "Over 3.5",
      "Under 3.5",
      "BTTS Sim",
      "BTTS Não",
    ],
  },
  {
    label: "── Resultado",
    options: [
      "1X2 Casa",
      "1X2 Empate",
      "1X2 Fora",
      "Dupla Chance 1X",
      "Dupla Chance X2",
      "Dupla Chance 12",
      "Handicap Asiático",
    ],
  },
  {
    label: "── Intervalo",
    options: [
      "HT Over 0.5",
      "HT Over 1.5",
      "HT Resultado Casa",
      "HT Resultado Empate",
      "HT Resultado Fora",
      "Gols 1º Tempo Over 0.5",
      "Gols 1º Tempo Over 1.5",
      "Primeiro Time a Marcar",
    ],
  },
  {
    label: "── Escanteios",
    options: [
      "Escanteios Over 8.5",
      "Escanteios Over 9.5",
      "Escanteios Over 10.5",
      "Escanteios Under 8.5",
      "Escanteios Under 9.5",
    ],
  },
  {
    label: "── Cartões",
    options: [
      "Cartões Over 2.5",
      "Cartões Over 3.5",
      "Cartões Over 4.5",
      "Cartões Under 3.5",
    ],
  },
  {
    label: "── Jogador",
    options: [
      "Jogador — Marcar a qualquer hora",
      "Jogador — Marcar 1º gol",
      "Jogador — Chutes ao gol Over 1.5",
      "Jogador — Chutes ao gol Over 2.5",
      "Jogador — Assistência",
      "Jogador — Cartão amarelo",
    ],
  },
  {
    label: "── Outro",
    options: ["Outro"],
  },
];

export const MERCADO_OPTIONS: string[] = MERCADOS.flatMap((g) => g.options);
