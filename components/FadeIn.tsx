"use client";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Section reveal.
 *
 * This used to lift 28px over 0.7s on every section, which turned motion
 * into background noise. It now travels a short distance quickly, so it
 * reads as the page settling rather than as an entrance animation.
 * Anyone who asked for reduced motion gets no movement at all.
 */
export default function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
