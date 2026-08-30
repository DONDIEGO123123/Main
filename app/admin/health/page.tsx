"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type Check = { label: string; status: "ok" | "warn" | "error"; detail: string };

/** System health check (#61). Verifies each integration is actually wired. */
export default function AdminHealth() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);

  const run = async () => {
    setLoading(true);
    const s = createClient();
    const out: Check[] = [];

    // database
    const { error: dbErr, count } = await s.from("products")
      .select("id", { count: "exact", head: true });
    out.push(dbErr
      ? { label: "מסד נתונים", status: "error", detail: dbErr.message }
      : { label: "מסד נתונים", status: "ok", detail: `${count ?? 0} מוצרים` });

    // storage
    const { error: stErr } = await s.storage.from("media").list("", { limit: 1 });
    out.push(stErr
      ? { label: "אחסון קבצים", status: "error", detail: "לא נגיש" }
      : { label: "אחסון קבצים", status: "ok", detail: "מחובר" });

    // settings-backed integrations
    const { data: settings } = await s.from("settings").select("key,value")
      .in("key", ["site", "notify", "sheet"]);
    const map = new Map(((settings ?? []) as { key: string; value: Record<string, unknown> }[])
      .map((r) => [r.key, r.value]));

    const notify = map.get("notify") ?? {};
    out.push(notify.enabled && notify.bot_token && notify.chat_id
      ? { label: "התראות טלגרם", status: "ok", detail: "מוגדר ופעיל" }
      : { label: "התראות טלגרם", status: "warn", detail: "לא מוגדר — לא תקבל התראות על הזמנות" });

    const sheet = map.get("sheet") ?? {};
    out.push(sheet.enabled && sheet.url
      ? { label: "סנכרון לגיליון", status: "ok", detail: "מוגדר ופעיל" }
      : { label: "סנכרון לגיליון", status: "warn", detail: "לא מוגדר" });

    const site = map.get("site") ?? {};
    out.push(site.whatsapp
      ? { label: "קישור וואטסאפ", status: "ok", detail: "מוגדר" }
      : { label: "קישור וואטסאפ", status: "error", detail: "חסר — לקוחות לא יוכלו להשלים הזמנה" });

    // server-side point functions
    const { error: rpcErr } = await s.rpc("award_points", {
      p_member_id: "00000000-0000-0000-0000-000000000000",
      p_rule_key: "__healthcheck__", p_label: null, p_multiplier: 1, p_idem: null,
    });
    out.push(!rpcErr || rpcErr.code === "PGRST202"
      ? { label: "פונקציות אבטחה", status: rpcErr ? "error" : "ok",
          detail: rpcErr ? "לא הותקנו — הרץ את m1" : "מותקנות" }
      : { label: "פונקציות אבטחה", status: "ok", detail: "מותקנות" });

    // recent activity
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const { count: evCount } = await s.from("events")
      .select("id", { count: "exact", head: true }).gte("created_at", since);
    out.push((evCount ?? 0) > 0
      ? { label: "מעקב אירועים", status: "ok", detail: `${evCount} אירועים השבוע` }
      : { label: "מעקב אירועים", status: "warn", detail: "אין אירועים — ייתכן שהמעקב לא פעיל" });

    setChecks(out);
    setLoading(false);
  };

  useEffect(() => { run(); }, []);

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  const icon = (s: Check["status"]) => (s === "ok" ? "🟢" : s === "warn" ? "🟡" : "🔴");
  const errors = checks.filter((c) => c.status === "error").length;
  const warns = checks.filter((c) => c.status === "warn").length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold flex-1">בדיקת מערכת</h1>
        <button onClick={run} className="btn-ghost px-4 py-2 text-sm">בדיקה מחדש</button>
      </div>

      <div className={`glass p-5 text-center ${errors > 0 ? "border-red-400/40" : ""}`}>
        <p className="text-3xl">{errors > 0 ? "🔴" : warns > 0 ? "🟡" : "🟢"}</p>
        <p className="font-semibold mt-2">
          {errors > 0 ? `${errors} תקלות דורשות טיפול`
            : warns > 0 ? `${warns} דברים לא מוגדרים`
            : "הכל תקין"}
        </p>
      </div>

      <div className="space-y-2">
        {checks.map((c) => (
          <div key={c.label} className="glass p-4 flex items-center gap-3">
            <span className="text-lg shrink-0">{icon(c.status)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{c.label}</p>
              <p className="text-smoke text-xs mt-0.5">{c.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
