import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/** Routes that manage their own scroll containers and should keep native scrolling. */
const NATIVE_SCROLL_PREFIXES = ["/admin", "/scanner"];

/**
 * Inertial page scrolling for the public site. The page still scrolls natively underneath,
 * so `useScroll`, anchors and keyboard scrolling keep working; Lenis only eases the motion.
 */
export function SmoothScroll() {
  const { pathname } = useLocation();
  const disabled = NATIVE_SCROLL_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    if (disabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Dialogs, dropdowns and other inner scroll areas scroll on their own.
      allowNestedScroll: true,
    });
    window.__lenis = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // Pause while a modal or the mobile menu has locked the page, resume when it unlocks.
    const syncLock = () => {
      const body = document.body;
      const locked =
        body.hasAttribute("data-scroll-locked") ||
        body.style.overflow === "hidden" ||
        document.documentElement.style.overflow === "hidden";
      if (locked) lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(syncLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ["style", "data-scroll-locked"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      lenis.destroy();
      if (window.__lenis === lenis) delete window.__lenis;
    };
  }, [disabled]);

  return null;
}
