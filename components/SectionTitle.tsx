/**
 * Section heading.
 *
 * The old version put a tracked-out uppercase label above every title.
 * That reads as template chrome, so the label is gone and the hierarchy
 * now comes from type size and a single hairline that carries light.
 *
 * `eyebrow` is still accepted so no caller breaks, but it is not rendered.
 */
export default function SectionTitle({
  title,
  sub,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  /** `subtitle` is accepted as an alias so older callers keep working. */
  sub?: string;
  subtitle?: string;
  align?: "center" | "start";
}) {
  const centered = align === "center";
  const text = sub ?? subtitle;

  return (
    <div className={`mb-12 max-w-2xl ${centered ? "text-center mx-auto" : "text-start"}`}>
      <h2 className="section-title">{title}</h2>
      {text && <p className="mt-4 text-smoke leading-relaxed">{text}</p>}
      <div
        className={`rule mt-6 w-24 ${centered ? "mx-auto" : ""}`}
        aria-hidden
      />
    </div>
  );
}
