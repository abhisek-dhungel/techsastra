import { revalidatePath, revalidateTag } from "next/cache";

export function revalidatePublishing() {
  revalidateTag("posts", "max");
  // These routes query the database directly, so the posts tag alone is insufficient.
  revalidatePath("/sitemap.xml");
  revalidatePath("/news-sitemap.xml");
  revalidatePath("/feed.xml");
}
