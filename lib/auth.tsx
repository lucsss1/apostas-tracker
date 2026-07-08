"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthValue {
  user: User | null;
  loading: boolean;
  signInWithOtp: (email: string, captchaToken?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function friendlyAuthError(error: { message?: string; status?: number }): string {
  const msg = (error.message || "").toLowerCase();
  const status = error.status;

  if (status === 429 || msg.includes("rate limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";
  }
  if (msg.includes("captcha")) {
    return "Não foi possível confirmar que você não é um robô. Recarregue a página e tente novamente.";
  }
  if (msg.includes("email") && (msg.includes("invalid") || msg.includes("valid"))) {
    return "Esse email não parece válido. Confira e tente de novo.";
  }
  if (msg.includes("failed to fetch") || msg.includes("network")) {
    return "Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.";
  }
  return "Não foi possível enviar o link de acesso agora. Tente novamente em instantes.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithOtp = useCallback(async (email: string, captchaToken?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        captchaToken,
      },
    });
    if (!error) return null;
    return friendlyAuthError(error);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value: AuthValue = {
    user: session?.user ?? null,
    loading,
    signInWithOtp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
