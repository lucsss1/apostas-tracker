import type { Aposta } from "./types";

const BANCA_KEY = "banca_v7";
const BETS_OFFLINE_KEY = "bets_off";

export function getBanca(userId: string): number {
  if (typeof window === "undefined") return 100;
  return parseFloat(localStorage.getItem(`${BANCA_KEY}_${userId}`) || "100");
}

export function setBanca(userId: string, v: number): void {
  localStorage.setItem(`${BANCA_KEY}_${userId}`, String(v));
}

export function getOfflineBets(userId: string): Aposta[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(`${BETS_OFFLINE_KEY}_${userId}`) || "[]");
  } catch {
    return [];
  }
}

export function setOfflineBets(userId: string, bets: Aposta[]): void {
  localStorage.setItem(`${BETS_OFFLINE_KEY}_${userId}`, JSON.stringify(bets));
}
