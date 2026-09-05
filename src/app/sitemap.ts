import type { MetadataRoute } from "next";
import {
  listSitemapCategories,
  listSitemapAuthors,
  listSitemapPosts,
} from "@/lib/database";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: absoluteUrl("/about"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/editorial-policy"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    const [posts, categories, authors] = await Promise.all([
      listSitemapPosts(),
      listSitemapCategories(),
      listSitemapAuthors(),
    ]);

    const latestUpdate = posts.reduce<Date | undefined>((latest, post) => {
      const updated = post.updatedAt ?? post.publishedAt;
      return !latest || updated > latest ? updated : latest;
    }, undefined);

    const datedStaticPages = staticPages.map((page) =>
      page.url === absoluteUrl("/") && latestUpdate
        ? { ...page, lastModified: latestUpdate }
        : page,
    );

    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
      lastModified: category.createdAt,
      changeFrequency: "daily",
      priority: 0.85,
    }));

    const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: absoluteUrl(`/${post.slug}`),
      lastModified: post.updatedAt ?? post.publishedAt,
      changeFrequency: "weekly",
      priority: 0.7,
      images: post.coverImage ? [absoluteUrl(post.coverImage)] : undefined,
    }));

    const authorPages: MetadataRoute.Sitemap = authors.map((author) => ({
      url: absoluteUrl(`/author/${author.slug}`),
      lastModified: author.lastModified,
      changeFrequency: "weekly",
      priority: 0.55,
    }));

    return [...datedStaticPages, ...categoryPages, ...authorPages, ...postPages];
  } catch {
    return staticPages;
  }
}
