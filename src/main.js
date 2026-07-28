import { createGuideApp } from "./modules/app.js";
import { loadGuideIndex, loadGuide } from "./modules/guide-loader.js";
import { getOfflineGuideStatus, registerServiceWorker, requestOfflineDownload } from "./modules/offline.js";

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

    const initialOfflineState = await getOfflineGuideStatus(sw, guide);
    let app;
    const updateOfflineState = (nextState) => {
      app?.updateOfflineState(nextState);
      if (nextState.state === "downloading") setStatus("Downloading guide…");
      if (nextState.state === "ready") setStatus("Guide ready offline");
      if (nextState.state === "failed") setStatus("Offline download incomplete");
    };
    app = createGuideApp({
      root,
      guide,
      guideIndex,
      selectedGuideId,
      onDownloadGuide: () => requestOfflineDownload(sw, guide, updateOfflineState),
      setStatus,
      initialOfflineState
    });

    document.title = `${guide.title} | Wes Walking Tours`;
    setStatus(initialOfflineState.state === "ready" ? "Guide ready offline" : navigator.onLine ? "Online" : "Offline");
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
