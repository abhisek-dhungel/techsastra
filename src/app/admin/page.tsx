"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatPostDate } from "@/lib/dates";

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent?: { name: string } | null;
};

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  published: boolean;
  featured: boolean;
  categoryId: string;
  secondaryCategoryId: string | null;
  category: { id: string; name: string; parentId: string | null };
  secondaryCategory?: {
    id: string;
    name: string;
    parentId: string | null;
  } | null;
  author: { name: string };
  publishedAt: string;
};

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(code ? `${message} (${code})` : message);
    this.name = "ApiError";
  }
}

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  const data = (await res.json().catch(() => null)) as
    | { error?: string; code?: string }
    | T
    | null;

  if (!res.ok) {
    const errorBody = data as { error?: string; code?: string } | null;
    throw new ApiError(
      errorBody?.error || `Request failed with status ${res.status}.`,
      res.status,
      errorBody?.code,
    );
  }

  if (data === null) {
    throw new ApiError("The server returned an empty response.", res.status);
  }

  return data as T;
}

async function uploadImage(file: File) {
  const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]);
  if (!allowedTypes.has(file.type)) {
    throw new ApiError("Only JPG, PNG, WEBP, and GIF images are allowed.", 400);
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new ApiError("Image must be 8MB or smaller.", 400);
  }

  const signed = await apiJson<{
    cloudName: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    signature: string;
  }>("/api/upload", {
    method: "POST",
  });

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signed.apiKey);
  body.append("timestamp", String(signed.timestamp));
  body.append("folder", signed.folder);
  body.append("signature", signed.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`,
    { method: "POST", body },
  );
  const result = (await response.json().catch(() => null)) as
    | { secure_url?: string; error?: { message?: string } }
    | null;
  if (!response.ok || !result?.secure_url) {
    throw new ApiError(
      result?.error?.message || "Cloudinary rejected the image upload.",
      response.status || 502,
      "CLOUDINARY_UPLOAD_FAILED",
    );
  }
  return result.secure_url;
}

export default function AdminPage() {
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineImageRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    parentCategoryId: "",
    subcategoryId: "",
    secondaryParentId: "",
    secondarySubcategoryId: "",
    authorName: "Abhisek Dhungel",
    featured: false,
    published: true,
  });

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  const subcategories = useMemo(
    () =>
      form.parentCategoryId
        ? categories.filter((c) => c.parentId === form.parentCategoryId)
        : [],
    [categories, form.parentCategoryId],
  );

  const secondarySubcategories = useMemo(
    () =>
      form.secondaryParentId
        ? categories.filter((c) => c.parentId === form.secondaryParentId)
        : [],
    [categories, form.secondaryParentId],
  );

  const selectedCategoryId = form.subcategoryId || form.parentCategoryId;
  const selectedSecondaryId =
    form.secondarySubcategoryId || form.secondaryParentId || "";

  async function load() {
    setLoading(true);
    try {
      const [me, cats, loadedPosts] = await Promise.all([
        apiJson<{ username?: string }>("/api/auth/me"),
        apiJson<Category[]>("/api/categories"),
        apiJson<Post[]>("/api/posts"),
      ]);

      setUsername(me.username ?? null);
      setCategories(cats);
      setPosts(loadedPosts);
      const firstParent = cats.find((c) => !c.parentId);
      if (!editingId && !form.parentCategoryId && firstParent) {
        setForm((f) => ({
          ...f,
          parentCategoryId: firstParent.id,
          subcategoryId: "",
        }));
      }
      if (cats.length === 0) {
        setError(
          "No categories exist in the database. Seed only a new empty database, or restore your category data.",
        );
      }
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setError(
        reason instanceof Error ? reason.message : "Failed to load the admin data.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm(keepParent = true) {
    const firstParent = categories.find((c) => !c.parentId);
    setForm({
      title: "",
      excerpt: "",
      content: "",
      coverImage: "",
      parentCategoryId: keepParent && firstParent ? firstParent.id : "",
      subcategoryId: "",
      secondaryParentId: "",
      secondarySubcategoryId: "",
      authorName: "Abhisek Dhungel",
      featured: false,
      published: true,
    });
    setEditingId(null);
  }

  function startEdit(post: Post) {
    const primaryParentId = post.category.parentId || post.category.id;
    const primarySubId = post.category.parentId ? post.category.id : "";
    const secondaryParentId = post.secondaryCategory
      ? post.secondaryCategory.parentId || post.secondaryCategory.id
      : "";
    const secondarySubId =
      post.secondaryCategory?.parentId ? post.secondaryCategory.id : "";

    setEditingId(post.id);
    setMessage(null);
    setError(null);
    setForm({
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content,
      coverImage: post.coverImage || "",
      parentCategoryId: primaryParentId,
      subcategoryId: primarySubId,
      secondaryParentId,
      secondarySubcategoryId: secondarySubId,
      authorName: post.author.name,
      featured: post.featured,
      published: post.published,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await apiJson<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Logout failed.");
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    // Initial client-side synchronization with the authenticated CMS APIs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function insertAtCursor(snippet: string) {
    const el = contentRef.current;
    if (!el) {
      setForm((f) => ({ ...f, content: `${f.content}${snippet}` }));
      return;
    }
    const start = el.selectionStart ?? form.content.length;
    const end = el.selectionEnd ?? start;
    const next =
      form.content.slice(0, start) + snippet + form.content.slice(end);
    setForm((f) => ({ ...f, content: next }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function insertSubheading(level: 2 | 3 = 2) {
    const tag = `h${level}`;
    const text =
      level === 2 ? "Your subheading here" : "Your section title here";
    insertAtCursor(`\n<${tag}>${text}</${tag}>\n<p></p>\n`);
  }

  async function onCoverSelected(file: File | null) {
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, coverImage: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cover upload failed");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function onInlineImageSelected(file: File | null) {
    if (!file) return;
    setUploadingInline(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      insertAtCursor(
        `\n<figure>\n  <img src="${url}" alt="Post image" />\n</figure>\n<p></p>\n`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingInline(false);
      if (inlineImageRef.current) inlineImageRef.current.value = "";
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedCategoryId) {
      setError("Please select a primary category.");
      return;
    }
    if (subcategories.length > 0 && !form.subcategoryId) {
      setError("Please select a primary subcategory.");
      return;
    }
    if (
      form.secondaryParentId &&
      secondarySubcategories.length > 0 &&
      !form.secondarySubcategoryId
    ) {
      setError("Please select a secondary subcategory, or clear secondary category.");
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage,
        authorName: form.authorName,
        featured: form.featured,
        published: form.published,
        categoryId: selectedCategoryId,
        secondaryCategoryId: selectedSecondaryId || null,
      };

      const data = await apiJson<Post>(
        editingId ? `/api/posts/${editingId}` : "/api/posts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      setMessage(editingId ? `Updated: ${data.title}` : `Published: ${data.title}`);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function removePost(id: string) {
    if (!confirm("Delete this post?")) return;
    setError(null);
    try {
      await apiJson<{ ok: boolean }>(`/api/posts/${id}`, { method: "DELETE" });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Delete failed.");
    }
  }

  return (
    <div className="container-ts relative py-8 md:py-10">
      <div className="glass relative z-[1] mb-6 flex flex-wrap items-end justify-between gap-4 p-5 md:p-6">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#7a9200]">
            CMS Dashboard
          </p>
          <h1 className="section-title m-0">
            {editingId ? (
              <>
                Edit <span>post</span>
              </>
            ) : (
              <>
                Publish a <span>post</span>
              </>
            )}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ts-muted">
            {editingId
              ? "Update the selected post, then save your changes."
              : "Upload cover and inline images, add mid-post subheadings, and optionally set a secondary category."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {username ? (
            <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs text-ts-muted">
              Signed in as <span className="text-[#141414]">{username}</span>
            </span>
          ) : null}
          <Link href="/" className="btn-ghost text-sm font-semibold">
            ← Back to site
          </Link>
          <button
            type="button"
            className="btn-ghost text-sm font-semibold"
            onClick={logout}
            disabled={loggingOut}
          >
            {loggingOut ? "Signing out…" : "Logout"}
          </button>
        </div>
      </div>

      <div className="relative z-[1] grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={onSubmit} className="glass space-y-4 p-5 md:p-6">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#555]">
              Title
            </span>
            <input
              className="admin-input"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="MacBook Air M5 Launched in Nepal..."
            />
          </label>

          <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#7a9200]">
              Primary category
            </p>
            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#555]">
                Category
              </span>
              <select
                className="admin-input"
                required
                value={form.parentCategoryId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    parentCategoryId: e.target.value,
                    subcategoryId: "",
                  }))
                }
              >
                <option value="" disabled>
                  Select category
                </option>
                {parentCategories.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>
            </label>

            {form.parentCategoryId ? (
              subcategories.length > 0 ? (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#555]">
                    Subcategory
                  </span>
                  <select
                    className="admin-input"
                    required
                    value={form.subcategoryId}
                    onChange={(e) =>
                      setForm({ ...form, subcategoryId: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Select subcategory
                    </option>
                    {subcategories.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="text-xs text-ts-muted">
                  No subcategory — saved under{" "}
                  <strong>
                    {
                      parentCategories.find((c) => c.id === form.parentCategoryId)
                        ?.name
                    }
                  </strong>
                  .
                </p>
              )
            ) : null}
          </div>

          <div className="rounded-2xl border border-dashed border-black/15 bg-white/40 p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[#555]">
              Secondary category{" "}
              <span className="font-semibold normal-case tracking-normal text-ts-muted">
                (optional)
              </span>
            </p>
            <p className="mb-3 text-xs text-ts-muted">
              Use this when a post also fits another section.
            </p>
            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#555]">
                Category
              </span>
              <select
                className="admin-input"
                value={form.secondaryParentId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    secondaryParentId: e.target.value,
                    secondarySubcategoryId: "",
                  }))
                }
              >
                <option value="">None</option>
                {parentCategories.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>
            </label>

            {form.secondaryParentId && secondarySubcategories.length > 0 ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#555]">
                  Subcategory
                </span>
                <select
                  className="admin-input"
                  value={form.secondarySubcategoryId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      secondarySubcategoryId: e.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Select subcategory
                  </option>
                  {secondarySubcategories.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#555]">
              Author
            </span>
            <input
              className="admin-input"
              value={form.authorName}
              onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            />
          </label>

          <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#555]">
              Cover image
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-ghost text-sm font-semibold"
                disabled={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
              >
                {uploadingCover ? "Uploading…" : "Upload cover"}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onCoverSelected(e.target.files?.[0] ?? null)}
              />
              {form.coverImage ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600"
                  onClick={() => setForm((f) => ({ ...f, coverImage: "" }))}
                >
                  Remove
                </button>
              ) : null}
            </div>
            {form.coverImage ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.coverImage}
                  alt="Cover preview"
                  className="max-h-48 w-full object-cover"
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-ts-muted">
                Upload a JPG, PNG, WEBP, or GIF (max 8MB).
              </p>
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#555]">
              Excerpt
            </span>
            <textarea
              className="admin-input min-h-[80px]"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </label>

          <div className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#555]">
              Content
            </span>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-ghost text-xs font-semibold"
                onClick={() => insertSubheading(2)}
              >
                + Subheading
              </button>
              <button
                type="button"
                className="btn-ghost text-xs font-semibold"
                onClick={() => insertSubheading(3)}
              >
                + Small heading
              </button>
              <button
                type="button"
                className="btn-ghost text-xs font-semibold"
                disabled={uploadingInline}
                onClick={() => inlineImageRef.current?.click()}
              >
                {uploadingInline ? "Uploading…" : "+ Insert image"}
              </button>
              <input
                ref={inlineImageRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) =>
                  onInlineImageSelected(e.target.files?.[0] ?? null)
                }
              />
            </div>
            <p className="mb-2 text-xs text-ts-muted">
              Paste plain text, article HTML, or a complete HTML document with
              CSS and JavaScript. Custom code is preserved exactly and runs in an
              isolated frame when the post is opened.
            </p>
            <textarea
              ref={contentRef}
              className="admin-input min-h-[260px] font-mono text-sm"
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={`<p>Intro paragraph...</p>\n<h2>Key specs</h2>\n<p>Details here...</p>\n<figure>\n  <img src="/uploads/example.jpg" alt="Product" />\n</figure>\n<p>More thoughts...</p>`}
            />
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-[#333]">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
              />
              Featured
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm({ ...form, published: e.target.checked })
                }
              />
              Published
            </label>
          </div>

          {message ? (
            <p className="rounded-xl border border-[rgba(216,255,0,0.3)] bg-[rgba(216,255,0,0.08)] px-3 py-2 text-sm font-semibold text-[#7a9200]">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? editingId
                  ? "Saving…"
                  : "Publishing…"
                : editingId
                  ? "Save changes"
                  : "Publish post"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="btn-ghost text-sm font-semibold"
                onClick={() => {
                  resetForm();
                  setMessage(null);
                  setError(null);
                }}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <aside className="glass p-5 md:p-6">
          <h2
            className="mb-4 text-lg font-bold tracking-tight text-[#141414]"
            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
          >
            Recent <span className="text-[#7a9200]">posts</span>
          </h2>
          {loading ? (
            <p className="text-sm text-ts-muted">Loading…</p>
          ) : (
            <ul className="m-0 list-none space-y-3 p-0">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="rounded-2xl border border-black/10 bg-white/70 p-3.5 text-sm"
                >
                  <div className="font-bold leading-snug text-[#141414]">
                    {post.title}
                  </div>
                  <div className="mt-1 text-xs text-ts-muted">
                    {formatPostDate(post.publishedAt)} · {post.category.name}
                    {post.secondaryCategory
                      ? ` · ${post.secondaryCategory.name}`
                      : ""}{" "}
                    · {post.author.name}
                    {post.featured ? " · Featured" : ""}
                    {!post.published ? " · Draft" : ""}
                    {editingId === post.id ? " · Editing" : ""}
                  </div>
                  <div className="mt-2.5 flex gap-3 text-xs font-semibold">
                    <button
                      type="button"
                      className="text-[#7a9200] hover:underline"
                      onClick={() => startEdit(post)}
                    >
                      Edit
                    </button>
                    <Link
                      href={`/post/${post.slug}`}
                      className="text-[#7a9200] hover:underline"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-500"
                      onClick={() => removePost(post.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
