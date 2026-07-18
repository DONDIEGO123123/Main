import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="font-display text-8xl font-black gold-text">404</p>
      <h1 className="mt-4 text-2xl font-bold">הדף שחיפשת לא נמצא</h1>
      <p className="mt-2 text-smoke">ייתכן שהקישור השתנה או שהדף הוסר.</p>
      <Link href="/" className="btn-gold mt-8">חזרה לדף הבית</Link>
    </div>
  );
}
