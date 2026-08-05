import type { Metadata } from "next";
import Link from "next/link";
import { PostCard, NewsListItem } from "@/components/PostCard";
import { JsonLd } from "@/components/JsonLd";
import { SectionPostSlider, type SliderPost } from "@/components/SectionPostSlider";
import {
  getFeaturedPosts,
  getLatestPosts,
  getPostsByCategorySlug,
  type PostCardData,
} from "@/lib/posts";
import { HomeHashScroll } from "@/components/HomeHashScroll";
import {
  DEFAULT_DESCRIPTION,
  SITE,
  absoluteUrl,
} from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    absolute: `${SITE.name} — Best Tech Site of Nepal | News, Prices & Reviews`,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — Best Tech Portal of Nepal`,
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl("/"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Best Tech Site of Nepal`,
    description: DEFAULT_DESCRIPTION,
  },
};

const HOME_SECTIONS = [
  { slug: "gadgets", label: "Gadgets", dark: true, layout: "double" },
  { slug: "auto", label: "Auto", dark: false, layout: "double" },
  { slug: "prices", label: "Prices", dark: true, layout: "single" },
  { slug: "reviews", label: "Reviews", dark: false, layout: "single" },
  { slug: "events-startups", label: "Events/Startups", dark: true, layout: "single" },
  { slug: "deals", label: "Deals", dark: false, layout: "single" },
  { slug: "blogs", label: "Blogs", dark: true, layout: "single" },
] as const;

const SECTION_POST_LIMIT = 12;

function toSliderPosts(posts: PostCardData[]): SliderPost[] {
  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    coverImage: post.coverImage,
    authorName: post.author.name,
    categorySlug: post.category.slug,
    categoryName: post.category.name,
    secondaryCategory: post.secondaryCategory
      ? {
          slug: post.secondaryCategory.slug,
          name: post.secondaryCategory.name,
        }
      : null,
  }));
}

function CategorySection({
  label,
  slug,
  posts,
  dark,
  layout,
}: {
  label: string;
  slug: string;
  posts: PostCardData[];
  dark: boolean;
  layout: "double" | "single";
}) {
  const inner = (
    <>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="section-title m-0">
          New From <span>{label}</span>
        </h2>
        <Link href={`/category/${slug}`} className="view-all">
          View all
        </Link>
      </div>
      <SectionPostSlider
        posts={toSliderPosts(posts)}
        dark={dark}
        layout={layout}
      />
    </>
  );

  if (dark) {
    return (
      <section id={slug} className="dark-section home-section-anchor">
        <div className="container-ts relative z-[1]">{inner}</div>
      </section>
    );
  }

  return (
    <section id={slug} className="container-ts home-section-anchor py-10">
      {inner}
    </section>
  );
}

export default async function HomePage() {
  const [latest, featured, ...sectionResults] = await Promise.all([
    getLatestPosts(9),
    getFeaturedPosts(5),
    ...HOME_SECTIONS.map((section) =>
      getPostsByCategorySlug(section.slug, SECTION_POST_LIMIT),
    ),
  ]);

  const hero = featured[0];
  const heroRest = featured.slice(1, 5);
  const newsList = latest;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Latest tech stories from TechSastra",
    itemListElement: latest.slice(0, 10).map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/post/${post.slug}`),
      name: post.title,
    })),
  };

  return (
    <>
      <HomeHashScroll />
      <JsonLd data={itemListJsonLd} />

      <section className="container-ts py-6 md:py-10">
        <div
          className="home-grid grid gap-6"
          style={{ gridTemplateColumns: "minmax(240px, 0.9fr) minmax(0, 1.7fr)" }}
        >
          <aside id="news" className="glass home-section-anchor p-5 md:p-6">
            <h2 className="section-title">
              Tech <span>News</span>
            </h2>
            <div>
              {newsList.map((post) => (
                <NewsListItem key={post.id} post={post} />
              ))}
            </div>
          </aside>

          <div className="space-y-5">
            {hero ? <PostCard post={hero} size="lg" /> : null}
            <div
              className="featured-grid grid gap-5"
              style={{ gridTemplateColumns: "1fr 1fr" }}
            >
              {heroRest.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {HOME_SECTIONS.map((section, index) => {
        const result = sectionResults[index];
        return (
          <CategorySection
            key={section.slug}
            label={section.label}
            slug={section.slug}
            posts={result.posts}
            dark={section.dark}
            layout={section.layout}
          />
        );
      })}
    </>
  );
}
