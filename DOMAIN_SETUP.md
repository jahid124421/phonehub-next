# PhoneHub Domain Setup Guide

## Prerequisites
- A custom domain (e.g., phonehub.com) purchased from a registrar

## Step 1: Configure Environment Variables
In your Vercel dashboard (Settings → Environment Variables), set:
- `NEXT_PUBLIC_SITE_URL` = `https://yourdomain.com`
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` = your Umami website ID
- `DATABASE_URL` = your Supabase/Postgres connection string
- `CRON_SECRET` = your cron secret
- `HUGGINGFACE_API_KEY` = your Hugging Face API key (optional, for AI features)

## Step 2: Configure DNS
Point your domain to Vercel:
1. In Vercel dashboard: Settings → Domains → Add your domain
2. Update DNS records at your registrar:
   - A record: `@` → `76.76.21.21`
   - CNAME record: `www` → `cname.vercel-dns.com`
3. Wait for DNS propagation (up to 48 hours)

## Step 3: Update Supabase
In Supabase dashboard → Authentication → URL Configuration:
- Add `https://yourdomain.com` to Site URL
- Add `https://yourdomain.com` to Redirect URLs

## Step 4: Deploy
```bash
vercel --prod
```

## Step 5: Verify
- Visit `https://yourdomain.com` and check all pages load
- Verify JSON-LD structured data uses correct URLs (View Source)
- Check Umami analytics dashboard for page views
- Test Google Search Console URL Inspection tool

## Environment Variables Reference
| Variable | Purpose | Required |
|---|---|---|
| NEXT_PUBLIC_SITE_URL | Base URL for SEO and canonical links | Yes |
| DATABASE_URL | PostgreSQL connection string | Yes |
| CRON_SECRET | Secret for protecting cron endpoint | Yes |
| NEXT_PUBLIC_UMAMI_WEBSITE_ID | Umami analytics tracking | Recommended |
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Optional |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key | Optional |
| HUGGINGFACE_API_KEY | For AI Phone Finder embeddings | Optional |
