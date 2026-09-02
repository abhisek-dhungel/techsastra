import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested TechSastra page could not be found.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="not-found-page container-ts">
      <span>404</span>
      <h1>That page is no longer here</h1>
      <p>
        Try the latest Nepal tech coverage or browse our current price guides.
      </p>
      <div>
        <Link href="/">Latest tech stories</Link>
        <Link href="/category/prices">Prices in Nepal</Link>
      </div>
    </section>
  );
}
