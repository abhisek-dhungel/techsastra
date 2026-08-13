PRAGMA foreign_keys = ON;

BEGIN;

INSERT OR IGNORE INTO "Category" ("id", "name", "slug", "parentId", "order", "createdAt")
VALUES
  ('cat-news', 'NEWS', 'news', NULL, 0, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-gadgets', 'GADGETS', 'gadgets', NULL, 1, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-auto', 'AUTO', 'auto', NULL, 2, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-prices', 'PRICES', 'prices', NULL, 3, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-reviews', 'REVIEWS', 'reviews', NULL, 4, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-events-startups', 'EVENTS/STARTUPS', 'events-startups', NULL, 5, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-deals', 'DEALS', 'deals', NULL, 6, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-blogs', 'BLOGS', 'blogs', NULL, 7, CAST(strftime('%s', 'now') AS INTEGER) * 1000);

INSERT OR IGNORE INTO "Category" ("id", "name", "slug", "parentId", "order", "createdAt")
VALUES
  ('cat-mobile-phones', 'MOBILE PHONES', 'mobile-phones', (SELECT "id" FROM "Category" WHERE "slug" = 'gadgets'), 0, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-laptops', 'LAPTOPS', 'laptops', (SELECT "id" FROM "Category" WHERE "slug" = 'gadgets'), 1, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-cameras', 'CAMERAS', 'cameras', (SELECT "id" FROM "Category" WHERE "slug" = 'gadgets'), 2, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-accessories', 'ACCESSORIES', 'accessories', (SELECT "id" FROM "Category" WHERE "slug" = 'gadgets'), 3, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-tv', 'TV', 'tv', (SELECT "id" FROM "Category" WHERE "slug" = 'gadgets'), 4, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-bikes', 'BIKES', 'bikes', (SELECT "id" FROM "Category" WHERE "slug" = 'auto'), 0, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-cars', 'CARS', 'cars', (SELECT "id" FROM "Category" WHERE "slug" = 'auto'), 1, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-scooters', 'SCOOTERS', 'scooters', (SELECT "id" FROM "Category" WHERE "slug" = 'auto'), 2, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-mobile-phone-prices', 'MOBILE PHONE', 'mobile-phone-prices', (SELECT "id" FROM "Category" WHERE "slug" = 'prices'), 0, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-laptop-prices', 'LAPTOPS', 'laptop-prices', (SELECT "id" FROM "Category" WHERE "slug" = 'prices'), 1, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-camera-prices', 'CAMERA', 'camera-prices', (SELECT "id" FROM "Category" WHERE "slug" = 'prices'), 2, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('cat-tv-prices', 'TV', 'tv-prices', (SELECT "id" FROM "Category" WHERE "slug" = 'prices'), 3, CAST(strftime('%s', 'now') AS INTEGER) * 1000);

COMMIT;
