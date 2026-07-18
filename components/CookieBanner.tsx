"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setShow(true);
  }, []);
  const accept = () => {
    localStorage.setItem("cookie-consent", "1");
    setShow(false);
  };
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-4 inset-x-4 md:inset-x-auto md:left-6 md:max-w-sm z-50 glass-gold p-5"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
        >
          <p className="text-sm text-smoke">
            האתר משתמש בעוגיות לשיפור החוויה ולמדידת ביקורים.
          </p>
          <button onClick={accept} className="btn-gold mt-3 w-full py-2 text-sm">
            הבנתי, אפשר להמשיך
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
