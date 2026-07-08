"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth";
import Turnstile from "@/components/Turnstile";

export default function LoginPage() {
  const { signInWithOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  const handleToken = useCallback((token: string | null) => setCaptchaToken(token), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !captchaToken) return;
    setSending(true);
    setError("");
    const errMsg = await signInWithOtp(email.trim(), captchaToken);
    setSending(false);
    if (errMsg) {
      setError(errMsg);
      setCaptchaToken(null);
      setTurnstileKey((k) => k + 1);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-[18px]">
      <div className="w-full max-w-[380px]">
        <div className="font-serif italic text-2xl text-ink tracking-tight mb-1 text-center">Hegreen</div>
        <div className="font-mono text-[11px] text-ink4 text-center mb-8 uppercase tracking-wide">
          Acesso por link mágico
        </div>

        {sent ? (
          <div className="border border-rule px-4 py-5 text-center">
            <div className="text-sm text-ink mb-1.5">Verifique seu email</div>
            <div className="font-mono text-[11px] text-ink4">
              Enviamos um link de acesso para {email}. Abra-o neste dispositivo para entrar.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block font-mono text-[10px] uppercase tracking-wide text-ink3 mb-1.5">
              Email
            </label>
            <input
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="mt-3">
              <Turnstile key={turnstileKey} onToken={handleToken} />
            </div>
            {error && <div className="text-lose text-xs mt-2">{error}</div>}
            <button
              type="submit"
              disabled={sending || !captchaToken}
              className="w-full p-[15px] bg-ink text-paper text-sm font-semibold tracking-wide font-mono uppercase transition-opacity disabled:opacity-30 mt-4"
            >
              {sending ? "Enviando…" : "Enviar link de acesso"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
