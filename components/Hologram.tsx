"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

/**
 * Fullscreen "hologram" presentation of a product:
 * 3D tilt (finger drag / device motion), holographic sweep, scanlines,
 * floating animation, light base rings + reflection.
 */
export default function Hologram({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  // device motion (iOS needs a permission tap; drag always works as fallback)
  useEffect(() => {
    if (!product) return;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (dragging.current || e.beta === null || e.gamma === null) return;
      setTilt({ x: Math.max(-18, Math.min(18, e.gamma / 2)), y: Math.max(-14, Math.min(14, (e.beta - 45) / 3)) });
    };
    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, [product]);

  const start = (x: number, y: number) => { dragging.current = true; last.current = { x, y }; };
  const move = (x: number, y: number) => {
    if (!dragging.current) return;
    setTilt((t) => ({
      x: Math.max(-25, Math.min(25, t.x + (x - last.current.x) / 6)),
      y: Math.max(-18, Math.min(18, t.y - (y - last.current.y) / 8)),
    }));
    last.current = { x, y };
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[80] overflow-hidden bg-[#020204] touch-none select-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => start(e.clientX, e.clientY)}
          onMouseMove={(e) => move(e.clientX, e.clientY)}
          onMouseUp={() => (dragging.current = false)}
          onTouchStart={(e) => start(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => move(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={() => (dragging.current = false)}
        >
          {/* ambient glow */}
          <div className="absolute inset-0 opacity-60"
            style={{ background: "radial-gradient(60% 45% at 50% 62%, rgba(212,175,55,0.22), transparent 70%)" }} />
          {/* star dust */}
          {[...Array(26)].map((_, i) => (
            <span key={i} className="absolute rounded-full bg-gold/50 animate-floaty"
              style={{
                width: 2 + (i % 3), height: 2 + (i % 3),
                left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`,
                animationDelay: `${(i % 10) * 0.4}s`, animationDuration: `${4 + (i % 5)}s`, opacity: 0.15 + (i % 4) * 0.1,
              }} />
          ))}

          <button onClick={onClose} aria-label="סגירה"
            className="absolute top-5 right-5 z-10 h-11 w-11 rounded-full glass-gold text-gold text-2xl leading-none">×</button>

          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ perspective: "1100px" }}>
            {/* the hologram */}
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`, transformStyle: "preserve-3d" }}
              className="relative w-[72vw] max-w-sm aspect-square will-change-transform"
            >
              <div className="absolute inset-0 rounded-3xl overflow-hidden holo-img"
                style={{ boxShadow: "0 0 60px rgba(212,175,55,0.35), 0 0 140px rgba(212,175,55,0.15)" }}>
                {product.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="h-full w-full grid place-items-center bg-panel text-gold/40 text-8xl">✦</div>
                )}
                {/* holographic color sweep + scanlines */}
                <div className="absolute inset-0 holo-sweep" />
                <div className="absolute inset-0 holo-lines" />
                <div className="absolute inset-0 rounded-3xl border border-gold/40" />
              </div>
              {/* reflection */}
              <div className="absolute top-full left-0 right-0 h-2/3 mt-4 rounded-3xl overflow-hidden opacity-25"
                style={{ transform: "scaleY(-1)", maskImage: "linear-gradient(to top, black, transparent 75%)", WebkitMaskImage: "linear-gradient(to top, black, transparent 75%)" }}>
                {product.image_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={product.image_url} alt="" className="h-full w-full object-cover" draggable={false} />
                )}
              </div>
            </motion.div>

            {/* base rings */}
            <div className="relative mt-10 h-16 w-[80vw] max-w-md" aria-hidden>
              {[0, 1, 2].map((i) => (
                <motion.div key={i}
                  className="absolute left-1/2 top-1/2 rounded-[50%] border border-gold/50"
                  style={{ width: `${70 - i * 20}%`, height: `${44 - i * 12}%` }}
                  animate={{ opacity: [0.15, 0.6, 0.15], scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.4, delay: i * 0.35, repeat: Infinity, ease: "easeInOut" }}
                  initial={false}
                  transformTemplate={(_, gen) => `translate(-50%,-50%) ${gen}`}
                />
              ))}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-gold shadow-glow" />
            </div>

            <div className="mt-6 text-center px-6">
              <h2 className="font-display text-2xl font-bold gold-text">{product.name}</h2>
              <p className="text-gold mt-1 text-lg font-semibold">{formatPrice(product.price)}</p>
              <p className="text-smoke text-xs mt-3">גררו באצבע כדי לסובב ✨</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
