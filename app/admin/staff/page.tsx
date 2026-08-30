"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Staff = { id: string; email: string; role: string; created_at: string };

const ROLES = [
  { key: "owner", label: "בעלים", desc: "גישה מלאה כולל נתונים כספיים" },
  { key: "manager", label: "מנהל", desc: "הזמנות, מוצרים ולקוחות — בלי רווחיות" },
  { key: "viewer", label: "צפייה", desc: "רק צפייה בהזמנות" },
];

export default function AdminStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient().from("staff").select("*").order("created_at")
      .then(({ data }) => { setStaff((data as Staff[]) ?? []); setLoading(false); });
  }, []);

  const add = async () => {
    if (!email.trim()) return;
    const { data } = await createClient().from("staff")
      .insert({ email: email.trim().toLowerCase(), role }).select("*").single();
    if (data) setStaff([...staff, data as Staff]);
    setEmail("");
  };

  const del = async (id: string) => {
    await createClient().from("staff").delete().eq("id", id);
    setStaff(staff.filter((s) => s.id !== id));
  };

  const changeRole = async (id: string, r: string) => {
    setStaff(staff.map((s) => s.id === id ? { ...s, role: r } : s));
    await createClient().from("staff").update({ role: r }).eq("id", id);
  };

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">צוות והרשאות</h1>
      <p className="text-smoke text-sm">
        הוסף כאן אימייל, ואז צור לו משתמש ב-Supabase תחת Authentication → Users.
      </p>

      <div className="glass p-5 space-y-3">
        <div>
          <label className="text-sm text-smoke block mb-1">אימייל</label>
          <input className="input" dir="ltr" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-smoke block mb-1">תפקיד</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label} — {r.desc}</option>)}
          </select>
        </div>
        <button onClick={add} className="btn-gold px-6 py-2.5 text-sm">הוספה</button>
      </div>

      {staff.length > 0 && (
        <div className="space-y-2">
          {staff.map((s) => (
            <div key={s.id} className="glass p-4 flex items-center gap-3">
              <span className="flex-1 text-sm truncate" dir="ltr">{s.email}</span>
              <select className="input w-32 text-sm" value={s.role}
                onChange={(e) => changeRole(s.id, e.target.value)}>
                {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
              <button onClick={() => del(s.id)} className="text-red-400 text-sm shrink-0">הסרה</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
