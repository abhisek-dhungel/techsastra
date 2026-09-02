import Image from "next/image";
import Link from "next/link";
import { NAV_CATEGORIES, navHref } from "@/lib/categories";
import { SITE } from "@/lib/seo";

const SOCIAL_LINKS = [
  {
    href: "https://www.facebook.com/official.techsastra/",
    label: "Facebook",
    icon: FacebookIcon,
  },
  {
    href: "https://www.instagram.com/tech.sastra",
    label: "Instagram",
    icon: InstagramIcon,
  },
  {
    href: "https://www.youtube.com/@techsastra1",
    label: "YouTube",
    icon: YoutubeIcon,
  },
] as const;

function FacebookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.174 2.097 15.943 2 14.643 2 11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3.5A4.5 4.5 0 1112 16a4.5 4.5 0 010-9zm0 2A2.5 2.5 0 1014.5 12 2.5 2.5 0 0012 7.5zM17.5 6a1 1 0 110 2 1 1 0 010-2z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container-ts">
        <div className="site-footer-panel">
          <div className="site-footer-row">
            <Link href="/" className="footer-logo" aria-label="TechSastra home">
              <Image
                src="/logo.png"
                alt="TechSastra"
                width={160}
                height={22}
                className="footer-logo-img"
                priority
              />
            </Link>
            <div className="footer-social" aria-label="Social media">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="social-chip"
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>

          <p className="footer-tagline">
            Nepal&apos;s tech portal for news, gadgets, prices & reviews.
          </p>

          <nav className="footer-nav" aria-label="Footer">
            {NAV_CATEGORIES.map((c) => (
              <Link key={c.slug} href={navHref(c.slug)}>
                {c.name}
              </Link>
            ))}
            <Link href="/about">About</Link>
            <Link href="/editorial-policy">Editorial Policy</Link>
            <a href={`mailto:${SITE.email}`}>Contact</a>
          </nav>

          <div className="site-footer-meta">
            <span>
              © {new Date().getFullYear()} {SITE.name}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
