"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminDaily() {
  return (
    <EntityManager
      title="תגמול יומי"
      table="daily_rewards"
      listKeys={["label", "points"]}
      orderBy="day_index"
      ascending
      fields={[
        { key: "day_index", label: "יום במחזור (1-7)", type: "number" },
        { key: "label", label: "תווית", type: "text" },
        { key: "points", label: "נקודות", type: "number" },
        { key: "icon", label: "אייקון", type: "text" },
      ]}
    />
  );
}
