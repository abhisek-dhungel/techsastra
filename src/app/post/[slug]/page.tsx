import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PostContent } from "@/components/PostContent";
import { formatPostDate } from "@/lib/dates";
import { categoryLabel, getPostBySlug } from "@/lib/posts";
import {
  SITE,
  absoluteUrl,
  breadcrumbJsonLd,
  seoDescriptionFromContent,
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
  const image = post.coverImage
    ? absoluteUrl(post.coverImage)
    : absoluteUrl(SITE.defaultOgImage);
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
    authors: [{ name: post.author.name }],
    creator: post.author.name,
    publisher: SITE.name,
    alternates: { canonical: url },
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
      images: [
        {
          url: image,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.published) notFound();

  const description = seoDescriptionFromContent(post.excerpt, post.content);
  const url = absoluteUrl(`/post/${post.slug}`);
  const image = post.coverImage
    ? absoluteUrl(post.coverImage)
    : absoluteUrl(SITE.defaultOgImage);
  const published = (post.publishedAt ?? post.createdAt).toISOString();

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: post.category.name, path: `/category/${post.category.slug}` },
    { name: post.title, path: `/post/${post.slug}` },
  ];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: post.title,
    description,
    image: [image],
    datePublished: published,
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: SITE.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(SITE.defaultOgImage),
      },
    },
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
    wordCount: stripHtml(post.content).split(/\s+/).filter(Boolean).length,
  };

  return (
    <article className="container-ts py-8 md:py-10" itemScope itemType="https://schema.org/NewsArticle">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbItems), articleJsonLd]} />
      <div className="glass max-w-3xl p-5 md:p-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-ts-muted">
          <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0">
            <li>
              <Link href="/">Home</Link>
              <span aria-hidden className="mx-1">
                /
              </span>
            </li>
            <li>
              <Link href={`/category/${post.category.slug}`}>
                {post.category.name}
              </Link>
              <span aria-hidden className="mx-1">
                /
              </span>
            </li>
            <li className="line-clamp-1" aria-current="page">
              {post.title}
            </li>
          </ol>
        </nav>

        <div className="mb-3 flex flex-wrap gap-2">
          <Link
            href={`/category/${post.category.slug}`}
            className="cat-label mb-0"
          >
            {categoryLabel(post)}
          </Link>
          {post.secondaryCategory ? (
            <Link
              href={`/category/${post.secondaryCategory.slug}`}
              className="cat-label mb-0"
            >
              {post.secondaryCategory.name}
            </Link>
          ) : null}
        </div>
        <h1
          className="m-0 text-[1.9rem] leading-tight tracking-tight md:text-[2.35rem]"
          style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 700 }}
          itemProp="headline"
        >
          {post.title}
        </h1>
        <p className="author-meta mt-3 text-sm">
          By{" "}
          <span itemProp="author" itemScope itemType="https://schema.org/Person">
            <span itemProp="name">{post.author.name}</span>
          </span>{" "}
          ·{" "}
          <time
            dateTime={published}
            itemProp="datePublished"
          >
            {formatPostDate(post.publishedAt)}
          </time>
        </p>
        <meta itemProp="dateModified" content={post.updatedAt.toISOString()} />

        {post.coverImage ? (
          <div className="mt-6 overflow-hidden rounded-2xl">
            <Image
              src={post.coverImage}
              alt={post.title}
              width={1200}
              height={675}
              className="w-full object-cover"
              sizes="(max-width: 900px) 100vw, 720px"
              quality={75}
              priority
              itemProp="image"
            />
          </div>
        ) : null}

        {post.excerpt ? (
          <p className="mt-6 text-lg leading-relaxed text-[#444]" itemProp="description">
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-6" itemProp="articleBody">
          <PostContent content={post.content} />
        </div>
      </div>
    </article>
  );
}
