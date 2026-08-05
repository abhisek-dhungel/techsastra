export const SITE = {
  name: "TechSastra",
  legalName: "TechSastra",
  tagline: "Nepal's Tech News, Gadgets, Prices & Reviews",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://techsastra.com").replace(
    /\/$/,
    "",
  ),
  locale: "en_NP",
  language: "en",
  country: "NP",
  twitterHandle: "@techsastra",
  email: "hello@techsastra.com",
  sameAs: [
    "https://www.facebook.com/techsastra",
    "https://www.instagram.com/techsastra",
    "https://www.youtube.com/@techsastra",
  ],
  defaultOgImage: "/logo.png",
  keywords: [
    "best tech site of Nepal",
    "best tech portal of Nepal",
    "tech news Nepal",
    "gadget prices Nepal",
    "mobile phone price in Nepal",
    "laptop price Nepal",
    "tech reviews Nepal",
    "automobile news Nepal",
    "TechSastra",
    "Nepal technology news",
    "best for price of tech in Nepal",
  ],
} as const;

export const DEFAULT_DESCRIPTION =
  "TechSastra is Nepal's leading tech portal for the latest tech news, gadget prices, mobile & laptop price lists, reviews, automobiles, deals and startups — your best tech site of Nepal.";

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}

export function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string, max = 155) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

export function seoDescriptionFromContent(
  excerpt: string | null | undefined,
  content: string,
  max = 155,
) {
  if (excerpt?.trim()) return truncate(excerpt, max);
  return truncate(stripHtml(content), max);
}

type CategorySeo = {
  title: string;
  description: string;
  keywords: string[];
};

