export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 space-y-8">
      <div className="h-10 w-2/3 rounded-xl bg-white/5 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
