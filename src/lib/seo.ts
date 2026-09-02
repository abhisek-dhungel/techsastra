const DEFAULT_SITE_URL = "https://www.techsastra.com";

function canonicalSiteUrl(value: string | undefined) {
  const configured = (value || DEFAULT_SITE_URL).replace(/\/$/, "");
  return configured === "https://techsastra.com" ? DEFAULT_SITE_URL : configured;
}

export const SITE = {
  name: "TechSastra",
  alternateName: "Tech Sastra",
  legalName: "TechSastra",
  tagline: "Tech News, Reviews & Prices in Nepal",
  url: canonicalSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  locale: "en_NP",
  language: "en",
  country: "NP",
  email: "hello@techsastra.com",
  sameAs: [
    "https://www.facebook.com/official.techsastra/",
    "https://www.instagram.com/tech.sastra",
    "https://www.youtube.com/@techsastra1",
  ],
  logo: "/icons/icon-512.png",
  defaultOgImage: "/opengraph-image",
  keywords: [
    "tech in Nepal",
    "tech news Nepal",
    "price in Nepal",
    "mobile price in Nepal",
    "laptop price in Nepal",
    "tech reviews Nepal",
    "gadgets Nepal",
    "automobile news Nepal",
    "TechSastra",
    "Tech Sastra",
  ],
} as const;

export const DEFAULT_DESCRIPTION =
  "TechSastra covers Nepal technology news, mobile and laptop prices, gadget reviews, automobiles, startups and practical buying guides for Nepali readers.";

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}

export function seoAlternates(path: string) {
  const canonical = absoluteUrl(path);
  return {
    canonical,
    languages: { "en-NP": canonical },
    types: { "application/rss+xml": absoluteUrl("/feed.xml") },
  };
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
    title: "Tech News in Nepal — Latest Technology Headlines",
    description:
      "Follow the latest tech news in Nepal, including gadgets, startups, software, telecom, digital policy and global stories relevant to Nepali readers.",
    keywords: ["tech news in Nepal", "technology news Nepal", "Nepal IT news"],
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
    title: "Tech Prices in Nepal: Phones, Laptops, Cameras & TVs",
    description:
      "Check tech prices in Nepal for mobile phones, laptops, cameras and TVs, with local availability, variant details and practical buying guidance.",
    keywords: [
      "tech prices in Nepal",
      "price in Nepal",
      "gadget price in Nepal",
      "electronics price in Nepal",
    ],
  },
  "mobile-phone-prices": {
    title: "Mobile Price in Nepal: Latest Phone Price List",
    description:
      "Find updated mobile price lists for phones in Nepal. Compare launch prices, storage variants, availability and buying guidance from TechSastra.",
    keywords: [
      "mobile price in Nepal",
      "mobile phone price in Nepal",
      "smartphone price in Nepal",
      "phone price list in Nepal",
    ],
  },
  "laptop-prices": {
    title: "Laptop Price in Nepal: Latest Price List",
    description:
      "Compare laptop prices in Nepal for study, office work, gaming and creative use, with specifications, availability and practical buying guidance.",
    keywords: ["laptop price in Nepal", "laptop price list in Nepal"],
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
    title: "Tech Reviews in Nepal — Products & Buying Advice",
    description:
      "Read tech reviews in Nepal covering phones, laptops, gadgets and automobiles, with local prices, availability and practical buying advice.",
    keywords: ["tech reviews in Nepal", "gadget review Nepal"],
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
): CategorySeo & { heading: string } {
  const mapped = CATEGORY_SEO[slug];
  if (mapped) {
    return {
      ...mapped,
      heading: mapped.title.split(/\s+—\s+|:\s+/)[0],
    };
  }
  return {
    title: `${name} in Nepal`,
    heading: name,
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
    alternateName: SITE.alternateName,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE.logo),
      width: 512,
      height: 512,
    },
    image: absoluteUrl(SITE.defaultOgImage),
    description: DEFAULT_DESCRIPTION,
    email: SITE.email,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "editorial",
      email: SITE.email,
    },
    areaServed: {
      "@type": "Country",
      name: "Nepal",
    },
    sameAs: [...SITE.sameAs],
    publishingPrinciples: absoluteUrl("/editorial-policy"),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE.name,
    alternateName: SITE.alternateName,
    url: SITE.url,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en-NP",
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
) {
  const currentPath = items.at(-1)?.path ?? "/";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(currentPath)}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
