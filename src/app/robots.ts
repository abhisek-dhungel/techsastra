import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: [`${SITE.url}/sitemap.xml`, `${SITE.url}/news-sitemap.xml`],
    host: SITE.url,
  };
}
