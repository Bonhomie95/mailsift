# MailSift — Setup Guide

The app runs with **zero config** (`npm install && npm run dev`). The steps below
turn on the optional production pieces. Put all values in `.env.local` (copy from
`.env.local.example`) and restart the dev server after changes.

---

## 1. Supabase (admin persistence + persistent DNS cache)

**What it enables:** saving admin-added providers, and a shared DNS cache so
repeat domains resolve instantly across restarts/instances.

1. Go to <https://supabase.com> → **Sign in** → **New project**.
   - Pick an org, name it `mailsift`, set a strong **database password** (you
     won't need it for the app), choose a region near your users, create it.
   - Wait ~2 min for it to provision.
2. In the project, open **SQL Editor** (left sidebar) → **New query**.
   - Open `supabase/schema.sql` from this repo, copy its contents, paste, and
     click **Run**. You should see "Success". This creates the `providers` and
     `dns_cache` tables (with RLS on — the app uses the service-role key).
3. Get your keys: **Project Settings** (gear) → **API**.
   - **Project URL** → put in `SUPABASE_URL`.
   - **`service_role` secret** (under Project API keys — click reveal) →
     `SUPABASE_SERVICE_ROLE_KEY`. ⚠️ Keep this secret; it bypasses RLS. Never
     put it in a `NEXT_PUBLIC_` variable.
4. Restart the app. Visit `/admin`, log in, and add a provider — it now persists.

---

## 2. Sentry (error monitoring)

**What it enables:** server + client error reports so you see failures in prod.
Disabled automatically until a DSN is set.

1. Go to <https://sentry.io> → sign up → **Create project** → platform
   **Next.js** → name it `mailsift`.
2. Copy the **DSN** it shows (looks like `https://abc123@o0.ingest.sentry.io/123`).
   - Put it in `NEXT_PUBLIC_SENTRY_DSN`. (The DSN is a public key — safe to ship.)
3. That's enough for error capture. To also upload **source maps** (readable
   stack traces) on deploy, add:
   - `SENTRY_ORG` — your Sentry org slug (Settings → General).
   - `SENTRY_PROJECT` — `mailsift`.
   - `SENTRY_AUTH_TOKEN` — Settings → **Auth Tokens** → create one with
     `project:releases` scope. Keep it secret (build-time only).
4. Test it: with the DSN set, throw an error somewhere or hit an API that fails,
   then check the Sentry **Issues** tab.

> Bundle note: the Sentry browser SDK adds ~60 kB to the client. If you want to
> keep the tool lean, you can keep **server-only** monitoring (delete
> `sentry.client.config.ts` and `src/app/global-error.tsx`) and still catch the
> API/DNS/RDAP failures, which are the ones that matter most.

---

## 3. Upstash Redis (distributed rate limiting) — recommended

**What it enables:** rate limits that hold across all serverless instances.
Without it, limiting still works but is per-instance (a soft guard).

1. Go to <https://upstash.com> → sign in → **Create Database** (Redis).
   - Name `mailsift`, pick a region near your Vercel region, **Regional** is fine.
2. On the database page, scroll to **REST API** and copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Restart. Limits are now global. (Current limits: `/api/sort` 40 req/min/IP,
   `/api/registrar` 30 req/min/IP — tune in `src/lib/rateLimit.ts` usage.)

---

## 4. Adsterra ads (2 banners + capped popunder)

**What it enables:** the revenue test. With no keys set, labeled placeholder
slots render so you can see where ads go.

1. Go to <https://adsterra.com> → **Publisher** sign up → add your website →
   wait for approval.
2. Create ad units under **Websites → your site → + Add unit**:
   - **Banner** unit, size **728×90** → copy its **key** → `NEXT_PUBLIC_ADSTERRA_BANNER1_KEY`.
   - **Banner** unit, size **300×250** → copy its **key** → `NEXT_PUBLIC_ADSTERRA_BANNER2_KEY`.
   - **Popunder** unit → copy the `invoke.js` **script URL** →
     `NEXT_PUBLIC_ADSTERRA_POPUNDER_SRC` (e.g. `//pl1234.example.com/xx/yy/zz/invoke.js`).
3. In the Adsterra dashboard, set the Popunder **frequency cap to 1 / 30 min** as
   a backup — the app already enforces once-per-30-min in the browser.
4. Restart. Real ads replace the placeholders.

> If your Adsterra banner snippet uses a host other than
> `www.highperformanceformat.com`, set `NEXT_PUBLIC_ADSTERRA_INVOKE_HOST`.

---

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. <https://vercel.com> → **Add New → Project** → import the repo → framework
   auto-detects **Next.js** → **Deploy**.
3. **Project → Settings → Environment Variables**: add every value from your
   `.env.local` (Supabase, Sentry, Upstash, Adsterra, `ADMIN_PASSWORD`,
   `ADMIN_SECRET`). Redeploy.
