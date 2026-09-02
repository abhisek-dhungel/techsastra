import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PostCard } from "@/components/PostCard";
import { getPostsByCategorySlug } from "@/lib/posts";
import {
  findCategoryById,
  findCategoryBySlug,
  listCategorySlugs,
  listChildCategories,
  type CategoryRecord,
} from "@/lib/database";
import {
  SITE,
  absoluteUrl,
  breadcrumbJsonLd,
  getCategorySeo,
  seoAlternates,
} from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

type CategoryGuide = {
  title: string;
  intro: string[];
  sections: Array<{
    title: string;
    paragraphs?: string[];
    items?: string[];
  }>;
  related: Array<{ href: string; label: string }>;
  faq?: Array<{ question: string; answer: string }>;
};

const CATEGORY_GUIDES: Record<string, CategoryGuide> = {
  prices: {
    title: "Find the right tech price in Nepal",
    intro: [
      "TechSastra brings Nepal-focused price coverage into one place so you can compare devices before visiting a shop or ordering online. Open a category below for model-specific price lists, specifications and availability notes.",
    ],
    sections: [
      {
        title: "What to compare before buying",
        items: [
          "Match the exact model number, storage and RAM variant.",
          "Check whether the listed amount is an official MRP, launch price or limited-time offer.",
          "Confirm the authorized distributor, VAT bill and Nepal warranty.",
          "Compare the update date because local prices and stock can change.",
        ],
      },
    ],
    related: [
      { href: "/category/mobile-phone-prices", label: "Mobile price in Nepal" },
      { href: "/category/laptop-prices", label: "Laptop price in Nepal" },
      { href: "/category/camera-prices", label: "Camera price in Nepal" },
      { href: "/category/tv-prices", label: "TV price in Nepal" },
    ],
  },
  "mobile-phone-prices": {
    title: "How to use our Nepal mobile price guides",
    intro: [
      "TechSastra's mobile price hub collects price-list articles and launch coverage for Nepali buyers. Use the latest articles above to compare models and storage variants, then check each article's update date and availability notes before deciding.",
      "नेपालमा मोबाइलको मूल्य खोज्दै हुनुहुन्छ? यहाँ नयाँ फोनको मूल्य, स्टोरेज भेरियन्ट, उपलब्धता र खरिदअघि जाँच गर्नुपर्ने मुख्य जानकारी पाउनुहोस्।",
    ],
    sections: [
      {
        title: "Compare the exact phone variant",
        paragraphs: [
          "A phone name alone is not enough for a useful comparison. RAM, storage, network support and warranty coverage can change the price substantially. Match the complete variant shown in the article with the box or product listing offered by the seller.",
        ],
      },
      {
        title: "Official MRP, launch price and shop price",
        paragraphs: [
          "Nepal phone prices can differ between an official launch announcement, a brand promotion and the price quoted by a retailer. TechSastra articles identify the available context where possible, but you should confirm the final amount, stock and offer terms with an authorized seller before payment.",
        ],
      },
      {
        title: "Before buying a mobile phone in Nepal",
        items: [
          "Ask for a VAT bill and written warranty details.",
          "Verify the exact RAM, storage, colour and model number.",
          "Check whether the device is an authorized Nepal unit.",
          "Compare bundled gifts separately from the phone's cash price.",
          "Review return, replacement and service-centre terms.",
          "Use the article's published or updated date when comparing prices.",
        ],
      },
    ],
    related: [
      { href: "/category/mobile-phones", label: "Mobile launches & news" },
      { href: "/category/reviews", label: "Tech reviews" },
      { href: "/category/deals", label: "Latest tech deals" },
      { href: "/category/laptop-prices", label: "Laptop price in Nepal" },
    ],
    faq: [
      {
        question: "Where can I check the latest mobile price in Nepal?",
        answer:
          "Use the latest price-list articles on this page. Open the relevant model or brand guide and check its update date, storage variant and Nepal availability notes.",
      },
      {
        question: "Why can the same phone have different prices in Nepal?",
        answer:
          "Prices vary by storage and RAM variant, authorized versus unofficial supply, seller promotions, bundled accessories and stock availability.",
      },
      {
        question: "Are listed phone prices always the final shop price?",
        answer:
          "Not always. A listed amount may be the official MRP or launch price, while retailers may offer temporary discounts. Confirm the final bill and warranty before buying.",
      },
      {
        question: "What should I verify before buying a phone in Nepal?",
        answer:
          "Verify the model and storage variant, authorized distributor, VAT bill, warranty coverage, device condition and the seller's replacement policy.",
      },
    ],
  },
};

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const slugs = await listCategorySlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await findCategoryBySlug(slug);
    if (!category) {
      return { title: "Category", robots: { index: false, follow: false } };
    }

    const seo = getCategorySeo(category.slug, category.name);
    const url = absoluteUrl(`/category/${category.slug}`);

    return {
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      alternates: seoAlternates(`/category/${category.slug}`),
      openGraph: {
        title: seo.title,
        description: seo.description,
        url,
        type: "website",
        siteName: SITE.name,
        locale: SITE.locale,
        images: [
          {
            url: SITE.defaultOgImage,
            width: 1200,
            height: 630,
            alt: `${seo.heading} on TechSastra`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: seo.title,
        description: seo.description,
        images: [SITE.defaultOgImage],
      },
    };
  } catch {
    return { title: "Category", robots: { index: false, follow: false } };
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const { category, posts } = await getPostsByCategorySlug(slug, 24);
  if (!category) notFound();

  let children: CategoryRecord[] = [];
  let parent: CategoryRecord | null = null;
  try {
    children = await listChildCategories(category.id);
    parent = category.parentId
      ? await findCategoryById(category.parentId)
      : null;
  } catch {
    // Build/offline: skip related category lookups
  }

  const seo = getCategorySeo(category.slug, category.name);
  const guide = CATEGORY_GUIDES[category.slug];
  const url = absoluteUrl(`/category/${category.slug}`);

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
    "@id": `${url}#collection`,
    name: seo.title,
    description: seo.description,
    url,
    inLanguage: "en-NP",
    isPartOf: { "@id": absoluteUrl("/#website") },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    publisher: { "@id": absoluteUrl("/#organization") },
    about: {
      "@type": "Thing",
      name: seo.heading,
    },
    mainEntity: {
      "@type": "ItemList",
      name: `Latest ${seo.heading} articles`,
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/post/${post.slug}`),
        name: post.title,
      })),
    },
  };

  return (
    <div className="category-page container-ts py-8 md:py-10">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbItems), collectionJsonLd]} />

      <header className="category-hero glass">
        <nav aria-label="Breadcrumb" className="category-breadcrumb">
          <ol className="m-0 flex list-none flex-wrap gap-1 p-0">
            <li>
              <Link href="/">Home</Link>
              <span aria-hidden className="mx-1">
                /
              </span>
            </li>
            {parent ? (
              <li>
                <Link href={`/category/${parent.slug}`}>{parent.name}</Link>
                <span aria-hidden className="mx-1">
                  /
                </span>
              </li>
            ) : null}
            <li aria-current="page">{category.name}</li>
          </ol>
        </nav>

        <p className="category-kicker">TechSastra · Nepal</p>
        <h1>{seo.heading}</h1>
        <p className="category-description">{seo.description}</p>

        {children.length > 0 ? (
          <nav className="category-child-links" aria-label={`${category.name} topics`}>
            {children.map((child) => (
              <Link key={child.id} href={`/category/${child.slug}`}>
                {getCategorySeo(child.slug, child.name).heading}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <section className="category-latest" aria-labelledby="category-latest-title">
        <div className="category-section-heading">
          <span>Fresh coverage</span>
          <h2 id="category-latest-title">
            {category.slug === "mobile-phone-prices"
              ? "Latest mobile price updates"
              : `Latest from ${seo.heading}`}
          </h2>
        </div>
        {posts.length === 0 ? (
          <p className="category-empty">
            New coverage is being prepared. Explore the related topics below in
            the meantime.
          </p>
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
      </section>

      {guide ? (
        <section className="category-guide" aria-labelledby="category-guide-title">
          <div className="category-guide-main">
            <span className="category-guide-kicker">Buyer&apos;s guide</span>
            <h2 id="category-guide-title">{guide.title}</h2>
            {guide.intro.map((paragraph) => (
              <p key={paragraph} lang={/[\u0900-\u097f]/.test(paragraph) ? "ne" : undefined}>
                {paragraph}
              </p>
            ))}

            {guide.sections.map((section) => (
              <section key={section.title}>
                <h3>{section.title}</h3>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.items ? (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <aside className="category-guide-links">
            <h2>Explore related Nepal tech guides</h2>
            {guide.related.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
                <span aria-hidden>→</span>
              </Link>
            ))}
          </aside>

          {guide.faq ? (
            <section className="category-faq" aria-labelledby="category-faq-title">
              <h2 id="category-faq-title">Mobile price in Nepal: FAQs</h2>
              <div>
                {guide.faq.map((item) => (
                  <details key={item.question}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
