"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError("פרטי ההתחברות שגויים. בדקו אימייל וסיסמה ונסו שוב.");
      setLoading(false);
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] grid place-items-center px-4">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-gold w-full max-w-sm p-8 space-y-4"
      >
        <div className="text-center mb-2">
          <p className="font-display text-3xl font-black gold-text">LUXE</p>
          <p className="text-smoke text-sm mt-1">כניסת מנהל</p>
        </div>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="אימייל" className="input" dir="ltr"
        />
        <input
          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמה" className="input" dir="ltr"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={loading} className="btn-gold w-full disabled:opacity-60">
          {loading ? "מתחבר…" : "כניסה"}
        </button>
      </motion.form>
    </div>
  );
}
