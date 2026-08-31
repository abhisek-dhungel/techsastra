"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Heading2,
  Heading3,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  PencilLine,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
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
  views: number;
};

type WorkspaceView = "dashboard" | "editor";
type PostFilter = "all" | "published" | "drafts" | "featured";

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
  const [workspaceView, setWorkspaceView] =
    useState<WorkspaceView>("dashboard");
  const [postFilter, setPostFilter] = useState<PostFilter>("all");
  const [query, setQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  const stats = useMemo(() => {
    const published = posts.filter((post) => post.published).length;
    const featured = posts.filter((post) => post.featured).length;
    const views = posts.reduce((total, post) => total + (post.views || 0), 0);
    return {
      total: posts.length,
      published,
      drafts: posts.length - published,
      featured,
      views,
    };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesFilter =
        postFilter === "all" ||
        (postFilter === "published" && post.published) ||
        (postFilter === "drafts" && !post.published) ||
        (postFilter === "featured" && post.featured);
      const matchesQuery =
        !normalizedQuery ||
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.category.name.toLowerCase().includes(normalizedQuery) ||
        post.author.name.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [postFilter, posts, query]);

  const editorWordCount = useMemo(
    () =>
      form.content
        .replace(/<[^>]+>/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length,
    [form.content],
  );

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
    setWorkspaceView("editor");
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function beginNewPost() {
    resetForm();
    setMessage(null);
    setError(null);
    setWorkspaceView("editor");
    setMobileNavOpen(false);
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
    const wasEditing = Boolean(editingId);
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
      setMessage(wasEditing ? `Updated: ${data.title}` : `Published: ${data.title}`);
      resetForm();
      await load();
      setWorkspaceView("dashboard");
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
    <div className="admin-shell">
      <button
        type="button"
        className="admin-mobile-menu"
        aria-label="Open dashboard menu"
        aria-expanded={mobileNavOpen}
        onClick={() => setMobileNavOpen((open) => !open)}
      >
        {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`admin-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <Link href="/" className="admin-brand" aria-label="TechSastra home">
          <Image src="/logo.png" alt="TechSastra" width={188} height={26} priority />
        </Link>
        <div className="admin-workspace-label">Editorial workspace</div>

        <nav className="admin-nav" aria-label="CMS navigation">
          <button
            type="button"
            className={workspaceView === "dashboard" ? "active" : ""}
            onClick={() => {
              setWorkspaceView("dashboard");
              setMobileNavOpen(false);
            }}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>
          <button
            type="button"
            className={workspaceView === "editor" ? "active" : ""}
            onClick={beginNewPost}
          >
            <PencilLine size={18} />
            New article
            <Plus size={15} className="admin-nav-tail" />
          </button>
          <button
            type="button"
            onClick={() => {
              setWorkspaceView("dashboard");
              setMobileNavOpen(false);
              requestAnimationFrame(() =>
                document.getElementById("content-library")?.scrollIntoView({
                  behavior: "smooth",
                }),
              );
            }}
          >
            <FileText size={18} />
            Content library
            <span className="admin-nav-count">{stats.total}</span>
          </button>
        </nav>

        <div className="admin-sidebar-spacer" />
        <div className="admin-sidebar-card">
          <Sparkles size={18} />
          <strong>TechSastra CMS</strong>
          <span>Built for fast, focused publishing.</span>
        </div>
        <Link href="/" className="admin-sidebar-link">
          <ArrowUpRight size={17} />
          View live site
        </Link>
        <button
          type="button"
          className="admin-sidebar-link"
          onClick={logout}
          disabled={loggingOut}
        >
          <LogOut size={17} />
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">
              {workspaceView === "dashboard" ? "Workspace" : "Story editor"}
            </p>
            <h1>
              {workspaceView === "dashboard"
                ? "Good to see you."
                : editingId
                  ? "Refine your story."
                  : "Create something worth reading."}
            </h1>
          </div>
          <div className="admin-profile">
            <div className="admin-avatar" aria-hidden>
              {(username || "A").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>{username || "Editor"}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {message ? (
          <div className="admin-notice is-success" role="status">
            <CheckCircle2 size={18} />
            <span>{message}</span>
            <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss message">
              <X size={16} />
            </button>
          </div>
        ) : null}
        {error ? (
          <div className="admin-notice is-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
              <X size={16} />
            </button>
          </div>
        ) : null}

        {workspaceView === "dashboard" ? (
          <>
            <section className="admin-welcome-panel">
              <div>
                <span className="admin-kicker">The newsroom, at a glance</span>
                <h2>Turn what&apos;s happening in tech into what Nepal reads next.</h2>
                <p>
                  Draft, publish and manage every TechSastra story from one focused workspace.
                </p>
              </div>
              <button type="button" className="admin-cta" onClick={beginNewPost}>
                <Plus size={18} />
                New article
              </button>
            </section>

            <section className="admin-stats" aria-label="Publishing overview">
              <div className="admin-stat-card is-accent">
                <span className="admin-stat-icon"><FileText size={19} /></span>
                <span>Total stories</span>
                <strong>{stats.total}</strong>
                <small>Across every category</small>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-icon"><CheckCircle2 size={19} /></span>
                <span>Published</span>
                <strong>{stats.published}</strong>
                <small>Live on TechSastra</small>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-icon"><Clock3 size={19} /></span>
                <span>Drafts</span>
                <strong>{stats.drafts}</strong>
                <small>Waiting for a final pass</small>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-icon"><Eye size={19} /></span>
                <span>Total views</span>
                <strong>{stats.views.toLocaleString()}</strong>
                <small>{stats.featured} featured stories</small>
              </div>
            </section>
          </>
        ) : null}

      <div
        className={`admin-workspace-grid ${workspaceView === "dashboard" ? "is-dashboard" : "is-editor"}`}
      >
        <form onSubmit={onSubmit} className="admin-editor-card space-y-4">
          <div className="admin-editor-heading">
            <div>
              <span>{editingId ? "Editing story" : "New story"}</span>
              <h2>{editingId ? "Update article" : "Compose article"}</h2>
            </div>
            <div className="admin-editor-meta">
              <span>{editorWordCount.toLocaleString()} words</span>
              <span>{Math.max(1, Math.ceil(editorWordCount / 225))} min read</span>
            </div>
          </div>
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
                className="admin-tool-button"
                disabled={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
              >
                <UploadCloud size={16} />
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
                className="admin-tool-button"
                onClick={() => insertSubheading(2)}
              >
                <Heading2 size={16} />
                Subheading
              </button>
              <button
                type="button"
                className="admin-tool-button"
                onClick={() => insertSubheading(3)}
              >
                <Heading3 size={16} />
                Small heading
              </button>
              <button
                type="button"
                className="admin-tool-button"
                disabled={uploadingInline}
                onClick={() => inlineImageRef.current?.click()}
              >
                <ImagePlus size={16} />
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
              Place the cursor where you want a subheading or image, then use the
              buttons. You can add multiple images throughout the article.
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

          <div className="admin-editor-actions">
            <button type="submit" className="admin-publish-button" disabled={saving}>
              <Send size={17} />
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
                className="admin-cancel-button"
                onClick={() => {
                  resetForm();
                  setMessage(null);
                  setError(null);
                  setWorkspaceView("dashboard");
                }}
              >
                <X size={16} />
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <aside id="content-library" className="admin-library-card">
          <div className="admin-library-head">
            <div>
              <span>Content library</span>
              <h2>Recent stories</h2>
            </div>
            <BarChart3 size={21} />
          </div>

          <div className="admin-library-tools">
            <label className="admin-search">
              <Search size={17} />
              <span className="sr-only">Search stories</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search stories…"
              />
            </label>
            <div className="admin-filter-row" aria-label="Filter stories">
              {(["all", "published", "drafts", "featured"] as PostFilter[]).map(
                (filter) => (
                  <button
                    type="button"
                    key={filter}
                    className={postFilter === filter ? "active" : ""}
                    onClick={() => setPostFilter(filter)}
                  >
                    {filter}
                  </button>
                ),
              )}
            </div>
          </div>

          {loading ? (
            <div className="admin-loading-state">
              <span />
              <span />
              <span />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="admin-empty-state">
              <FileText size={24} />
              <strong>No stories found</strong>
              <span>Try another search or clear the current filter.</span>
            </div>
          ) : (
            <ul className="admin-post-list">
              {filteredPosts.map((post) => (
                <li key={post.id} className={editingId === post.id ? "is-editing" : ""}>
                  <div className="admin-post-thumb">
                    {post.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.coverImage} alt="" />
                    ) : (
                      <ImagePlus size={20} />
                    )}
                  </div>
                  <div className="admin-post-copy">
                    <div className="admin-post-badges">
                      <span className={post.published ? "is-live" : "is-draft"}>
                        {post.published ? "Published" : "Draft"}
                      </span>
                      {post.featured ? (
                        <span className="is-featured"><Star size={11} /> Featured</span>
                      ) : null}
                      <span>{post.category.name}</span>
                    </div>
                    <strong>{post.title}</strong>
                    <div className="admin-post-meta">
                      <span>{formatPostDate(post.publishedAt)}</span>
                      <span>{post.author.name}</span>
                      <span><Eye size={13} /> {(post.views || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="admin-post-actions">
                    <button
                      type="button"
                      aria-label={`Edit ${post.title}`}
                      onClick={() => startEdit(post)}
                    >
                      <PencilLine size={16} />
                    </button>
                    <Link
                      href={`/post/${post.slug}`}
                      aria-label={`View ${post.title}`}
                    >
                      <ChevronRight size={17} />
                    </Link>
                    <button
                      type="button"
                      className="is-danger"
                      aria-label={`Delete ${post.title}`}
                      onClick={() => removePost(post.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
      </main>
    </div>
  );
}
