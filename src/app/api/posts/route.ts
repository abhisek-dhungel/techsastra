import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import slugify from "slugify";
import { Prisma } from "@prisma/client";
import { requireApiSession } from "@/lib/auth";
import { logDatabaseError } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  try {
    const posts = await prisma.post.findMany({
      include: {
        category: { include: { parent: true } },
        secondaryCategory: { include: { parent: true } },
        author: true,
      },
      orderBy: { publishedAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch (reason) {
    const details = logDatabaseError("list posts", reason);
    return NextResponse.json(
      { error: details.message, code: details.code },
      { status: details.status },
    );
  }
}

export async function POST(request: Request) {
  const { error } = await requireApiSession();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      categoryId,
      secondaryCategoryId,
      featured,
      published,
      slug: customSlug,
    } = body;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
    const coverImage =
      typeof body.coverImage === "string" ? body.coverImage.trim() : "";
    const authorLabel =
      typeof body.authorName === "string" && body.authorName.trim()
        ? body.authorName.trim()
        : "Abhisek Dhungel";

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: "Title, content, and primary category are required." },
        { status: 400 },
      );
    }

    if (title.length > 500) {
      return NextResponse.json(
        { error: "Title must be 500 characters or fewer." },
        { status: 400 },
      );
    }

    if (coverImage.length > 1000) {
      return NextResponse.json(
        { error: "Cover image URL must be 1000 characters or fewer." },
        { status: 400 },
      );
    }

    if (authorLabel.length > 191) {
      return NextResponse.json(
        { error: "Author name must be 191 characters or fewer." },
        { status: 400 },
      );
    }

    if (secondaryCategoryId && secondaryCategoryId === categoryId) {
      return NextResponse.json(
        { error: "Secondary category must be different from primary." },
        { status: 400 },
      );
    }

    const requestedCategoryIds = [
      String(categoryId),
      ...(secondaryCategoryId ? [String(secondaryCategoryId)] : []),
    ];
    const existingCategories = await prisma.category.findMany({
      where: { id: { in: requestedCategoryIds } },
      select: { id: true },
    });
    if (existingCategories.length !== new Set(requestedCategoryIds).size) {
      return NextResponse.json(
        { error: "A selected category no longer exists. Reload and try again." },
        { status: 400 },
      );
    }

    const generatedSlug = slugify(
      typeof customSlug === "string" && customSlug.trim() ? customSlug : title,
      { lower: true, strict: true, trim: true },
    );
    const baseSlug = (generatedSlug || `post-${Date.now()}`).slice(0, 470);
    const authorSlug =
      slugify(authorLabel, { lower: true, strict: true, trim: true }) || "author";

    let post = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
      try {
        post = await prisma.post.create({
          data: {
            title,
            slug,
            content,
            excerpt: excerpt || null,
            coverImage: coverImage || null,
            category: { connect: { id: String(categoryId) } },
            ...(secondaryCategoryId
              ? {
                  secondaryCategory: {
                    connect: { id: String(secondaryCategoryId) },
                  },
                }
              : {}),
            author: {
              connectOrCreate: {
                where: { slug: authorSlug },
                create: { name: authorLabel, slug: authorSlug },
              },
            },
            featured: Boolean(featured),
            published: published !== false,
          },
          include: {
            category: true,
            secondaryCategory: true,
            author: true,
          },
        });
        break;
      } catch (reason) {
        if (
          reason instanceof Prisma.PrismaClientKnownRequestError &&
          reason.code === "P2002"
        ) {
          continue;
        }
        throw reason;
      }
    }

    if (!post) {
      return NextResponse.json(
        { error: "Could not generate a unique post URL. Change the title and retry." },
        { status: 409 },
      );
    }

    revalidateTag("posts", "max");
    return NextResponse.json(post, { status: 201 });
  } catch (reason) {
    if (reason instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid post request." }, { status: 400 });
    }
    const details = logDatabaseError("create post", reason);
    return NextResponse.json(
      { error: details.message, code: details.code },
      { status: details.status },
    );
  }
}
