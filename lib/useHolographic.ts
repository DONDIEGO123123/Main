"use client";
import { useEffect, useRef, useCallback } from "react";

/**
 * Holographic tilt engine.
 *
 * Design notes:
 * - Writes CSS custom properties straight to the DOM node. React never
 *   re-renders on pointer movement, so a page of 20+ cards stays smooth.
 * - Reads the element rect once per interaction (on enter), not per move,
 *   which avoids layout thrashing.
 * - One shared device-orientation listener for every card on the page
 *   instead of one per card.
 * - Honours prefers-reduced-motion by disabling motion entirely.
 */

const MAX_ROTATE = 7;      // degrees — restrained on purpose
const MAX_PARALLAX = 10;   // px of layer separation

// ---- shared gyroscope: one listener, many subscribers -----------------
type GyroHandler = (gamma: number, beta: number) => void;
const gyroSubs = new Set<GyroHandler>();
let gyroAttached = false;
let gyroFrame = 0;

function onDeviceTilt(e: DeviceOrientationEvent) {
  if (gyroFrame) return;
  gyroFrame = requestAnimationFrame(() => {
    gyroFrame = 0;
    const g = e.gamma ?? 0;
    const b = e.beta ?? 0;
    gyroSubs.forEach((fn) => fn(g, b));
  });
}

function subscribeGyro(fn: GyroHandler) {
  gyroSubs.add(fn);
  if (!gyroAttached && typeof window !== "undefined") {
    window.addEventListener("deviceorientation", onDeviceTilt, { passive: true });
    gyroAttached = true;
  }
  return () => {
    gyroSubs.delete(fn);
    if (gyroSubs.size === 0 && gyroAttached) {
      window.removeEventListener("deviceorientation", onDeviceTilt);
      gyroAttached = false;
      if (gyroFrame) { cancelAnimationFrame(gyroFrame); gyroFrame = 0; }
    }
  };
}

function prefersReducedMotion() {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useHolographic<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const rect = useRef<DOMRect | null>(null);
  const frame = useRef(0);
  const reduced = useRef(false);

  useEffect(() => { reduced.current = prefersReducedMotion(); }, []);

  /** Push a normalised position (0..1) into the element's CSS variables. */
  const paint = useCallback((nx: number, ny: number, active: boolean) => {
    const el = ref.current;
    if (!el) return;

    const cx = nx - 0.5;
    const cy = ny - 0.5;

    el.style.setProperty("--mx", `${(nx * 100).toFixed(2)}%`);
    el.style.setProperty("--my", `${(ny * 100).toFixed(2)}%`);
    el.style.setProperty("--rx", `${(-cy * MAX_ROTATE).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(cx * MAX_ROTATE).toFixed(2)}deg`);
    el.style.setProperty("--px", `${(cx * MAX_PARALLAX).toFixed(2)}px`);
    el.style.setProperty("--py", `${(cy * MAX_PARALLAX).toFixed(2)}px`);
    // hue shift drives the iridescent layer — subtle, angle-based
    el.style.setProperty("--hue", `${(cx * 40).toFixed(1)}deg`);
    el.style.setProperty("--active", active ? "1" : "0");
  }, []);

  const schedule = useCallback((nx: number, ny: number) => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      paint(nx, ny, true);
    });
  }, [paint]);

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) { cancelAnimationFrame(frame.current); frame.current = 0; }
    rect.current = null;
    paint(0.5, 0.5, false);
  }, [paint]);

  // ---- pointer (desktop) ---------------------------------------------
  const onPointerEnter = useCallback((e: React.PointerEvent<T>) => {
    if (reduced.current || e.pointerType === "touch") return;
    rect.current = e.currentTarget.getBoundingClientRect();
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    if (reduced.current || e.pointerType === "touch") return;
    const r = rect.current ?? e.currentTarget.getBoundingClientRect();
    rect.current = r;
    schedule((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }, [schedule]);

  // ---- touch (mobile) — follows the finger, never blocks scrolling ----
  const onTouchMove = useCallback((e: React.TouchEvent<T>) => {
    if (reduced.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const r = rect.current ?? e.currentTarget.getBoundingClientRect();
    rect.current = r;
    schedule((touch.clientX - r.left) / r.width, (touch.clientY - r.top) / r.height);
  }, [schedule]);

  // ---- gyroscope (mobile, when granted) -------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (prefersReducedMotion()) return;
    // pointer devices already have a better signal
    if (!window.matchMedia("(hover: none)").matches) return;

    let visible = false;
    const el = ref.current;
    if (!el) return;

    // only tilt cards actually on screen — saves work on long lists
    const io = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting; if (!visible) reset(); },
      { threshold: 0.35 }
    );
    io.observe(el);

    const unsub = subscribeGyro((gamma, beta) => {
      if (!visible) return;
      const nx = Math.max(0, Math.min(1, 0.5 + gamma / 45));
      const ny = Math.max(0, Math.min(1, 0.5 + (beta - 45) / 60));
      paint(nx, ny, true);
    });

    return () => { io.disconnect(); unsub(); };
  }, [paint, reset]);

  useEffect(() => () => {
    if (frame.current) cancelAnimationFrame(frame.current);
  }, []);

  return {
    ref,
    handlers: {
      onPointerEnter,
      onPointerMove,
      onPointerLeave: reset,
      onTouchMove,
      onTouchEnd: reset,
      onTouchCancel: reset,
      // keyboard users get the lit state without any motion
      onFocus: () => paint(0.5, 0.35, true),
      onBlur: reset,
    },
  };
}
