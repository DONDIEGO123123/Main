"use client";
import EntityManager from "@/components/admin/EntityManager";

const METRICS = [
  { value: "orders", label: "מספר הזמנות" },
  { value: "spend", label: "סכום רכישות" },
  { value: "reviews", label: "מספר ביקורות" },
  { value: "referrals", label: "מספר הפניות" },
  { value: "points", label: "נקודות שנצברו" },
  { value: "streak", label: "ימים ברצף" },
];

export default function AdminAchievements() {
  return (
    <EntityManager
      title="הישגים"
      table="achievements"
      listKeys={["title", "threshold"]}
      orderBy="sort_order"
      ascending
      fields={[
        { key: "key", label: "מזהה (באנגלית, ייחודי)", type: "text" },
        { key: "title", label: "שם ההישג", type: "text" },
        { key: "description", label: "תיאור", type: "text" },
        { key: "icon", label: "אייקון", type: "text" },
        { key: "metric", label: "לפי מה נמדד", type: "select", options: METRICS },
        { key: "threshold", label: "יעד", type: "number" },
        { key: "reward_points", label: "נקודות בפרס", type: "number" },
        { key: "sort_order", label: "סדר תצוגה", type: "number" },
        { key: "is_active", label: "פעיל", type: "boolean" },
      ]}
    />
  );
}
