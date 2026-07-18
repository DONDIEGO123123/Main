"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function LoadingScreen() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1100);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink"
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          aria-hidden
        >
          <motion.p
            className="font-display text-5xl font-black gold-text"
            initial={{ opacity: 0, letterSpacing: "0.4em" }}
            animate={{ opacity: 1, letterSpacing: "0.12em" }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            LUXE
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
