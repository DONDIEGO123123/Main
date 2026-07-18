export default function SectionTitle({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12">
      {eyebrow && (
        <p className="text-gold text-sm font-semibold tracking-[0.3em] uppercase mb-3">{eyebrow}</p>
      )}
      <h2 className="section-title">{title}</h2>
      {sub && <p className="mt-4 text-smoke leading-relaxed">{sub}</p>}
    </div>
  );
}
