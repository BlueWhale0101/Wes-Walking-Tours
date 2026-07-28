import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const guidesDir = path.join(repoRoot, "guides");
const generatedDir = path.join(repoRoot, "src", "generated");
const index = JSON.parse(fs.readFileSync(path.join(guidesDir, "index.json"), "utf8"));
const manifest = {};
const isRemote = (value = "") => /^(https?:)?\/\//.test(value) || value.startsWith("data:");

const addAsset = (assets, guideId, asset) => {
  if (!asset || isRemote(asset)) return;
  assets.add(`./guides/${guideId}/${asset}`);
};

for (const entry of index.guides || []) {
  const guidePath = path.join(guidesDir, entry.id, "guide.json");
  const guide = JSON.parse(fs.readFileSync(guidePath, "utf8"));
  const assets = new Set([`./guides/${entry.id}/guide.json`]);
  addAsset(assets, entry.id, guide.map?.image);
  for (const stop of guide.stops || []) {
    addAsset(assets, entry.id, stop.audio);
    for (const image of stop.images || []) {
      addAsset(assets, entry.id, image.src);
    }
  }
  manifest[entry.id] = [...assets];
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.writeFileSync(
  path.join(generatedDir, "cache-manifest.js"),
  `self.GUIDE_CACHE_ASSETS = ${JSON.stringify(manifest, null, 2)};\n`
);

console.log(`Wrote cache manifest for ${Object.keys(manifest).length} guide(s).`);
