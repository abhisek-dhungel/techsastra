import Image from "next/image";
import Link from "next/link";
import type { PostCardData } from "@/lib/posts";
import { categoryLabel } from "@/lib/posts";

type Props = {
  post: PostCardData;
  size?: "sm" | "md" | "lg";
  showAuthor?: boolean;
  darkCard?: boolean;
};

export function PostCard({
  post,
  size = "md",
  showAuthor = true,
}: Props) {
  const titleClass =
    size === "lg"
      ? "text-[1.25rem] md:text-[1.5rem]"
      : size === "sm"
        ? "text-[1.05rem]"
        : "text-[1.12rem]";

  return (
    <article className="glass-card">
      {post.coverImage ? (
        <Link href={`/${post.slug}`} className="block overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={size === "lg" ? 900 : 640}
            height={size === "lg" ? 560 : 400}
            sizes={
              size === "lg"
                ? "(max-width: 900px) 100vw, 55vw"
                : "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 28vw"
            }
            quality={70}
            priority={size === "lg"}
            loading={size === "lg" ? "eager" : "lazy"}
            className="card-image"
          />
        </Link>
      ) : null}
      <div className="p-3.5 md:p-4">
        <div className="mb-1 flex flex-wrap gap-1.5">
          <Link href={`/category/${post.category.slug}`} className="cat-label">
            {categoryLabel(post)}
          </Link>
          {post.secondaryCategory ? (
            <Link
              href={`/category/${post.secondaryCategory.slug}`}
              className="cat-label"
            >
              {post.secondaryCategory.name}
            </Link>
          ) : null}
        </div>
        <h3 className={`post-title m-0 ${titleClass}`}>
          <Link href={`/${post.slug}`}>{post.title}</Link>
        </h3>
        {showAuthor ? (
          <p className="author-meta">
            By <Link href={`/author/${post.author.slug}`}>{post.author.name}</Link>
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function NewsListItem({ post }: { post: PostCardData }) {
  return (
    <div className="news-list-item">
      <h3 className="post-title m-0 text-[1.05rem] md:text-[1.12rem]">
        <Link href={`/${post.slug}`}>{post.title}</Link>
      </h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Link href={`/category/${post.category.slug}`} className="cat-label">
          {categoryLabel(post)}
        </Link>
        {post.secondaryCategory ? (
          <Link
            href={`/category/${post.secondaryCategory.slug}`}
            className="cat-label"
          >
            {post.secondaryCategory.name}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
