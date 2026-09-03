"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminTrust() {
  return (
    <div className="space-y-8">
      <div className="glass p-5">
        <p className="font-semibold mb-2">כתבו רק מה שאתם באמת מקיימים</p>
        <p className="text-smoke text-sm leading-relaxed">
          תגי אמון עובדים כשהם מדויקים. הבטחה שלא תעמדו בה פוגעת יותר
          מהיעדר התג, ובנוסף חושפת אתכם לתלונה לפי חוק הגנת הצרכן.
        </p>
      </div>

      <EntityManager
        title="תגי אמון"
        table="trust_badges"
        listKeys={["title", "body"]}
        orderBy="sort_order"
        ascending
        fields={[
          { key: "icon", label: "אייקון", type: "text" },
          { key: "title", label: "כותרת", type: "text" },
          { key: "body", label: "תיאור קצר", type: "text" },
          { key: "sort_order", label: "סדר תצוגה", type: "number" },
          { key: "is_active", label: "פעיל", type: "boolean" },
        ]}
      />
    </div>
  );
}
