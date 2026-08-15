import { getFeedPosts } from "@/lib/posts";
import { SITE, absoluteUrl, seoDescriptionFromContent, stripHtml } from "@/lib/seo";

export const revalidate = 120;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRssDate(value: Date | string | null | undefined) {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime())
    ? new Date().toUTCString()
    : date.toUTCString();
}

export async function GET() {
  const posts = await getFeedPosts(30);
  const lastBuild = toRssDate(posts[0]?.publishedAt);

  const items = posts
    .map((post) => {
      const link = absoluteUrl(`/post/${post.slug}`);
      const description = seoDescriptionFromContent(
        post.excerpt,
        stripHtml(post.content),
      );
      const pubDate = toRssDate(post.publishedAt ?? post.createdAt);
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(post.category.name)}</category>
      <description>${escapeXml(description)}</description>
      ${post.coverImage ? `<enclosure url="${escapeXml(absoluteUrl(post.coverImage))}" type="image/jpeg" />` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${SITE.name} — Nepal Tech News`)}</title>
    <link>${escapeXml(SITE.url)}</link>
    <description>${escapeXml(SITE.tagline)}</description>
    <language>en-np</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}
