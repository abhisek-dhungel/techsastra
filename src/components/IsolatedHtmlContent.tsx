"use client";

import { useEffect, useMemo, useRef } from "react";

type Props = {
  html: string;
  title: string;
  className?: string;
};

const FRAGMENT_STYLES = `
:root {
  color-scheme: light;
  font-family: Arial, Helvetica, sans-serif;
  color: #202020;
  background: transparent;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: transparent; }
body {
  overflow-wrap: anywhere;
  font-family: Arial, Helvetica, sans-serif;
  font-size: calc(17px * var(--reader-scale, 1));
  line-height: 1.72;
  color: #202020;
}
p { margin: 0 0 1.35em; }
h1, h2, h3, h4, h5, h6 {
  margin: 1.8em 0 0.65em;
  color: #111;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.025em;
}
h1 { font-size: 2.25em; }
h2 { font-size: 1.65em; }
h3 { font-size: 1.3em; }
ul, ol { margin: 0 0 1.4em; padding-left: 1.35em; }
li { margin: 0.4em 0; }
a { color: #526400; text-decoration-thickness: 1px; text-underline-offset: 0.18em; }
img, video, iframe, table { max-width: 100%; }
img { height: auto; }
figure { margin: 1.8em 0; }
figcaption { margin-top: 0.65em; color: #6a6a6a; font-size: 0.78em; line-height: 1.45; }
blockquote {
  margin: 1.8em 0;
  padding: 0.2em 0 0.2em 1em;
  border-left: 4px solid #c7e000;
  font-size: 1.08em;
  font-weight: 650;
}
pre {
  max-width: 100%;
  overflow-x: auto;
  padding: 1em;
  border-radius: 10px;
  color: #f5f5f5;
  background: #151515;
}
code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
hr { margin: 2em 0; border: 0; border-top: 1px solid #deded8; }
`;

function isCompleteDocument(html: string) {
  return /^\s*(?:<!doctype\s+html[^>]*>\s*)?<html(?:\s|>)/i.test(html);
}

function createSourceDocument(html: string) {
  if (isCompleteDocument(html)) return html;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${FRAGMENT_STYLES}</style>
</head>
<body>${html}</body>
</html>`;
}

export function IsolatedHtmlContent({ html, title, className = "" }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const completeDocument = useMemo(() => isCompleteDocument(html), [html]);
  const sourceDocument = useMemo(() => createSourceDocument(html), [html]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let observer: ResizeObserver | undefined;
    let scaleObserver: MutationObserver | undefined;

    const syncReaderScale = () => {
      if (completeDocument) return;
      const document = frame.contentDocument;
      if (!document?.documentElement) return;
      const scale = getComputedStyle(frame)
        .getPropertyValue("--reader-scale")
        .trim();
      document.documentElement.style.setProperty("--reader-scale", scale || "1");
    };

    const resize = () => {
      const document = frame.contentDocument;
      if (!document?.documentElement || !document.body) return;

      const height = Math.max(
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        document.body.scrollHeight,
        document.body.offsetHeight,
        120,
      );
      frame.style.height = `${height}px`;

      observer?.disconnect();
      observer = new ResizeObserver(resize);
      observer.observe(document.documentElement);
      observer.observe(document.body);
      syncReaderScale();
    };

    const articleBody = frame.closest("#article-body");
    if (articleBody && !completeDocument) {
      scaleObserver = new MutationObserver(syncReaderScale);
      scaleObserver.observe(articleBody, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }

    frame.addEventListener("load", resize);
    if (frame.contentDocument?.readyState === "complete") resize();

    return () => {
      frame.removeEventListener("load", resize);
      observer?.disconnect();
      scaleObserver?.disconnect();
    };
  }, [completeDocument, sourceDocument]);

  return (
    <iframe
      ref={frameRef}
      className={`isolated-html-frame ${className}`.trim()}
      title={title}
      sandbox="allow-same-origin"
      srcDoc={sourceDocument}
    />
  );
}
