# Wes Walking Tours

A lightweight, phone-first framework for data-driven walking audio guides.

The app is built for GitHub Pages and weak-signal field use: plain static files, local guide assets, offline caching, inline reference images, and guide content stored outside the app shell.

## Quick Start

1. Copy `guides/_template` to `guides/my-guide`.
2. Edit `guides/my-guide/guide.json`.
3. Add local map, image, and audio assets inside that guide folder.
4. Add the guide to `guides/index.json`.
5. Run:

```bash
npm run check
```

6. Commit and publish with GitHub Pages.

See `docs/guide-authoring.md` for the repeatable guide process.
