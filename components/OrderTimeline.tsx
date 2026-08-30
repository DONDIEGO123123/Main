"use client";

const STEPS = [
  { key: "new",       label: "ההזמנה התקבלה", icon: "📝" },
  { key: "confirmed", label: "אושרה ובהכנה",  icon: "📦" },
  { key: "shipped",   label: "יצאה למשלוח",   icon: "🚚" },
  { key: "delivered", label: "נמסרה",         icon: "✅" },
];

/** Visual order progress (#53). Cancelled orders show their own state. */
export default function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="glass p-4 text-center">
        <p className="text-2xl">✕</p>
        <p className="text-red-400 text-sm mt-1">ההזמנה בוטלה</p>
      </div>
    );
  }

  const idx = Math.max(0, STEPS.findIndex((s) => s.key === status));

  return (
    <div className="glass p-5">
      <div className="flex items-start">
        {STEPS.map((s, i) => {
          const done = i <= idx;
          return (
            <div key={s.key} className="flex-1 flex flex-col items-center relative">
              {i > 0 && (
                <span className={`absolute top-4 right-1/2 w-full h-0.5 ${
                  i <= idx ? "bg-gold" : "bg-white/10"
                }`} />
              )}
              <span className={`relative z-10 h-8 w-8 rounded-full grid place-items-center text-sm border transition ${
                done ? "bg-gold text-ink border-gold" : "bg-panel text-smoke border-white/15"
              }`}>
                {done ? "✓" : s.icon}
              </span>
              <p className={`text-[11px] mt-2 text-center leading-tight ${
                done ? "text-gold" : "text-smoke"
              }`}>
                {s.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
