# TechSastra

Nepal-focused tech news site modeled on [techsastra.com](https://techsastra.com) — responsive UI plus a backend for publishing posts under categories and subcategories.

## Categories

- **NEWS**
- **GADGETS** → Mobile Phones, Laptops, Cameras, Accessories, TV
- **AUTO** → Bikes, Cars, Scooters
- **PRICES** → Mobile Phone, Laptops, Camera, TV
- **REVIEWS**
- **EVENTS/STARTUPS**
- **DEALS**
- **BLOGS**

## Quick start

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the site and [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the CMS.

Default admin login (change in `.env`):

- Username: `admin`
- Password: `techsastra2026`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run db:setup` | Apply the local SQLite schema + seed sample posts |
| `npm run db:seed` | Re-seed sample content |
| `npm run db:deploy` | Apply tracked Turso/libSQL migrations |
| `npm run backfill:images` | Migrate existing `public/uploads` images to Cloudinary and rewrite Post rows |
| `npm run build` | Production build, including database migration deployment |
| `npm run build:app` | Build the app without applying migrations |

> **Production warning:** `db:seed` and `db:setup` delete all existing posts,
> categories, and authors before loading sample content. Never run them against a
> populated production database.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Turso/libSQL (serverless SQLite) for posts, categories, and authors
- Cloudinary for image storage (cover + inline uploads)
- Admin CMS at `/admin` with REST APIs under `/api/posts` and `/api/categories`

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the step-by-step Vercel + Turso + Cloudinary guide.
