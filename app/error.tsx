"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="font-display text-6xl font-black gold-text">אופס</p>
      <h1 className="mt-4 text-2xl font-bold">משהו השתבש</h1>
      <p className="mt-2 text-smoke">נסו לרענן את הדף. אם הבעיה חוזרת — דברו איתנו.</p>
      <button onClick={reset} className="btn-gold mt-8">נסו שוב</button>
    </div>
  );
}
