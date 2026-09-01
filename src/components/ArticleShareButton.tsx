"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

type Props = {
  title: string;
};

export function ArticleShareButton({ title }: Props) {
  const [copied, setCopied] = useState(false);

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

  return (
    <button
      type="button"
      className="article-share-button"
      onClick={shareArticle}
      aria-label={copied ? "Article link copied" : "Share this article"}
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
