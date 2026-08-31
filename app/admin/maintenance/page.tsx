"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminMaintenance() {
  const [on, setOn] = useState(false);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    createClient().from("settings").select("value").eq("key", "site").maybeSingle()
      .then(({ data }) => {
        const v = (data?.value ?? {}) as { maintenance?: boolean; maintenance_msg?: string };
        setOn(!!v.maintenance);
        setMsg(v.maintenance_msg ?? "האתר בעדכון קצר, נחזור עוד רגע 🖤");
        setLoaded(true);
      });
  }, []);

  const save = async () => {
    const s = createClient();
    const { data } = await s.from("settings").select("value").eq("key", "site").maybeSingle();
    const v = { ...((data?.value ?? {}) as object), maintenance: on, maintenance_msg: msg };
    await s.from("settings").upsert({ key: "site", value: v }, { onConflict: "key" });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  if (!loaded) return <div className="skeleton h-64 rounded-2xl" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">מצב תחזוקה</h1>
      <p className="text-smoke text-sm">
        כשמופעל, מבקרים רואים הודעת עדכון. הפאנל שלך נשאר זמין תמיד.
      </p>

      <div className="glass p-5 space-y-4">
        <button onClick={() => setOn(!on)}
          className={`w-full py-4 rounded-xl border transition ${
            on ? "bg-red-500/15 text-red-300 border-red-400/40" : "border-white/15 text-smoke"
          }`}>
          {on ? "🛠️ האתר סגור למבקרים" : "✓ האתר פתוח"}
        </button>

        <div>
          <label className="text-sm text-smoke block mb-1">הודעה למבקרים</label>
          <textarea className="input min-h-[80px]" value={msg} onChange={(e) => setMsg(e.target.value)} />
        </div>

        <button onClick={save} className="btn-gold w-full py-3">
          {saved ? "✓ נשמר" : "שמירה"}
        </button>
      </div>
    </div>
  );
}
