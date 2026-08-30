"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMember, hashPin, normalizePhone, makeReferralCode, awardPoints, logEvent, type Member } from "@/lib/member";

export default function JoinForm() {
  const router = useRouter();
  const { setMember } = useMember();
  const [mode, setMode] = useState<"join" | "login">("join");
  const [form, setForm] = useState({ name: "", phone: "", pin: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async () => {
    setErr("");
    const phone = normalizePhone(form.phone);
    if (phone.length < 9) { setErr("מספר טלפון לא תקין"); return; }
    if (form.pin.length < 4) { setErr("בחרו קוד אישי של 4 ספרות לפחות"); return; }
    if (mode === "join" && !form.name.trim()) { setErr("נא למלא שם"); return; }

    setBusy(true);
    const supabase = createClient();
    const pin_hash = await hashPin(form.pin, phone);
    const { data: existing } = await supabase.from("members").select("*").eq("phone", phone).maybeSingle();

    if (mode === "login") {
      if (!existing) { setErr("לא נמצא חבר עם המספר הזה"); setBusy(false); return; }
      if ((existing as Member & { pin_hash: string }).pin_hash !== pin_hash) {
        setErr("קוד אישי שגוי"); setBusy(false); return;
      }
      await supabase.from("members").update({ last_seen_at: new Date().toISOString() }).eq("id", existing.id);
      setMember(existing as Member);
      router.push("/me");
      return;
    }

    if (existing) { setErr("המספר כבר רשום — עברו להתחברות"); setBusy(false); return; }

    const referred_by = typeof window !== "undefined" ? localStorage.getItem("luxe-ref") : null;
    const { data, error } = await supabase.from("members").insert({
      phone,
      display_name: form.name.trim(),
      pin_hash,
      referral_code: makeReferralCode(form.name.trim()),
      referred_by,
    }).select("*").single();

    if (error || !data) { setErr("ההרשמה נכשלה, נסו שוב"); setBusy(false); return; }

    await logEvent(data.id, "joined", "הצטרפות לקהילה");
    await awardPoints(data.id, "registration");

    // reward the referrer
    if (referred_by) {
      const { data: ref } = await supabase.from("members").select("id").eq("referral_code", referred_by).maybeSingle();
      if (ref) await awardPoints(ref.id, "referral_join", "חבר הצטרף דרך הקישור שלך");
    }

    const { data: fresh } = await supabase.from("members").select("*").eq("id", data.id).single();
    setMember((fresh ?? data) as Member);
    router.push("/me");
  };

  return (
    <div className="glass p-6 space-y-4">
      <div className="flex gap-2">
        {(["join", "login"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setErr(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm transition border ${
              mode === m ? "bg-gold text-ink border-gold font-semibold" : "border-white/15 text-smoke"
            }`}>
            {m === "join" ? "הצטרפות" : "כניסה"}
          </button>
        ))}
      </div>

      {mode === "join" && (
        <div>
          <label className="text-sm text-smoke block mb-1">איך לקרוא לך?</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
      )}
      <div>
        <label className="text-sm text-smoke block mb-1">מספר טלפון</label>
        <input className="input" dir="ltr" inputMode="tel" placeholder="05X-XXXXXXX"
          value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div>
        <label className="text-sm text-smoke block mb-1">
          {mode === "join" ? "בחרו קוד אישי (4 ספרות)" : "הקוד האישי שלכם"}
        </label>
        <input className="input" dir="ltr" inputMode="numeric" maxLength={6} type="password"
          value={form.pin} onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))} />
        {mode === "join" && <p className="text-smoke text-xs mt-1">שמרו את הקוד — הוא הכניסה שלכם לחשבון</p>}
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}

      <button onClick={submit} disabled={busy} className="btn-gold w-full py-3 disabled:opacity-50">
        {busy ? "רגע…" : mode === "join" ? "הצטרפות לקהילה ←" : "כניסה ←"}
      </button>
    </div>
  );
}
