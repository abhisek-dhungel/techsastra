import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import {
  DEFAULT_DESCRIPTION,
  SITE,
  absoluteUrl,
  breadcrumbJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "About TechSastra — Nepal's Tech Portal",
  description:
    "TechSastra is Nepal's modern tech portal for news, gadget prices, reviews, automobiles and startups — built for Nepali readers and buyers.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About TechSastra — Nepal's Tech Portal",
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl("/about"),
    type: "website",
  },
  keywords: [
    "about TechSastra",
    "best tech site of Nepal",
    "best tech portal of Nepal",
    "tech news Nepal",
    "best for price of tech in Nepal",
  ],
};

const FOCUS = [
  {
    title: "News",
    href: "/category/news",
    text: "Daily tech headlines and digital trends with Nepal context.",
  },
  {
    title: "Gadgets",
    href: "/category/gadgets",
    text: "Phones, laptops, cameras, TVs and accessories worth knowing.",
  },
  {
    title: "Prices",
    href: "/category/prices",
    text: "Mobile, laptop, camera and TV price clarity for Nepali buyers.",
  },
  {
    title: "Auto",
    href: "/category/auto",
    text: "Cars, bikes, scooters and EV updates that matter locally.",
  },
  {
    title: "Reviews",
    href: "/category/reviews",
    text: "Straightforward reviews and buying notes before you spend.",
  },
  {
    title: "Startups",
    href: "/category/events-startups",
    text: "Events, founders and the growing Nepal tech scene.",
  },
] as const;

const SOCIAL = [
  {
    href: "https://www.facebook.com/official.techsastra/",
    label: "Facebook",
  },
  {
    href: "https://www.instagram.com/tech.sastra",
    label: "Instagram",
  },
  {
    href: "https://www.youtube.com/@techsastra1",
    label: "YouTube",
  },
] as const;

export default function AboutPage() {
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "About", path: "/about" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "About TechSastra",
      url: absoluteUrl("/about"),
      description: DEFAULT_DESCRIPTION,
      mainEntity: { "@id": absoluteUrl("/#organization") },
    },
  ];

  return (
    <div className="about-page">
      <JsonLd data={jsonLd} />

      <section className="about-hero">
        <div className="container-ts">
          <div className="about-hero-panel">
            <nav aria-label="Breadcrumb" className="about-crumb">
              <Link href="/">Home</Link>
              <span aria-hidden>/</span>
              <span aria-current="page">About</span>
            </nav>

            <Image
              src="/logo.png"
              alt="TechSastra"
              width={200}
              height={28}
              className="about-hero-logo"
              priority
            />

            <h1 className="about-hero-title">
              Nepal&apos;s tech story,
              <span> told clearly.</span>
            </h1>
            <p className="about-hero-lead">
              TechSastra is a modern tech portal for Nepal — news, prices,
              gadgets, autos and reviews in one focused place.
            </p>

            <div className="about-hero-actions">
              <Link href="/" className="about-btn about-btn-primary">
                Explore latest
              </Link>
              <Link href="/category/prices" className="about-btn about-btn-ghost">
                Check prices
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-ts about-section">
        <div className="about-split">
          <div>
            <p className="about-kicker">Who we are</p>
            <h2 className="about-heading">Built for Nepali readers & buyers</h2>
          </div>
          <div className="about-prose">
            <p>
              We cover technology the way people in Nepal actually use it —
              what launched, what it costs, and whether it is worth your money.
            </p>
            <p>
              From smartphone price lists to auto launches and startup moments,
              TechSastra keeps the signal high and the noise low.
            </p>
          </div>
        </div>
      </section>

      <section className="container-ts about-section">
        <div className="about-section-head">
          <p className="about-kicker">What we cover</p>
          <h2 className="about-heading">One portal. Clear lanes.</h2>
        </div>
        <div className="about-focus-grid">
          {FOCUS.map((item) => (
            <Link key={item.href} href={item.href} className="about-focus-card">
              <span className="about-focus-title">{item.title}</span>
              <span className="about-focus-text">{item.text}</span>
              <span className="about-focus-go" aria-hidden>
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-ts about-section about-section-last">
        <div className="about-cta-panel">
          <div>
            <p className="about-kicker about-kicker-light">Follow along</p>
            <h2 className="about-cta-title">Stay close to Nepal tech</h2>
            <p className="about-cta-text">
              New stories, price updates and reviews — on the site and across
              our channels.
            </p>
          </div>
          <div className="about-cta-links">
            {SOCIAL.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="about-social-link"
              >
                {s.label}
              </a>
            ))}
            <a href={SITE.url} className="about-social-link">
              {SITE.url.replace(/^https?:\/\//, "")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
