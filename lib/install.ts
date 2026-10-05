"use client";
import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

/** The deferred Android prompt is captured once and shared by every component. */
let deferredPrompt: BIPEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BIPEvent;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    try { localStorage.setItem("luxe-installed", "1"); } catch { /* ignore */ }
    listeners.forEach((fn) => fn());
  });
}

export type InstallMode =
  | "installed"   // already running from the home screen
  | "android"     // the browser will show a real install dialog
  | "ios"         // Safari: we have to explain Share → Add to Home Screen
  | "none";       // desktop or an unsupported browser

export function installMode(): InstallMode {
  if (typeof window === "undefined") return "none";

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";

  if (deferredPrompt) return "android";

  const ua = navigator.userAgent;
  // iPadOS reports as Mac, so check for touch as well
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";

  return "none";
}

/**
 * Tracks whether this device can be offered an install, and how.
 * Re-renders when the browser hands us the deferred prompt.
 */
export function useInstall() {
  const [mode, setMode] = useState<InstallMode>("none");

  useEffect(() => {
    const sync = () => setMode(installMode());
    sync();
    listeners.add(sync);
    return () => { listeners.delete(sync); };
  }, []);

  /** Fires the native dialog on Android. Returns true if they accepted. */
  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      listeners.forEach((fn) => fn());
      return outcome === "accepted";
    } catch {
      return false;
    }
  };

  return { mode, install, canInstall: mode === "android" || mode === "ios" };
}
