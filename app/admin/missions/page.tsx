"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminMissions() {
  return (
    <EntityManager
      title="משימות"
      table="missions"
      listKeys={["title", "reward_points"]}
      orderBy="sort_order"
      ascending
      fields={[
        { key: "key", label: "מזהה (באנגלית, ייחודי)", type: "text" },
        { key: "title", label: "שם המשימה", type: "text" },
        { key: "description", label: "תיאור", type: "text" },
        { key: "icon", label: "אייקון", type: "text" },
        { key: "metric", label: "לפי מה נמדד", type: "select", options: [
          { value: "orders", label: "הזמנות" },
          { value: "reviews", label: "ביקורות" },
          { value: "referrals", label: "הפניות" },
          { value: "streak", label: "ימים ברצף" },
          { value: "profile", label: "השלמת פרופיל" },
        ] },
        { key: "threshold", label: "יעד", type: "number" },
        { key: "reward_points", label: "נקודות בפרס", type: "number" },
        { key: "sort_order", label: "סדר תצוגה", type: "number" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
