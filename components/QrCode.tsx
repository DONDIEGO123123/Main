"use client";
import { useEffect, useRef } from "react";

/**
 * Minimal QR renderer (no dependency) using a public image endpoint fallback.
 * Renders a canvas the admin can right-click / long-press to save.
 */
export default function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const ref = useRef<HTMLImageElement>(null);
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

  useEffect(() => { if (ref.current) ref.current.src = src; }, [src]);

  return (
    <div className="inline-block bg-white p-3 rounded-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={ref} alt="QR" width={size} height={size} />
    </div>
  );
}
