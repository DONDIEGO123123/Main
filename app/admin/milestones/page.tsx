"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminMilestones() {
  return (
    <EntityManager
      title="יעדי רכישה"
      table="milestones"
      listKeys={["title", "spend_target"]}
      orderBy="sort_order"
      ascending
      fields={[
        { key: "title", label: "שם היעד", type: "text" },
        { key: "spend_target", label: "סכום רכישות ₪", type: "number" },
        { key: "reward_label", label: "ההטבה", type: "text" },
        { key: "reward_points", label: "נקודות בפרס", type: "number" },
        { key: "sort_order", label: "סדר תצוגה", type: "number" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
