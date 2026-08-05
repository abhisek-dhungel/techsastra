import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PostCard } from "@/components/PostCard";
import { getPostsByCategorySlug } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  getCategorySeo,
} from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const categories = await prisma.category.findMany({
      select: { slug: true },
    });
    return categories.map((category) => ({ slug: category.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: { parent: true },
    });
    if (!category) {
      return { title: "Category", robots: { index: false, follow: false } };
    }

    const seo = getCategorySeo(category.slug, category.name);
    const url = absoluteUrl(`/category/${category.slug}`);

    return {
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      alternates: { canonical: url },
      openGraph: {
        title: seo.title,
        description: seo.description,
        url,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: seo.title,
        description: seo.description,
      },
    };
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const { category, posts } = await getPostsByCategorySlug(slug, 24);
  if (!category) notFound();

  let children: Awaited<ReturnType<typeof prisma.category.findMany>> = [];
  let parent: Awaited<ReturnType<typeof prisma.category.findUnique>> = null;
  try {
    children = await prisma.category.findMany({
      where: { parentId: category.id },
      orderBy: { order: "asc" },
    });
    parent = category.parentId
      ? await prisma.category.findUnique({ where: { id: category.parentId } })
      : null;
  } catch {
    // Build/offline: skip related category lookups
  }

  const seo = getCategorySeo(category.slug, category.name);

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    ...(parent
      ? [{ name: parent.name, path: `/category/${parent.slug}` }]
      : []),
    { name: category.name, path: `/category/${category.slug}` },
  ];

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seo.title,
    description: seo.description,
    url: absoluteUrl(`/category/${category.slug}`),
    isPartOf: { "@id": absoluteUrl("/#website") },
    about: category.name,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/post/${post.slug}`),
        name: post.title,
      })),
    },
  };

  return (
    <div className="container-ts py-8 md:py-10">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbItems), collectionJsonLd]} />

      {parent ? (
        <>
          <h1 className="sr-only">{category.name}</h1>
          <nav
            aria-label="Breadcrumb"
            className="mb-5 text-xs text-ts-muted"
          >
          <ol className="m-0 flex list-none flex-wrap gap-1 p-0">
            <li>
              <Link href="/">Home</Link>
              <span aria-hidden className="mx-1">
                /
              </span>
            </li>
            <li>
              <Link href={`/category/${parent.slug}`}>{parent.name}</Link>
              <span aria-hidden className="mx-1">
                /
              </span>
            </li>
            <li aria-current="page">{category.name}</li>
          </ol>
        </nav>
        </>
      ) : (
        <div className="glass mb-6 p-5 md:p-6">
          <h1 className="sr-only">{category.name}</h1>
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-ts-muted">
            <ol className="m-0 flex list-none flex-wrap gap-1 p-0">
              <li>
                <Link href="/">Home</Link>
                <span aria-hidden className="mx-1">
                  /
                </span>
              </li>
              <li aria-current="page">{category.name}</li>
            </ol>
          </nav>
          {children.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/category/${child.slug}`}
                  className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#333] transition hover:border-[rgba(184,214,0,0.55)] hover:text-[#7a9200]"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-ts-muted">No posts in this category yet.</p>
      ) : (
        <div
          className="latest-grid grid gap-5"
          style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        >
          {posts.map((post) => (
            <PostCard key={post.id} post={post} darkCard />
          ))}
        </div>
      )}
    </div>
  );
}
