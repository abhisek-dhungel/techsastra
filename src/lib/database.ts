import { randomUUID } from "node:crypto";
import type { InValue, Row } from "@libsql/client";
import {
  getDatabase,
  nowTimestamp,
  rowBoolean,
  rowDate,
  rowNullableString,
  rowNumber,
  rowString,
} from "./turso";

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  createdAt: Date;
};

export type CategoryWithParent = CategoryRecord & {
  parent: CategoryRecord | null;
};

export type CategoryWithChildren = CategoryRecord & {
  children: CategoryRecord[];
};

export type AuthorRecord = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar: string | null;
  createdAt: Date;
};

export type PostRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  published: boolean;
  featured: boolean;
  views: number;
  categoryId: string;
  secondaryCategoryId: string | null;
  authorId: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PostWithRelations = PostRecord & {
  category: CategoryWithParent;
  secondaryCategory: CategoryWithParent | null;
  author: AuthorRecord;
};

export type PostCardRecord = Pick<
  PostRecord,
  | "id"
  | "title"
  | "slug"
  | "coverImage"
  | "excerpt"
  | "publishedAt"
  | "createdAt"
> & {
  category: { name: string; slug: string };
  secondaryCategory: { name: string; slug: string } | null;
  author: { name: string; slug: string };
};

const CATEGORY_COLUMNS = `
  c."id" AS c_id,
  c."name" AS c_name,
  c."slug" AS c_slug,
  c."parentId" AS c_parentId,
  c."order" AS c_order,
  c."createdAt" AS c_createdAt
`;

const POST_RELATION_COLUMNS = `
  p."id" AS p_id,
  p."title" AS p_title,
  p."slug" AS p_slug,
  p."excerpt" AS p_excerpt,
  p."content" AS p_content,
  p."coverImage" AS p_coverImage,
  p."published" AS p_published,
  p."featured" AS p_featured,
  p."views" AS p_views,
  p."categoryId" AS p_categoryId,
  p."secondaryCategoryId" AS p_secondaryCategoryId,
  p."authorId" AS p_authorId,
  p."publishedAt" AS p_publishedAt,
  p."createdAt" AS p_createdAt,
  p."updatedAt" AS p_updatedAt,
  c."id" AS c_id,
  c."name" AS c_name,
  c."slug" AS c_slug,
  c."parentId" AS c_parentId,
  c."order" AS c_order,
  c."createdAt" AS c_createdAt,
  cp."id" AS cp_id,
  cp."name" AS cp_name,
  cp."slug" AS cp_slug,
  cp."parentId" AS cp_parentId,
  cp."order" AS cp_order,
  cp."createdAt" AS cp_createdAt,
  sc."id" AS sc_id,
  sc."name" AS sc_name,
  sc."slug" AS sc_slug,
  sc."parentId" AS sc_parentId,
  sc."order" AS sc_order,
  sc."createdAt" AS sc_createdAt,
  scp."id" AS scp_id,
  scp."name" AS scp_name,
  scp."slug" AS scp_slug,
  scp."parentId" AS scp_parentId,
  scp."order" AS scp_order,
  scp."createdAt" AS scp_createdAt,
  a."id" AS a_id,
  a."name" AS a_name,
  a."slug" AS a_slug,
  a."bio" AS a_bio,
  a."avatar" AS a_avatar,
  a."createdAt" AS a_createdAt
`;

const POST_RELATION_JOINS = `
  JOIN "Category" c ON c."id" = p."categoryId"
  LEFT JOIN "Category" cp ON cp."id" = c."parentId"
  LEFT JOIN "Category" sc ON sc."id" = p."secondaryCategoryId"
  LEFT JOIN "Category" scp ON scp."id" = sc."parentId"
  JOIN "Author" a ON a."id" = p."authorId"
`;

const POST_CARD_COLUMNS = `
  p."id" AS p_id,
  p."title" AS p_title,
  p."slug" AS p_slug,
  p."coverImage" AS p_coverImage,
  p."excerpt" AS p_excerpt,
  p."publishedAt" AS p_publishedAt,
  p."createdAt" AS p_createdAt,
  c."name" AS c_name,
  c."slug" AS c_slug,
  sc."name" AS sc_name,
  sc."slug" AS sc_slug,
  a."name" AS a_name,
  a."slug" AS a_slug
`;

