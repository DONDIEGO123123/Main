export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 space-y-10">
      <div className="space-y-4">
        <div className="skeleton h-10 w-1/2 rounded-xl" />
        <div className="skeleton h-4 w-1/3 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton aspect-[3/4] rounded-2xl" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
