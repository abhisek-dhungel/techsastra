# Deployment Guide — Vercel + Turso + Cloudinary

Vercel hosts the Next.js application, Turso stores posts and categories in
serverless SQLite, and Cloudinary stores and delivers images. Railway, MySQL,
and Prisma are not used.

## 1. Push the project to GitHub

Commit and push the latest project changes. Vercel deploys the production branch
automatically after the repository is connected.

## 2. Create the Vercel project

1. Sign in at [vercel.com](https://vercel.com).
2. Select **Add New → Project** and import the GitHub repository.
3. Keep **Next.js** as the framework preset and the repository root as the root
   directory.
4. Do not deploy yet if Vercel offers an opportunity to configure integrations and
   environment variables first.

## 3. Add Turso from the Vercel Marketplace

1. In the Vercel dashboard, open **Storage → Create Database**.
2. Choose **Turso Cloud** and select the free plan.
3. Create a database in a region close to the Vercel Functions region.
4. Connect the database to this project.
5. Confirm that Vercel created both variables:

   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`

The production build runs `npm run db:deploy`, which safely creates the tables,
indexes, and default categories on a new database. Later builds apply only new SQL
migrations from `db/migrations/`.

## 4. Create the Cloudinary account

1. Sign up at [cloudinary.com](https://cloudinary.com).
2. Open the Cloudinary Console and go to **Settings → API Keys**.
3. Copy the **Cloud name**, **API key**, and **API secret**.
4. Add these Vercel Production environment variables:

   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

The admin requests a short-lived signature from the application and then uploads
images directly from the browser to Cloudinary. The API secret remains server-only,
and images up to 8 MB do not pass through Vercel's request body.

## 5. Add the remaining Vercel variables

Under **Project → Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `AUTH_SECRET` | A long random value, preferably 48+ characters |
| `ADMIN_USERNAME` | Your private CMS username |
| `ADMIN_PASSWORD` | A strong, unique CMS password |
| `NEXT_PUBLIC_SITE_URL` | The production URL, such as `https://your-project.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` should already exist after connecting
Turso. Add secrets to **Production**. Add them to **Preview** only if preview builds
should use a database and Cloudinary account.

## 6. Deploy

Select **Deploy**. The build command is `npm run build`, which:

1. validates the required production variables;
2. applies pending Turso migrations; and
3. builds the Next.js application.

Environment-variable changes affect only new deployments. Redeploy after adding or
changing a variable.

## 7. Optional sample content

The deployment migration automatically creates the categories required by the admin.
If you also want the bundled sample posts, run the seed once from a trusted local
machine after copying the two Turso variables from Vercel:

```bash
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:seed
```

The seed creates starter categories, authors, and sample posts.

> **Do not run `db:seed` or `db:setup` on a populated production database.** The
> seed deliberately deletes all existing posts, categories, and authors first.

## 8. Verify production

1. Open the homepage and a category page.
2. Visit `/admin/login` and sign in.
3. Create a test post and upload an image.
4. Confirm the image appears in Cloudinary under the `techsastra` folder.
5. Confirm the post remains after a Vercel redeployment.

If you add a custom domain, update `NEXT_PUBLIC_SITE_URL` and redeploy.

## Existing local images

If old post HTML still references `/uploads/...`, place those files in
`public/uploads/` and run this once with the production credentials:

```bash
TURSO_DATABASE_URL="libsql://..." \
TURSO_AUTH_TOKEN="..." \
CLOUDINARY_CLOUD_NAME="..." \
CLOUDINARY_API_KEY="..." \
CLOUDINARY_API_SECRET="..." \
npm run backfill:images
```

The script uploads referenced files and replaces their local paths with Cloudinary
URLs in Turso.

## Troubleshooting

| Code | Meaning | Fix |
|---|---|---|
| `TURSO_NOT_CONFIGURED` | Missing Turso URL or token | Reconnect Turso or add both variables, then redeploy |
| `TURSO_AUTHENTICATION_FAILED` | Invalid or expired token | Rotate/reconnect the Turso token and redeploy |
| `TURSO_UNREACHABLE` | Network or database availability problem | Check the Turso URL, region, and service status |
| `TURSO_SCHEMA_OUTDATED` | Missing table or column | Deploy the latest commit so migrations run |
| `CLOUDINARY_NOT_CONFIGURED` | Missing Cloudinary credential | Add all three Cloudinary variables and redeploy |
| `CLOUDINARY_UPLOAD_FAILED` | Cloudinary rejected the file | Check file type, size, account limits, and browser response |
| `AUTH_CONFIGURATION_FAILED` | Missing CMS authentication variable | Add `AUTH_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` |

## Local development

Local development uses `file:prisma/dev.db` when Turso variables are absent. That
file is ignored by Git and is never used by Vercel. To create a fresh local schema
and sample content:

```bash
npm run db:setup
npm run dev
```
