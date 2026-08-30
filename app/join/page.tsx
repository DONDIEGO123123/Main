import type { Metadata } from "next";
import JoinForm from "./JoinForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "הצטרפות לקהילה",
  description: "הצטרפו לקהילה וצברו נקודות והטבות",
};

const perks = [
  { icon: "⭐", title: "נקודות על כל הזמנה", text: "שנצברות להטבות אמיתיות" },
  { icon: "💎", title: "רמות VIP", text: "ככל שתצברו יותר, ההנחה גדלה" },
  { icon: "🎁", title: "הטבות בלעדיות", text: "מבצעים שרק חברי הקהילה מקבלים" },
  { icon: "👥", title: "חבר מביא חבר", text: "קישור אישי — ושניכם מרוויחים" },
];

export default function JoinPage() {
  return (
    <main className="container mx-auto px-4 py-16 max-w-lg">
      <div className="text-center mb-8">
        <p className="text-4xl mb-3">🔥</p>
        <h1 className="font-display text-3xl font-bold gold-text">הצטרפו לקהילה</h1>
        <p className="text-smoke mt-2">הרשמה מהירה עם מספר טלפון בלבד</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {perks.map((p) => (
          <div key={p.title} className="glass p-4">
            <p className="text-2xl">{p.icon}</p>
            <p className="font-semibold text-sm mt-2">{p.title}</p>
            <p className="text-smoke text-xs mt-0.5">{p.text}</p>
          </div>
        ))}
      </div>

      <JoinForm />
    </main>
  );
}
