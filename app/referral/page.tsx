"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSiteSettings } from "@/lib/site";
import FadeIn from "@/components/FadeIn";

export const dynamic = "force-dynamic";

function makeCode(name: string) {
  const base = (name || "friend").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "FRIEND";
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function ReferralPage() {
  const site = useSiteSettings();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (site.referral_enabled === false) {
    return <div className="mx-auto max-w-lg px-4 py-32 text-center text-smoke">התוכנית אינה פעילה כרגע.</div>;
  }

  const generate = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    const supabase = createClient();
    const code = makeCode(form.name);
    await supabase.from("referrals").insert({ code, owner_name: form.name, owner_phone: form.phone });
    setLink(`${window.location.origin}/?ref=${code}`);
    setBusy(false);
  };

  const share = () => {
    if (navigator.share) navigator.share({ title: "מבצע בשבילך", url: link });
    else { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <FadeIn>
        <div className="text-center">
          <span className="text-5xl">🎁</span>
          <h1 className="font-display text-4xl font-bold gold-text mt-4">חבר מביא חבר</h1>
          <p className="text-smoke mt-3">
            {site.referral_reward || "שתפו את החברים שלכם — ושניכם נהנים מהטבה על ההזמנה הבאה."}
          </p>
        </div>
        {!link ? (
          <div className="glass p-6 mt-8 space-y-4">
            <input className="input" placeholder="השם שלך" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" dir="ltr" placeholder="טלפון (לא חובה)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <button onClick={generate} disabled={busy} className="btn-gold w-full py-3">{busy ? "יוצר…" : "צור קישור אישי"}</button>
          </div>
        ) : (
          <div className="glass-gold p-6 mt-8 text-center space-y-4">
            <p className="text-smoke text-sm">הקישור האישי שלך:</p>
            <p className="font-mono text-gold text-sm break-all bg-black/30 rounded-lg p-3" dir="ltr">{link}</p>
            <button onClick={share} className="btn-gold w-full py-3">{copied ? "הועתק ✓" : "שיתוף הקישור ←"}</button>
            <p className="text-xs text-smoke">כל חבר שייכנס דרך הקישור ויזמין — נזהה ונעניק לכם את ההטבה.</p>
          </div>
        )}
      </FadeIn>
    </div>
  );
}
