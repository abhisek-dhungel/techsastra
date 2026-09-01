"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

const DESKTOP_COLS = 3;
const DESKTOP_DOUBLE_VISIBLE = 6; // 3 × 2
const MOBILE_MQ = "(max-width: 560px)";

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
        <Link href={`/post/${post.slug}`} className="block overflow-hidden">
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
          <Link href={`/post/${post.slug}`}>{post.title}</Link>
        </h3>
      </div>
    </article>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return mobile;
}

function SlidingRow({
  posts,
  index,
  stepPx,
  trackRef,
}: {
  posts: SliderPost[];
  index: number;
  stepPx: number;
  trackRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="section-slider-viewport">
      <div
        ref={trackRef}
        className="section-slider-track section-slider-track-one"
        style={{ transform: `translate3d(-${index * stepPx}px, 0, 0)` }}
      >
        {posts.map((post) => (
          <SliderCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

function ArrowRow({
  showArrows,
  canPrev,
  canNext,
  onPrev,
  onNext,
  children,
}: {
  showArrows: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  children: ReactNode;
}) {
  return (
    <div className={`section-slider-row2${showArrows ? " has-arrows" : ""}`}>
      {showArrows ? (
        <button
          type="button"
          className="section-slider-arrow"
          aria-label="Previous post"
          disabled={!canPrev}
          onClick={onPrev}
        >
          <ChevronLeft />
        </button>
      ) : null}
      {children}
      {showArrows ? (
        <button
          type="button"
          className="section-slider-arrow"
          aria-label="Next post"
          disabled={!canNext}
          onClick={onNext}
        >
          <ChevronRight />
        </button>
      ) : null}
    </div>
  );
}

export function SectionPostSlider({
  posts,
  layout = "single",
}: Props) {
  const [index, setIndex] = useState(0);
  const [stepPx, setStepPx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isDouble = layout === "double" && !isMobile;

  const row2Posts = useMemo(() => posts.slice(DESKTOP_COLS), [posts]);

  const visibleCount = isMobile ? 1 : isDouble ? DESKTOP_DOUBLE_VISIBLE : DESKTOP_COLS;
  const maxIndex = Math.max(0, posts.length - visibleCount);
  const showArrows = posts.length > visibleCount;
  const canPrev = index > 0;
  const canNext = index < maxIndex;

  const onPrev = () => setIndex((i) => Math.max(0, i - 1));
  const onNext = () => setIndex((i) => Math.min(maxIndex, i + 1));

  useEffect(() => {
    // A changed collection or layout starts from its first visible card.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(0);
  }, [posts, isMobile, layout]);

  useEffect(() => {
    // Keep the current position valid when the number of visible cards changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const first = track.querySelector(
        ".section-slider-card",
      ) as HTMLElement | null;
      if (!first) return;
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap) || 16;
      setStepPx(first.getBoundingClientRect().width + gap);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [posts.length, isMobile, layout]);

  if (posts.length === 0) {
    return (
      <p className="text-sm text-ts-muted">No posts in this section yet.</p>
    );
  }

  /* Mobile or single-row sections: one scrolling row */
  if (!isDouble) {
    return (
      <div className={`section-slider ${isMobile ? "is-mobile" : "is-single"}`}>
        <ArrowRow
          showArrows={showArrows}
          canPrev={canPrev}
          canNext={canNext}
          onPrev={onPrev}
          onNext={onNext}
        >
          <SlidingRow
            posts={posts}
            index={index}
            stepPx={stepPx}
            trackRef={trackRef}
          />
        </ArrowRow>
      </div>
    );
  }

  /* Desktop Gadgets/Auto: 2 rows × 3 tiles */
  return (
    <div className="section-slider is-desktop is-double">
      <div className="section-slider-desktop-rows">
        <SlidingRow
          posts={posts}
          index={index}
          stepPx={stepPx}
          trackRef={trackRef}
        />
        {row2Posts.length > 0 ? (
          <ArrowRow
            showArrows={showArrows}
            canPrev={canPrev}
            canNext={canNext}
            onPrev={onPrev}
            onNext={onNext}
          >
            <SlidingRow
              posts={row2Posts}
              index={index}
              stepPx={stepPx}
            />
          </ArrowRow>
        ) : null}
      </div>
    </div>
  );
}
