"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminChallenges() {
  return (
    <EntityManager
      title="אתגרי קהילה"
      table="challenges"
      fields={[
        { key: "title", label: "שם האתגר", type: "text" },
        { key: "description", label: "תיאור", type: "textarea" },
        { key: "goal_type", label: "סוג היעד", type: "select", options: [
          { value: "orders", label: "מספר הזמנות" },
          { value: "referrals", label: "מספר הפניות" },
          { value: "points", label: "צבירת נקודות" },
        ] },
        { key: "goal_value", label: "יעד", type: "number" },
        { key: "reward_points", label: "נקודות בפרס", type: "number" },
        { key: "sort_order", label: "סדר תצוגה", type: "number" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
