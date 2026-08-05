type JsonLdObject = Record<string, unknown>;

export function JsonLd({
  data,
}: {
  data: JsonLdObject | JsonLdObject[] | null | undefined;
}) {
  const items = (Array.isArray(data) ? data : [data]).filter(
    (item): item is JsonLdObject =>
      !!item && typeof item === "object" && !Array.isArray(item) && "@context" in item,
  );

  if (items.length === 0) return null;

  // One script per object — array roots break some JSON-LD parsers
  // (e.g. r["@context"].toLowerCase on undefined).
  if (items.length === 1) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(items[0]) }}
      />
    );
  }

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
