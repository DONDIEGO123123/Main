"use client";
import { motion } from "framer-motion";
import { trackClick } from "@/lib/track";
import { useSiteSettings } from "@/lib/site";

export default function FloatingButtons() {
  const site = useSiteSettings();
  const tg = site.telegram || process.env.NEXT_PUBLIC_TELEGRAM_URL || "#";
  const wa = site.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_URL || "#";
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
      <motion.a
        href={tg}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="טלגרם"
        onClick={() => trackClick("telegram")}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="grid place-items-center rounded-full h-12 w-12 bg-[#229ED9] shadow-card text-white"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M9.04 15.6 8.9 19c.4 0 .58-.17.8-.38l1.9-1.82 3.95 2.9c.73.4 1.25.19 1.44-.67l2.6-12.2c.26-1.06-.4-1.53-1.1-1.27L3.6 11.44c-1.04.4-1.03.98-.18 1.24l3.9 1.22 9.05-5.7c.43-.26.82-.12.5.16l-7.83 7.24Z"/></svg>
      </motion.a>
      <motion.a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="וואטסאפ"
        onClick={() => trackClick("whatsapp")}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="grid place-items-center rounded-full h-12 w-12 bg-[#25D366] shadow-card text-white"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 13.9c-.24.66-1.36 1.26-1.9 1.3-.5.05-1.1.07-1.78-.14-3-1-4.96-4-5.1-4.2-.15-.2-1.2-1.6-1.2-3.06 0-1.46.76-2.18 1.03-2.48.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.5l.86 2.1c.07.16.12.34.02.54-.1.2-.15.32-.3.5l-.44.52c-.15.15-.3.32-.13.62.17.3.77 1.27 1.66 2.06 1.14 1.02 2.1 1.34 2.4 1.5.3.14.47.12.65-.08l1-1.16c.22-.3.42-.22.7-.13l2.24 1.06c.3.15.5.22.57.34.07.13.07.72-.17 1.38Z"/></svg>
      </motion.a>
    </div>
  );
}
