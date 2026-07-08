"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AppStoreProvider } from "@/lib/store";
import Header from "./Header";
import BottomNav from "./BottomNav";
import Toast from "./Toast";
import CalcSheet from "./CalcSheet";
import BancaSheet from "./BancaSheet";
import ResolverSheet from "./ResolverSheet";
import EditarSheet from "./EditarSheet";
import OfflineBanner from "./OfflineBanner";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginRoute) router.replace("/login");
    if (user && isLoginRoute) router.replace("/");
  }, [loading, user, isLoginRoute, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="font-mono text-[11px] text-ink4 uppercase tracking-wide">Carregando…</div>
      </div>
    );
  }

  if (!user) {
    return isLoginRoute ? <>{children}</> : null;
  }

  if (isLoginRoute) return null;

  return (
    <AppStoreProvider>
      <div className="min-h-screen flex flex-col bg-paper">
        <Header />
        <OfflineBanner />
        <div
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: "calc(var(--nav-h) + 16px)" }}
        >
          <div className="px-[18px] py-5 max-w-[560px] lg:max-w-[960px] mx-auto">{children}</div>
        </div>
      </div>
      <BottomNav />
      <ResolverSheet />
      <EditarSheet />
      <BancaSheet />
      <CalcSheet />
      <Toast />
    </AppStoreProvider>
  );
}
