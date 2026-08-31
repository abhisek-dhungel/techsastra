"use client";

import {
  ArrowUp,
  Check,
  Copy,
  ListTree,
  Minus,
  Plus,
  Share2,
  Type,
} from "lucide-react";
import { useEffect, useState } from "react";

type Heading = {
  id: string;
  label: string;
  level: 2 | 3;
};

type Props = {
  title: string;
};

function headingId(label: string, index: number) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 56);
  return slug || `section-${index + 1}`;
}

export function ArticleExperience({ title }: Props) {
  const [progress, setProgress] = useState(0);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeHeading, setActiveHeading] = useState("");
  const [copied, setCopied] = useState(false);
  const [fontStep, setFontStep] = useState(1);

  useEffect(() => {
    const article = document.getElementById("article-body");
    if (!article) return;
    const articleRoot = article;

    const nodes = Array.from(articleRoot.querySelectorAll<HTMLHeadingElement>("h2, h3"));
    const usedIds = new Set<string>();
    const discovered = nodes.map((node, index) => {
      const label = node.textContent?.trim() || `Section ${index + 1}`;
      const base = node.id || headingId(label, index);
      let id = base;
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `${base}-${suffix}`;
        suffix += 1;
      }
      usedIds.add(id);
      node.id = id;
      return {
        id,
        label,
        level: node.tagName === "H3" ? (3 as const) : (2 as const),
      };
    });
    // This state mirrors the live CMS-authored heading structure discovered in the DOM.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeadings(discovered);

    function updateProgress() {
      const rect = articleRoot.getBoundingClientRect();
      const viewport = window.innerHeight;
      const total = Math.max(1, rect.height - viewport * 0.45);
      const travelled = Math.min(total, Math.max(0, -rect.top + viewport * 0.2));
      setProgress((travelled / total) * 100);

      let current = "";
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= viewport * 0.3) current = node.id;
      }
      setActiveHeading(current);
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  useEffect(() => {
    const article = document.getElementById("article-body");
    if (!article) return;
    article.style.setProperty("--reader-scale", String([0.94, 1, 1.08][fontStep]));
  }, [fontStep]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const input = document.createElement("textarea");
      input.value = window.location.href;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareArticle() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
        return;
      }
      await copyLink();
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      await copyLink();
    }
  }

  function scrollToHeading(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div className="article-progress" aria-hidden>
        <span style={{ width: `${progress}%` }} />
      </div>

      <aside className="article-tools" aria-label="Article tools">
        <div className="article-tools-section">
          <div className="article-tools-title">
            <ListTree size={16} />
            <span>In this story</span>
          </div>
          {headings.length ? (
            <nav className="article-toc" aria-label="Table of contents">
              {headings.slice(0, 8).map((heading) => (
                <button
                  type="button"
                  key={heading.id}
                  className={`${heading.level === 3 ? "is-sub" : ""} ${
                    activeHeading === heading.id ? "active" : ""
                  }`}
                  onClick={() => scrollToHeading(heading.id)}
                >
                  {heading.label}
                </button>
              ))}
            </nav>
          ) : (
            <p className="article-tools-empty">A focused read, from start to finish.</p>
          )}
        </div>

        <div className="article-tools-section">
          <div className="article-tools-title">
            <Type size={16} />
            <span>Reading size</span>
          </div>
          <div className="article-font-controls" aria-label="Reading text size">
            <button
              type="button"
              onClick={() => setFontStep((step) => Math.max(0, step - 1))}
              disabled={fontStep === 0}
              aria-label="Decrease article text size"
            >
              <Minus size={15} />
            </button>
            <span>Aa</span>
            <button
              type="button"
              onClick={() => setFontStep((step) => Math.min(2, step + 1))}
              disabled={fontStep === 2}
              aria-label="Increase article text size"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        <div className="article-tools-section">
          <div className="article-tools-title">
            <Share2 size={16} />
            <span>Share story</span>
          </div>
          <div className="article-share-actions">
            <button type="button" onClick={shareArticle}>
              <Share2 size={15} />
              Share
            </button>
            <button type="button" onClick={copyLink}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>

        <button
          type="button"
          className="article-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp size={15} />
          Back to top
        </button>
      </aside>

      <div className="article-mobile-bar" aria-label="Article quick tools">
        <button type="button" onClick={shareArticle}>
          <Share2 size={17} />
          Share
        </button>
        <span>{Math.round(progress)}% read</span>
        <button type="button" onClick={copyLink}>
          {copied ? <Check size={17} /> : <Copy size={17} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </>
  );
}
