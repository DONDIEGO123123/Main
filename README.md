# LUXE — Premium Luxury Storefront

Next.js 15 · TypeScript · Tailwind · Framer Motion · Supabase · Hebrew RTL · PWA

Black & gold luxury storefront with a full Supabase-backed CMS and a secure admin panel.

## Quick start (mobile workflow: GitHub → Vercel)

1. **Create the Supabase project**
   - New project at supabase.com → SQL Editor → paste and run `supabase/schema.sql`.
     This creates all tables, RLS policies, the public `media` storage bucket, and seed data.
   - Authentication → Users → **Add user** → create your admin email + password
     (this is the login for `/admin`).
   - Authentication → Providers → Email → disable "Allow new users to sign up"
     (so only the user you created can log in — RLS gives any authenticated user admin rights).

2. **Push this repo to GitHub** (upload the folder via github.com → Add file → Upload files).

3. **Deploy on Vercel**
   - Import the repo. Framework is auto-detected (Next.js).
   - Add Environment Variables (from `.env.example`):
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_SITE_URL` — your production URL
     - `NEXT_PUBLIC_TELEGRAM_URL`, `NEXT_PUBLIC_WHATSAPP_URL`
     - `NEXT_PUBLIC_GA_ID` — optional Google Analytics
   - Deploy.

4. **Log in at `/admin`** and add products, banners, promotions, reviews.

## Structure

```
app/
  page.tsx            Home (Server Component, ISR 60s, sections toggleable from admin)
  products/           Search · category filters · sort · pagination · quick view
  promotions/         Large promo banners
  delivery/           Interactive Israel map (tap a region → ETA + fee)
  reviews/  faq/  contact/
  admin/              Protected by middleware (Supabase Auth)
    dashboard/        Stats cards + charts + latest updates
    products/ categories/ promotions/ banners/ reviews/ faq/ delivery/ settings/
  manifest.ts robots.ts sitemap.ts   PWA + SEO
components/           Public UI (Navbar w/ mega menu + global search, HeroSlider, …)
components/admin/     AdminShell, EntityManager (generic CRUD), ImageUpload, BarChart
lib/                  Supabase clients (browser/server), types, utils, wishlist hooks
supabase/schema.sql   Full schema + RLS + storage + seed
middleware.ts         Auth guard for /admin
```

## How the CMS works

- Public pages are **Server Components** with `revalidate = 60` — content edited in
  the admin appears on the site within a minute, with pages served statically in between.
- **RLS**: anonymous visitors can only read active/approved rows; any authenticated
  user (your admin) has full write access. The contact form can insert only.
- Images upload to the public `media` bucket; URLs are stored on each row and served
  through `next/image` (AVIF/WebP, lazy loading, responsive sizes).
- Homepage sections can be switched on/off from **Admin → הגדרות אתר**.

## Performance notes

- Server Components + ISR, `next/font` with `display: swap`, `next/image` everywhere,
  lazy-loaded content below the fold, no client JS on static sections.
- `prefers-reduced-motion` respected; theme color + manifest for PWA installs.
- Lighthouse tip: scores depend on your images — upload reasonably sized files
  (≤ 1600px wide) and the pipeline handles the rest.

## Customizing the brand

- Name/logo text: search for `LUXE` (Navbar, Footer, LoadingScreen, layout metadata).
- Colors: `tailwind.config.ts` (`ink`, `gold`, `panel`).
- Fonts: `app/layout.tsx` (Frank Ruhl Libre + Assistant).
