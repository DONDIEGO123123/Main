"use client";
import { trackClick } from "@/lib/track";
import { useSiteSettings } from "@/lib/site";

export default function ContactChannels({ tg, wa }: { tg: string; wa: string }) {
  const site = useSiteSettings();
  tg = site.telegram || tg;
  wa = site.whatsapp || wa;
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <a href={tg} target="_blank" rel="noopener noreferrer" onClick={() => trackClick("telegram")}
        className="glass-gold p-6 text-center hover:scale-[1.02] transition-transform">
        <p className="text-3xl">✈️</p>
        <p className="font-bold mt-2">טלגרם</p>
        <p className="text-smoke text-sm mt-1">מענה מיידי</p>
      </a>
      <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => trackClick("whatsapp")}
        className="glass-gold p-6 text-center hover:scale-[1.02] transition-transform">
        <p className="text-3xl">💬</p>
        <p className="font-bold mt-2">וואטסאפ</p>
        <p className="text-smoke text-sm mt-1">זמינים כל היום</p>
      </a>
    </div>
  );
}
