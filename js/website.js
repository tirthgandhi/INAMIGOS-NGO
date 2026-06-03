/**
 * PAGE 2 — Main website logic
 */
(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const navMobile = document.querySelector(".nav-mobile");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (window.InAmigosAnimations) {
    window.InAmigosAnimations.initWebsiteEnter();
    window.InAmigosAnimations.initReveal();
    window.InAmigosAnimations.initHeroParallax();
  }

  if (window.InAmigosCounters) {
    window.InAmigosCounters.observeSections("[data-counter-section]");
    // Also observe story cards for their impact counters
    window.InAmigosCounters.observeSections(".story-card--premium");
  }

  function updateHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 40);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  if (menuToggle && navMobile) {
    menuToggle.addEventListener("click", () => {
      const open = navMobile.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    navMobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMobile.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const id = this.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  });

  loadProjects();
  if (window.InAmigosProjectImages) {
    window.InAmigosProjectImages.hydrateHomeGallery().catch((err) =>
      console.warn("Gallery:", err)
    );
  }

  // Test image loading
  testProjectImages();

  // Initialize impact cards interaction for mobile
  initImpactCards();

  function testProjectImages() {
    const projectIds = ['bachpanshala', 'seva', 'udaan', 'jeev', 'prakriti', 'vikas'];
    console.log('Testing project image paths:');
    
    projectIds.forEach(id => {
      const imagePath = `assets/images/projects/${id}/img1.jpg`;
      console.log(`${id}: ${imagePath}`);
      
      // Create a test image to verify it loads
      const testImg = new Image();
      testImg.onload = () => console.log(`✅ ${id} image loaded successfully`);
      testImg.onerror = () => console.log(`❌ ${id} image failed to load`);
      testImg.src = imagePath;
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderProjectCard(p) {
    const impacts = (p.impactStats || [])
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join("");
    const objectives = (p.objectives || [])
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join("");
    
    // Simple, direct image path
    const imgSrc = escapeHtml(p._cover || `assets/images/projects/${p.id}/img1.jpg`);
    const fallbackSrc = escapeHtml(p._fallback || p.imageFallback || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80');
    
    console.log(`Rendering ${p.id} with image: ${imgSrc}`);
    
    const detailUrl = `projects/${encodeURIComponent(p.id)}.html`;

    return `
      <article class="project-card reveal" data-project-id="${escapeHtml(p.id)}" data-href="${escapeHtml(detailUrl)}">
        <div class="project-card__shell" tabindex="0" role="link" aria-label="Open ${escapeHtml(p.name)} project page">
          <div class="project-card__glow" aria-hidden="true"></div>
          <div class="project-card__frame">
            <div class="project-card__flip">
              <div class="project-card__flipper">
                <div class="project-card__face project-card__face--front">
                  <div class="project-card__media">
                    <img
                      src="${imgSrc}"
                      alt="${escapeHtml(p.name)} project cover"
                      width="400"
                      height="280"
                      loading="eager"
                      style="object-fit: cover; background-color: #1f2937;"
                      onerror="console.log('Image failed, using fallback:', this.src); this.onerror=null; this.src='${fallbackSrc}';"
                      onload="console.log('Image loaded successfully:', this.src);"
                    >
                    <div class="project-card__media-overlay" aria-hidden="true"></div>
                    <span class="project-card__hint">Hover to explore</span>
                  </div>
                  <h3 class="project-card__front-title">${escapeHtml(p.name)}</h3>
                </div>
                <div class="project-card__face project-card__face--back">
                  <div class="project-card__back-inner">
                    <h3 class="project-card__back-title">${escapeHtml(p.name)}</h3>
                    <dl class="project-card__meta">
                      <dt>Location</dt>
                      <dd>${escapeHtml(p.location)}</dd>
                    </dl>
                    <p class="project-card__description">${escapeHtml(p.description || "")}</p>
                    <div class="project-card__meta">
                      <span class="project-card__meta-label">Objectives</span>
                      <ul class="project-card__objectives">${objectives}</ul>
                    </div>
                    <div class="project-card__meta project-card__meta--impact">
                      <span class="project-card__meta-label">Impact</span>
                      <ul class="project-card__impacts">${impacts}</ul>
                    </div>
                    <p class="project-card__open-hint">Click anywhere to open project page</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>`;
  }

  function initProjectCardNavigation() {
    const isTouch = window.matchMedia("(hover: none)").matches;

    document.querySelectorAll(".project-card").forEach((card) => {
      const shell = card.querySelector(".project-card__shell");
      const href = card.getAttribute("data-href");
      if (!shell || !href) return;

      function goToProject() {
        window.location.assign(href);
      }

      shell.addEventListener("click", (e) => {
        e.preventDefault();
        if (isTouch && !card.classList.contains("is-flipped")) {
          card.classList.add("is-flipped");
          shell.setAttribute("aria-expanded", "true");
          return;
        }
        goToProject();
      });

      shell.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (isTouch && !card.classList.contains("is-flipped")) {
            card.classList.add("is-flipped");
            shell.setAttribute("aria-expanded", "true");
            return;
          }
          goToProject();
        }
        if (e.key === " " && isTouch) {
          e.preventDefault();
          card.classList.toggle("is-flipped");
          shell.setAttribute(
            "aria-expanded",
            card.classList.contains("is-flipped") ? "true" : "false"
          );
        }
      });
    });
  }

  async function loadProjects() {
    const grid = document.getElementById("projects-grid");
    if (!grid) return;

    try {
      // Load project data
      const res = await fetch("data/projects.json");
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();

      // Simple, direct image assignment
      const projects = data.projects.map(p => {
        // Direct path to img1.jpg for each project
        const coverImage = `assets/images/projects/${p.id}/img1.jpg`;
        
        console.log('Loading image:', coverImage);
        
        return { 
          ...p, 
          _cover: coverImage,
          _fallback: p.imageFallback || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80'
        };
      });

      grid.innerHTML = projects.map(renderProjectCard).join("");
      
      console.log('Projects loaded with covers:', projects.map(p => ({ 
        id: p.id, 
        cover: p._cover 
      })));
      
      initProjectCardNavigation();

      if (window.InAmigosAnimations) window.InAmigosAnimations.initReveal();
    } catch (err) {
      console.warn(err);
      grid.innerHTML = `<p class="section-lead">Unable to load projects. Please refresh the page.</p>`;
    }
  }

  function initImpactCards() {
    // Impact cards now use simple CSS-only animations
    // No JavaScript interaction needed
  }
})();
