"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { processImage, formatBytes } from "@/lib/image-tools";
import { useSiteSettings } from "@/lib/site";

const isVideo = (url: string) => /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url);

/** Multi-file upload (images or videos) → public `media` bucket → array of URLs. */
export default function MediaListUpload({
  value,
  onChange,
  accept = "image/*",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  accept?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [progress, setProgress] = useState("");
  const [saving, setSaving] = useState(0);
  const site = useSiteSettings() as { watermark?: string };

  const upload = async (files: FileList) => {
    setBusy(true); setErr(""); setSaving(0);
    const supabase = createClient();
    const urls: string[] = [];
    const all = Array.from(files);
    let bytesSaved = 0;

    for (let i = 0; i < all.length; i++) {
      const original = all[i];
      setProgress(`${i + 1} מתוך ${all.length}`);

      // compress + watermark before upload — smaller files load far faster
      const file = await processImage(original, { watermark: site.watermark || null });
      bytesSaved += Math.max(0, original.size - file.size);

      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (error) { setErr("חלק מהקבצים לא עלו — ודאו שכל קובץ קטן מ-50MB."); continue; }
      urls.push(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
    }

    if (urls.length) onChange([...(value ?? []), ...urls]);
    setSaving(bytesSaved);
    setProgress("");
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      {(value ?? []).length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <div key={url + i} className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/30">
              {isVideo(url) ? (
                <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={url} alt="" className="h-full w-full object-cover" />
              )}
              {isVideo(url) && <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 rounded px-1">▶ וידאו</span>}
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute top-1 left-1 rounded-full bg-black/70 text-white h-6 w-6 text-sm leading-none">×</button>
            </div>
          ))}
        </div>
      )}
      <label className="flex h-16 cursor-pointer items-center justify-center rounded-xl border border-dashed border-gold/40 text-smoke text-sm hover:bg-gold/5 transition">
        {busy ? "מעלה…" : "+ הוספת קבצים (אפשר לבחור כמה ביחד)"}
        <input type="file" multiple accept={accept} className="hidden"
          onChange={(e) => e.target.files?.length && upload(e.target.files)} />
      </label>
      {saving > 0 && (
        <p className="text-gold text-xs">✓ נחסכו {formatBytes(saving)} — הדף ייטען מהר יותר</p>
      )}
      {progress && <p className="text-smoke text-xs">מעלה {progress}…</p>}
      {err && <p className="text-red-400 text-xs">{err}</p>}
    </div>
  );
}
