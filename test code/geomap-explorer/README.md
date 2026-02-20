# Geomap Explorer — Bangladesh ADM0

A clean, modular D3.js map viewer for the Bangladesh administrative boundary shapefile (BBS, 2020).

---

## Project Structure

```
geomap-explorer/
│
├── index.html              # Entry point — markup only, no inline styles or scripts
│
├── css/
│   ├── variables.css       # Design tokens (colours, fonts, spacing, transitions)
│   ├── layout.css          # Body, header, main, footer layout
│   └── map.css             # Map container, SVG, land paths, controls, tooltip
│
├── js/
│   ├── config.js           # Central config (data path, zoom limits, map dimensions)
│   ├── main.js             # Entry point — fetches data, wires all modules together
│   ├── map.js              # D3 map rendering (projection, land paths, graticule)
│   ├── controls.js         # Zoom +/−/reset button wiring
│   ├── tooltip.js          # Hover tooltip positioning and label building
│   └── stats.js            # Info-bar statistics (polygon/vertex counts)
│
└── data/
    └── bangladesh.geojson  # Converted & simplified shapefile (WGS84, ~550 KB)
```

---

## Responsibilities at a glance

| File | What it owns |
|---|---|
| `config.js` | All magic numbers and tunable constants |
| `map.js` | D3 projection, path rendering, zoom behavior |
| `controls.js` | Button → zoom event wiring |
| `tooltip.js` | Tooltip DOM positioning and label text |
| `stats.js` | Reading GeoJSON metadata → info bar |
| `main.js` | Orchestration only — no rendering logic |

---

## Running locally

Because `main.js` uses ES modules and fetches the GeoJSON, you need a local HTTP server (opening `index.html` directly as a `file://` URL will be blocked by CORS).

**Option 1 — Python (no install needed)**
```bash
cd geomap-explorer
python3 -m http.server 8080
# Open http://localhost:8080
```

**Option 2 — Node / npx**
```bash
npx serve geomap-explorer
```

**Option 3 — VS Code**
Install the **Live Server** extension and click *Go Live*.

---

## Adding more data layers

1. Drop additional GeoJSON files into `data/` (e.g. `adm1_divisions.geojson`).
2. Add a new entry to `config.js` under `dataPath`.
3. Create a new rendering function in `map.js` or a dedicated `js/layers/divisions.js`.
4. Call it from `main.js` after the base layer is drawn.

---

## Data source

- **File**: `bgd_admbnda_adm0_bbs_20201113.shp`
- **Provider**: Bangladesh Bureau of Statistics (BBS) via OCHA HDX
- **Date**: 2020-11-13
- **Projection**: WGS84 (EPSG:4326)
- **Bounding box**: 88.009°E – 92.680°E, 20.591°N – 26.635°N
