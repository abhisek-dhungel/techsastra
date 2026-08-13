import { unstable_cache } from "next/cache";
import {
  findCategoryBySlug,
  findPostBySlug,
  listChildCategories,
  listFeedPostRecords,
  listFlatCategories,
  listLatestPostCards,
  listPostCardsByCategoryIds,
  listRootCategoriesWithChildren,
  type PostCardRecord,
  type PostWithRelations,
} from "./database";

export type { PostWithRelations };

/** Lean shape for homepage / category cards — no content or parent trees */
export type PostCardData = PostCardRecord;

export function categoryLabel(post: {
  category: { name: string };
}) {
  return post.category.name;
}

async function latestPosts(take: number) {
  try {
    return await listLatestPostCards(take);
  } catch (err) {
    console.warn("[posts] getLatestPosts skipped:", (err as Error).message);
    return [];
  }
}

async function featuredPosts(take: number) {
  try {
    return await listLatestPostCards(take, { featuredOnly: true });
  } catch (err) {
    console.warn("[posts] getFeaturedPosts skipped:", (err as Error).message);
    return [];
  }
}

async function postsByCategorySlug(slug: string, take: number) {
  try {
    const category = await findCategoryBySlug(slug);
    if (!category) return { category: null, posts: [] as PostCardData[] };

    const children = await listChildCategories(category.id);
    const ids = [category.id, ...children.map((child) => child.id)];
    const posts = await listPostCardsByCategoryIds(ids, take);
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
    return await listFeedPostRecords(take);
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
    return await findPostBySlug(slug);
  } catch (err) {
    console.warn("[posts] getPostBySlug skipped:", (err as Error).message);
    return null;
  }
}

export async function getAllCategories() {
  try {
    return await listRootCategoriesWithChildren();
  } catch (err) {
    console.warn("[posts] getAllCategories skipped:", (err as Error).message);
    return [];
  }
}

export async function getFlatCategories() {
  try {
    return await listFlatCategories();
  } catch (err) {
    console.warn("[posts] getFlatCategories skipped:", (err as Error).message);
    return [];
  }
}

export function excerptFrom(content: string, max = 160) {
  const plain = content.replace(/\s+/g, " ").trim();
  return plain.length > max ? `${plain.slice(0, max).trim()}…` : plain;
}
