import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import {
  SITE,
  absoluteUrl,
  breadcrumbJsonLd,
  seoAlternates,
} from "@/lib/seo";

const TITLE = "Editorial Policy — How We Work";
const DESCRIPTION =
  "Read TechSastra's editorial standards for sourcing, Nepal price information, reviews, corrections and commercial transparency.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: seoAlternates("/editorial-policy"),
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/editorial-policy"),
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    images: [SITE.defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [SITE.defaultOgImage],
  },
};

export default function EditorialPolicyPage() {
  const url = absoluteUrl("/editorial-policy");
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: TITLE,
    description: DESCRIPTION,
    inLanguage: "en-NP",
    isPartOf: { "@id": absoluteUrl("/#website") },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    about: { "@id": absoluteUrl("/#organization") },
  };

  return (
    <article className="policy-page container-ts">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Editorial Policy", path: "/editorial-policy" },
          ]),
          webPageJsonLd,
        ]}
      />

      <nav aria-label="Breadcrumb" className="author-breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden>/</span>
        <span aria-current="page">Editorial Policy</span>
      </nav>

      <header>
        <span>Trust & transparency</span>
        <h1>How TechSastra reports technology in Nepal</h1>
        <p>
          Our goal is to give Nepali readers clear, useful information about
          technology, prices and products. These standards guide how we publish
          and update that work.
        </p>
      </header>

      <div className="policy-content">
        <section>
          <h2>Sourcing and accuracy</h2>
          <p>
            We aim to verify launches, specifications, availability and quoted
            prices against primary sources such as manufacturers, authorized
            distributors and official announcements whenever those sources are
            available. Rumours, leaks and expected prices should be identified
            as unconfirmed rather than presented as established fact.
          </p>
        </section>

        <section>
          <h2>Price information for Nepal</h2>
          <p>
            A price is a snapshot, not a permanent guarantee. Articles should
            identify the relevant model and storage variant and provide a
            published or updated date. Retail discounts, stock, colours and
            bundles can vary, so readers should confirm the final price, VAT
            bill and warranty with the seller before purchase.
          </p>
        </section>

        <section>
          <h2>Reviews and buying advice</h2>
          <p>
            We distinguish hands-on experience from analysis based on announced
            specifications and third-party information. Recommendations should
            consider Nepal pricing, warranty, local availability and practical
            use—not specifications alone. Any material commercial relationship
            connected to a recommendation should be disclosed to readers.
          </p>
        </section>

        <section>
          <h2>Updates and corrections</h2>
          <p>
            Technology and prices change quickly. We update stories when new
            information materially changes what a reader needs to know. If you
            spot an error, email{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a> with the article
            URL and the correction. We will review the supporting information
            and correct verified errors.
          </p>
        </section>

        <section>
          <h2>Editorial independence</h2>
          <p>
            Advertising, sponsorships or access to a product should not decide
            an editorial conclusion. Sponsored material and affiliate
            relationships should be clearly labelled when present so readers
            can understand the context.
          </p>
        </section>
      </div>
    </article>
  );
}
