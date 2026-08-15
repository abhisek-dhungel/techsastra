"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  content: string;
};

const FRAME_MESSAGE = "techsastra:embedded-post-height";
const DEFAULT_HEIGHT = 640;
const MIN_HEIGHT = 384;
const MAX_HEIGHT = 20_000;

const resizeBridge = `<script>
(() => {
  const sendHeight = () => {
    const root = document.documentElement;
    const body = document.body;
    const height = Math.max(
      root ? root.scrollHeight : 0,
      root ? root.offsetHeight : 0,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0
    );
    window.parent.postMessage({ type: "${FRAME_MESSAGE}", height }, "*");
  };

  window.addEventListener("load", sendHeight);
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(sendHeight);
    if (document.documentElement) observer.observe(document.documentElement);
    if (document.body) observer.observe(document.body);
  }
  requestAnimationFrame(() => requestAnimationFrame(sendHeight));
  let attempts = 0;
  const startupTimer = window.setInterval(() => {
    sendHeight();
    attempts += 1;
    if (attempts >= 4) window.clearInterval(startupTimer);
  }, 250);
})();
</script>`;

function addResizeBridge(content: string) {
  // Appending avoids accidentally matching a literal "</body>" inside an
  // author's script or template string. Browsers place trailing document
  // content into the parsed body, including after an explicit </html> tag.
  return `${content}\n${resizeBridge}`;
}

export function EmbeddedPostContent({ content }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const document = useMemo(() => addResizeBridge(content), [content]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (
        !event.data ||
        typeof event.data !== "object" ||
        event.data.type !== FRAME_MESSAGE ||
        typeof event.data.height !== "number" ||
        !Number.isFinite(event.data.height)
      ) {
        return;
      }

      const nextHeight = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, Math.ceil(event.data.height)),
      );
      setHeight(nextHeight);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [content]);

  return (
    <iframe
      ref={frameRef}
      className="embedded-post-frame"
      title="Interactive post content"
      srcDoc={document}
      sandbox="allow-forms allow-modals allow-popups allow-scripts"
      referrerPolicy="no-referrer"
      style={{ height }}
    />
  );
}
