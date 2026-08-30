"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminCoupons() {
  return (
    <EntityManager
      title="קופונים"
      table="coupons"
      listKeys={["code", "value"]}
      fields={[
        { key: "code", label: "קוד הקופון", type: "text" },
        { key: "kind", label: "סוג", type: "select", options: [
          { value: "percent", label: "אחוז הנחה" },
          { value: "amount", label: "סכום קבוע" },
        ] },
        { key: "value", label: "ערך (אחוז או ₪)", type: "number" },
        { key: "min_order", label: "מינימום הזמנה ₪", type: "number" },
        { key: "max_uses", label: "מקסימום שימושים (ריק = ללא הגבלה)", type: "number" },
        { key: "ends_at", label: "תוקף עד (אופציונלי)", type: "text" },
        { key: "vip_only", label: "לחברי VIP בלבד", type: "boolean" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
