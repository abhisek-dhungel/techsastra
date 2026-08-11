import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import slugify from "slugify";
import { Prisma } from "@prisma/client";
import { requireApiSession } from "@/lib/auth";
import { logDatabaseError } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.post.delete({ where: { id } });
    revalidateTag("posts", "max");
    return NextResponse.json({ ok: true });
  } catch (reason) {
    if (
      reason instanceof Prisma.PrismaClientKnownRequestError &&
      reason.code === "P2025"
    ) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    const details = logDatabaseError("delete post", reason);
    return NextResponse.json(
      { error: details.message, code: details.code },
      { status: details.status },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  try {
    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
    const coverImage =
      typeof body.coverImage === "string" ? body.coverImage.trim() : "";

    if (!title || !content || !body.categoryId) {
      return NextResponse.json(
        { error: "Title, content, and primary category are required." },
        { status: 400 },
      );
    }

    if (title.length > 500 || coverImage.length > 1000) {
      return NextResponse.json(
        { error: "Title or cover image URL is too long." },
        { status: 400 },
      );
    }

    if (body.secondaryCategoryId && body.secondaryCategoryId === body.categoryId) {
      return NextResponse.json(
        { error: "Secondary category must be different from primary." },
        { status: 400 },
      );
    }

    const requestedCategoryIds = [
      String(body.categoryId),
      ...(body.secondaryCategoryId ? [String(body.secondaryCategoryId)] : []),
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

    const authorLabel =
      typeof body.authorName === "string" && body.authorName.trim()
        ? body.authorName.trim()
        : null;
    const authorSlug = authorLabel
      ? slugify(authorLabel, { lower: true, strict: true, trim: true }) || "author"
      : null;

    if (authorLabel && authorLabel.length > 191) {
      return NextResponse.json(
        { error: "Author name must be 191 characters or fewer." },
        { status: 400 },
      );
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        category: { connect: { id: String(body.categoryId) } },
        secondaryCategory: body.secondaryCategoryId
          ? { connect: { id: String(body.secondaryCategoryId) } }
          : { disconnect: true },
        featured: Boolean(body.featured),
        published: body.published !== false,
        ...(authorLabel && authorSlug
          ? {
              author: {
                connectOrCreate: {
                  where: { slug: authorSlug },
                  create: { name: authorLabel, slug: authorSlug },
                },
              },
            }
          : {}),
      },
      include: {
        category: { include: { parent: true } },
        secondaryCategory: { include: { parent: true } },
        author: true,
      },
    });
    revalidateTag("posts", "max");
    return NextResponse.json(post);
  } catch (reason) {
    if (reason instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid post request." }, { status: 400 });
    }
    const details = logDatabaseError("update post", reason);
    return NextResponse.json(
      { error: details.message, code: details.code },
      { status: details.status },
    );
  }
}