const POST_CARD_JOINS = `
  JOIN "Category" c ON c."id" = p."categoryId"
  LEFT JOIN "Category" sc ON sc."id" = p."secondaryCategoryId"
  JOIN "Author" a ON a."id" = p."authorId"
`;

function mapCategory(row: Row, prefix = "c_"): CategoryRecord {
  return {
    id: rowString(row, `${prefix}id`),
    name: rowString(row, `${prefix}name`),
    slug: rowString(row, `${prefix}slug`),
    parentId: rowNullableString(row, `${prefix}parentId`),
    order: rowNumber(row, `${prefix}order`),
    createdAt: rowDate(row, `${prefix}createdAt`),
  };
}

function mapNullableCategory(row: Row, prefix: string) {
  return row[`${prefix}id`] === null ? null : mapCategory(row, prefix);
}

function mapAuthor(row: Row, prefix = "a_"): AuthorRecord {
  return {
    id: rowString(row, `${prefix}id`),
    name: rowString(row, `${prefix}name`),
    slug: rowString(row, `${prefix}slug`),
    bio: rowNullableString(row, `${prefix}bio`),
    avatar: rowNullableString(row, `${prefix}avatar`),
    createdAt: rowDate(row, `${prefix}createdAt`),
  };
}

function mapPost(row: Row): PostRecord {
  return {
    id: rowString(row, "p_id"),
    title: rowString(row, "p_title"),
    slug: rowString(row, "p_slug"),
    excerpt: rowNullableString(row, "p_excerpt"),
    content: rowString(row, "p_content"),
    coverImage: rowNullableString(row, "p_coverImage"),
    published: rowBoolean(row, "p_published"),
    featured: rowBoolean(row, "p_featured"),
    views: rowNumber(row, "p_views"),
    categoryId: rowString(row, "p_categoryId"),
    secondaryCategoryId: rowNullableString(row, "p_secondaryCategoryId"),
    authorId: rowString(row, "p_authorId"),
    publishedAt: rowDate(row, "p_publishedAt"),
    createdAt: rowDate(row, "p_createdAt"),
    updatedAt: rowDate(row, "p_updatedAt"),
  };
}

function mapPostWithRelations(row: Row): PostWithRelations {
  const category = mapCategory(row, "c_");
  const secondaryCategory = mapNullableCategory(row, "sc_");
  return {
    ...mapPost(row),
    category: { ...category, parent: mapNullableCategory(row, "cp_") },
    secondaryCategory: secondaryCategory
      ? {
          ...secondaryCategory,
          parent: mapNullableCategory(row, "scp_"),
        }
      : null,
    author: mapAuthor(row),
  };
}

function mapPostCard(row: Row): PostCardRecord {
  const secondaryName = rowNullableString(row, "sc_name");
  const secondarySlug = rowNullableString(row, "sc_slug");
  return {
    id: rowString(row, "p_id"),
    title: rowString(row, "p_title"),
    slug: rowString(row, "p_slug"),
    coverImage: rowNullableString(row, "p_coverImage"),
    excerpt: rowNullableString(row, "p_excerpt"),
    publishedAt: rowDate(row, "p_publishedAt"),
    createdAt: rowDate(row, "p_createdAt"),
    category: {
      name: rowString(row, "c_name"),
      slug: rowString(row, "c_slug"),
    },
    secondaryCategory:
      secondaryName && secondarySlug
        ? { name: secondaryName, slug: secondarySlug }
        : null,
    author: {
      name: rowString(row, "a_name"),
      slug: rowString(row, "a_slug"),
    },
  };
}

function placeholders(count: number) {
  return Array.from({ length: count }, () => "?").join(", ");
}

async function queryPostWithRelations(whereSql: string, args: InValue[]) {
  const result = await getDatabase().execute({
    sql: `
      SELECT ${POST_RELATION_COLUMNS}
      FROM "Post" p
      ${POST_RELATION_JOINS}
      WHERE ${whereSql}
      LIMIT 1
    `,
    args,
  });
  return result.rows[0] ? mapPostWithRelations(result.rows[0]) : null;
}

