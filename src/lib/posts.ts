import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    category: { include: { parent: true } };
    secondaryCategory: { include: { parent: true } };
    author: true;
  };
}>;

/** Lean shape for homepage / category cards — no content or parent trees */
export type PostCardData = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  excerpt?: string | null;
  publishedAt?: Date;
  createdAt?: Date;
  category: { name: string; slug: string };
  secondaryCategory: { name: string; slug: string } | null;
  author: { name: string };
};

const postInclude = {
  category: { include: { parent: true } },
  secondaryCategory: { include: { parent: true } },
  author: true,
} satisfies Prisma.PostInclude;

const cardSelect = {
  id: true,
  title: true,
  slug: true,
  coverImage: true,
  excerpt: true,
  publishedAt: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
  secondaryCategory: { select: { name: true, slug: true } },
  author: { select: { name: true } },
} satisfies Prisma.PostSelect;

export function categoryLabel(post: {
  category: { name: string };
}) {
  return post.category.name;
}

async function latestPosts(take: number) {
  try {
    return await prisma.post.findMany({
      where: { published: true },
      select: cardSelect,
      orderBy: { publishedAt: "desc" },
      take,
    });
  } catch (err) {
    console.warn("[posts] getLatestPosts skipped:", (err as Error).message);
    return [];
  }
}

async function featuredPosts(take: number) {
  try {
    return await prisma.post.findMany({
      where: { published: true, featured: true },
      select: cardSelect,
      orderBy: { publishedAt: "desc" },
      take,
    });
  } catch (err) {
    console.warn("[posts] getFeaturedPosts skipped:", (err as Error).message);
    return [];
  }
}

async function postsByCategorySlug(slug: string, take: number) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        children: { select: { id: true } },
      },
    });
    if (!category) return { category: null, posts: [] as PostCardData[] };

    const ids = [category.id, ...category.children.map((c) => c.id)];
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        OR: [{ categoryId: { in: ids } }, { secondaryCategoryId: { in: ids } }],
      },
      select: cardSelect,
      orderBy: { publishedAt: "desc" },
      take,
    });
    return { category, posts };
  } catch (err) {
    console.warn("[posts] getPostsByCategorySlug skipped:", (err as Error).message);
    return { category: null, posts: [] as PostCardData[] };
  }
}

export const getLatestPosts = unstable_cache(
  latestPosts,
  ["latest-posts"],
  { revalidate: 60, tags: ["posts"] },
);

export const getFeaturedPosts = unstable_cache(
  featuredPosts,
  ["featured-posts"],
  { revalidate: 60, tags: ["posts"] },
);

export const getPostsByCategorySlug = unstable_cache(
  postsByCategorySlug,
  ["posts-by-category"],
  { revalidate: 60, tags: ["posts"] },
);

async function feedPosts(take: number) {
  try {
    return await prisma.post.findMany({
      where: { published: true },
      select: {
        ...cardSelect,
        content: true,
      },
      orderBy: { publishedAt: "desc" },
      take,
    });
  } catch (err) {
    console.warn("[posts] getFeedPosts skipped:", (err as Error).message);
    return [];
  }
}

export const getFeedPosts = unstable_cache(feedPosts, ["feed-posts"], {
  revalidate: 120,
  tags: ["posts"],
});

export async function getPostBySlug(slug: string) {
  try {
    return await prisma.post.findUnique({
      where: { slug },
      include: postInclude,
    });
  } catch (err) {
    console.warn("[posts] getPostBySlug skipped:", (err as Error).message);
    return null;
  }
}

export async function getAllCategories() {
  try {
    return await prisma.category.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });
  } catch (err) {
    console.warn("[posts] getAllCategories skipped:", (err as Error).message);
    return [];
  }
}

export async function getFlatCategories() {
  try {
    return await prisma.category.findMany({
      include: { parent: true },
      orderBy: [{ parentId: "asc" }, { order: "asc" }],
    });
  } catch (err) {
    console.warn("[posts] getFlatCategories skipped:", (err as Error).message);
    return [];
  }
}

export function excerptFrom(content: string, max = 160) {
  const plain = content.replace(/\s+/g, " ").trim();
  return plain.length > max ? `${plain.slice(0, max).trim()}…` : plain;
}
