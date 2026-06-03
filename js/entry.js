/**
 * PAGE 1 — Entry page: ENTER → home.html with fade transition
 */
(function () {
  "use strict";

  const MAIN_PAGE = "home.html";
  const TRANSITION_MS = 650;
  const SESSION_KEY = "inamigos-enter-transition";

  const enterBtn = document.getElementById("btn-enter");
  const statsRoot = document.querySelector("[data-entry-counters]");
  let isNavigating = false;

  if (statsRoot && window.InAmigosCounters) {
    window.InAmigosCounters.runCounters(statsRoot, 1800);
  }

  /**
   * Resolve target URL relative to current page (works in subfolders & localhost).
   */
  function resolveTarget(path) {
    try {
      return new URL(path, window.location.href).href;
    } catch {
      return path;
    }
  }

  function navigateToMainSite(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isNavigating) return;
    isNavigating = true;

    if (enterBtn) {
      enterBtn.disabled = true;
      enterBtn.setAttribute("aria-busy", "true");
    }

    const target =
      enterBtn?.getAttribute("data-href")?.trim() || MAIN_PAGE;
    const destination = resolveTarget(target);

    document.body.classList.add("is-exiting");
    sessionStorage.setItem(SESSION_KEY, "1");

    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : TRANSITION_MS;

    window.setTimeout(function () {
      window.location.href = destination;
    }, delay);
  }

  if (enterBtn) {
    enterBtn.setAttribute("data-href", MAIN_PAGE);
    enterBtn.addEventListener("click", navigateToMainSite);
    enterBtn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") navigateToMainSite(e);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.repeat || isNavigating) return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
    navigateToMainSite(e);
  });
})();
