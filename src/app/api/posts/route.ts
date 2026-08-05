import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import slugify from "slugify";
import { requireApiSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  const posts = await prisma.post.findMany({
    include: {
      category: { include: { parent: true } },
      secondaryCategory: { include: { parent: true } },
      author: true,
    },
    orderBy: { publishedAt: "desc" },
  });
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const { error } = await requireApiSession();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      coverImage,
      categoryId,
      secondaryCategoryId,
      authorName,
      featured,
      published,
      slug: customSlug,
    } = body;

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: "Title, content, and primary category are required." },
        { status: 400 },
      );
    }

    if (secondaryCategoryId && secondaryCategoryId === categoryId) {
      return NextResponse.json(
        { error: "Secondary category must be different from primary." },
        { status: 400 },
      );
    }

    const baseSlug =
      customSlug?.trim() ||
      slugify(title, { lower: true, strict: true, trim: true });

    let slug = baseSlug;
    let i = 1;
    while (await prisma.post.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    const authorLabel = (authorName || "Abhisek Dhungel").trim();
    const authorSlug = slugify(authorLabel, { lower: true, strict: true });
    const author = await prisma.author.upsert({
      where: { slug: authorSlug },
      update: {},
      create: { name: authorLabel, slug: authorSlug },
    });

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        slug,
        content: content.trim(),
        excerpt: excerpt?.trim() || null,
        coverImage: coverImage?.trim() || null,
        categoryId,
        secondaryCategoryId: secondaryCategoryId || null,
        authorId: author.id,
        featured: Boolean(featured),
        published: published !== false,
      },
      include: {
        category: true,
        secondaryCategory: true,
        author: true,
      },
    });

    revalidateTag("posts", "max");
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
  }
}
