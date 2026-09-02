import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PostCard } from "@/components/PostCard";
import { getAuthorPageData } from "@/lib/posts";
import {
  SITE,
  absoluteUrl,
  breadcrumbJsonLd,
  seoAlternates,
  truncate,
} from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 120;

function authorDescription(name: string, bio: string | null) {
  return truncate(
    bio?.trim() ||
      `${name} is a TechSastra author covering technology, gadgets, prices and developments relevant to readers in Nepal.`,
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { author } = await getAuthorPageData(slug, 1);
  if (!author) {
    return {
      title: "Author not found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${author.name} — Author`;
  const description = authorDescription(author.name, author.bio);
  const url = absoluteUrl(`/author/${author.slug}`);
  const image = author.avatar ? absoluteUrl(author.avatar) : absoluteUrl(SITE.defaultOgImage);

  return {
    title,
    description,
    alternates: seoAlternates(`/author/${author.slug}`),
    authors: [{ name: author.name, url }],
    openGraph: {
      type: "profile",
      title,
      description,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      images: [{ url: image, alt: author.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const { author, posts } = await getAuthorPageData(slug, 36);
  if (!author) notFound();

  const description = authorDescription(author.name, author.bio);
  const url = absoluteUrl(`/author/${author.slug}`);
  const initials = author.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profile`,
    url,
    name: `${author.name} — TechSastra Author`,
    description,
    inLanguage: "en-NP",
    isPartOf: { "@id": absoluteUrl("/#website") },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: {
      "@type": "Person",
      "@id": `${url}#person`,
      name: author.name,
      url,
      description,
      image: author.avatar ? absoluteUrl(author.avatar) : undefined,
      worksFor: { "@id": absoluteUrl("/#organization") },
    },
  };

  return (
    <div className="author-page container-ts">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: author.name, path: `/author/${author.slug}` },
          ]),
          profileJsonLd,
        ]}
      />

      <nav aria-label="Breadcrumb" className="author-breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden>/</span>
        <span aria-current="page">{author.name}</span>
      </nav>

      <header className="author-profile">
        {author.avatar ? (
          <Image
            src={author.avatar}
            alt={author.name}
            width={144}
            height={144}
            className="author-profile-image"
          />
        ) : (
          <div className="author-profile-placeholder" aria-hidden>
            {initials}
          </div>
        )}
        <div>
          <span>TechSastra author</span>
          <h1>{author.name}</h1>
          <p>{description}</p>
        </div>
      </header>

      <section className="author-stories" aria-labelledby="author-stories-title">
        <div className="category-section-heading">
          <span>Published work</span>
          <h2 id="author-stories-title">Latest stories by {author.name}</h2>
        </div>
        {posts.length ? (
          <div
            className="latest-grid grid gap-5"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            {posts.map((post) => (
              <PostCard key={post.id} post={post} darkCard showAuthor={false} />
            ))}
          </div>
        ) : (
          <p className="category-empty">No published stories yet.</p>
        )}
      </section>
    </div>
  );
}
