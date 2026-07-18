"use client";
import { useEffect, useRef, useState } from "react";
import { useSiteSettings } from "@/lib/site";

/** Floating background-music toggle. Autoplays if the browser allows it. */
export default function MusicPlayer() {
  const { music_url } = useSiteSettings();
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!music_url || !ref.current) return;
    if (localStorage.getItem("luxe-music") === "off") return;
    ref.current.volume = 0.35;
    ref.current.play().then(() => setPlaying(true)).catch(() => setBlocked(true));
  }, [music_url]);

  if (!music_url) return null;

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (playing) {
      a.pause(); setPlaying(false);
      localStorage.setItem("luxe-music", "off");
    } else {
      a.volume = 0.35;
      a.play().then(() => { setPlaying(true); setBlocked(false); }).catch(() => {});
      localStorage.setItem("luxe-music", "on");
    }
  };

  return (
    <>
      <audio ref={ref} src={music_url} loop preload="none" />
      <button
        onClick={toggle}
        aria-label={playing ? "השתקת מוזיקה" : "הפעלת מוזיקה"}
        className={`fixed bottom-5 left-5 z-50 h-12 w-12 rounded-full glass-gold grid place-items-center text-gold text-xl shadow-glow ${
          !playing && blocked ? "animate-pulse" : ""
        }`}
      >
        {playing ? (
          <span className="flex items-end gap-[3px] h-4" aria-hidden>
            <span className="w-[3px] bg-gold animate-[floaty_0.8s_ease-in-out_infinite] h-2" />
            <span className="w-[3px] bg-gold animate-[floaty_0.8s_ease-in-out_0.2s_infinite] h-4" />
            <span className="w-[3px] bg-gold animate-[floaty_0.8s_ease-in-out_0.4s_infinite] h-3" />
          </span>
        ) : (
          "♪"
        )}
      </button>
    </>
  );
}
