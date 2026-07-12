# MailSift 📬

Sort thousands of domains by their **mail provider** in seconds. Paste a list or
upload a file — MailSift reads live **MX** and **NS** records and buckets each
domain into its provider (Google Workspace, Microsoft 365, Zoho, Namecheap
Private Email, and more).

## How it works

1. You paste/upload domains or emails (mixed, any separator).
2. The client normalizes them to unique domains (`joseph@bonhomieinc.dev` → `bonhomieinc.dev`).
3. The `/api/sort` endpoint resolves **MX** and **NS** records via free
   DNS-over-HTTPS resolvers (Cloudflare + Google fallback), with caching and
   bounded concurrency so it scales under heavy traffic.
4. Each domain is matched against provider rules and grouped into buckets you
   can drill into and export as CSV.

You can also flip the **Registrar** toggle to regroup the same domains by their
domain registrar (Namecheap, GoDaddy, MarkMonitor, …). That uses a lazy,
best-effort **RDAP** lookup (`/api/registrar`) routed per-TLD via the IANA
bootstrap registry, so it only runs when you ask for it and never slows the main
mail-provider sort.

## Run locally

```bash
npm install
cp .env.local.example .env.local   # optional for first run
npm run dev
```

Open http://localhost:3000. It works immediately with built-in provider rules —
no database required.

## Enable admin + persistence (Supabase)

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql)
   in its SQL editor.
2. Fill `.env.local`:
   - `ADMIN_PASSWORD`, `ADMIN_SECRET` — gate the `/admin` page.
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — store admin-added providers.
3. Restart `npm run dev`. Visit `/admin` to add/edit providers live.

## Free-tier limits (as configured)

- **20,000 domains per session** (client quota + server cap).
- **One tab at a time** (BroadcastChannel lock).

## Deploy

Push to GitHub and import into **Vercel**. Add the same env vars in the Vercel
project settings. Serverless functions + DoH caching handle scale; add the
`dns_cache` table for cross-instance cache sharing under very high load.

## Roadmap hooks

- Payments ($2/$5 monthly) → gate higher limits + remove ads. The quota logic
  lives in `src/lib/useSessionQuota.ts` and the `/api/sort` cap.
- Ads for free tier.
- User accounts for real per-user limits (replace the session-based cap).
