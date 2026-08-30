"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Registers the service worker and offers "add to home screen". */
export default function InstallPrompt() {
  const { t } = useLang();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (localStorage.getItem("luxe-install-dismissed")) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setTimeout(() => setShow(true), 8000);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem("luxe-install-dismissed", "1");
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  if (!show || !deferred) return null;

  return (
    <div className="fixed bottom-24 inset-x-4 z-50 glass-gold p-4 flex items-center gap-3 max-w-md mx-auto">
      <span className="text-2xl">📱</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{t("installApp")}</p>
        <p className="text-smoke text-xs">גישה מהירה ישירות ממסך הבית</p>
      </div>
      <button onClick={install} className="btn-gold px-4 py-2 text-sm shrink-0">{t("install")}</button>
      <button onClick={dismiss} aria-label="סגירה" className="text-smoke text-xl shrink-0">×</button>
    </div>
  );
}
