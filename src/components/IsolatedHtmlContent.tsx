"use client";

import { useEffect, useMemo, useRef } from "react";

type Props = {
  html: string;
  title: string;
  className?: string;
};

const CONTENT_BOUNDARY_STYLES = `
html body img {
  min-width: 0 !important;
  max-width: 100% !important;
  height: auto !important;
}
html body picture,
html body figure { max-width: 100%; }
`;

type Color = { channels: number[]; alpha: number };

function parseColor(value: string): Color | null {
  const match = value.match(/^rgba?\(([^)]+)\)$/);
  if (!match) return null;
  const values = match[1].split(/[,\s/]+/).map(Number);
  return { channels: values.slice(0, 3), alpha: values[3] ?? 1 };
}

function luminance(color: Color) {
  const channels = color.channels.map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function isNeutral(color: Color) {
  return Math.max(...color.channels) - Math.min(...color.channels) <= 30;
}

// Compute changes from the authored light palette before changing any styles.
// Accent surfaces (and their dark labels), photos, and colored text stay intact.
function applyDarkPalette(content: Document) {
  const view = content.defaultView;
  if (!view) return () => {};
  const surface = "rgb(18, 20, 16)";
  const backgrounds = new Map<Element, { color: Color; image: boolean }>();
  const changes: { element: HTMLElement; property: string; value: string }[] = [];
  const add = (element: HTMLElement, property: string, value: string) => {
    changes.push({ element, property, value });
  };

  content.querySelectorAll<HTMLElement>("html, body, body *").forEach((element) => {
    if (element.namespaceURI !== "http://www.w3.org/1999/xhtml" ||
      element.matches("img, picture, video, canvas, script, style, link")) return;
    const style = view.getComputedStyle(element);
    const inherited = backgrounds.get(element.parentElement!) ?? {
      color: parseColor(surface)!, image: false,
    };
    let background = parseColor(style.backgroundColor);
    let image = style.backgroundImage !== "none";
    const gradientColors = style.backgroundImage.match(/rgba?\([^)]+\)/g)?.map(parseColor);
    const neutralGradient = image && !style.backgroundImage.includes("url(") &&
      gradientColors?.length && gradientColors.every((color) => color && isNeutral(color)) &&
      gradientColors.some((color) => color && luminance(color) > 0.15);
    if (neutralGradient) {
      add(element, "background-image", "none");
      add(element, "background-color", surface);
      background = parseColor(surface);
      image = false;
    } else if (background && background.alpha > 0 && isNeutral(background) && luminance(background) > 0.15) {
      add(element, "background-color", surface);
      background = parseColor(surface);
    }
    if (element === content.documentElement && (!background || background.alpha === 0)) {
      add(element, "background-color", surface);
      background = parseColor(surface);
    }
    const effective = background && background.alpha > 0
      ? { color: { channels: background.channels.map((value, i) =>
          value * background.alpha + inherited.color.channels[i] * (1 - background.alpha)), alpha: 1 }, image }
      : { color: inherited.color, image: image || inherited.image };
    backgrounds.set(element, effective);

    const foreground = parseColor(style.color);
    let textColor = style.color;
    if (foreground && isNeutral(foreground) && !effective.image) {
      const light = luminance(foreground);
      const backdrop = luminance(effective.color);
      const contrast = (Math.max(light, backdrop) + 0.05) / (Math.min(light, backdrop) + 0.05);
      if (contrast < 4.5) textColor = backdrop < 0.3 ? "#d5d9ce" : "#202020";
    }
    // Pin authored colors so inherited changes cannot wash out an accent label.
    add(element, "color", textColor);
    for (const side of ["top", "right", "bottom", "left"]) {
      const property = `border-${side}-color`;
      const border = parseColor(style.getPropertyValue(property));
      if (border && border.alpha > 0 && isNeutral(border) && luminance(border) > 0.3) {
        add(element, property, "#3b4134");
      }
    }
  });
  add(content.documentElement, "color-scheme", "dark");
  const originals = changes.map(({ element, property }) => ({
    element, property, value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  }));
  changes.forEach(({ element, property, value }) => element.style.setProperty(property, value, "important"));
  return () => originals.forEach(({ element, property, value, priority }) => {
    if (value) element.style.setProperty(property, value, priority);
    else element.style.removeProperty(property);
  });
}

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
${CONTENT_BOUNDARY_STYLES}
`;

function isCompleteDocument(html: string) {
  return /^\s*(?:<!doctype\s+html[^>]*>\s*)?<html(?:\s|>)/i.test(html);
}

function addContentBoundaryStyles(html: string) {
  const style = `<style data-content-boundaries>${CONTENT_BOUNDARY_STYLES}</style>`;

  if (/<\/head\s*>/i.test(html)) {
    return html.replace(/<\/head\s*>/i, (closingHead) => `${style}\n${closingHead}`);
  }

  if (/<body(?:\s|>)/i.test(html)) {
    return html.replace(/<body(?:\s[^>]*)?>/i, (openingBody) => `${style}\n${openingBody}`);
  }

  return html.replace(/<html(?:\s[^>]*)?>/i, (openingHtml) => `${openingHtml}\n${style}`);
}

function createSourceDocument(html: string) {
  if (isCompleteDocument(html)) return addContentBoundaryStyles(html);

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
    let themedDocument: Document | null = null;
    let appliedTheme: string | undefined;
    let restorePalette: (() => void) | undefined;
    const syncTheme = () => {
      const contentDocument = frame.contentDocument;
      if (!contentDocument?.documentElement || !contentDocument.body) return;
      const theme = document.documentElement.dataset.theme || "light";
      if (themedDocument === contentDocument && appliedTheme === theme) return;
      restorePalette?.();
      restorePalette = undefined;
      if (theme === "dark") restorePalette = applyDarkPalette(contentDocument);
      contentDocument.documentElement.dataset.theme = theme;
      themedDocument = contentDocument;
      appliedTheme = theme;
    };
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

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

      document.querySelectorAll("img").forEach((image) => {
        image.style.setProperty("min-width", "0", "important");
        image.style.setProperty("max-width", "100%", "important");
        image.style.setProperty("height", "auto", "important");
      });

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
      syncTheme();
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
      themeObserver.disconnect();
      restorePalette?.();
    };
  }, [completeDocument, sourceDocument]);

  return (
    <iframe
      ref={frameRef}
      className={`isolated-html-frame ${completeDocument ? "complete-html-document" : ""} ${className}`.trim()}
      title={title}
      sandbox="allow-same-origin"
      srcDoc={sourceDocument}
    />
  );
}
