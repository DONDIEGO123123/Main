"use client";
import { motion } from "framer-motion";

export default function BarChart({
  data,
  title,
}: {
  data: { label: string; value: number }[];
  title: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="glass p-6">
      <p className="font-semibold mb-5">{title}</p>
      <div className="space-y-4">
        {data.length === 0 && <p className="text-smoke text-sm">אין נתונים להצגה עדיין.</p>}
        {data.map((d, i) => (
          <div key={d.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/85">{d.label}</span>
              <span className="text-gold font-semibold tabular-nums">{d.value}</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-l from-gold-soft to-gold-dim"
                initial={{ width: 0 }}
                animate={{ width: `${(d.value / max) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
