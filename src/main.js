import { createGuideApp } from "./modules/app.js";
import { loadGuideIndex, loadGuide } from "./modules/guide-loader.js";
import { registerServiceWorker, requestOfflineDownload } from "./modules/offline.js";

const root = document.querySelector("#app-root");
const status = document.querySelector("#offline-status");

const setStatus = (message) => {
  status.textContent = message;
};

const getSelectedGuideId = (guideIndex) => {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("guide");
  if (requested) return requested;
  return guideIndex.defaultGuideId || guideIndex.guides?.[0]?.id || null;
};

const boot = async () => {
  try {
    const guideIndex = await loadGuideIndex();
    const selectedGuideId = getSelectedGuideId(guideIndex);

    if (!selectedGuideId) {
      throw new Error("No guide is configured in guides/index.json.");
    }

    const guide = await loadGuide(selectedGuideId);
    const sw = await registerServiceWorker(setStatus);

    createGuideApp({
      root,
      guide,
      guideIndex,
      selectedGuideId,
      onDownloadGuide: () => requestOfflineDownload(sw, guide, setStatus),
      setStatus
    });

    document.title = `${guide.title} | Wes Walking Tours`;
    setStatus(sw?.active ? "Ready" : "Ready online");
  } catch (error) {
    console.error(error);
    root.innerHTML = `
      <section class="empty-state">
        <h1>Guide could not load</h1>
        <p>${error.message}</p>
      </section>
    `;
    setStatus("Load failed");
  }
};

boot();
