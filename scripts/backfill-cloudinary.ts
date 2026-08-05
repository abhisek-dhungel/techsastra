/**
 * One-off migration: move existing images stored under public/uploads into
 * Cloudinary, then rewrite the Post rows (coverImage + inline <img src="/uploads/...">)
 * to the new Cloudinary URLs.
 *
 * Run this ONCE, locally, against your production DATABASE_URL:
 *   DATABASE_URL="mysql://..." CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... npx tsx scripts/backfill-cloudinary.ts
 *
 * Alternatively put the values in a .env file and run `npm run backfill:images`.
 */
import { readdir, readFile } from "fs/promises";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { uploadBuffer } from "../src/lib/cloudinary";

// Minimal .env loader (no extra dependency). Prisma already auto-loads .env
// for DATABASE_URL; this ensures Cloudinary creds are set too when run with npm script.
function loadDotEnv() {
  const { readFileSync } = require("fs");
  try {
    const raw = readFileSync(path.join(process.cwd(), ".env"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    // no .env file — rely on real env vars
  }
}
loadDotEnv();

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
// Matches `/uploads/<file>` inside content HTML or a standalone path.
const UPLOAD_PATH_RE = /\/uploads\/([^"')\s\\]+)/g;

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error(
      "Missing Cloudinary config. Set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET in .env or the command line.",
    );
    process.exit(1);
  }

  const posts = await prisma.post.findMany({ select: { id: true, coverImage: true, content: true } });
  const files = new Set(await readdir(UPLOADS_DIR).catch(() => [] as string[]));
  if (files.size === 0) {
    console.log("No files in public/uploads — nothing to backfill.");
    return;
  }

  // 1. Collect every referenced local file (covers + inline content).
  const referenced = new Set<string>();
  for (const p of posts) {
    if (p.coverImage?.startsWith("/uploads/")) {
      referenced.add(p.coverImage.replace("/uploads/", ""));
    }
    for (const m of p.content.matchAll(UPLOAD_PATH_RE)) {
      referenced.add(m[1]);
    }
  }

  // 2. Upload each referenced local file once, build a filename -> URL map.
  const urlMap = new Map<string, string>();
  for (const fname of referenced) {
    if (!files.has(fname)) {
      console.warn(`  ! skipped missing file: ${fname}`);
      continue;
    }
    const buf = await readFile(path.join(UPLOADS_DIR, fname));
    const { url } = await uploadBuffer(buf);
    urlMap.set(fname, url);
    console.log(`  + ${fname} -> ${url}`);
  }
  if (urlMap.size === 0) {
    console.log("No referenced local files to migrate.");
    return;
  }

  // 3. Rewrite Post rows.
  let updatedCount = 0;
  for (const p of posts) {
    let cover = p.coverImage;
    if (cover?.startsWith("/uploads/")) {
      const u = urlMap.get(cover.replace("/uploads/", ""));
      if (u) cover = u;
    }
    const content = p.content.replace(
      UPLOAD_PATH_RE,
      (full, fname) => urlMap.get(fname) ?? full,
    );

    if (cover !== p.coverImage || content !== p.content) {
      await prisma.post.update({
        where: { id: p.id },
        data: { coverImage: cover, content },
      });
      updatedCount += 1;
    }
  }

  console.log(`\nDone. Uploaded ${urlMap.size} files, updated ${updatedCount} posts.`);
  console.log("You can now remove public/uploads if you no longer need the local copies.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
