// Baked-in Supabase config — env vars override these if set in Vercel.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://noksacqndukhtsspoamh.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_MpB7d6lU1evbPghtzc-flg_gmhjenl5";
