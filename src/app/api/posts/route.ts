import { NextResponse } from "next/server";
import { revalidatePublishing } from "@/lib/revalidate-publishing";
import slugify from "slugify";
import { requireApiSession } from "@/lib/auth";
import {
  isUniqueDatabaseError,
  logDatabaseError,
} from "@/lib/database-errors";
import {
  countExistingCategories,
  findCategoryBySlug,
  createPost as insertPost,
  listAllPosts,
} from "@/lib/database";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  try {
    const posts = await listAllPosts();
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
    const customSlugValue =
      typeof customSlug === "string" ? customSlug.trim() : "";
    const hasCustomSlug = Boolean(customSlugValue);

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
    const coverImage =
      typeof body.coverImage === "string" ? body.coverImage.trim() : "";
    const authorLabel =
      typeof body.authorName === "string" && body.authorName.trim()
        ? body.authorName.trim()
        : "Abhisek Dhungel";

    if (!title || !content.trim() || !categoryId) {
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
    const existingCategoryCount = await countExistingCategories(
      requestedCategoryIds,
    );
    if (existingCategoryCount !== new Set(requestedCategoryIds).size) {
      return NextResponse.json(
        { error: "A selected category no longer exists. Reload and try again." },
        { status: 400 },
      );
    }

    const generatedSlug = slugify(
      hasCustomSlug ? customSlugValue : title,
      { lower: true, strict: true, trim: true },
    );
    if (hasCustomSlug && !generatedSlug) {
      return NextResponse.json(
        { error: "Post link must contain at least one letter or number." },
        { status: 400 },
      );
    }
    if (hasCustomSlug && generatedSlug.length > 470) {
      return NextResponse.json(
        { error: "Post link must be 470 characters or fewer." },
        { status: 400 },
      );
    }
    const baseSlug = (generatedSlug || `post-${Date.now()}`).slice(0, 470);
    // Root post URLs must not shadow application pages or legacy category URLs.
    const reservedSlugs = new Set([
      "about", "editorial-policy", "admin", "api", "author", "category", "post",
      "icons", "pulsar-n125-launched-in-nepal",
    ]);
    if (reservedSlugs.has(baseSlug) || await findCategoryBySlug(baseSlug)) {
      return NextResponse.json(
        { error: "That post link is reserved for a site page. Choose a different ending." },
        { status: 409 },
      );
    }
    const authorSlug =
      slugify(authorLabel, { lower: true, strict: true, trim: true }) || "author";

    let post = null;
    const maxAttempts = hasCustomSlug ? 1 : 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
      try {
        post = await insertPost({
          title,
          slug,
          content,
          excerpt: excerpt || null,
          coverImage: coverImage || null,
          categoryId: String(categoryId),
          secondaryCategoryId: secondaryCategoryId
            ? String(secondaryCategoryId)
            : null,
          authorName: authorLabel,
          authorSlug,
          featured: Boolean(featured),
          published: published !== false,
        });
        break;
      } catch (reason) {
        if (isUniqueDatabaseError(reason)) {
          if (hasCustomSlug) {
            return NextResponse.json(
              {
                error:
                  "That post link is already in use. Choose a different ending.",
              },
              { status: 409 },
            );
          }
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

    revalidatePublishing();
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
