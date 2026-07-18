"use client";
import { useEffect, useState } from "react";
import EntityManager from "@/components/admin/EntityManager";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

export default function AdminProducts() {
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => {
    createClient().from("categories").select("*").order("sort_order")
      .then(({ data }) => setCats(data ?? []));
  }, []);

  return (
    <EntityManager
      table="products"
      title="מוצרים"
      slugFrom="name"
      listKeys={["name", "price"]}
      fields={[
        { key: "name", label: "שם המוצר", type: "text", required: true },
        { key: "description", label: "תיאור", type: "textarea" },
        { key: "price", label: "מחיר (₪)", type: "number" },
        { key: "compare_at_price", label: "מחיר לפני הנחה (₪, לא חובה)", type: "number" },
        { key: "image_url", label: "תמונה ראשית", type: "image" },
        { key: "gallery", label: "תמונות נוספות", type: "media", accept: "image/*" },
        { key: "videos", label: "סרטונים", type: "media", accept: "video/*" },
        {
          key: "category_id", label: "קטגוריה", type: "select",
          options: cats.map((c) => ({ value: c.id, label: c.name })),
        },
        { key: "stock", label: "מלאי", type: "number" },
        { key: "is_featured", label: "להציג בדף הבית", type: "boolean" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
