"use client";
import { trackClick } from "@/lib/track";
import { useSiteSettings } from "@/lib/site";

export default function VipClub() {
  const site = useSiteSettings();
  const tg = site.vip_telegram || site.telegram;
  if (!tg) return null;
  return (
    <div className="glass-gold p-8 md:p-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(50% 60% at 50% 0%, rgba(212,175,55,0.5), transparent)" }} />
      <div className="relative">
        <span className="inline-block rounded-full bg-gold text-ink text-xs font-black px-4 py-1 tracking-widest">VIP CLUB</span>
        <h3 className="font-display text-3xl md:text-4xl font-bold mt-4">🔥 רוצה את המבצעים לפני כולם?</h3>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 text-smoke text-sm">
          <span>✦ מבצעים בלעדיים</span><span>✦ מוצרים חדשים ראשונים</span><span>✦ קופונים אישיים</span>
        </div>
        <a href={tg} target="_blank" rel="noopener noreferrer" onClick={() => trackClick("telegram")}
          className="btn-gold inline-block mt-6 px-8 py-3">הצטרפות לטלגרם ←</a>
      </div>
    </div>
  );
}
