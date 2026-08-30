"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminRewards() {
  return (
    <EntityManager
      title="הטבות למימוש"
      table="rewards"
      listKeys={["title", "points_cost"]}
      fields={[
        { key: "title", label: "שם ההטבה", type: "text" },
        { key: "description", label: "תיאור", type: "textarea" },
        { key: "points_cost", label: "עלות בנקודות", type: "number" },
        { key: "coupon_code", label: "קוד קופון קבוע (ריק = נוצר אוטומטית)", type: "text" },
        { key: "sort_order", label: "סדר תצוגה", type: "number" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