export async function listLatestPostCards(
  take: number,
  options: { featuredOnly?: boolean } = {},
) {
  const result = await getDatabase().execute({
    sql: `
      SELECT ${POST_CARD_COLUMNS}
      FROM "Post" p
      ${POST_CARD_JOINS}
      WHERE p."published" = 1
        ${options.featuredOnly ? 'AND p."featured" = 1' : ""}
      ORDER BY p."publishedAt" DESC
      LIMIT ?
    `,
    args: [take],
  });
  return result.rows.map(mapPostCard);
}

export async function listPostCardsByCategoryIds(ids: string[], take: number) {
  if (ids.length === 0) return [];
  const inClause = placeholders(ids.length);
  const result = await getDatabase().execute({
    sql: `
      SELECT ${POST_CARD_COLUMNS}
      FROM "Post" p
      ${POST_CARD_JOINS}
      WHERE p."published" = 1
        AND (
          p."categoryId" IN (${inClause})
          OR p."secondaryCategoryId" IN (${inClause})
        )
      ORDER BY p."publishedAt" DESC
      LIMIT ?
    `,
    args: [...ids, ...ids, take],
  });
  return result.rows.map(mapPostCard);
}

export async function listFeedPostRecords(take: number) {
  const result = await getDatabase().execute({
    sql: `
      SELECT ${POST_CARD_COLUMNS}, p."content" AS p_content
      FROM "Post" p
      ${POST_CARD_JOINS}
      WHERE p."published" = 1
      ORDER BY p."publishedAt" DESC
      LIMIT ?
    `,
    args: [take],
  });
  return result.rows.map((row) => ({
    ...mapPostCard(row),
    content: rowString(row, "p_content"),
  }));
}

export async function findPostBySlug(slug: string) {
  return queryPostWithRelations('p."slug" = ?', [slug]);
}

export async function findPostById(id: string) {
  return queryPostWithRelations('p."id" = ?', [id]);
}

export async function listAllPosts() {
  const result = await getDatabase().execute(`
    SELECT ${POST_RELATION_COLUMNS}
    FROM "Post" p
    ${POST_RELATION_JOINS}
    ORDER BY p."publishedAt" DESC
  `);
  return result.rows.map(mapPostWithRelations);
}

export async function findCategoryBySlug(slug: string) {
  const result = await getDatabase().execute({
    sql: `
      SELECT ${CATEGORY_COLUMNS},
        parent."id" AS parent_id,
        parent."name" AS parent_name,
        parent."slug" AS parent_slug,
        parent."parentId" AS parent_parentId,
        parent."order" AS parent_order,
        parent."createdAt" AS parent_createdAt
      FROM "Category" c
      LEFT JOIN "Category" parent ON parent."id" = c."parentId"
      WHERE c."slug" = ?
      LIMIT 1
    `,
    args: [slug],
  });
  if (!result.rows[0]) return null;
  return {
    ...mapCategory(result.rows[0]),
    parent: mapNullableCategory(result.rows[0], "parent_"),
  } satisfies CategoryWithParent;
}

export async function findCategoryById(id: string) {
  const result = await getDatabase().execute({
    sql: `SELECT ${CATEGORY_COLUMNS} FROM "Category" c WHERE c."id" = ? LIMIT 1`,
    args: [id],
  });
  return result.rows[0] ? mapCategory(result.rows[0]) : null;
}

export async function findAuthorBySlug(slug: string) {
  const result = await getDatabase().execute({
    sql: `
      SELECT "id", "name", "slug", "bio", "avatar", "createdAt"
      FROM "Author"
      WHERE "slug" = ?
      LIMIT 1
    `,
    args: [slug],
  });
  return result.rows[0] ? mapAuthor(result.rows[0], "") : null;
}

export async function listPostCardsByAuthorId(authorId: string, take: number) {
  const result = await getDatabase().execute({
    sql: `
      SELECT ${POST_CARD_COLUMNS}
      FROM "Post" p
      ${POST_CARD_JOINS}
      WHERE p."published" = 1 AND p."authorId" = ?
      ORDER BY p."publishedAt" DESC
      LIMIT ?
    `,
    args: [authorId, take],
  });
  return result.rows.map(mapPostCard);
}

export async function listChildCategories(parentId: string) {
  const result = await getDatabase().execute({
    sql: `
      SELECT ${CATEGORY_COLUMNS}
      FROM "Category" c
      WHERE c."parentId" = ?
      ORDER BY c."order" ASC
    `,
    args: [parentId],
  });
  return result.rows.map((row) => mapCategory(row));
}

