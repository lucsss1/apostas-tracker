"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { fromDB, toDB, type Aposta, type ApostaRow, type Resultado } from "./types";
import { getBanca, getOfflineBets, setBanca as persistBanca, setOfflineBets } from "./storage";
import { fmtR } from "./calc";

type SyncStatus = "ok" | "sp" | "err";

export interface CalcTransfer {
  odd?: string;
  oddC?: string;
  prob?: string;
}

interface AppStoreValue {
  bets: Aposta[];
  banca: number;
  bancaAtual: number;
  loading: boolean;
  sync: SyncStatus;
  loadBets: () => Promise<void>;
  insertBet: (b: Aposta) => Promise<void>;
  updateBet: (b: Aposta) => Promise<void>;
  deleteBet: (id: number) => Promise<void>;
  setBancaValue: (v: number) => Promise<void>;
  importBets: (bets: Aposta[], banca: number) => Promise<void>;

  toastMsg: string;
  toastOn: boolean;
  toast: (msg: string, duration?: number) => void;

  calcOpen: boolean;
  openCalc: () => void;
  closeCalc: () => void;

  bancaSheetOpen: boolean;
  openBancaSheet: () => void;
  closeBancaSheet: () => void;

  resolverOpen: boolean;
  resolvingId: number | null;
  openResolver: (id: number) => void;
  closeResolver: () => void;
  confirmResolver: (resultado: Resultado, oddFech: number | null) => Promise<void>;

  editarOpen: boolean;
  editingId: number | null;
  openEditar: (id: number) => void;
  closeEditar: () => void;

  calcTransfer: CalcTransfer | null;
  setCalcTransfer: (t: CalcTransfer) => void;
  consumeCalcTransfer: () => CalcTransfer | null;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [bets, setBets] = useState<Aposta[]>([]);
  const [banca, setBancaState] = useState(100);
  const [sync, setSync] = useState<SyncStatus>("sp");
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [calcOpen, setCalcOpen] = useState(false);
  const [bancaSheetOpen, setBancaSheetOpen] = useState(false);
  const [resolverOpen, setResolverOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [editarOpen, setEditarOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [calcTransfer, setCalcTransferState] = useState<CalcTransfer | null>(null);
  const [bancaLoaded, setBancaLoaded] = useState(false);
  const [betsLoaded, setBetsLoaded] = useState(false);
  const loading = !bancaLoaded || !betsLoaded;

  const loadBanca = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("config")
      .select("value")
      .eq("key", "banca_inicial")
      .maybeSingle();
    if (error || !data) {
      setBancaState(getBanca(userId));
      setBancaLoaded(true);
      return;
    }
    const v = parseFloat(data.value);
    setBancaState(v);
    persistBanca(userId, v);
    setBancaLoaded(true);
  }, [userId]);

  useEffect(() => {
    loadBanca();
  }, [loadBanca]);

