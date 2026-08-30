"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Level = { id: string; key: string; name: string; min_points: number; discount_percent: number; perks: string; sort_order: number };
type Rule = { id: string; key: string; label: string; points: number; is_active: boolean };

export default function AdminLevels() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const s = createClient();
    Promise.all([
      s.from("levels").select("*").order("sort_order"),
      s.from("point_rules").select("*").order("key"),
    ]).then(([l, r]) => {
      setLevels((l.data as Level[]) ?? []);
      setRules((r.data as Rule[]) ?? []);
      setLoading(false);
    });
  }, []);

  const flash = (m: string) => { setSaved(m); setTimeout(() => setSaved(""), 1800); };

  const saveLevel = async (lv: Level) => {
    await createClient().from("levels").update({
      name: lv.name, min_points: lv.min_points, discount_percent: lv.discount_percent, perks: lv.perks,
    }).eq("id", lv.id);
    flash("הרמה נשמרה");
  };

  const saveRule = async (r: Rule) => {
    await createClient().from("point_rules").update({ points: r.points, is_active: r.is_active }).eq("id", r.id);
    flash("הכלל נשמר");
  };

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold">רמות ונקודות</h1>
        {saved && <span className="text-gold text-sm">✓ {saved}</span>}
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">💎 רמות VIP</h2>
        <p className="text-smoke text-sm">כמה נקודות נדרשות לכל רמה, ואיזו הנחה היא מקנה.</p>
        {levels.map((lv, i) => (
          <div key={lv.id} className="glass p-4 space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-smoke block mb-1">שם הרמה</label>
                <input className="input" value={lv.name}
                  onChange={(e) => setLevels(levels.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
              </div>
              <div>
                <label className="text-xs text-smoke block mb-1">נקודות נדרשות</label>
                <input className="input" type="number" value={lv.min_points}
                  onChange={(e) => setLevels(levels.map((x, j) => j === i ? { ...x, min_points: +e.target.value } : x))} />
              </div>
              <div>
                <label className="text-xs text-smoke block mb-1">הנחה %</label>
                <input className="input" type="number" value={lv.discount_percent}
                  onChange={(e) => setLevels(levels.map((x, j) => j === i ? { ...x, discount_percent: +e.target.value } : x))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-smoke block mb-1">הטבות (מוצג לחבר)</label>
              <input className="input" value={lv.perks}
                onChange={(e) => setLevels(levels.map((x, j) => j === i ? { ...x, perks: e.target.value } : x))} />
            </div>
            <button onClick={() => saveLevel(lv)} className="btn-gold px-6 py-2 text-sm">שמירה</button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">⭐ כללי צבירת נקודות</h2>
        <p className="text-smoke text-sm">כמה נקודות מקבל חבר על כל פעולה.</p>
        {rules.map((r, i) => (
          <div key={r.id} className="glass p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{r.label}</p>
              <p className="text-smoke text-xs font-mono" dir="ltr">{r.key}</p>
            </div>
            <input className="input w-24 text-center" type="number" value={r.points}
              onChange={(e) => setRules(rules.map((x, j) => j === i ? { ...x, points: +e.target.value } : x))} />
            <button
              onClick={() => setRules(rules.map((x, j) => j === i ? { ...x, is_active: !x.is_active } : x))}
              className={`px-3 py-2 rounded-lg text-xs border transition ${
                r.is_active ? "bg-gold/15 text-gold border-gold/40" : "border-white/15 text-smoke"
              }`}>
              {r.is_active ? "פעיל" : "כבוי"}
            </button>
            <button onClick={() => saveRule(r)} className="btn-gold px-4 py-2 text-sm">שמור</button>
          </div>
        ))}
      </section>
    </div>
  );
}
