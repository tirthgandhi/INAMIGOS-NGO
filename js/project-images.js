/**
 * Project image manifest: folder-based covers, galleries, lightbox.
 */
(function () {
  "use strict";

  const COVER_CANDIDATES = [
    "img1.webp",
    "img1.jpg",
    "img1.jpeg", 
    "img1.png",
    "img2.webp",
    "img2.jpg",
    "cover.webp",
    "cover.jpg",
    "01.webp",
    "01.jpg",
  ];
  let cache = null;

  function assetBase() {
    const base = document.documentElement.getAttribute("data-asset-base");
    return base ? base.replace(/\/$/, "") : "";
  }

  function assetUrl(path) {
    const clean = path.replace(/^\//, "");
    const base = assetBase();
    return base ? `${base}/${clean}` : clean;
  }

  function projectFolderUrl(projectId, filename) {
    return assetUrl(`assets/images/projects/${projectId}/${filename}`);
  }

  function getCoverCandidates(projectId) {
    return COVER_CANDIDATES.map((name) => projectFolderUrl(projectId, name));
  }

  function imageExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  async function discoverImagesInFolder(projectId, maxCount) {
    const limit = maxCount || 32;
    const found = [];
    const exts = ["webp", "jpg", "jpeg", "png", "gif"];
    for (let i = 1; i <= limit; i += 1) {
      let matched = false;
      for (const ext of exts) {
        const url = projectFolderUrl(projectId, `img${i}.${ext}`);
        if (await imageExists(url)) {
          found.push(url);
          matched = true;
          break;
        }
      }
      if (!matched && i > 3 && found.length > 0) break;
    }
    return found;
  }

  async function findFolderCover(projectId, entry) {
    const norm = entry ? normalizeProjectImages(entry, projectId) : null;
    if (norm?.cover && (await imageExists(norm.cover))) return norm.cover;
    if (norm?.images?.length) {
      for (const src of norm.images) {
        if (await imageExists(src)) return src;
      }
    }
    for (const url of getCoverCandidates(projectId)) {
      if (await imageExists(url)) return url;
    }
    return null;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  async function loadProjectImages(force) {
    if (cache && !force) return cache;

    try {
      const res = await fetch(assetUrl("api/project-images.php"), { cache: "no-store" });
      if (res.ok) {
        cache = await res.json();
        return cache;
      }
    } catch (e) {
      console.warn("project-images API:", e);
    }

    const res = await fetch(assetUrl("data/project-images.json"), { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load project images manifest");
    cache = await res.json();
    return cache;
  }

  function getProjectEntry(data, projectId) {
    if (!data?.projects) return null;
    return data.projects[projectId] || null;
  }

  async function resolveCover(project, entry) {
    const id = project?.id || project?.imageFolder;
    const fromFolder = id ? await findFolderCover(id, entry) : null;
    if (fromFolder) return fromFolder;
    return project?.imageFallback || "";
  }

  function normalizeProjectImages(entry, projectId) {
    if (!entry) return { images: [], cover: null };
    const images = (entry.images || []).map((src) => assetUrl(src));
    let cover = entry.cover ? assetUrl(entry.cover) : images[0] || null;
    return { ...entry, id: projectId, images, cover };
  }

  function renderGalleryTile(src, alt, projectId, index) {
    const safeSrc = escapeHtml(src);
    const safeAlt = escapeHtml(alt);
    return `
      <button
        type="button"
        class="gallery-tile"
        data-lightbox
        data-src="${safeSrc}"
        data-alt="${safeAlt}"
        data-project="${escapeHtml(projectId)}"
        data-index="${index}"
        aria-label="Open image: ${safeAlt}"
      >
        <img src="${safeSrc}" alt="${safeAlt}" loading="lazy" width="400" height="300">
        <span class="gallery-tile__shade" aria-hidden="true"></span>
      </button>`;
  }

  function renderMasonryGallery(images, projectId, projectName) {
    if (!images?.length) {
      return `<div class="gallery-masonry" data-project-gallery="${escapeHtml(projectId)}"></div>`;
    }
    const tiles = images
      .map((src, i) =>
        renderGalleryTile(src, `${projectName} — photo ${i + 1}`, projectId, i)
      )
      .join("");
    return `<div class="gallery-masonry" data-project-gallery="${escapeHtml(projectId)}">${tiles}</div>`;
  }

  const GALLERY_TITLES = {
    bachpanshala: "Bachpanshala Gallery",
    seva: "Seva Gallery",
    udaan: "Udaan Gallery",
    jeev: "Jeev Gallery",
    prakriti: "Prakriti Gallery",
    vikas: "Vikas Gallery",
  };

  const GALLERY_ORDER = ["bachpanshala", "seva", "udaan", "jeev", "prakriti", "vikas"];

  function initLightbox() {
    let root = document.getElementById("lightbox");
    if (!root) {
      root = document.createElement("div");
      root.id = "lightbox";
      root.className = "lightbox";
      root.hidden = true;
      root.innerHTML = `
        <div class="lightbox__backdrop" data-lightbox-close tabindex="-1"></div>
        <div class="lightbox__dialog" role="dialog" aria-modal="true" aria-label="Image preview">
          <button type="button" class="lightbox__close" data-lightbox-close aria-label="Close">&times;</button>
          <button type="button" class="lightbox__nav lightbox__nav--prev" data-lightbox-prev aria-label="Previous image">&#8249;</button>
          <img class="lightbox__img" src="" alt="">
          <button type="button" class="lightbox__nav lightbox__nav--next" data-lightbox-next aria-label="Next image">&#8250;</button>
          <p class="lightbox__caption"></p>
        </div>`;
      document.body.appendChild(root);
    }

    const img = root.querySelector(".lightbox__img");
    const caption = root.querySelector(".lightbox__caption");
    let group = [];
    let index = 0;

    function show(i) {
      if (!group.length) return;
      index = (i + group.length) % group.length;
      const item = group[index];
      img.src = item.src;
      img.alt = item.alt;
      caption.textContent = item.alt;
      root.hidden = false;
      document.body.classList.add("lightbox-open");
      console.log('Lightbox opened for:', item.src);
    }

    function close() {
      root.hidden = true;
      document.body.classList.remove("lightbox-open");
      img.removeAttribute("src");
      console.log('Lightbox closed');
    }

    function collectGroup(el) {
      const projectId = el.getAttribute("data-project");
      const container = projectId
        ? document.querySelector(`[data-project-gallery="${projectId}"]`)
        : el.closest("[data-project-gallery], .gallery-masonry, .gallery-grid, .gallery-grid--featured");
      
      const buttons = container
        ? [...container.querySelectorAll("[data-lightbox]")]
        : [...document.querySelectorAll("[data-lightbox]")];
      
      group = buttons.map((btn) => ({
        src: btn.getAttribute("data-src") || btn.querySelector("img")?.src || "",
        alt: btn.getAttribute("data-alt") || btn.querySelector("img")?.alt || "",
      }));
      index = buttons.indexOf(el);
      if (index < 0) index = 0;
      console.log('Lightbox group collected:', group.length, 'images, starting at index:', index);
    }

    // Use event delegation to handle dynamically added gallery tiles
    document.addEventListener("click", (e) => {
      const tile = e.target.closest("[data-lightbox]");
      if (!tile) return;
      e.preventDefault();
      collectGroup(tile);
      show(index);
    });

    root.querySelectorAll("[data-lightbox-close]").forEach((el) => {
      el.addEventListener("click", close);
    });
    root.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => show(index - 1));
    root.querySelector("[data-lightbox-next]")?.addEventListener("click", () => show(index + 1));

    document.addEventListener("keydown", (e) => {
      if (root.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
  }

  async function hydrateHomeGallery() {
    const featured = document.getElementById("gallery-featured");
    if (!featured) return;

    try {
      const data = await loadProjectImages();
      console.log('Home gallery data loaded:', data);
      
      const picks = GALLERY_ORDER.map((id) => {
        const entry = getProjectEntry(data, id);
        console.log(`Home gallery entry for ${id}:`, entry);
        if (!entry?.cover && entry?.images?.length > 0) {
          // Use first image as cover if no cover specified
          entry.cover = entry.images[0];
        }
        if (!entry?.cover) return null;
        return { id, src: entry.cover, title: GALLERY_TITLES[id] };
      }).filter(Boolean);

      console.log('Home gallery picks:', picks);

      if (picks.length === 0) {
        // Hide the entire gallery section if no images exist
        const gallerySection = document.getElementById("gallery");
        if (gallerySection) {
          gallerySection.style.display = "none";
        }
        return;
      }

      featured.innerHTML = picks
          .map(
            (p, index) => `
      <a href="gallery.html?project=${encodeURIComponent(p.id)}" class="gallery-item gallery-item--featured">
        <div class="gallery-item__bg" style="background-image:url('${escapeHtml(p.src)}')"></div>
        <div class="gallery-item__overlay"><span>${escapeHtml(p.title)}</span></div>
        <img src="${escapeHtml(p.src)}" alt="${escapeHtml(p.title)}" loading="${index < 3 ? 'eager' : 'lazy'}" width="400" height="300" style="display: none;" 
             onerror="console.log('Home gallery image failed:', '${escapeHtml(p.src)}');">
      </a>`
          )
          .join("");

      if (window.InAmigosAnimations) window.InAmigosAnimations.initReveal();
    } catch (error) {
      console.error('Home gallery loading error:', error);
      // Hide gallery section on error
      const gallerySection = document.getElementById("gallery");
      if (gallerySection) {
        gallerySection.style.display = "none";
      }
    }
  }

  window.InAmigosProjectImages = {
    loadProjectImages,
    getProjectEntry,
    resolveCover,
    findFolderCover,
    discoverImagesInFolder,
    normalizeProjectImages,
    assetUrl,
    projectFolderUrl,
    renderMasonryGallery,
    hydrateHomeGallery,
    initLightbox,
    initLazyLoading,
    GALLERY_ORDER,
    GALLERY_TITLES,
  };

  function initLazyLoading() {
    // Modern browsers with Intersection Observer
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.getAttribute('data-src')) {
              img.src = img.getAttribute('data-src');
              img.removeAttribute('data-src');
            }
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px'
      });

      // Observe all lazy images
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      lazyImages.forEach(img => {
        if (img.getAttribute('data-src')) {
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
        }
        img.classList.add('loaded');
      });
    }
  }

  initLightbox();
  
  // Initialize lazy loading when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLazyLoading);
  } else {
    initLazyLoading();
  }
})();
