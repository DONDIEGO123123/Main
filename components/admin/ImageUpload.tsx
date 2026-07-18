"use client";
import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ImageUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const upload = async (file: File) => {
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
    if (error) {
      setErr("ההעלאה נכשלה. ודאו שקובץ התמונה קטן מ-5MB ונסו שוב.");
    } else {
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative h-40 w-full overflow-hidden rounded-xl border border-white/10">
          <Image src={value} alt="" fill className="object-cover" sizes="300px" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 left-2 rounded-full bg-black/70 text-white h-8 w-8"
          >
            ×
          </button>
        </div>
      ) : (
        <label className="flex h-32 cursor-pointer items-center justify-center rounded-xl border border-dashed border-gold/40 text-smoke text-sm hover:bg-gold/5 transition">
          {busy ? "מעלה…" : "לחצו להעלאת תמונה"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
      )}
      {err && <p className="text-red-400 text-xs">{err}</p>}
    </div>
  );
}
