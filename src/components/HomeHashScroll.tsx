"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToSectionId } from "@/lib/scroll";

/** Smooth-scroll to homepage section hashes (e.g. /#gadgets). */
export function HomeHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    const run = () => {
      if (window.location.hash) scrollToSectionId(window.location.hash);
    };
    run();
    // Next may paint sections after first paint
    const t = window.setTimeout(run, 100);

    const onHashChange = () => scrollToSectionId(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [pathname]);

  return null;
}
