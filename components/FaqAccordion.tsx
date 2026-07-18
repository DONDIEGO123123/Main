"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Faq } from "@/lib/types";

export default function FaqAccordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {items.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id} className={`glass overflow-hidden transition-colors ${isOpen ? "border-gold/30" : ""}`}>
            <button
              onClick={() => setOpen(isOpen ? null : f.id)}
              className="w-full flex items-center justify-between gap-4 p-5 text-start"
              aria-expanded={isOpen}
            >
              <span className="font-semibold">{f.question}</span>
              <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className="text-gold text-2xl leading-none shrink-0">
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="px-5 pb-5 text-smoke leading-relaxed">{f.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
