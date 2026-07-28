export const registerServiceWorker = async (setStatus) => {
  if (!("serviceWorker" in navigator)) {
    setStatus("Offline cache unsupported");
    return null;
  }

  try {
    await navigator.serviceWorker.register("./service-worker.js");
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.warn(error);
    setStatus("Offline cache unavailable");
    return null;
  }
};

const sendWorkerMessage = (registration, message) => new Promise((resolve, reject) => {
  const worker = registration?.active || registration?.waiting || registration?.installing;
  if (!worker) {
    reject(new Error("Offline cache is not ready yet"));
    return;
  }

  const channel = new MessageChannel();
  channel.port1.onmessage = (event) => resolve(event.data);
  worker.postMessage(message, [channel.port2]);
});

export const getOfflineGuideStatus = async (registration, guide) => {
  if (!registration) return { state: "unsupported" };
  try {
    const result = await sendWorkerMessage(registration, { type: "GET_GUIDE_CACHE_STATUS", guideId: guide.id });
    return result?.ready
      ? { state: "ready", total: result.total }
      : { state: "not-downloaded", missing: result?.missing || [], total: result?.total };
  } catch (error) {
    return { state: "unsupported", message: error.message };
  }
};

export const requestOfflineDownload = async (registration, guide, onStateChange) => {
  if (!registration) {
    onStateChange({ state: "unsupported" });
    return;
  }

  onStateChange({ state: "downloading" });
  try {
    const result = await sendWorkerMessage(registration, { type: "CACHE_GUIDE", guideId: guide.id });
    onStateChange(result?.ok
      ? { state: "ready", total: result.total }
      : { state: "failed", missing: result?.missing || [], total: result?.total, message: result?.message });
  } catch (error) {
    onStateChange({ state: "failed", message: error.message });
  }
};
