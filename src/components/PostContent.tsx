type Props = {
  content: string;
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

export async function PostContent({ content }: Props) {
  if (looksLikeHtml(content)) {
    // Load sanitizer only when HTML is present (avoids cost on plain posts)
    const DOMPurify = (await import("isomorphic-dompurify")).default;
    const clean = DOMPurify.sanitize(content, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["target", "rel"],
    });
    return (
      <div
        className="prose-ts"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  return <div className="prose-ts">{renderPlainBlocks(content)}</div>;
}
