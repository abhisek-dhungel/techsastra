export const NAV_CATEGORIES = [
  { name: "NEWS", slug: "news" },
  {
    name: "GADGETS",
    slug: "gadgets",
    children: [
      { name: "MOBILE PHONES", slug: "mobile-phones" },
      { name: "LAPTOPS", slug: "laptops" },
      { name: "CAMERAS", slug: "cameras" },
      { name: "ACCESSORIES", slug: "accessories" },
      { name: "TV", slug: "tv" },
    ],
  },
  {
    name: "AUTO",
    slug: "auto",
    children: [
      { name: "BIKES", slug: "bikes" },
      { name: "CARS", slug: "cars" },
      { name: "SCOOTERS", slug: "scooters" },
    ],
  },
  {
    name: "PRICES",
    slug: "prices",
    children: [
      { name: "MOBILE PHONE", slug: "mobile-phone-prices" },
      { name: "LAPTOPS", slug: "laptop-prices" },
      { name: "CAMERA", slug: "camera-prices" },
      { name: "TV", slug: "tv-prices" },
    ],
  },
  { name: "REVIEWS", slug: "reviews" },
  { name: "EVENTS/STARTUPS", slug: "events-startups" },
  { name: "DEALS", slug: "deals" },
  { name: "BLOGS", slug: "blogs" },
] as const;

export type NavCategory = (typeof NAV_CATEGORIES)[number];

/** Top-level nav items that scroll to homepage sections */
export const HOME_SECTION_SLUGS = new Set([
  "news",
  "gadgets",
  "auto",
  "prices",
  "reviews",
  "events-startups",
  "deals",
  "blogs",
]);

export function navHref(slug: string) {
  if (HOME_SECTION_SLUGS.has(slug)) return `/#${slug}`;
  return `/category/${slug}`;
}
