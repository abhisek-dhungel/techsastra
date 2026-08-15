import sanitizeHtml from "sanitize-html";
import { EmbeddedPostContent } from "./EmbeddedPostContent";

type Props = {
  content: string;
};

const POST_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["class", "id", "style"],
    a: ["href", "name", "target", "rel"],
    img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
};

function looksLikeHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

/**
 * Rich documents need their own browsing context. React deliberately does not
 * execute scripts inserted with `dangerouslySetInnerHTML`, while sanitizing the
 * source removes the CSS and JavaScript that the author intentionally supplied.
 */
export function isEmbeddedPostContent(content: string) {
  return (
    /<!doctype\s+html/i.test(content) ||
    /<\/?(?:html|head|body|style|script|link|iframe|canvas|svg|form|input|button|select|textarea|video|audio)(?:\s|>)/i.test(
      content,
    ) ||
    /\son[a-z]+\s*=/i.test(content)
  );
}

function renderPlainBlocks(content: string) {
  const blocks = content.trim().split(/\n\n+/);
  return blocks.map((block, i) => {
    if (block.startsWith("## ")) {
      return <h2 key={i}>{block.replace(/^##\s+/, "")}</h2>;
    }
    if (block.startsWith("- ")) {
      const items = block.split("\n").filter((l) => l.startsWith("- "));
      return (
        <ul key={i}>
          {items.map((item, j) => (
            <li key={j}>{item.replace(/^- /, "")}</li>
          ))}
        </ul>
      );
    }
    return <p key={i}>{block}</p>;
  });
}

export function PostContent({ content }: Props) {
  if (looksLikeHtml(content) && isEmbeddedPostContent(content)) {
    return <EmbeddedPostContent content={content} />;
  }

  if (looksLikeHtml(content)) {
    const clean = sanitizeHtml(content, POST_HTML_OPTIONS);
    return (
      <div
        className="prose-ts"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  return <div className="prose-ts">{renderPlainBlocks(content)}</div>;
}
