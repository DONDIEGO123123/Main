"use client";
import { useLang, type Lang } from "@/lib/i18n";

const OPTIONS: { key: Lang; label: string }[] = [
  { key: "he", label: "עב" },
  { key: "ru", label: "RU" },
];

export default function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex gap-1 rounded-full glass p-1">
      {OPTIONS.map((o) => (
        <button key={o.key} onClick={() => setLang(o.key)}
          className={`px-2.5 py-1 rounded-full text-xs transition ${
            lang === o.key ? "bg-gold text-ink font-semibold" : "text-smoke"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
