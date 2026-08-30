import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ההזמנה התקבלה",
  robots: { index: false },
};

export default async function OrderSuccess({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>;
}) {
  const { n } = await searchParams;

  return (
    <main className="container mx-auto px-4 py-24 max-w-lg text-center">
      <div className="glass-gold p-10">
        <p className="text-6xl mb-4">✓</p>
        <h1 className="font-display text-3xl font-bold gold-text">ההזמנה התקבלה!</h1>
        {n && (
          <p className="text-smoke mt-3">
            מספר הזמנה: <span className="text-gold font-bold tabular-nums">{n}</span>
          </p>
        )}
        <p className="text-smoke mt-5 leading-relaxed">
          קיבלנו את ההזמנה וניצור איתכם קשר בהקדם לאישור ותיאום המשלוח.
          אם חלון הוואטסאפ לא נפתח, אפשר לפנות אלינו ישירות מדף צור קשר.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-8">
          <Link href="/products" className="btn-gold py-3">להמשך קנייה</Link>
          <Link href="/contact" className="btn-ghost py-3">צור קשר</Link>
        </div>
      </div>
    </main>
  );
}
