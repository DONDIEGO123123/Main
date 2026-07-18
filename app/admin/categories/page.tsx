"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function AdminCategories() {
  return (
    <EntityManager
      table="categories"
      title="קטגוריות"
      slugFrom="name"
      orderBy="sort_order"
      ascending
      listKeys={["name"]}
      fields={[
        { key: "name", label: "שם הקטגוריה", type: "text", required: true },
        { key: "sort_order", label: "סדר תצוגה", type: "number" },
      ]}
    />
  );
}
