/** Scroll so the target sits below the sticky site header. */
export function scrollToSectionEl(
  el: HTMLElement,
  behavior: ScrollBehavior = "smooth",
) {
  const header = document.querySelector(".site-header") as HTMLElement | null;
  const offset = (header?.getBoundingClientRect().height ?? 72) + 16;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior });
}

export function scrollToSectionId(
  id: string,
  behavior: ScrollBehavior = "smooth",
) {
  const el = document.getElementById(id.replace(/^#/, ""));
  if (!el) return false;
  scrollToSectionEl(el, behavior);
  return true;
}