export async function listCategorySlugs() {
  const result = await getDatabase().execute(
    `SELECT "slug" FROM "Category" ORDER BY "order" ASC`,
  );
  return result.rows.map((row) => rowString(row, "slug"));
}

export async function listRootCategoriesWithChildren() {
  const [parentResult, childResult] = await Promise.all([
    getDatabase().execute(`
      SELECT ${CATEGORY_COLUMNS}
      FROM "Category" c
      WHERE c."parentId" IS NULL
      ORDER BY c."order" ASC
    `),
    getDatabase().execute(`
      SELECT ${CATEGORY_COLUMNS}
      FROM "Category" c
      WHERE c."parentId" IS NOT NULL
      ORDER BY c."parentId" ASC, c."order" ASC
    `),
  ]);
  const childrenByParent = new Map<string, CategoryRecord[]>();
  for (const row of childResult.rows) {
    const child = mapCategory(row);
    if (!child.parentId) continue;
    const children = childrenByParent.get(child.parentId) ?? [];
    children.push(child);
    childrenByParent.set(child.parentId, children);
  }
  return parentResult.rows.map((row) => {
    const category = mapCategory(row);
    return {
      ...category,
      children: childrenByParent.get(category.id) ?? [],
    } satisfies CategoryWithChildren;
  });
}

export async function listFlatCategories() {
  const result = await getDatabase().execute(`
    SELECT ${CATEGORY_COLUMNS},
      parent."id" AS parent_id,
      parent."name" AS parent_name,
      parent."slug" AS parent_slug,
      parent."parentId" AS parent_parentId,
      parent."order" AS parent_order,
      parent."createdAt" AS parent_createdAt
    FROM "Category" c
    LEFT JOIN "Category" parent ON parent."id" = c."parentId"
    ORDER BY c."parentId" ASC, c."order" ASC
  `);
  return result.rows.map((row) => ({
    ...mapCategory(row),
    parent: mapNullableCategory(row, "parent_"),
  }));
}

export async function countExistingCategories(ids: string[]) {
  if (ids.length === 0) return 0;
  const result = await getDatabase().execute({
    sql: `SELECT COUNT(*) AS count FROM "Category" WHERE "id" IN (${placeholders(ids.length)})`,
    args: ids,
  });
  return result.rows[0] ? rowNumber(result.rows[0], "count") : 0;
}

async function upsertAuthor(name: string, slug: string) {
  const now = nowTimestamp();
  await getDatabase().execute({
    sql: `
      INSERT INTO "Author" (
        "id", "name", "slug", "bio", "avatar", "createdAt"
      ) VALUES (?, ?, ?, NULL, NULL, ?)
      ON CONFLICT("slug") DO NOTHING
    `,
    args: [randomUUID(), name, slug, now],
  });
  const result = await getDatabase().execute({
    sql: `
      SELECT "id", "name", "slug", "bio", "avatar", "createdAt"
      FROM "Author"
      WHERE "slug" = ?
      LIMIT 1
    `,
    args: [slug],
  });
  if (!result.rows[0]) throw new Error("Turso did not return the saved author.");
  return mapAuthor(result.rows[0], "");
}

export type CreatePostInput = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  categoryId: string;
  secondaryCategoryId: string | null;
  authorName: string;
  authorSlug: string;
  featured: boolean;
  published: boolean;
};

