import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { AppStoreProvider } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import CalcSheet from "@/components/CalcSheet";
import BancaSheet from "@/components/BancaSheet";
import ResolverSheet from "@/components/ResolverSheet";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hegreen",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hegreen",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F5F0E8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${playfair.variable} ${dmMono.variable} ${dmSans.variable} font-sans text-[15px] bg-paper text-ink min-h-screen overflow-x-hidden`}
      >
        <AppStoreProvider>
          <div className="min-h-screen flex flex-col bg-paper">
            <Header />
            <div
              className="flex-1 overflow-y-auto"
              style={{ paddingBottom: "calc(var(--nav-h) + 16px)" }}
            >
              <div className="px-[18px] py-5 max-w-[560px] lg:max-w-[960px] mx-auto">{children}</div>
            </div>
          </div>
          <BottomNav />
          <ResolverSheet />
          <BancaSheet />
          <CalcSheet />
          <Toast />
        </AppStoreProvider>
      </body>
    </html>
  );
}
