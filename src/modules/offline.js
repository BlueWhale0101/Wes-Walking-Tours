export const registerServiceWorker = async (setStatus) => {
  if (!("serviceWorker" in navigator)) {
    setStatus("Offline cache unsupported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("./service-worker.js");
    return registration;
  } catch (error) {
    console.warn(error);
    setStatus("Offline cache unavailable");
    return null;
  }
};

export const requestOfflineDownload = async (registration, guide, setStatus) => {
  const worker = registration?.active || registration?.waiting || registration?.installing;
  if (!worker) {
    setStatus("Offline cache not ready yet");
    return;
  }

  setStatus("Downloading guide...");
  const channel = new MessageChannel();
  channel.port1.onmessage = (event) => {
    setStatus(event.data?.ok ? "Guide saved offline" : `Offline save failed: ${event.data?.message || "unknown error"}`);
  };
  worker.postMessage({ type: "CACHE_GUIDE", guideId: guide.id }, [channel.port2]);
};