export async function createPost(input: CreatePostInput) {
  const author = await upsertAuthor(input.authorName, input.authorSlug);
  const now = nowTimestamp();
  const id = randomUUID();
  await getDatabase().execute({
    sql: `
      INSERT INTO "Post" (
        "id", "title", "slug", "excerpt", "content", "coverImage",
        "published", "featured", "views", "categoryId",
        "secondaryCategoryId", "authorId", "publishedAt", "createdAt", "updatedAt"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      input.title,
      input.slug,
      input.excerpt,
      input.content,
      input.coverImage,
      input.published,
      input.featured,
      input.categoryId,
      input.secondaryCategoryId,
      author.id,
      now,
      now,
      now,
    ],
  });
  const post = await findPostById(id);
  if (!post) throw new Error("Turso did not return the created post.");
  return post;
}

export type UpdatePostInput = {
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  categoryId: string;
  secondaryCategoryId: string | null;
  featured: boolean;
  published: boolean;
  authorName?: string;
  authorSlug?: string;
};

export async function updatePost(id: string, input: UpdatePostInput) {
  const author =
    input.authorName && input.authorSlug
      ? await upsertAuthor(input.authorName, input.authorSlug)
      : null;
  const result = await getDatabase().execute({
    sql: `
      UPDATE "Post"
      SET "title" = ?,
          "excerpt" = ?,
          "content" = ?,
          "coverImage" = ?,
          "categoryId" = ?,
          "secondaryCategoryId" = ?,
          "featured" = ?,
          "published" = ?,
          "authorId" = COALESCE(?, "authorId"),
          "updatedAt" = ?
      WHERE "id" = ?
    `,
    args: [
      input.title,
      input.excerpt,
      input.content,
      input.coverImage,
      input.categoryId,
      input.secondaryCategoryId,
      input.featured,
      input.published,
      author?.id ?? null,
      nowTimestamp(),
      id,
    ],
  });
  if (result.rowsAffected === 0) return null;
  return findPostById(id);
}

export async function deletePost(id: string) {
  const result = await getDatabase().execute({
    sql: `DELETE FROM "Post" WHERE "id" = ?`,
    args: [id],
  });
  return result.rowsAffected > 0;
}

export async function listPublishedPostSlugs() {
  const result = await getDatabase().execute(
    `SELECT "slug" FROM "Post" WHERE "published" = 1 ORDER BY "publishedAt" DESC`,
  );
  return result.rows.map((row) => rowString(row, "slug"));
}

export async function listSitemapPosts() {
  const result = await getDatabase().execute(`
    SELECT "slug", "updatedAt", "publishedAt", "coverImage"
    FROM "Post"
    WHERE "published" = 1
    ORDER BY "publishedAt" DESC
  `);
  return result.rows.map((row) => ({
    slug: rowString(row, "slug"),
    updatedAt: rowDate(row, "updatedAt"),
    publishedAt: rowDate(row, "publishedAt"),
    coverImage: rowNullableString(row, "coverImage"),
  }));
}

export async function listSitemapAuthors() {
  const result = await getDatabase().execute(`
    SELECT a."slug" AS slug, MAX(p."updatedAt") AS lastModified
    FROM "Author" a
    JOIN "Post" p ON p."authorId" = a."id" AND p."published" = 1
    GROUP BY a."id", a."slug"
    ORDER BY a."name" ASC
  `);
  return result.rows.map((row) => ({
    slug: rowString(row, "slug"),
    lastModified: rowDate(row, "lastModified"),
  }));
}

export async function listRecentNewsSitemapPosts(since: Date) {
  const result = await getDatabase().execute({
    sql: `
      SELECT "slug", "title", "publishedAt"
      FROM "Post"
      WHERE "published" = 1 AND "publishedAt" >= ?
      ORDER BY "publishedAt" DESC
      LIMIT 1000
    `,
    args: [since.getTime()],
  });
  return result.rows.map((row) => ({
    slug: rowString(row, "slug"),
    title: rowString(row, "title"),
    publishedAt: rowDate(row, "publishedAt"),
  }));
}

export async function listSitemapCategories() {
  const result = await getDatabase().execute(
    `SELECT "slug", "createdAt" FROM "Category" ORDER BY "order" ASC`,
  );
  return result.rows.map((row) => ({
    slug: rowString(row, "slug"),
    createdAt: rowDate(row, "createdAt"),
  }));
}

export async function listPostImagesForBackfill() {
  const result = await getDatabase().execute(
    `SELECT "id", "coverImage", "content" FROM "Post"`,
  );
  return result.rows.map((row) => ({
    id: rowString(row, "id"),
    coverImage: rowNullableString(row, "coverImage"),
    content: rowString(row, "content"),
  }));
}

export async function updatePostImages(
  id: string,
  coverImage: string | null,
  content: string,
) {
  await getDatabase().execute({
    sql: `
      UPDATE "Post"
      SET "coverImage" = ?, "content" = ?, "updatedAt" = ?
      WHERE "id" = ?
    `,
    args: [coverImage, content, nowTimestamp(), id],
  });
}
