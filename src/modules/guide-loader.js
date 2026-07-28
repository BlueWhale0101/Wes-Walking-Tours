const jsonFetch = async (path) => {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Could not load ${path} (${response.status}).`);
  }
  return response.json();
};

export const loadGuideIndex = () => jsonFetch("./guides/index.json");

export const loadGuide = async (guideId) => {
  const guide = await jsonFetch(`./guides/${guideId}/guide.json`);
  guide.basePath = `./guides/${guideId}/`;
  return guide;
};

export const assetPath = (guide, path) => {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  return `${guide.basePath}${path}`;
};
