"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAdmin } from "@/lib/flags";

type Flag = { key: string; label: string; description: string; enabled: boolean };

/** Feature flags (#49) — turn features off without a deploy. */
export default function AdminFlags() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient().from("feature_flags").select("*").order("sort_order")
      .then(({ data }) => { setFlags((data as Flag[]) ?? []); setLoading(false); });
  }, []);

  const toggle = async (f: Flag) => {
    const next = !f.enabled;
    setFlags((r) => r.map((x) => (x.key === f.key ? { ...x, enabled: next } : x)));
    await createClient().from("feature_flags").update({ enabled: next }).eq("key", f.key);
    logAdmin("update", "feature_flags", f.key, `${f.label}: ${next ? "הופעל" : "כובה"}`);
    try { sessionStorage.removeItem("luxe-flags"); } catch { /* ignore */ }
  };

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">הפעלת פיצ׳רים</h1>
      <p className="text-smoke text-sm">
        כיבוי פיצ׳ר מסתיר אותו מהאתר מיד, בלי לגעת בקוד ובלי לאבד נתונים.
      </p>

      <div className="space-y-2">
        {flags.map((f) => (
          <button key={f.key} onClick={() => toggle(f)}
            className="w-full glass p-4 flex items-center gap-3 text-right">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{f.label}</p>
              {f.description && <p className="text-smoke text-xs mt-0.5">{f.description}</p>}
            </div>
            <span className={`w-11 h-6 rounded-full transition relative shrink-0 ${
              f.enabled ? "bg-gold" : "bg-white/15"
            }`}>
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-ink transition-all ${
                f.enabled ? "right-1" : "right-6"
              }`} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
