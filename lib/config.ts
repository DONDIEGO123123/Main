// Baked-in Supabase config.
// Env vars override these ONLY if they are non-empty — an empty env var in the
// build environment must not win over the working fallback.
const env = (v: string | undefined, fallback: string) =>
  v && v.trim().length > 0 ? v.trim() : fallback;

export const SUPABASE_URL = env(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://bbjqmbmuabhmtihuvomo.supabase.co"
);

export const SUPABASE_ANON_KEY = env(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJianFtYm11YWJobXRpaHV2b21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMDk1OTUsImV4cCI6MjEwMzU4NTU5NX0.ip0DnATI2PKdcSH65S1iOjvqsKHqdh60DdQq2rH8SvA"
);
