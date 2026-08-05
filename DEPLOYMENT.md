# Deployment Guide — Vercel + Railway MySQL + Cloudinary

This site has three moving parts. Vercel hosts the Next.js app, Railway hosts the
MySQL database, and Cloudinary hosts the images.

> **Why Cloudinary?** Uploads used to be written to `public/uploads/` on local disk.
> Vercel's filesystem is ephemeral — files vanish on every deploy and don't sync
> across serverless instances. Image storage **must** live in object storage, so the
> upload route (`src/app/api/upload/route.ts`) now uploads to Cloudinary.

---

## 1. Database — Railway MySQL

1. Create an account at [railway.app](https://railway.app) → **New Project** →
   **Deploy with a Template** → search **MySQL**.
2. Wait for provisioning. Open the MySQL service → **Variables** → copy `DATABASE_URL`.
   It looks like: `mysql://root:USER_PSW@HOST:PORT/railway`.
3. In **Settings → Networking**, confirm the TCP proxy is public so Vercel can reach it.

## 2. Image storage — Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com). From the
   dashboard copy your **Cloud name**, **API Key**, **API Secret**.
2. The upload route already uses these. No code changes needed.

## 3. App — Vercel

1. Push the repo to GitHub.
2. [vercel.com](https://vercel.com) → **Add New Project** → import the repo
   (framework = Next.js, auto-detected).
3. **Environment Variables** (Production):
   | Variable | Example |
   |----------|---------|
   | `DATABASE_URL` | `mysql://root:...@host:port/railway` |
   | `AUTH_SECRET` | long random string |
   | `ADMIN_USERNAME` | `admin` |
   | `ADMIN_PASSWORD` | a strong password |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |
   | `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard |
   | `CLOUDINARY_API_KEY` | from Cloudinary dashboard |
   | `CLOUDINARY_API_SECRET` | from Cloudinary dashboard |
4. **Set `DATABASE_URL` for the *Build* step too.** The homepage/category/post pages
   use ISR (`revalidate = 60`) and `sitemap.ts` reads Prisma, so `next build`
   connects to MySQL to prerender. If the DB is unreachable at build time, the build
   fails. In Vercel, under Project → Settings → Environment Variables, the values you
   add apply to Build by default — just make sure it's enabled for Build, not only Runtime.
5. **Push the schema once** (from your machine, against the Railway URL):
   ```bash
   npx prisma db push --skip-generate
   npx tsx prisma/seed.ts   # optional starter content
   ```
6. **Deploy.** Watch the build log for the `prisma generate` step.

## Migrating existing uploads (if you already have posts with `/uploads/...` images)

The local files in `public/uploads/` need to move to Cloudinary once. Run locally,
pointing at your production DB and Cloudinary creds:

```bash
DATABASE_URL="mysql://..." CLOUDINARY_CLOUD_NAME="..." CLOUDINARY_API_KEY="..." CLOUDINARY_API_SECRET="..." npm run backfill:images
```

Or put the values in a `.env` file and run `npm run backfill:images`. The script
uploads every referenced local file, then rewrites each Post's `coverImage` and inline
`<img src="/uploads/...">` to the Cloudinary URL.

## Gotchas

- **Never commit `.env`.** Secrets live only in Vercel's env UI.
- **Don't rotate `AUTH_SECRET`** casually — it invalidates admin sessions.
- **No Edge runtime** in this codebase, so standard Prisma Client works in Vercel
  serverless functions. If you later add `export const runtime = "edge"` anywhere
  that touches Prisma, you'll need the `@prisma/adapter-*` driver adapter instead.
- **Cloudinary free tier** has a monthly image-transformation credit cap. It's fine
  for a blog; upgrade if you exceed it.
- The cPanel bundle (`server.js`, `scripts/build-deploy.sh`, `start:cpanel`) is a
  **separate** hosting path — ignore it for Vercel.
