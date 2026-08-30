"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Shows a maintenance screen to visitors while the admin area stays reachable. */
export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<{ on: boolean; msg: string } | null>(null);

  useEffect(() => {
    createClient().from("settings").select("value").eq("key", "site").maybeSingle()
      .then(({ data }) => {
        const v = (data?.value ?? {}) as { maintenance?: boolean; maintenance_msg?: string };
        setState({ on: !!v.maintenance, msg: v.maintenance_msg || "האתר בעדכון קצר, נחזור עוד רגע 🖤" });
      })
      .catch(() => setState({ on: false, msg: "" }));
  }, []);

  // never block the admin, and never flash the gate before we know
  if (!state || !state.on || pathname?.startsWith("/admin")) return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <div>
        <p className="text-6xl mb-6">🛠️</p>
        <h1 className="font-display text-3xl font-bold gold-text">בעדכון</h1>
        <p className="text-smoke mt-3 max-w-sm">{state.msg}</p>
      </div>
    </div>
  );
}
