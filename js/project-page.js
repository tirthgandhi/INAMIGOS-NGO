/**
 * Dedicated project pages — projects/{id}.html
 */
(function () {
  "use strict";

  const projectId = (
    document.documentElement.getAttribute("data-project-id") || ""
  )
    .toLowerCase()
    .trim();

  const IMG = window.InAmigosProjectImages;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function listItems(items) {
    return (items || []).map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  }

  async function init() {
    const root = document.getElementById("project-page-root");
    if (!root || !projectId) return;

    try {
      const [projectsRes, imageData] = await Promise.all([
        fetch(IMG.assetUrl("data/projects.json")),
        IMG.loadProjectImages(),
      ]);
      if (!projectsRes.ok) throw new Error("projects");
      const { projects } = await projectsRes.json();
      const project = projects.find((p) => p.id === projectId);
      const rawEntry = IMG.getProjectEntry(imageData, projectId);
      const entry = rawEntry
        ? IMG.normalizeProjectImages(rawEntry, projectId)
        : null;
      const cover = project
        ? await IMG.resolveCover(project, entry || rawEntry)
        : "";
      let images = entry?.images?.length ? entry.images : [];
      if (!images.length) {
        images = await IMG.discoverImagesInFolder(projectId);
      }
      if (!images.length && cover) images = [cover];

      if (!project) {
        root.innerHTML = `<p class="gallery-empty">Project not found. <a href="${escapeHtml(IMG.assetUrl("home.html"))}#projects">Back to projects</a></p>`;
        return;
      }

      document.title = `${project.name} — InAmigos Foundation`;
      const story = project.successStory || {};
      const galleryTitle =
        IMG.GALLERY_TITLES[projectId] || `${project.name} Gallery`;
      const home = IMG.assetUrl("home.html");
      const donate = "https://inamigosfoundation.org.in/";

      root.innerHTML = `
        <header class="project-detail-hero">
          <div class="project-detail-hero__bg" style="background-image:url('${escapeHtml(cover)}')" role="img" aria-label="${escapeHtml(project.name)} cover"></div>
          <div class="project-detail-hero__overlay" aria-hidden="true"></div>
          <div class="project-detail-hero__content reveal">
            <a class="project-detail-back" href="${escapeHtml(home)}#projects">&larr; Back to projects</a>
            <p class="section-label">${escapeHtml(project.location)}</p>
            <h1 class="section-title">${escapeHtml(project.name)}</h1>
            <p class="section-lead project-detail-tagline">${escapeHtml(project.tagline || "")}</p>
          </div>
        </header>

        <section class="project-detail-section reveal">
          <div class="project-detail-section__inner">
            <h2>About this project</h2>
            <p class="project-detail-lead">${escapeHtml(project.description || "")}</p>
          </div>
        </section>

        <section class="project-detail-section project-detail-section--alt reveal">
          <div class="project-detail-section__inner project-detail-split">
            <div>
              <h2>Mission</h2>
              <p>${escapeHtml(project.mission || project.description || "")}</p>
            </div>
            <div>
              <h2>Objectives</h2>
              <ul class="project-detail-list">${listItems(project.objectives)}</ul>
            </div>
          </div>
        </section>

        <section class="project-detail-section reveal" data-counter-section>
          <div class="project-detail-section__inner">
            <h2>Impact</h2>
            <ul class="project-impact-cards">
              ${(project.impactStats || [])
                .map(
                  (line) =>
                    `<li class="project-impact-cards__item"><span>${escapeHtml(line)}</span></li>`
                )
                .join("")}
            </ul>
          </div>
        </section>

        <section class="project-detail-section project-detail-section--alt reveal" aria-labelledby="project-gallery-title">
          <div class="project-detail-section__inner">
            <h2 id="project-gallery-title">${escapeHtml(galleryTitle)}</h2>
            <p class="section-lead">All photos load from <code>assets/images/projects/${escapeHtml(projectId)}/</code></p>
            ${IMG.renderMasonryGallery(images, projectId, project.name)}
          </div>
        </section>

        <section class="project-detail-section reveal">
          <div class="project-detail-section__inner">
            <h2>Success story</h2>
            <article class="project-story-card">
              <h3>${escapeHtml(story.title || "")}</h3>
              <p>${escapeHtml(story.body || "")}</p>
              ${story.quote ? `<blockquote class="story-quote">"${escapeHtml(story.quote)}"</blockquote>` : ""}
            </article>
          </div>
        </section>

        <section class="project-detail-section reveal">
          <div class="project-detail-section__inner">
            <div class="cta-volunteer project-detail-cta">
              <h2>Volunteer with ${escapeHtml(project.name)}</h2>
              <p>Join our volunteers and help deliver lasting impact in communities across India.</p>
              <div class="cta-actions">
                <a class="btn-primary" href="${donate}" target="_blank" rel="noopener noreferrer">Volunteer Now</a>
                <a class="btn-outline" href="${escapeHtml(home)}#projects">Back to all projects</a>
              </div>
            </div>
          </div>
        </section>`;

      if (window.InAmigosAnimations) window.InAmigosAnimations.initReveal();
      if (window.InAmigosCounters) {
        window.InAmigosCounters.observeSections("[data-counter-section]");
      }
    } catch (err) {
      console.warn(err);
      root.innerHTML = `<p class="gallery-empty">Unable to load project. <a href="${escapeHtml(IMG.assetUrl("home.html"))}#projects">Back to projects</a></p>`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
