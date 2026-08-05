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
| `npm run db:setup` | Create schema (`prisma db push`) + seed sample posts |
| `npm run db:seed` | Re-seed sample content |
| `npm run backfill:images` | Migrate existing `public/uploads` images to Cloudinary and rewrite Post rows |
| `npm run build` | Production build |

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + **MySQL** for posts, categories, and authors
- Cloudinary for image storage (cover + inline uploads)
- Admin CMS at `/admin` with REST APIs under `/api/posts` and `/api/categories`

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the step-by-step Vercel + Railway MySQL + Cloudinary guide.

