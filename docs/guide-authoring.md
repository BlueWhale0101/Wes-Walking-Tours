# Guide Authoring Process

Use this when making a new guide quickly without turning the repo into one giant page.

## Add A Guide

This is the mechanical path for adding a new guide once the app framework exists.

1. Copy the template folder:

```bash
cp -R guides/_template guides/my-guide-id
```

2. Rename the guide inside `guides/my-guide-id/guide.json`:

```json
{
  "id": "my-guide-id",
  "title": "My Guide Title"
}
```

3. Put all guide-owned assets inside that folder:

```text
guides/my-guide-id/
  guide.json
  assets/map.jpg
  audio/stop-01.mp3
  images/reference-01.jpg
```

4. Reference assets from `guide.json` using paths relative to the guide folder:

```json
{
  "map": {
    "image": "assets/map.jpg"
  },
  "stops": [
    {
      "audio": "audio/stop-01.mp3",
      "images": [
        {
          "src": "images/reference-01.jpg",
          "alt": "Reference image description",
          "caption": "Short field-useful caption."
        }
      ]
    }
  ]
}
```

5. Add the guide to `guides/index.json`:

```json
{
  "defaultGuideId": "my-guide-id",
  "guides": [
    {
      "id": "my-guide-id",
      "title": "My Guide Title",
      "status": "draft"
    }
  ]
}
```

6. Run the repo checks:

```bash
npm run check
```

The check validates required fields, confirms local assets exist, and rebuilds `src/generated/cache-manifest.js` so the offline download knows which files belong to each guide.

## 1. Define The Field Job

Answer these before writing:

| Question | Why It Matters |
| --- | --- |
| Who is walking? | Sets tone, depth, pace, and risk tolerance |
| How much time is available? | Controls route ambition and stop count |
| What can change today? | Identifies transport, hours, weather, closures, tides, heat, safety |
| What is the intellectual spine? | Prevents shallow tourist blurbs |
| Where will signal fail? | Decides what must be local and offline |

## 2. Build The Stop Plan

Use a mix of stop types:

| Stop Type | Use For |
| --- | --- |
| `field briefing` | Orientation, safety, timing, route choice |
| `history lecture` | Deeper background not tied to a sign |
| `ranger guide` | Ecology, geology, landscape reading |
| `construction/logistics` | How people built, supplied, maintained, or survived the place |
| `site interpretation` | What to notice at the exact stop |
| `transition` | Walk-and-listen segment between major points |

For adult guides, a good default is 8-14 stops. Add more stops on ascents or long transfers where listening fills the walk.

## 3. Research The Guide

Prioritize current and primary sources:

- Official park, council, airport, transit, museum, and government pages.
- Current opening hours, closures, alerts, and transport timetables.
- Historical society, academic, museum, or archive sources for depth.
- Local safety context: heat, tides, crocodiles, weather, water availability, mobile reception.

Save references in each stop, but put field-critical facts directly in the script.

## 4. Write Scripts

Scripts are the product.

- Write for listening, not reading.
- Use concrete numbers, names, dates, materials, distances, and constraints.
- Tell the listener what to look at now.
- Let paragraphs end cleanly for TTS.
- Avoid vague phrases like “rich history” unless the next sentence proves it.
- Alternate modes so the guide feels like a historian and a ranger taking turns.

Target length:

| Segment | Good Range |
| --- | --- |
| Short orientation | 1-2 min |
| Normal stop | 3-6 min |
| Deep lecture | 6-9 min |

## 5. Add Assets

Place everything inside the guide folder:

```text
guides/my-guide/
  guide.json
  assets/map.jpg
  audio/stop-01.mp3
  images/reference-01.jpg
```

Prefer local images over remote links for field use. Remote reference links are for later reading.

## 6. Validate And Cache

Run:

```bash
npm run check
```

This validates required guide fields, checks local assets exist, and writes the offline cache manifest.
