"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMember } from "@/lib/member";
import { loadPrefs, savePrefs, PREF_LABELS, type NotificationPrefs } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export default function NotificationSettings() {
  const router = useRouter();
  const { member, ready } = useMember();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (ready && !member) router.replace("/join"); }, [ready, member, router]);

  useEffect(() => {
    if (!member) return;
    loadPrefs(member.id).then(setPrefs);
  }, [member?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!member || !prefs) return <div className="h-96 grid place-items-center text-smoke">טוען…</div>;

  const toggle = async (key: keyof NotificationPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await savePrefs(member.id, next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold gold-text flex-1">הגדרות התראות</h1>
        {saved && <span className="text-gold text-sm">✓ נשמר</span>}
      </div>
      <p className="text-smoke text-sm">בחרו על מה תרצו לקבל עדכון.</p>

      <div className="space-y-2">
        {PREF_LABELS.map((p) => (
          <button key={p.key} onClick={() => toggle(p.key)}
            className="w-full glass p-4 flex items-center gap-3 text-right">
            <span className="text-xl">{p.icon}</span>
            <span className="flex-1 text-sm">{p.label}</span>
            <span className={`w-11 h-6 rounded-full transition relative shrink-0 ${
              prefs[p.key] ? "bg-gold" : "bg-white/15"
            }`}>
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-ink transition-all ${
                prefs[p.key] ? "right-1" : "right-6"
              }`} />
            </span>
          </button>
        ))}
      </div>

      <Link href="/me" className="btn-ghost block text-center py-3">← לאזור האישי</Link>
    </main>
  );
}
