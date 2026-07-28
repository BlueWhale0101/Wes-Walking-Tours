import { assetPath } from "./guide-loader.js";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const renderMap = ({ guide, activeStopId }) => {
  if (!guide.map?.image) return "";

  const markers = guide.stops
    .map((stop, index) => ({ stop, index }))
    .filter(({ stop }) => stop.map)
    .map(({ stop, index }) => {
      const isActive = stop.id === activeStopId;
      return `
        <button
          class="map-marker${isActive ? " active" : ""}"
          style="--x:${stop.map.x}%; --y:${stop.map.y}%"
          data-stop-id="${escapeHtml(stop.id)}"
          aria-label="Select stop ${index + 1}: ${escapeHtml(stop.title)}"
          ${isActive ? 'aria-current="location"' : ""}
        >
          <span class="map-marker-dot" aria-hidden="true">${index + 1}</span>
          <span class="map-marker-label" aria-hidden="true">Stop ${index + 1}</span>
        </button>
      `;
    })
    .join("");

  return `
    <section class="map-panel" aria-label="Route map">
      <img src="${assetPath(guide, guide.map.image)}" alt="${escapeHtml(guide.map.alt || "Route map")}" class="route-map">
      <div class="map-markers">${markers}</div>
    </section>
  `;
};

export const updateMapSelection = (root, activeStopId) => {
  root.querySelectorAll(".map-marker").forEach((marker) => {
    const isActive = marker.dataset.stopId === activeStopId;
    marker.classList.toggle("active", isActive);
    if (isActive) marker.setAttribute("aria-current", "location");
    else marker.removeAttribute("aria-current");
  });
};
