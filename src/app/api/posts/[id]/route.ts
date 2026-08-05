import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import slugify from "slugify";
import { requireApiSession } from "@/lib/auth";
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
  } catch {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  try {
    const body = await request.json();

    if (!body.title || !body.content || !body.categoryId) {
      return NextResponse.json(
        { error: "Title, content, and primary category are required." },
        { status: 400 },
      );
    }

    if (body.secondaryCategoryId && body.secondaryCategoryId === body.categoryId) {
      return NextResponse.json(
        { error: "Secondary category must be different from primary." },
        { status: 400 },
      );
    }

    let authorId: string | undefined;
    if (body.authorName) {
      const authorLabel = String(body.authorName).trim();
      const authorSlug = slugify(authorLabel, { lower: true, strict: true });
      const author = await prisma.author.upsert({
        where: { slug: authorSlug },
        update: {},
        create: { name: authorLabel, slug: authorSlug },
      });
      authorId = author.id;
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title: String(body.title).trim(),
        content: String(body.content).trim(),
        excerpt: body.excerpt?.trim() || null,
        coverImage: body.coverImage?.trim() || null,
        categoryId: body.categoryId,
        secondaryCategoryId: body.secondaryCategoryId || null,
        featured: Boolean(body.featured),
        published: body.published !== false,
        ...(authorId ? { authorId } : {}),
      },
      include: {
        category: { include: { parent: true } },
        secondaryCategory: { include: { parent: true } },
        author: true,
      },
    });
    revalidateTag("posts", "max");
    return NextResponse.json(post);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update post." }, { status: 400 });
  }
}
