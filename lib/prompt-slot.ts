"use client";

/**
 * Only one floating prompt at a time.
 *
 * The install bar and the notification bar both sit above the cart button,
 * so without this they would cover each other. Whoever claims the slot
 * first keeps it until it releases.
 */
let holder: string | null = null;
const listeners = new Set<() => void>();

export function claimSlot(id: string): boolean {
  if (holder && holder !== id) return false;
  holder = id;
  return true;
}

export function releaseSlot(id: string) {
  if (holder !== id) return;
  holder = null;
  listeners.forEach((fn) => fn());
}

export function slotFree(): boolean {
  return holder === null;
}

/** Call fn when the slot frees up, so a waiting prompt can take its turn. */
export function onSlotFree(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
