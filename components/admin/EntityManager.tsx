"use client";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import ImageUpload from "./ImageUpload";
import MediaListUpload from "./MediaListUpload";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "image" | "media" | "select";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  accept?: string; // for media
  options?: { value: string; label: string }[]; // for select
  required?: boolean;
};

type Row = Record<string, unknown> & { id: string };

/**
 * Generic CRUD table + drawer form for a Supabase table.
 * - `slugFrom`: auto-generate a `slug` column from this field on save.
 * - `listKeys`: which fields to show in the list rows.
 */
export default function EntityManager({
  table,
  title,
  fields,
  listKeys,
  slugFrom,
  orderBy = "created_at",
  ascending = false,
}: {
  table: string;
  title: string;
  fields: FieldDef[];
  listKeys: string[];
  slugFrom?: string;
  orderBy?: string;
  ascending?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await createClient()
      .from(table)
      .select("*")
      .order(orderBy, { ascending });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [table, orderBy, ascending]);

  useEffect(() => {
    load();
  }, [load]);

  const blank = (): Row => {
    const r: Row = { id: "" };
    fields.forEach((f) => {
      r[f.key] =
        f.type === "boolean" ? true : f.type === "number" ? 0 : f.type === "image" ? null : f.type === "media" ? [] : "";
    });
    return r;
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const payload: Record<string, unknown> = {};
    fields.forEach((f) => (payload[f.key] = editing[f.key]));
    if (slugFrom) payload.slug = slugify(String(editing[slugFrom] ?? ""));

    const res = isNew
      ? await supabase.from(table).insert(payload)
      : await supabase.from(table).update(payload).eq("id", editing.id);

    if (res.error) {
      setError("השמירה נכשלה: " + res.error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק את הפריט? פעולה זו אינה הפיכה.")) return;
    await createClient().from(table).delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <button
          onClick={() => {
            setEditing(blank());
            setIsNew(true);
          }}
          className="btn-gold py-2 px-5 text-sm"
        >
          + הוספה
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">
          אין פריטים עדיין — לחצו על "הוספה" כדי ליצור את הראשון.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="glass p-4 flex items-center gap-4 hover:border-gold/25 transition"
            >
              {typeof r.image_url === "string" && r.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.image_url}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover border border-white/10"
                />
              )}
              <div className="min-w-0 flex-1">
                {listKeys.map((k, i) => (
                  <p key={k} className={i === 0 ? "font-semibold truncate" : "text-smoke text-sm truncate"}>
                    {String(r[k] ?? "")}
                  </p>
                ))}
              </div>
              {"is_active" in r && (
                <span
                  className={`text-xs rounded-full px-3 py-1 border ${
                    r.is_active
                      ? "border-gold/40 text-gold"
                      : "border-white/15 text-smoke"
                  }`}
                >
                  {r.is_active ? "פעיל" : "מוסתר"}
                </span>
              )}
              <button
                onClick={() => {
                  setEditing(r);
                  setIsNew(false);
                }}
                className="btn-ghost py-1.5 px-4 text-sm"
              >
                עריכה
              </button>
              <button
                onClick={() => remove(r.id)}
                className="text-red-300 hover:text-red-400 text-sm px-2"
              >
                מחיקה
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit drawer */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="fixed inset-0 z-[70] flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setEditing(null)}
            />
            <motion.div
              initial={{ x: -420 }}
              animate={{ x: 0 }}
              exit={{ x: -420 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="relative h-full w-full max-w-md overflow-y-auto bg-panel border-e border-gold/20 p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">
                  {isNew ? "פריט חדש" : "עריכת פריט"}
                </h2>
                <button onClick={() => setEditing(null)} className="text-smoke text-2xl">
                  ×
                </button>
              </div>

              {fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-sm text-smoke mb-1.5">{f.label}</label>
                  {f.type === "text" && (
                    <input
                      className="input"
                      value={String(editing[f.key] ?? "")}
                      onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    />
                  )}
                  {f.type === "textarea" && (
                    <textarea
                      rows={4}
                      className="input resize-none"
                      value={String(editing[f.key] ?? "")}
                      onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    />
                  )}
                  {f.type === "number" && (
                    <input
                      type="number"
                      className="input"
                      dir="ltr"
                      value={Number(editing[f.key] ?? 0)}
                      onChange={(e) =>
                        setEditing({ ...editing, [f.key]: Number(e.target.value) })
                      }
                    />
                  )}
                  {f.type === "boolean" && (
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, [f.key]: !editing[f.key] })}
                      className={`w-14 h-8 rounded-full transition relative ${
                        editing[f.key] ? "bg-gold" : "bg-white/10"
                      }`}
                      aria-pressed={Boolean(editing[f.key])}
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-ink transition-all ${
                          editing[f.key] ? "right-1" : "right-7"
                        }`}
                      />
                    </button>
                  )}
                  {f.type === "image" && (
                    <ImageUpload
                      value={(editing[f.key] as string) ?? null}
                      onChange={(url) => setEditing({ ...editing, [f.key]: url })}
                    />
                  )}
                  {f.type === "media" && (
                    <MediaListUpload
                      value={(editing[f.key] as string[]) ?? []}
                      onChange={(urls) => setEditing({ ...editing, [f.key]: urls })}
                      accept={f.accept}
                    />
                  )}
                  {f.type === "select" && (
                    <select
                      className="input"
                      value={String(editing[f.key] ?? "")}
                      onChange={(e) =>
                        setEditing({ ...editing, [f.key]: e.target.value || null })
                      }
                    >
                      <option value="">— ללא —</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}

              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={save} disabled={saving} className="btn-gold w-full disabled:opacity-60">
                {saving ? "שומר…" : "שמירה"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