const CATEGORY_SEO: Record<string, CategorySeo> = {
  news: {
    title: "Tech News Nepal — Latest Technology Headlines",
    description:
      "Breaking tech news from Nepal and around the world. Stay updated with startups, gadgets, software and digital trends on TechSastra — Nepal's best tech portal.",
    keywords: ["tech news Nepal", "technology news Nepal", "Nepal IT news"],
  },
  gadgets: {
    title: "Gadgets in Nepal — Phones, Laptops, Cameras & More",
    description:
      "Explore new gadgets in Nepal: mobile phones, laptops, cameras, TVs and accessories with local context on TechSastra, the best tech site of Nepal.",
    keywords: ["gadgets Nepal", "new gadgets Nepal", "electronics Nepal"],
  },
  "mobile-phones": {
    title: "Mobile Phones Nepal — Specs, Launches & Guides",
    description:
      "Mobile phone news, launches and buying guides for Nepal. Compare smartphones and find the right phone on TechSastra.",
    keywords: ["mobile phones Nepal", "smartphone Nepal", "new phone Nepal"],
  },
  laptops: {
    title: "Laptops in Nepal — News, Specs & Buying Guides",
    description:
      "Laptop news and buying guides for Nepal. Find the best laptop options for study, work and gaming on TechSastra.",
    keywords: ["laptops Nepal", "best laptop Nepal", "laptop guide Nepal"],
  },
  cameras: {
    title: "Cameras in Nepal — DSLR, Mirrorless & More",
    description:
      "Camera news and guides for Nepal — DSLR, mirrorless and action cameras covered by TechSastra.",
    keywords: ["cameras Nepal", "DSLR Nepal", "mirrorless Nepal"],
  },
  accessories: {
    title: "Tech Accessories Nepal",
    description:
      "Tech accessories in Nepal — earbuds, chargers, cases and more. Practical picks from TechSastra.",
    keywords: ["tech accessories Nepal", "gadgets accessories"],
  },
  tv: {
    title: "TV & Smart TVs in Nepal",
    description:
      "Smart TV news, features and buying tips for Nepal on TechSastra.",
    keywords: ["smart TV Nepal", "TV price Nepal"],
  },
  auto: {
    title: "Automobiles Nepal — Cars, Bikes & Scooters",
    description:
      "Auto news in Nepal: cars, bikes, scooters and EV updates from TechSastra.",
    keywords: ["automobile news Nepal", "cars Nepal", "bikes Nepal"],
  },
  bikes: {
    title: "Bikes in Nepal — News & Reviews",
    description:
      "Motorcycle and bike news for Nepal readers on TechSastra.",
    keywords: ["bikes Nepal", "motorcycle Nepal"],
  },
  cars: {
    title: "Cars in Nepal — News & Reviews",
    description:
      "Car news, launches and reviews relevant to Nepal on TechSastra.",
    keywords: ["cars Nepal", "car news Nepal"],
  },
  scooters: {
    title: "Scooters in Nepal — News & Reviews",
    description:
      "Scooter and electric scooter updates for Nepal on TechSastra.",
    keywords: ["scooters Nepal", "electric scooter Nepal"],
  },
  prices: {
    title: "Tech Prices in Nepal — Phones, Laptops, Cameras & TVs",
    description:
      "Best place for tech prices in Nepal. Check mobile phone, laptop, camera and TV price lists updated for Nepali buyers on TechSastra.",
    keywords: [
      "tech price Nepal",
      "best for price of tech in Nepal",
      "gadget price Nepal",
      "electronics price Nepal",
    ],
  },
  "mobile-phone-prices": {
    title: "Mobile Phone Price in Nepal — Latest Price List",
    description:
      "Mobile phone price in Nepal — updated smartphone price lists, budget phones and flagship costs for Nepali buyers on TechSastra.",
    keywords: [
      "mobile phone price in Nepal",
      "smartphone price Nepal",
      "phone price list Nepal",
    ],
  },
  "laptop-prices": {
    title: "Laptop Price in Nepal — Latest Price List",
    description:
      "Laptop price in Nepal with current price lists for students, professionals and gamers on TechSastra.",
    keywords: ["laptop price Nepal", "laptop price list Nepal"],
  },
  "camera-prices": {
    title: "Camera Price in Nepal",
    description:
      "Camera prices in Nepal for DSLR, mirrorless and compact cameras on TechSastra.",
    keywords: ["camera price Nepal", "DSLR price Nepal"],
  },
  "tv-prices": {
    title: "TV Price in Nepal — Smart TV Price List",
    description:
      "TV and smart TV prices in Nepal. Compare screen sizes and brands on TechSastra.",
    keywords: ["TV price Nepal", "smart TV price Nepal"],
  },
  reviews: {
    title: "Tech Reviews Nepal — Honest Product Reviews",
    description:
      "In-depth tech reviews for Nepal: phones, laptops, gadgets and autos from TechSastra.",
    keywords: ["tech reviews Nepal", "gadget review Nepal"],
  },
  "events-startups": {
    title: "Tech Events & Startups Nepal",
    description:
      "Nepal tech events, startups and innovation stories on TechSastra.",
    keywords: ["Nepal startups", "tech events Nepal"],
  },
  deals: {
    title: "Tech Deals Nepal — Offers & Discounts",
    description:
      "Latest tech deals and discounts in Nepal on gadgets, phones and more — TechSastra.",
    keywords: ["tech deals Nepal", "gadget offers Nepal"],
  },
  blogs: {
    title: "Tech Blogs Nepal — Guides & Opinion",
    description:
      "Tech blogs, how-tos and opinion pieces for Nepal's tech audience on TechSastra.",
    keywords: ["tech blog Nepal", "technology guides Nepal"],
  },
};

export function getCategorySeo(
  slug: string,
  name: string,
): CategorySeo {
  const mapped = CATEGORY_SEO[slug];
  if (mapped) return mapped;
  return {
    title: `${name} — TechSastra Nepal`,
    description: `${name} coverage from TechSastra, Nepal's tech portal for news, prices, gadgets and reviews.`,
    keywords: [name, "tech Nepal", "TechSastra"],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "@id": absoluteUrl("/#organization"),
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE.defaultOgImage),
    },
    image: absoluteUrl(SITE.defaultOgImage),
    description: DEFAULT_DESCRIPTION,
    email: SITE.email,
    areaServed: {
      "@type": "Country",
      name: "Nepal",
    },
    sameAs: [...SITE.sameAs],
    publishingPrinciples: absoluteUrl("/about"),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE.name,
    url: SITE.url,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en-NP",
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
