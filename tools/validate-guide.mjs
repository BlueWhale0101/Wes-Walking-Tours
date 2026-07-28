import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const guidesDir = path.join(repoRoot, "guides");
const indexPath = path.join(guidesDir, "index.json");
const errors = [];
const warnings = [];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const exists = (filePath) => fs.existsSync(filePath);
const isRemote = (value = "") => /^(https?:)?\/\//.test(value) || value.startsWith("data:");
const hasText = (value) => typeof value === "string" && value.trim().length > 0;

const requireData = (condition, message) => {
  if (!condition) errors.push(`[required data] ${message}`);
};

const validateAsset = ({ guideDir, guideId, label, asset, status }) => {
  if (!hasText(asset) || isRemote(asset)) return;
  if (exists(path.resolve(guideDir, asset))) return;

  const message = `${guideId}: referenced ${label} asset does not exist: ${asset}`;
  if (status === "ready") errors.push(`[referenced asset] ${message}`);
  else warnings.push(`[draft referenced asset] ${message}`);
};

const guideIndex = readJson(indexPath);
requireData(Array.isArray(guideIndex.guides), "guides/index.json must include a guides array.");

for (const entry of guideIndex.guides || []) {
  requireData(hasText(entry.id), "Each guide index entry needs an id.");
  requireData(hasText(entry.title), `${entry.id || "Guide index entry"}: index title is required.`);
  requireData(["draft", "ready"].includes(entry.status), `${entry.id || "Guide index entry"}: status must be "draft" or "ready".`);

  const status = entry.status;
  const guideDir = path.join(guidesDir, entry.id || "");
  const guidePath = path.join(guideDir, "guide.json");
  requireData(exists(guidePath), `${entry.id || "Guide index entry"}: guide.json is required.`);
  if (!exists(guidePath)) continue;

  const guide = readJson(guidePath);
  requireData(guide.id === entry.id, `${entry.id}: guide.id must match index id.`);
  requireData(hasText(guide.title), `${entry.id}: title is required.`);
  requireData(hasText(guide.region), `${entry.id}: region is required.`);
  requireData(hasText(guide.summary), `${entry.id}: summary is required.`);
  requireData(hasText(guide.duration), `${entry.id}: duration is required.`);
  requireData(hasText(guide.distance), `${entry.id}: distance is required.`);
  requireData(Array.isArray(guide.stops) && guide.stops.length > 0, `${entry.id}: stops must be a non-empty array.`);

  if (status === "ready") {
    requireData(hasText(guide.map?.image), `${entry.id}: ready guides require map.image.`);
    requireData(hasText(guide.map?.alt), `${entry.id}: ready guides require map.alt.`);
  }
  validateAsset({ guideDir, guideId: entry.id, label: "map", asset: guide.map?.image, status });

  const seenStopIds = new Set();
  for (const [index, stop] of (guide.stops || []).entries()) {
    const prefix = `${entry.id}: stop ${index + 1}`;
    requireData(hasText(stop.id), `${prefix} needs an id.`);
    requireData(!seenStopIds.has(stop.id), `${entry.id}: duplicate stop id ${stop.id}.`);
    seenStopIds.add(stop.id);
    requireData(hasText(stop.title), `${prefix} needs a title.`);
    requireData(hasText(stop.location), `${prefix} needs a location.`);
    requireData(Number.isFinite(stop.durationMinutes) && stop.durationMinutes > 0, `${prefix} durationMinutes must be greater than zero.`);
    requireData(hasText(stop.mode), `${prefix} needs a mode.`);
    requireData(Array.isArray(stop.script) && stop.script.length > 0 && stop.script.every(hasText), `${prefix} needs non-empty script paragraphs.`);

    if (status === "ready") {
      requireData(hasText(stop.audio), `${prefix} requires audio for ready status.`);
      requireData(stop.map && typeof stop.map === "object", `${prefix} requires map coordinates for ready status.`);
    }
    validateAsset({ guideDir, guideId: entry.id, label: `audio for ${stop.id || `stop ${index + 1}`}`, asset: stop.audio, status });

    if (stop.images !== undefined) {
      requireData(Array.isArray(stop.images), `${prefix} images must be an array when supplied; images are otherwise optional.`);
    }
    for (const [imageIndex, image] of (Array.isArray(stop.images) ? stop.images : []).entries()) {
      requireData(hasText(image.src), `${prefix} image ${imageIndex + 1} needs src when supplied.`);
      requireData(hasText(image.alt), `${prefix} image ${imageIndex + 1} needs alt text when supplied.`);
      validateAsset({ guideDir, guideId: entry.id, label: `image for ${stop.id || `stop ${index + 1}`}`, asset: image.src, status });
    }

    if (stop.map) {
      requireData(Number.isFinite(stop.map.x) && stop.map.x >= 0 && stop.map.x <= 100, `${prefix} map.x must be 0-100.`);
      requireData(Number.isFinite(stop.map.y) && stop.map.y >= 0 && stop.map.y <= 100, `${prefix} map.y must be 0-100.`);
    }
  }
}

if (warnings.length) console.warn(warnings.map((warning) => `- ${warning}`).join("\n"));
if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Validated ${guideIndex.guides.length} guide(s). Optional images may be omitted; referenced images were checked.`);
