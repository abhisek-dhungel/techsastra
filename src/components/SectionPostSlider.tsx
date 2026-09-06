"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export type SliderPost = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  categorySlug: string;
  categoryName: string;
  secondaryCategory: { slug: string; name: string } | null;
};

type Props = {
  posts: SliderPost[];
  /** double = 2 rows (Gadgets/Auto). single = 1 scrolling row. */
  layout?: "double" | "single";
};

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SliderCard({ post }: { post: SliderPost }) {
  return (
    <article className="glass-card section-slider-card">
      {post.coverImage ? (
        <Link href={`/${post.slug}`} className="block overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={640}
            height={400}
            sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 28vw"
            quality={70}
            loading="lazy"
            className="card-image"
          />
        </Link>
      ) : null}
      <div className="p-3.5 md:p-4">
        <div className="mb-1 flex flex-wrap gap-1.5">
          <Link href={`/category/${post.categorySlug}`} className="cat-label">
            {post.categoryName}
          </Link>
          {post.secondaryCategory ? (
            <Link
              href={`/category/${post.secondaryCategory.slug}`}
              className="cat-label"
            >
              {post.secondaryCategory.name}
            </Link>
          ) : null}
        </div>
        <h3 className="post-title m-0 text-[1.12rem]">
          <Link href={`/${post.slug}`}>{post.title}</Link>
        </h3>
      </div>
    </article>
  );
}

export function SectionPostSlider({ posts, layout = "single" }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewportId = useId();
  const [edges, setEdges] = useState({ prev: false, next: false });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const sync = () => {
      setEdges({
        prev: viewport.scrollLeft > 1,
        next: viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1,
      });
    };
    viewport.scrollLeft = 0;
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(viewport);
    viewport.addEventListener("scroll", sync, { passive: true });
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", sync);
    };
  }, [posts, layout]);

  function move(direction: number) {
    const viewport = viewportRef.current;
    const card = viewport?.querySelector<HTMLElement>(".section-slider-card");
    if (!viewport || !card) return;
    const gap = parseFloat(getComputedStyle(viewport).columnGap) || 0;
    viewport.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  if (posts.length === 0) {
    return <p className="text-sm text-ts-muted">No posts in this section yet.</p>;
  }

  return (
    <div className={`section-slider is-${layout}`}>
      <button
        type="button"
        className="section-slider-arrow"
        aria-label="Previous posts"
        aria-controls={viewportId}
        disabled={!edges.prev}
        onClick={() => move(-1)}
      >
        <ChevronLeft />
      </button>
      <div
        ref={viewportRef}
        id={viewportId}
        className="section-slider-viewport"
        tabIndex={0}
        role="region"
        aria-label="Post cards"
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        {posts.map((post) => <SliderCard key={post.id} post={post} />)}
      </div>
      <button
        type="button"
        className="section-slider-arrow"
        aria-label="Next posts"
        aria-controls={viewportId}
        disabled={!edges.next}
        onClick={() => move(1)}
      >
        <ChevronRight />
      </button>
    </div>
  );
}
