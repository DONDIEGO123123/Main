"use client";
import { createClient } from "@/lib/supabase/client";

export const VAPID_PUBLIC =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BGMBCRQkxPJp0AS7hx0ZrhEXWYhRPeUXw_Lw0g3Ze-Jm4tfneohtryJDs7fVpvxC23U8zRF1BxW7VTaToBYq6O4";

/** The browser needs the VAPID key as raw bytes, not base64url. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export type PushState =
  | "unsupported"   // browser can't do push at all
  | "ios-install"   // iOS Safari: must be added to the home screen first
  | "denied"        // the person said no — only they can undo this
  | "granted"       // already subscribed
  | "available";    // can be asked

/**
 * What we can actually do on this device.
 *
 * iOS only allows push once the site is installed to the home screen,
 * so we detect that case separately and ask for an install instead of
 * firing a permission prompt that would silently fail.
 */
export function pushState(): PushState {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    return isIOS && !standalone ? "ios-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "granted") return "granted";
  return "available";
}

/** Ask permission and register the device. Returns true once stored. */
export async function subscribeToPush(memberId?: string): Promise<boolean> {
  try {
    if (pushState() === "unsupported" || pushState() === "ios-install") return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const reg = await navigator.serviceWorker.ready;

    // reuse an existing subscription rather than creating a duplicate
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      });
    }

    const json = sub.toJSON() as { endpoint?: string; keys?: Record<string, string> };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    await createClient().from("push_subscriptions").upsert(
      {
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        member_id: memberId ?? null,
        user_agent: navigator.userAgent.slice(0, 200),
        failed_count: 0,
      },
      { onConflict: "endpoint" }
    );

    return true;
  } catch {
    // a blocked prompt or private mode — never surface as an error
    return false;
  }
}

/** Stop receiving, and remove the device so we don't keep sending to it. */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await createClient().from("push_subscriptions")
      .delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  } catch {
    /* ignore */
  }
}

/** True when this device is already registered with us. */
export async function isSubscribed(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    return !!(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
}
