import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const guidesDir = path.join(repoRoot, "guides");
const indexPath = path.join(guidesDir, "index.json");
const errors = [];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const exists = (filePath) => fs.existsSync(filePath);
const isRemote = (value = "") => /^(https?:)?\/\//.test(value) || value.startsWith("data:");

const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const validateAsset = (guideDir, guideId, label, asset) => {
  if (!asset || isRemote(asset)) return;
  assert(exists(path.join(guideDir, asset)), `${guideId}: missing ${label} asset ${asset}`);
};

const guideIndex = readJson(indexPath);
assert(Array.isArray(guideIndex.guides), "guides/index.json must include a guides array.");

for (const entry of guideIndex.guides || []) {
  assert(entry.id, "Each guide index entry needs an id.");
  const guideDir = path.join(guidesDir, entry.id || "");
  const guidePath = path.join(guideDir, "guide.json");
  assert(exists(guidePath), `${entry.id}: missing guide.json.`);
  if (!exists(guidePath)) continue;

  const guide = readJson(guidePath);
  assert(guide.id === entry.id, `${entry.id}: guide.id must match index id.`);
  assert(guide.title, `${entry.id}: title is required.`);
  assert(Array.isArray(guide.stops) && guide.stops.length > 0, `${entry.id}: stops must be a non-empty array.`);
  validateAsset(guideDir, entry.id, "map", guide.map?.image);

  const seenStopIds = new Set();
  for (const [index, stop] of (guide.stops || []).entries()) {
    const prefix = `${entry.id}: stop ${index + 1}`;
    assert(stop.id, `${prefix} needs an id.`);
    assert(!seenStopIds.has(stop.id), `${entry.id}: duplicate stop id ${stop.id}.`);
    seenStopIds.add(stop.id);
    assert(stop.title, `${prefix} needs a title.`);
    assert(Array.isArray(stop.script) && stop.script.length > 0, `${prefix} needs script paragraphs.`);
    validateAsset(guideDir, entry.id, `audio for ${stop.id}`, stop.audio);
    for (const image of stop.images || []) {
      validateAsset(guideDir, entry.id, `image for ${stop.id}`, image.src);
    }
    if (stop.map) {
      assert(Number.isFinite(stop.map.x) && stop.map.x >= 0 && stop.map.x <= 100, `${prefix} map.x must be 0-100.`);
      assert(Number.isFinite(stop.map.y) && stop.map.y >= 0 && stop.map.y <= 100, `${prefix} map.y must be 0-100.`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Validated ${guideIndex.guides.length} guide(s).`);
