import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, CalendarDays, Clock3, Eye } from "lucide-react";
import { ArticleShareButton } from "@/components/ArticleShareButton";
import { JsonLd } from "@/components/JsonLd";
import { PostContent } from "@/components/PostContent";
import { formatPostDate } from "@/lib/dates";
import { getPostBySlug, getPostsByCategorySlug } from "@/lib/posts";
import {
  SITE,
  absoluteUrl,
  breadcrumbJsonLd,
  seoDescriptionFromContent,
  seoAlternates,
  stripHtml,
} from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

// Posts are published from the CMS after deployment, so every slug must be
// resolved against the live database instead of the build-time slug list.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.published) {
    return { title: "Post not found", robots: { index: false, follow: false } };
  }

  const description = seoDescriptionFromContent(post.excerpt, post.content);
  const url = absoluteUrl(`/post/${post.slug}`);
  const image = post.coverImage ? absoluteUrl(post.coverImage) : null;
  const socialImage = image ?? absoluteUrl(SITE.defaultOgImage);
  const authorUrl = absoluteUrl(`/author/${post.author.slug}`);
  const keywords = [
    post.title,
    post.category.name,
    post.secondaryCategory?.name,
    "tech Nepal",
    "TechSastra",
    "Nepal tech news",
  ].filter(Boolean) as string[];

  return {
    title: post.title,
    description,
    keywords,
    authors: [{ name: post.author.name, url: authorUrl }],
    creator: post.author.name,
    publisher: SITE.name,
    alternates: seoAlternates(`/post/${post.slug}`),
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      publishedTime: (post.publishedAt ?? post.createdAt).toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author.name],
      section: post.category.name,
      tags: keywords,
      images: [{ url: socialImage, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [socialImage],
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.published) notFound();

  const description = seoDescriptionFromContent(post.excerpt, post.content);
  const url = absoluteUrl(`/post/${post.slug}`);
  const image = post.coverImage ? absoluteUrl(post.coverImage) : null;
  const socialImage = image ?? absoluteUrl(SITE.defaultOgImage);
  const authorUrl = absoluteUrl(`/author/${post.author.slug}`);
  const published = (post.publishedAt ?? post.createdAt).toISOString();
  const wordCount = stripHtml(post.content).split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 225));
  const relatedResult = await getPostsByCategorySlug(post.category.slug, 6);
  const relatedPosts = relatedResult.posts
    .filter((relatedPost) => relatedPost.id !== post.id)
    .slice(0, 3);

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: post.category.name, path: `/category/${post.category.slug}` },
    { name: post.title, path: `/post/${post.slug}` },
  ];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${url}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
    },
    headline: post.title,
    description,
    image: [socialImage],
    thumbnailUrl: socialImage,
    datePublished: published,
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      "@id": `${authorUrl}#person`,
      name: post.author.name,
      url: authorUrl,
    },
    publisher: { "@id": absoluteUrl("/#organization") },
    isPartOf: { "@id": absoluteUrl("/#website") },
    articleSection: post.category.name,
    keywords: [
      post.category.name,
      post.secondaryCategory?.name,
      "Nepal",
      "tech",
    ]
      .filter(Boolean)
      .join(", "),
    inLanguage: "en-NP",
    isAccessibleForFree: true,
    wordCount,
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: post.title,
    description,
    inLanguage: "en-NP",
    isPartOf: { "@id": absoluteUrl("/#website") },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: socialImage,
    },
    mainEntity: { "@id": `${url}#article` },
  };

  return (
    <article className="article-page" itemScope itemType="https://schema.org/NewsArticle">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbItems), webPageJsonLd, articleJsonLd]} />
      <meta itemProp="dateModified" content={post.updatedAt.toISOString()} />

      <header className="article-hero">
        <div className="article-container">
          <nav aria-label="Breadcrumb" className="article-breadcrumb">
            <ol>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/category/${post.category.slug}`}>
                  {post.category.name}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page">Story</li>
            </ol>
          </nav>

          <div className="article-category-row">
            <Link href={`/category/${post.category.slug}`}>
              {post.category.name}
            </Link>
            {post.secondaryCategory ? (
              <Link href={`/category/${post.secondaryCategory.slug}`}>
                {post.secondaryCategory.name}
              </Link>
            ) : null}
          </div>

          <h1 itemProp="headline">{post.title}</h1>

          {post.excerpt ? (
            <p className="article-dek" itemProp="description">
              {post.excerpt}
            </p>
          ) : null}

          <div className="article-byline-row">
            <div className="article-author-avatar" aria-hidden>
              {post.author.name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="article-author-copy">
              <span>Written by</span>
              <strong itemProp="author" itemScope itemType="https://schema.org/Person">
                <Link href={`/author/${post.author.slug}`} itemProp="url">
                  <span itemProp="name">{post.author.name}</span>
                </Link>
              </strong>
            </div>
            <div className="article-meta-list">
              <ArticleShareButton title={post.title} />
              <span>
                <CalendarDays size={15} />
                <time dateTime={published} itemProp="datePublished">
                  {formatPostDate(post.publishedAt)}
                </time>
              </span>
              <span>
                <Clock3 size={15} />
                {readingMinutes} min read
              </span>
              <span>
                <Eye size={15} />
                {post.views.toLocaleString()} views
              </span>
            </div>
          </div>
        </div>
      </header>

      {post.coverImage ? (
        <div className="article-container article-cover-wrap">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={1600}
            height={1000}
            className="article-cover"
            sizes="(max-width: 760px) 100vw, (max-width: 1280px) 92vw, 1180px"
            quality={82}
            preload
            itemProp="image"
          />
          <div className="article-cover-caption">
            <span>Featured story</span>
            <span>TechSastra · Nepal</span>
          </div>
        </div>
      ) : null}

      <div className="article-reading-grid">
        <div className="article-copy-column">
          <div id="article-body" className="article-body" itemProp="articleBody">
            <PostContent content={post.content} />
          </div>
        </div>

      </div>

      {relatedPosts.length ? (
        <section className="article-related" aria-labelledby="related-stories-title">
          <div className="article-container">
            <div className="article-related-head">
              <div>
                <span>Continue exploring</span>
                <h2 id="related-stories-title">More from {post.category.name}</h2>
              </div>
              <Link href={`/category/${post.category.slug}`}>
                View all
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="article-related-grid">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/post/${relatedPost.slug}`}
                  className="article-related-card"
                >
                  <div className="article-related-image">
                    {relatedPost.coverImage ? (
                      <Image
                        src={relatedPost.coverImage}
                        alt=""
                        width={720}
                        height={450}
                        sizes="(max-width: 720px) 100vw, 33vw"
                      />
                    ) : (
                      <span>TS</span>
                    )}
                  </div>
                  <div className="article-related-copy">
                    <span>{relatedPost.category.name}</span>
                    <h3>{relatedPost.title}</h3>
                    <small>
                      {formatPostDate(relatedPost.publishedAt)} · {relatedPost.author.name}
                    </small>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
