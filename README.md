# Metalink

An internal, password-gated tool that turns a short client interview into
ready-to-launch Meta (Facebook/Instagram) ad copy: onboarding form → AI chat
discovery → angle mining → generated ads, exportable to CSV for Meta Ads
Manager.

This folder is a full, standalone copy of the app — no API keys or accounts
are included. Follow the steps below to stand up your own instance end to
end (about 15-20 minutes).

## 1. Prerequisites

- Node.js 18+ and npm
- A free [Supabase](https://supabase.com) account
- An [Anthropic](https://console.anthropic.com) API key (primary AI provider)
- A [Groq](https://console.groq.com) API key (fallback AI provider + image analysis)

## 2. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project. Note the project's
   **Project URL** and **anon public key** (Project Settings → API) — you'll
   need both in step 5.
2. Open the SQL Editor and run the two files in `supabase/migrations/`, **in
   order**:
   - `20260701000000_metalink_tables.sql`
   - `20260702000000_metalink_performance_and_brief.sql`

   This creates the tables the app reads/writes: `metalink_clients`,
   `metalink_onboarding_responses`, `metalink_chat_messages`,
   `metalink_generated_ads`, `metalink_ad_performance`.

## 3. Deploy the two Edge Functions

The app calls two small server-side functions so your AI keys and admin
password never reach the browser. Both are self-contained single files
(no shared imports), so the easiest path is pasting them straight into the
Supabase dashboard:

1. Dashboard → Edge Functions → **Create a function** named `metalink-ai`.
   Paste in the contents of `supabase/functions/metalink-ai/index.ts` and deploy.
2. Create a second function named `verify-admin`. Paste in the contents of
   `supabase/functions/verify-admin/index.ts` and deploy.

   (If you prefer the CLI: `supabase functions deploy metalink-ai` and
   `supabase functions deploy verify-admin` from this folder, after
   `supabase link`-ing to your project.)

3. Dashboard → Edge Functions → Secrets (or Project Settings → Edge Functions),
   add:

   | Secret | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | your Anthropic key |
   | `GROQ_API_KEY` | your Groq key |
   | `ADMIN_PASSWORD` | any password you choose — this is what you'll type in to log in to the dashboard |
   | `ADMIN_TOKEN_SECRET` | any long random string (used to sign login sessions — e.g. generate one with `openssl rand -hex 32`) |

## 4. Configure the app

```bash
cp .env.example .env
```

Fill in `.env` with:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from step 2.
- `VITE_GROQ_API_KEY` — same Groq key as above (used directly from the
  browser for analyzing uploaded brand images, separate from the server-side
  copy used by the AI edge function).

## 5. Run it

```bash
npm install
npm run dev
```

Open the printed local URL, enter the `ADMIN_PASSWORD` you set in step 3,
and you're in.

## 6. Deploy it somewhere real (optional)

A `vercel.json` is included. The simplest path:

```bash
npm i -g vercel
vercel
```

Then in the Vercel project's dashboard, add the same three `VITE_*`
variables from your `.env` under Settings → Environment Variables, and
redeploy. Any static host works too (Netlify, Cloudflare Pages, etc.) — just
make sure it serves `index.html` for all routes (that's what `vercel.json`'s
rewrite does) so `/metalink-client/:id` links work.

## How client links work

From the dashboard, create a client — that gives you a client ID. Send them:

```
https://your-domain.com/metalink-client/<client-id>
```

That's the public onboarding form (no password needed). Once they submit it,
their answers show up against that client in your dashboard, ready for the
AI chat → angle mining → ad generation flow.

## Project layout

```
src/
  metalink/          the actual product: onboarding, dashboard, chat, angle
                      mining, ad generation, all the copywriting playbooks
  lib/                Supabase client + input sanitizers
  context/            client-record data layer (shared plumbing)
  ai/                 shared writing-rules constants + LLM-output sanitizer
  components/         small shared UI kit (buttons, cards, badges, palette)
  onboarding/         file upload + PDF/image brand-intel extraction,
                      used by the onboarding form
supabase/
  migrations/         the two SQL files from step 2
  functions/          the two Edge Functions from step 3
```
