import sanitizeHtml from "sanitize-html";

type Props = {
  content: string;
};

function looksLikeHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

function sanitizePostHtml(content: string) {
  const body = content.match(/<body(?:\s[^>]*)?>([\s\S]*?)<\/body\s*>/i)?.[1] ?? content;

  return sanitizeHtml(body, {
    allowedTags: [
      "p",
      "br",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "blockquote",
      "figure",
      "figcaption",
      "img",
      "picture",
      "source",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "caption",
      "pre",
      "code",
      "hr",
      "div",
      "span",
      "section",
      "time",
      "details",
      "summary",
      "sup",
      "sub",
      "mark",
    ],
    allowedAttributes: {
      "*": ["id"],
      a: ["href", "name", "target", "rel", "aria-label"],
      img: [
        "src",
        "srcset",
        "sizes",
        "alt",
        "title",
        "width",
        "height",
        "loading",
        "decoding",
      ],
      source: ["src", "srcset", "media", "sizes", "type", "width", "height"],
      table: ["aria-label"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
      time: ["datetime"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    disallowedTagsMode: "discard",
    nonTextTags: ["style", "script", "textarea", "option", "noscript"],
    transformTags: {
      h1: "h2",
      a: (tagName, attribs) => ({
        tagName,
        attribs:
          attribs.target === "_blank"
            ? { ...attribs, rel: "noopener noreferrer" }
            : attribs,
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          loading: attribs.loading || "lazy",
          decoding: attribs.decoding || "async",
        },
      }),
    },
  });
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
  if (looksLikeHtml(content)) {
    return (
      <div
        className="prose-ts"
        dangerouslySetInnerHTML={{ __html: sanitizePostHtml(content) }}
      />
    );
  }

  return <div className="prose-ts">{renderPlainBlocks(content)}</div>;
}
