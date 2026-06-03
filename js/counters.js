/**
 * InAmigos Foundation — Animated impact counters
 */
(function (global) {
  "use strict";

  const prefersReducedMotion = global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateValue(el, end, suffix, duration) {
    if (prefersReducedMotion) {
      el.textContent = end.toLocaleString("en-IN") + (suffix || "");
      return;
    }

    const startTime = performance.now();

    function frame(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.floor(end * eased);
      el.textContent = val.toLocaleString("en-IN") + (suffix || "");
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = end.toLocaleString("en-IN") + (suffix || "");
    }

    requestAnimationFrame(frame);
  }

  function runCounters(root, duration) {
    root.querySelectorAll("[data-count]").forEach((el) => {
      if (el.dataset.animated === "true") return;
      el.dataset.animated = "true";
      const end = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || "";
      animateValue(el, end, suffix, duration || 2200);
    });
  }

  function observeSections(selector) {
    const sections = document.querySelectorAll(selector);
    if (!sections.length || !("IntersectionObserver" in global)) {
      sections.forEach((s) => runCounters(s));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounters(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  global.InAmigosCounters = {
    animateValue,
    runCounters,
    observeSections,
  };
})(window);
