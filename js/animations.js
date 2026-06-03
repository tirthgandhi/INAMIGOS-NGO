/**
 * InAmigos Foundation — Scroll reveals, parallax, page transitions
 */
(function (global) {
  "use strict";

  const prefersReducedMotion = global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    if (!("IntersectionObserver" in global) || prefersReducedMotion) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => observer.observe(el));
  }

  function initHeroParallax() {
    const heroMedia = document.querySelector(".hero-media-wrap");
    const hero = document.querySelector(".hero--site");
    if (!heroMedia || !hero || prefersReducedMotion) return;

    function update() {
      const rect = hero.getBoundingClientRect();
      const heroH = hero.offsetHeight;
      if (rect.bottom <= 0) return;
      const progress = Math.min(Math.max(-rect.top / heroH, 0), 1);
      heroMedia.style.transform = `scale(${1 + progress * 0.12})`;
      heroMedia.style.opacity = String(1 - progress * 0.55);
    }

    let ticking = false;
    global.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            update();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  function initWebsiteEnter() {
    if (!document.body.classList.contains("page-website")) return;
    const flag = sessionStorage.getItem("inamigos-enter-transition");
    if (flag === "1") {
      sessionStorage.removeItem("inamigos-enter-transition");
      document.body.classList.add("is-entering");
    }
  }

  function navigateWithFade(url) {
    const duration = prefersReducedMotion ? 0 : 650;
    document.body.classList.add("is-exiting");
    sessionStorage.setItem("inamigos-enter-transition", "1");

    let destination = url;
    try {
      destination = new URL(url, global.location.href).href;
    } catch {
      /* use url as-is */
    }

    global.setTimeout(() => {
      global.location.href = destination;
    }, duration);
  }

  global.InAmigosAnimations = {
    initReveal,
    initHeroParallax,
    initWebsiteEnter,
    navigateWithFade,
  };
})(window);
