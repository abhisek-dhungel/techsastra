import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  try {
    const [posts, categories] = await Promise.all([
      prisma.post.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
      prisma.category.findMany({
        select: { slug: true, createdAt: true },
      }),
    ]);

    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
      lastModified: category.createdAt,
      changeFrequency: "daily",
      priority: 0.85,
    }));

    const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: absoluteUrl(`/post/${post.slug}`),
      lastModified: post.updatedAt ?? post.publishedAt ?? now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticPages, ...categoryPages, ...postPages];
  } catch {
    return staticPages;
  }
}
