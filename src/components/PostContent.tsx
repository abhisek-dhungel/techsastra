import sanitizeHtml from "sanitize-html";

type Props = {
  content: string;
};

const POST_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ["href", "name", "target", "rel"],
    img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
};

function looksLikeHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
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
