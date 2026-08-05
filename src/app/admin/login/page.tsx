"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-strong relative mx-auto w-full max-w-md overflow-hidden p-7 md:p-9">
      <div
        className="orb"
        style={{
          width: 180,
          height: 180,
          top: -60,
          right: -40,
          background: "rgba(216,255,0,0.45)",
        }}
      />
      <div
        className="orb"
        style={{
          width: 140,
          height: 140,
          bottom: -50,
          left: -30,
          background: "rgba(216,255,0,0.2)",
          animationDelay: "1.5s",
        }}
      />

      <div className="relative z-[1] mb-7 text-center">
        <Link href="/" className="inline-flex justify-center">
          <span className="inline-flex rounded-xl bg-black px-4 py-2.5">
            <Image
              src="/logo.png"
              alt="TechSastra"
              width={190}
              height={26}
              className="h-7 w-auto"
              priority
            />
          </span>
        </Link>
        <h1
          className="mt-6 text-3xl font-bold tracking-tight text-[#141414]"
          style={{ fontFamily: "var(--font-outfit), sans-serif" }}
        >
          Admin <span className="text-[#7a9200]">Login</span>
        </h1>
        <p className="mt-2 text-sm text-ts-muted">
          Sign in to publish and manage TechSastra posts.
        </p>
      </div>

      <form onSubmit={onSubmit} className="relative z-[1] space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#555]">
            Username
          </span>
          <input
            className="admin-input"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#555]">
            Password
          </span>
          <input
            className="admin-input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="relative z-[1] mt-6 text-center text-xs text-ts-muted">
        <Link href="/" className="hover:text-[#7a9200]">
          ← Back to site
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="relative min-h-[75vh] overflow-hidden py-14 md:py-20">
      <div
        className="orb"
        style={{
          width: 280,
          height: 280,
          top: "8%",
          left: "12%",
          background: "rgba(216,255,0,0.28)",
        }}
      />
      <div
        className="orb"
        style={{
          width: 320,
          height: 320,
          bottom: "5%",
          right: "8%",
          background: "rgba(216,255,0,0.18)",
          animationDelay: "2s",
        }}
      />
      <div className="container-ts relative z-[1]">
        <Suspense
          fallback={
            <div className="glass mx-auto max-w-md p-8 text-center text-sm text-ts-muted">
              Loading…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
