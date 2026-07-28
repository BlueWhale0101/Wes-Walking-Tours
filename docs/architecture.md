# Architecture

This repo is intentionally static and modular.

## File Layout

| Path | Purpose |
| --- | --- |
| `index.html` | Minimal app host for GitHub Pages |
| `src/styles.css` | Phone-first field UI styles |
| `src/main.js` | App bootstrapping |
| `src/modules/app.js` | Rendering and guide interaction |
| `src/modules/audio.js` | Audio playback and browser speech fallback |
| `src/modules/guide-loader.js` | Guide index and guide JSON loading |
| `src/modules/offline.js` | Service worker registration and offline download request |
| `service-worker.js` | App shell cache and per-guide asset cache |
| `guides/index.json` | Published guide list and default guide |
| `guides/{id}/guide.json` | One guide's content and asset references |
| `tools/validate-guide.mjs` | JSON and asset validation |
| `tools/build-cache-manifest.mjs` | Offline asset manifest generation |

## Design Rules

- App behavior belongs in `src/modules`.
- Guide content belongs in `guides/{id}/guide.json`.
- Guide-specific assets stay inside that guide folder.
- Scripts should be authored as paragraphs, not one giant string.
- Reference links are optional field extras; important images should be local and inline.
- Offline use requires local assets and an updated cache manifest.

## Offline Model

The service worker caches the app shell on install. The user can then tap `Download for Offline Use`, which caches every local asset listed for the active guide in `src/generated/cache-manifest.js`.

Run `npm run build:cache` whenever guide assets change.
