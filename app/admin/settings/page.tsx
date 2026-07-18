"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const sectionLabels: Record<string, string> = {
  hero: "סליידר ראשי",
  featured: "מוצרים מובילים",
  promotions: "מבצעים",
  why_us: "למה לבחור בנו",
  delivery: "אזורי משלוח",
  reviews: "ביקורות",
  faq: "שאלות נפוצות",
  contact: "צור קשר",
};

type Site = {
  name?: string; tagline?: string;
  telegram?: string; whatsapp?: string; music_url?: string;
};

export default function AdminSettings() {
  const [sections, setSections] = useState<Record<string, boolean>>({});
  const [site, setSite] = useState<Site>({});
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("settings").select("value").eq("key", "homepage_sections").single(),
      supabase.from("settings").select("value").eq("key", "site").single(),
    ]).then(([a, b]) => {
      setSections((a.data?.value as Record<string, boolean>) ?? {});
      setSite((b.data?.value as Site) ?? {});
      setLoaded(true);
    });
  }, []);

  const uploadMusic = async (file: File) => {
    setUploading(true);
    const supabase = createClient();
    const path = `music-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (!error) {
      const url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
      setSite((s) => ({ ...s, music_url: url }));
    }
    setUploading(false);
  };

  const save = async () => {
    const supabase = createClient();
    const now = new Date().toISOString();
    await Promise.all([
      supabase.from("settings").upsert({ key: "homepage_sections", value: sections, updated_at: now }),
      supabase.from("settings").upsert({ key: "site", value: site, updated_at: now }),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!loaded) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  const input = (key: keyof Site, label: string, placeholder: string) => (
    <div>
      <label className="text-sm text-smoke block mb-1">{label}</label>
      <input className="input" dir="ltr" placeholder={placeholder}
        value={site[key] ?? ""} onChange={(e) => setSite({ ...site, [key]: e.target.value })} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="font-display text-3xl font-bold">הגדרות אתר</h1>

      <div className="glass p-6 space-y-4">
        <p className="font-semibold">קישורי יצירת קשר</p>
        <p className="text-smoke text-sm">הקישורים לכפתורים הצפים, לדף צור קשר ולכפתור ההזמנה במוצרים. נכנס לתוקף מיד.</p>
        {input("telegram", "קישור טלגרם", "https://t.me/username")}
        {input("whatsapp", "קישור וואטסאפ", "https://wa.me/972501234567")}
      </div>

      <div className="glass p-6 space-y-4">
        <p className="font-semibold">מוזיקת רקע</p>
        <p className="text-smoke text-sm">שיר שמתנגן באתר בלולאה. מומלץ MP3 עד 10MB. המבקרים יכולים להשתיק בכפתור צף.</p>
        {site.music_url ? (
          <div className="flex items-center gap-3">
            <audio src={site.music_url} controls className="w-full" />
            <button onClick={() => setSite({ ...site, music_url: "" })}
              className="btn-ghost px-3 py-2 text-sm shrink-0">הסרה</button>
          </div>
        ) : (
          <label className="flex h-16 cursor-pointer items-center justify-center rounded-xl border border-dashed border-gold/40 text-smoke text-sm hover:bg-gold/5 transition">
            {uploading ? "מעלה…" : "לחצו להעלאת קובץ שמע"}
            <input type="file" accept="audio/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadMusic(e.target.files[0])} />
          </label>
        )}
      </div>

      <div className="glass p-6 space-y-4">
        <p className="font-semibold">אזורים בדף הבית</p>
        <p className="text-smoke text-sm">כבו אזור כדי להסתיר אותו מדף הבית. השינוי נכנס לתוקף תוך דקה.</p>
        {Object.keys(sectionLabels).map((k) => (
          <div key={k} className="flex items-center justify-between border-b border-white/5 pb-3">
            <span>{sectionLabels[k]}</span>
            <button
              onClick={() => setSections({ ...sections, [k]: sections[k] === false })}
              className={`w-14 h-8 rounded-full transition relative ${
                sections[k] !== false ? "bg-gold" : "bg-white/10"
              }`}
              aria-pressed={sections[k] !== false}
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-ink transition-all ${
                sections[k] !== false ? "right-1" : "right-7"
              }`} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={save} className="btn-gold px-6 py-2.5">שמירה</button>
      {saved && <p className="text-emerald-400 text-sm">נשמר ✓</p>}
    </div>
  );
}
