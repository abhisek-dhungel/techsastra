import { notFound, permanentRedirect } from "next/navigation";
import { findCategoryBySlug, findPostBySlug } from "@/lib/database";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

const LEGACY_POST_REDIRECTS: Record<string, string> = {
  "pulsar-n125-launched-in-nepal": "pulsar-n125-nepal",
};

export default async function LegacyUrlPage({ params }: Props) {
  const { slug } = await params;
  const mappedPostSlug = LEGACY_POST_REDIRECTS[slug];
  if (mappedPostSlug) permanentRedirect(`/post/${mappedPostSlug}`);

  let destination: string | null = null;
  try {
    const [category, post] = await Promise.all([
      findCategoryBySlug(slug),
      findPostBySlug(slug),
    ]);
    if (category) destination = `/category/${category.slug}`;
    else if (post?.published) destination = `/post/${post.slug}`;
  } catch {
    notFound();
  }

  if (destination) permanentRedirect(destination);
  notFound();
}
