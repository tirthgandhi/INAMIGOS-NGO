/**
 * Project detail page — all images from project folder.
 */
(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const projectId = (params.get("id") || "").toLowerCase().trim();

  async function init() {
    const heroBg = document.getElementById("project-hero-bg");
    const titleEl = document.getElementById("project-title");
    const taglineEl = document.getElementById("project-tagline");
    const descEl = document.getElementById("project-description");
    const galleryRoot = document.getElementById("project-gallery");
    const metaList = document.getElementById("project-meta-list");

    if (!projectId) {
      document.title = "Project — InAmigos Foundation";
      if (galleryRoot) {
        galleryRoot.innerHTML = "<p class=\"gallery-empty\">No project selected. <a href=\"home.html#projects\">View all projects</a>.</p>";
      }
      return;
    }

    try {
      const [projectsRes, imagesData] = await Promise.all([
        fetch("data/projects.json"),
        window.InAmigosProjectImages.loadProjectImages(),
      ]);

      if (!projectsRes.ok) throw new Error("projects.json");
      const { projects } = await projectsRes.json();
      const project = projects.find((p) => p.id === projectId);
      const entry = window.InAmigosProjectImages.getProjectEntry(imagesData, projectId);

      if (!project) {
        document.title = "Project not found — InAmigos Foundation";
        if (galleryRoot) {
          galleryRoot.innerHTML = "<p class=\"gallery-empty\">Project not found. <a href=\"home.html#projects\">Back to projects</a>.</p>";
        }
        return;
      }

      document.title = `${project.name} — InAmigos Foundation`;
      if (titleEl) titleEl.textContent = project.name;
      if (taglineEl) taglineEl.textContent = project.tagline || "";
      if (descEl) descEl.textContent = project.description || "";

      const cover = window.InAmigosProjectImages.resolveCover(project, entry);
      if (heroBg && cover) {
        heroBg.style.backgroundImage = `url('${cover.replace(/'/g, "%27")}')`;
      }

      if (metaList) {
        const impacts = (project.impactStats || [])
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("");
        const objectives = (project.objectives || [])
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("");
        metaList.innerHTML = `
          <p><strong>Location:</strong> ${escapeHtml(project.location)}</p>
          <h3>Objectives</h3><ul>${objectives}</ul>
          <h3>Impact</h3><ul>${impacts}</ul>`;
      }

      if (galleryRoot) {
        const images = entry?.images?.length ? entry.images : [];
        const title =
          window.InAmigosProjectImages.GALLERY_TITLES[projectId] ||
          `${project.name} Gallery`;
        galleryRoot.innerHTML = window.InAmigosProjectImages.renderMasonryGallery(
          images,
          projectId,
          title
        );
      }

      if (window.InAmigosAnimations) window.InAmigosAnimations.initReveal();
    } catch (err) {
      console.warn(err);
      if (galleryRoot) {
        galleryRoot.innerHTML =
          "<p class=\"gallery-empty\">Unable to load project photos. Please refresh.</p>";
      }
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