  const toast = useCallback((msg: string, duration = 2500) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    setToastOn(true);
    toastTimer.current = setTimeout(() => setToastOn(false), duration);
  }, []);

  const loadBets = useCallback(async () => {
    if (!userId) return;
    setSync("sp");
    const { data, error } = await supabase
      .from("apostas")
      .select("*")
      .order("id", { ascending: false });
    if (error || !data) {
      setSync("err");
      toast("Offline — dados locais");
      setBets(getOfflineBets(userId));
      setBetsLoaded(true);
      return;
    }
    setSync("ok");
    setBets((data as ApostaRow[]).map(fromDB));
    setBetsLoaded(true);
  }, [toast, userId]);

  const insertBet = useCallback(
    async (b: Aposta) => {
      if (!userId) return;
      setSync("sp");
      const { error } = await supabase.from("apostas").insert({ ...toDB(b), user_id: userId });
      if (error) {
        setSync("err");
        const next = [b, ...getOfflineBets(userId)];
        setOfflineBets(userId, next);
        setBets(next);
        toast("Salvo offline");
        return;
      }
      setSync("ok");
      await loadBets();
    },
    [loadBets, toast, userId]
  );

  const updateBet = useCallback(
    async (b: Aposta) => {
      setSync("sp");
      const { error } = await supabase.from("apostas").update(toDB(b)).eq("id", b.id);
      if (error) {
        setSync("err");
        toast("Erro ao salvar");
        return;
      }
      setSync("ok");
      await loadBets();
    },
    [loadBets, toast]
  );

  const deleteBet = useCallback(
    async (id: number) => {
      const b = bets.find((x) => x.id === id);
      const msg =
        b && b.resultado !== "pendente" && b.lucro
          ? `Apagar esta aposta vai remover ${fmtR(b.lucro)} do seu lucro registrado. Confirmar?`
          : "Apagar aposta?";
      if (typeof window !== "undefined" && !window.confirm(msg)) return;
      setSync("sp");
      const { error } = await supabase.from("apostas").delete().eq("id", id);
      if (error) {
        setSync("err");
        toast("Erro");
        return;
      }
      setSync("ok");
      await loadBets();
    },
    [bets, loadBets, toast]
  );

  const setBancaValue = useCallback(
    async (v: number) => {
      if (!userId) return;
      setBancaState(v);
      persistBanca(userId, v);
      setSync("sp");
      const { error } = await supabase
        .from("config")
        .upsert({ key: "banca_inicial", value: String(v), user_id: userId }, { onConflict: "user_id,key" });
      if (error) {
        setSync("err");
        toast("Salvo offline");
        return;
      }
      setSync("ok");
    },
    [toast, userId]
  );

  const importBets = useCallback(
    async (importedBets: Aposta[], importedBanca: number) => {
      if (!userId) return;
      setSync("sp");
      const { error } = await supabase
        .from("apostas")
        .insert(importedBets.map((b) => ({ ...toDB(b), user_id: userId })));
      if (error) {
        setSync("err");
        toast("Erro ao importar");
        return;
      }
      setSync("ok");
      const banca = importedBanca || 100;
      setBancaState(banca);
      persistBanca(userId, banca);
      await supabase
        .from("config")
        .upsert({ key: "banca_inicial", value: String(banca), user_id: userId }, { onConflict: "user_id,key" });
      await loadBets();
      toast(`✓ ${importedBets.length} importadas`);
    },
    [loadBets, toast, userId]
  );

  useEffect(() => {
    loadBets();
  }, [loadBets]);

  const resolvedLucro = bets
    .filter((b) => b.resultado !== "pendente" && b.resultado !== "void")
    .reduce((s, b) => s + (b.lucro || 0), 0);
  const bancaAtual = banca + resolvedLucro;

  const openResolver = useCallback((id: number) => {
    setResolvingId(id);
    setResolverOpen(true);
  }, []);
  const closeResolver = useCallback(() => setResolverOpen(false), []);

  const openEditar = useCallback((id: number) => {
    setEditingId(id);
    setEditarOpen(true);
  }, []);
  const closeEditar = useCallback(() => setEditarOpen(false), []);

  const confirmResolver = useCallback(
    async (resultado: Resultado, oddFech: number | null) => {
      const b = bets.find((x) => x.id === resolvingId);
      if (!b) return;
      const lucro =
        resultado === "ganhou"
          ? b.stakeR * (b.odd - 1)
          : resultado === "perdeu"
          ? -b.stakeR
          : 0;
      const updated: Aposta = {
        ...b,
        resultado,
        oddFech,
        lucro: parseFloat(lucro.toFixed(2)),
      };
      setResolverOpen(false);
      await updateBet(updated);
      toast(
        resultado === "ganhou"
          ? "✓ " + fmtR(updated.lucro)
          : resultado === "perdeu"
          ? "✕ " + fmtR(updated.lucro)
          : "⊘ Void"
      );
    },
    [bets, resolvingId, updateBet, toast]
  );

  const setCalcTransfer = useCallback((t: CalcTransfer) => {
    setCalcTransferState(t);
  }, []);
  const consumeCalcTransfer = useCallback(() => {
    let val: CalcTransfer | null = null;
    setCalcTransferState((prev) => {
      val = prev;
      return null;
    });
    return val;
  }, []);

  const value: AppStoreValue = {
    bets,
    banca,
    bancaAtual,
    loading,
    sync,
    loadBets,
    insertBet,
    updateBet,
    deleteBet,
    setBancaValue,
    importBets,

    toastMsg,
    toastOn,
    toast,

    calcOpen,
    openCalc: () => setCalcOpen(true),
    closeCalc: () => setCalcOpen(false),

    bancaSheetOpen,
    openBancaSheet: () => setBancaSheetOpen(true),
    closeBancaSheet: () => setBancaSheetOpen(false),

    resolverOpen,
    resolvingId,
    openResolver,
    closeResolver,
    confirmResolver,

    editarOpen,
    editingId,
    openEditar,
    closeEditar,

    calcTransfer,
    setCalcTransfer,
    consumeCalcTransfer,
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
