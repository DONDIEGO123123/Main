"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminMystery() {
  return (
    <EntityManager
      title="פרסים מסתוריים"
      table="mystery_rewards"
      listKeys={["label", "weight"]}
      fields={[
        { key: "label", label: "שם הפרס", type: "text" },
        { key: "kind", label: "סוג", type: "select", options: [
          { value: "points", label: "נקודות" },
          { value: "coupon", label: "קופון" },
        ] },
        { key: "points", label: "נקודות (אם נקודות)", type: "number" },
        { key: "coupon_percent", label: "אחוז הנחה (אם קופון)", type: "number" },
        { key: "weight", label: "משקל — ככל שגבוה יותר, סיכוי גדול יותר", type: "number" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
