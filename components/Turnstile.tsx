"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const LOAD_TIMEOUT_MS = 8000;

export default function Turnstile({
  onToken,
  onError,
}: {
  onToken: (token: string | null) => void;
  onError?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!sitekey) {
      onError?.();
      return;
    }
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;
    window.turnstile.render(containerRef.current, {
      sitekey,
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(null),
      "error-callback": () => onError?.(),
    });
    setRendered(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!rendered) onError?.();
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        onLoad={() => setScriptLoaded(true)}
        onError={() => onError?.()}
      />
      <div ref={containerRef} />
    </>
  );
}
