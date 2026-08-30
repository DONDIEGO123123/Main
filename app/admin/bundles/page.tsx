"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminBundles() {
  return (
    <EntityManager
      title="חבילות מוצרים"
      table="bundles"
      fields={[
        { key: "name", label: "שם החבילה", type: "text" },
        { key: "description", label: "תיאור", type: "textarea" },
        { key: "image_url", label: "תמונה", type: "image" },
        { key: "price", label: "מחיר החבילה ₪", type: "number" },
        { key: "sort_order", label: "סדר תצוגה", type: "number" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
