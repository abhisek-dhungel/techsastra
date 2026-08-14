"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { HOME_SECTION_SLUGS, NAV_CATEGORIES, navHref } from "@/lib/categories";
import { scrollToSectionId } from "@/lib/scroll";

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

function scrollToSection(slug: string) {
  if (!scrollToSectionId(slug)) return;
  window.history.replaceState(null, "", `/#${slug}`);
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash.replace(/^#/, ""));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  function onSectionNav(e: MouseEvent<HTMLAnchorElement>, slug: string) {
    if (!HOME_SECTION_SLUGS.has(slug)) return;
    if (pathname === "/") {
      e.preventDefault();
      scrollToSection(slug);
      setHash(slug);
      setOpen(false);
    }
  }

  return (
    <header className="site-header">
      <div className="container-ts">
        <div className="header-bar">
          <div className="header-bar-row">
            <a
              href="/"
              className="header-logo"
              aria-label="TechSastra home — refresh"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/";
              }}
            >
              <Image
                src="/logo.png"
                alt="TechSastra"
                width={140}
                height={19}
                priority
                className="h-4 w-auto md:h-[18px]"
              />
            </a>

            <nav className="desktop-nav header-nav" aria-label="Main">
              <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-0.5 p-0">
                {NAV_CATEGORIES.map((cat) => {
                  const href = navHref(cat.slug);
                  const active =
                    (HOME_SECTION_SLUGS.has(cat.slug) &&
                      pathname === "/" &&
                      hash === cat.slug) ||
                    (!HOME_SECTION_SLUGS.has(cat.slug) &&
                      pathname.startsWith(`/category/${cat.slug}`));
                  const hasChildren =
                    "children" in cat && !!cat.children?.length;
                  return (
                    <li key={cat.slug} className="nav-item relative">
                      <Link
                        href={href}
                        className={`nav-link ${active ? "active" : ""}`}
                        onClick={(e) => onSectionNav(e, cat.slug)}
                      >
                        {cat.name}
                        {hasChildren ? (
                          <span className="text-[0.6rem] opacity-70">+</span>
                        ) : null}
                      </Link>
                      {hasChildren ? (
                        <div className="dropdown-panel">
                          {cat.children!.map((child) => (
                            <Link
                              key={child.slug}
                              href={`/category/${child.slug}`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <div className="header-social-links">
                <a
                  href="https://www.facebook.com/official.techsastra/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="social-chip"
                >
                  <FacebookIcon />
                </a>
                <a
                  href="https://www.instagram.com/tech.sastra"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="social-chip"
                >
                  <InstagramIcon />
                </a>
                <a
                  href="https://www.youtube.com/@techsastra1"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="social-chip"
                >
                  <YoutubeIcon />
                </a>
              </div>
              <button
                type="button"
                className="mobile-nav menu-chip"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label="Toggle menu"
              >
                MENU
              </button>
            </div>
          </div>

          {open ? (
            <div className="mobile-nav mobile-menu">
              {NAV_CATEGORIES.map((cat) => {
                const hasChildren =
                  "children" in cat && !!cat.children?.length;
                const expanded = openGroup === cat.slug;
                return (
                  <div key={cat.slug} className="border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <Link
                        href={navHref(cat.slug)}
                        className="nav-link"
                        onClick={(e) => {
                          onSectionNav(e, cat.slug);
                          if (!HOME_SECTION_SLUGS.has(cat.slug)) {
                            setOpen(false);
                          }
                        }}
                      >
                        {cat.name}
                      </Link>
                      {hasChildren ? (
                        <button
                          type="button"
                          className="px-3 text-lg text-white/50"
                          onClick={() =>
                            setOpenGroup((g) =>
                              g === cat.slug ? null : cat.slug,
                            )
                          }
                          aria-label={`Expand ${cat.name}`}
                        >
                          {expanded ? "−" : "+"}
                        </button>
                      ) : null}
                    </div>
                    {hasChildren && expanded ? (
                      <div className="pb-2 pl-4">
                        {cat.children!.map((child) => (
                          <Link
                            key={child.slug}
                            href={`/category/${child.slug}`}
                            className="block py-2 text-xs font-bold uppercase tracking-wide text-white/70"
                            onClick={() => setOpen(false)}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
