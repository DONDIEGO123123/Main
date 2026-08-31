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
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  align?: "center" | "start";
}) {
  const centered = align === "center";

  return (
    <div className={`mb-12 max-w-2xl ${centered ? "text-center mx-auto" : "text-start"}`}>
      <h2 className="section-title">{title}</h2>
      {sub && <p className="mt-4 text-smoke leading-relaxed">{sub}</p>}
      <div
        className={`rule mt-6 w-24 ${centered ? "mx-auto" : ""}`}
        aria-hidden
      />
    </div>
  );
}
