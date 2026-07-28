import { assetPath } from "./guide-loader.js";
import { createAudioController } from "./audio.js";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatMinutes = (minutes) => {
  if (!minutes) return "";
  return `${minutes} min`;
};

const stopMeta = (stop) =>
  [stop.location, formatMinutes(stop.durationMinutes), stop.mode].filter(Boolean).join(" · ");

export const createGuideApp = ({
  root,
  guide,
  guideIndex,
  selectedGuideId,
  onDownloadGuide,
  setStatus
}) => {
  let activeStopId = guide.stops?.[0]?.id || null;
  const audio = createAudioController({ setStatus });

  const activeStop = () => guide.stops.find((stop) => stop.id === activeStopId) || guide.stops[0];

  const selectStop = (stopId) => {
    activeStopId = stopId;
    render();
  };

  const renderGuidePicker = () => {
    if (!guideIndex.guides || guideIndex.guides.length < 2) return "";
    const options = guideIndex.guides
      .map((item) => `
        <option value="${escapeHtml(item.id)}"${item.id === selectedGuideId ? " selected" : ""}>
          ${escapeHtml(item.title)}
        </option>
      `)
      .join("");
    return `
      <label class="guide-picker">
        <span>Guide</span>
        <select id="guide-picker">${options}</select>
      </label>
    `;
  };

  const renderMap = () => {
    if (!guide.map?.image) return "";
    const markers = guide.stops
      .filter((stop) => stop.map)
      .map((stop, index) => `
        <button
          class="map-marker${stop.id === activeStopId ? " active" : ""}"
          style="--x:${stop.map.x}%; --y:${stop.map.y}%"
          data-stop-id="${escapeHtml(stop.id)}"
          aria-label="Open stop ${index + 1}: ${escapeHtml(stop.title)}"
        >
          ${index + 1}
        </button>
      `)
      .join("");

    return `
      <section class="map-panel" aria-label="Route map">
        <img src="${assetPath(guide, guide.map.image)}" alt="${escapeHtml(guide.map.alt || "Route map")}" class="route-map">
        ${markers}
      </section>
    `;
  };

  const renderStopList = () => `
    <details class="stop-list-panel secondary-panel">
      <summary>
        <span>All stops</span>
        <small>${guide.stops.length} stops</small>
      </summary>
      <div class="stop-list" aria-label="All stops">
        ${guide.stops
          .map((stop, index) => `
            <button class="stop-button${stop.id === activeStopId ? " active" : ""}" data-stop-id="${escapeHtml(stop.id)}">
              <span class="stop-number">${index + 1}</span>
              <span>
                <strong>${escapeHtml(stop.title)}</strong>
                <small>${escapeHtml(stopMeta(stop))}</small>
              </span>
            </button>
          `)
          .join("")}
      </div>
    </details>
  `;

  const renderImages = (stop) => {
    if (!stop.images?.length) return "";
    return `
      <div class="image-grid">
        ${stop.images
          .map((image) => `
            <figure>
              <img src="${assetPath(guide, image.src)}" alt="${escapeHtml(image.alt || "")}" loading="lazy">
              ${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ""}
            </figure>
          `)
          .join("")}
      </div>
    `;
  };

  const renderReferences = (stop) => {
    if (!stop.references?.length) return "";
    return `
      <details class="references">
        <summary>References for later</summary>
        <ul>
          ${stop.references
            .map((ref) => `<li><a href="${escapeHtml(ref.url)}">${escapeHtml(ref.title)}</a></li>`)
            .join("")}
        </ul>
      </details>
    `;
  };

  const renderActiveStop = () => {
    const stop = activeStop();
    const stopIndex = guide.stops.findIndex((item) => item.id === stop.id);
    const nextStop = guide.stops[stopIndex + 1];
    return `
      <article id="active-stop" class="active-stop">
        <div class="stop-kicker">Stop ${stopIndex + 1}</div>
        <h2>${escapeHtml(stop.title)}</h2>
        <p class="stop-meta">${escapeHtml(stopMeta(stop))}</p>
        <div class="audio-controls">
          <button id="play-stop" class="primary">Play</button>
          <button id="pause-stop" class="secondary">Pause</button>
          <button id="stop-audio" class="secondary">Stop</button>
          ${nextStop ? `<button id="next-stop" class="secondary">Next Stop</button>` : ""}
        </div>
        ${stop.audio ? `<audio id="audio-player" controls preload="metadata" src="${assetPath(guide, stop.audio)}"></audio>` : ""}
        ${renderImages(stop)}
        ${(stop.script?.length || stop.references?.length) ? `
          <details class="stop-details">
            <summary>Read script and details</summary>
            <div class="script">
              ${(stop.script || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
            </div>
            ${renderReferences(stop)}
          </details>
        ` : ""}
      </article>
    `;
  };

  const renderOfflinePanel = () => `
    <section class="offline-panel secondary-panel" aria-labelledby="offline-heading">
      <div>
        <h2 id="offline-heading">Take this guide offline</h2>
        <p>Download the complete guide, including its available map, images, and audio.</p>
      </div>
      <button id="download-guide" class="primary">Download Whole Guide</button>
    </section>
  `;

  const bindEvents = () => {
    root.querySelector("#download-guide")?.addEventListener("click", onDownloadGuide);
    root.querySelector("#guide-picker")?.addEventListener("change", (event) => {
      window.location.href = `./?guide=${encodeURIComponent(event.target.value)}`;
    });

    root.querySelectorAll("[data-stop-id]").forEach((button) => {
      button.addEventListener("click", () => selectStop(button.dataset.stopId));
    });

    const stop = activeStop();
    const player = root.querySelector("#audio-player");
    root.querySelector("#play-stop")?.addEventListener("click", () => audio.play({ player, stop }));
    root.querySelector("#pause-stop")?.addEventListener("click", () => audio.pause(player));
    root.querySelector("#stop-audio")?.addEventListener("click", () => audio.stop(player));
    root.querySelector("#next-stop")?.addEventListener("click", () => {
      const index = guide.stops.findIndex((item) => item.id === activeStopId);
      const next = guide.stops[index + 1];
      if (next) selectStop(next.id);
    });
  };

  const render = () => {
    root.innerHTML = `
      <section class="guide-hero">
        <div>
          <p class="eyebrow">${escapeHtml(guide.region || "Walking guide")}</p>
          <h1>${escapeHtml(guide.title)}</h1>
          ${guide.summary ? `<p class="guide-summary">${escapeHtml(guide.summary)}</p>` : ""}
        </div>
        ${renderGuidePicker()}
      </section>
      <section class="field-layout">
        ${renderMap()}
        ${renderActiveStop()}
      </section>
      <section class="secondary-content" aria-label="More guide options">
        ${renderStopList()}
        ${renderOfflinePanel()}
        <dl class="guide-facts">
          <div><dt>Duration</dt><dd>${escapeHtml(guide.duration || "Flexible")}</dd></div>
          <div><dt>Distance</dt><dd>${escapeHtml(guide.distance || "Varies")}</dd></div>
          <div><dt>Stops</dt><dd>${guide.stops.length}</dd></div>
        </dl>
      </section>
    `;
    bindEvents();
  };

  render();
};
