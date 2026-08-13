PRAGMA foreign_keys = ON;

BEGIN;

CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "parentId" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" INTEGER NOT NULL,
  CONSTRAINT "Category_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Category" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key"
  ON "Category" ("slug");

CREATE TABLE IF NOT EXISTS "Author" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "bio" TEXT,
  "avatar" TEXT,
  "createdAt" INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Author_slug_key"
  ON "Author" ("slug");

CREATE TABLE IF NOT EXISTS "Post" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "coverImage" TEXT,
  "published" INTEGER NOT NULL DEFAULT 1 CHECK ("published" IN (0, 1)),
  "featured" INTEGER NOT NULL DEFAULT 0 CHECK ("featured" IN (0, 1)),
  "views" INTEGER NOT NULL DEFAULT 0,
  "categoryId" TEXT NOT NULL,
  "secondaryCategoryId" TEXT,
  "authorId" TEXT NOT NULL,
  "publishedAt" INTEGER NOT NULL,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  CONSTRAINT "Post_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Post_secondaryCategoryId_fkey"
    FOREIGN KEY ("secondaryCategoryId") REFERENCES "Category" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Post_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "Author" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Post_slug_key"
  ON "Post" ("slug");
CREATE INDEX IF NOT EXISTS "Post_published_publishedAt_idx"
  ON "Post" ("published", "publishedAt");
CREATE INDEX IF NOT EXISTS "Post_featured_publishedAt_idx"
  ON "Post" ("featured", "publishedAt");
CREATE INDEX IF NOT EXISTS "Post_categoryId_idx"
  ON "Post" ("categoryId");
CREATE INDEX IF NOT EXISTS "Post_secondaryCategoryId_idx"
  ON "Post" ("secondaryCategoryId");

COMMIT;
