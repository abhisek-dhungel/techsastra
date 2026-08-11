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
2. Wait for provisioning. Open the MySQL service and copy its **external/public**
   connection URL. It looks like:
   `mysql://root:USER_PSW@something.proxy.rlwy.net:PORT/railway`.
3. In **Settings → Networking**, confirm the TCP proxy is enabled so Vercel can
   reach it. Never give Vercel a `*.railway.internal` URL; that hostname is only
   reachable by other Railway services.
4. Enable Railway backups before storing production content.

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
   | `DATABASE_URL` | `mysql://root:...@something.proxy.rlwy.net:port/railway` |
   | `AUTH_SECRET` | long random string |
   | `ADMIN_USERNAME` | `admin` |
   | `ADMIN_PASSWORD` | a strong password |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |
   | `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard |
   | `CLOUDINARY_API_KEY` | from Cloudinary dashboard |
   | `CLOUDINARY_API_SECRET` | from Cloudinary dashboard |
4. Add every variable to the **Production** environment. Add them to **Preview**
   only when preview deployments intentionally use a database and Cloudinary account.
5. **Deploy.** `npm run build` now validates `DATABASE_URL`, generates Prisma Client,
   and runs `prisma migrate deploy` before building Next.js. A fresh database gets
   the tracked schema automatically.
6. If the database was previously created with `prisma db push`, the first deployment
   safely aligns it without a data-loss override, records the initial migration as a
   baseline, and then switches to tracked migrations. Later deployments only apply
   pending migrations.
7. Environment-variable edits do not affect an existing Vercel deployment. Redeploy
   after changing any variable.

### Initial content

The admin requires categories. For a completely new and empty database, you may run
`npm run db:seed` once from a trusted local machine using the public Railway URL.

**Never run `db:seed` or `db:setup` on a populated database.** The seed intentionally
deletes all posts, categories, and authors before loading starter content.

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
- The production app refuses to start with missing authentication credentials or a
  private Railway database hostname. This turns configuration errors into explicit
  deployment failures instead of a broken admin page.
- Prisma uses `connection_limit=1`, `pool_timeout=20`, and `connect_timeout=10` by
  default at runtime unless those values are already present in `DATABASE_URL`. This
  protects Railway MySQL from Vercel serverless connection spikes.
- **No Edge runtime** in this codebase, so standard Prisma Client works in Vercel
  serverless functions. If you later add `export const runtime = "edge"` anywhere
  that touches Prisma, you'll need the `@prisma/adapter-*` driver adapter instead.
- **Cloudinary free tier** has a monthly image-transformation credit cap. It's fine
  for a blog; upgrade if you exceed it.
- The cPanel bundle (`server.js`, `scripts/build-deploy.sh`, `start:cpanel`) is a
  **separate** hosting path — ignore it for Vercel.

## Troubleshooting the admin

The admin now displays a safe error code returned by the API, and Vercel logs include
the matching server-side detail:

| Code | Meaning | Fix |
|------|---------|-----|
| `P1000` | MySQL rejected credentials | Replace `DATABASE_URL` and redeploy |
| `P1001` / `P1002` | MySQL cannot be reached | Use Railway's public TCP URL and check service status |
| `P2021` / `P2022` | Missing table or column | Redeploy the latest commit so migrations run |
| `P2024` | Connection pool timeout | Check Railway load; the app already limits each function to one connection |
| `CLOUDINARY_NOT_CONFIGURED` | Missing Cloudinary variable | Add all three Cloudinary variables and redeploy |
| `AUTH_CONFIGURATION_FAILED` | Missing admin/auth variable | Add `AUTH_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` |
