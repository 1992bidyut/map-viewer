# GIS Viewer

A high-performance, browser-based GIS map visualization tool built with React and Leaflet. Upload unlimited shapefile layers, inspect feature attributes, and customize visualization in real time.

---

## Features

- **Unlimited Layer Upload** — Drop any shapefile set (.shp, .dbf, .prj, .shx) to add layers
- **Multi-layer Stacking** — All uploaded layers render on top of each other
- **Mouse-over Info Panel** — Hover over any feature to see all attribute data
- **Click to Select & Zoom** — Click a feature to lock its info and zoom into it
- **Layer Controls** — Toggle visibility, adjust opacity, change color per layer
- **Performance Optimization** — Auto-simplifies large datasets for smooth rendering
- **Persistent Settings** — Initial zoom/center saved to localStorage
- **Dark Map Theme** — CartoDB dark basemap for crisp visualization

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# Extract and enter the project
cd gis-viewer

# Install dependencies
npm install

# Start development server (Vite)
npm start
# → Opens at http://localhost:3000
```

### Production Build

```bash
npm run build
# Output in /build — serve with any static file server
npx serve build   # quick local preview
```

---

## Docker Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Production — build and run on port 3000
docker compose up --build -d

# View logs
docker compose logs -f gis-viewer

# Stop
docker compose down
```

The app will be available at **http://localhost:3000**

### Option 2: Plain Docker

```bash
# Build the image
docker build -t gis-viewer .

# Run container (maps port 3000 on host to port 80 in container)
docker run -d \
  --name gis-viewer \
  -p 3000:80 \
  --restart unless-stopped \
  gis-viewer

# View logs
docker logs -f gis-viewer

# Stop and remove
docker stop gis-viewer && docker rm gis-viewer
```

### Option 3: Docker Compose Dev Mode (Hot Reload)

```bash
# Start with dev profile (hot reload on port 3001)
docker compose --profile dev up gis-viewer-dev
# → Opens at http://localhost:3001
```

---

## Usage Guide

### Uploading Shapefiles
1. Click **+ Upload Layer** in the header
2. Drag and drop all files for a shapefile (`.shp`, `.dbf`, `.prj`, `.shx`, `.cpg`)
3. You can drop multiple shapefile sets at once — each becomes a separate layer

### Exploring Data
- **Hover** over any polygon/point/line to see its attributes in the bottom-right panel
- **Click** a feature to lock the info panel and zoom in
- Click again or press **✕** to deselect

### Layer Management (left sidebar)
- **Color square** — Click to toggle visibility
- **⊕ button** — Fit map to this layer's bounds
- **≡ button** — Expand layer options (opacity, color, fields)
- **✕ button** — Remove layer

### Settings
Click **⚙ Settings** in the header to configure:
- **Initial zoom level** — Default map zoom on page load
- **Initial lat/lng** — Default map center on page load
- **Simplification tolerance** — Controls auto-simplification for large datasets
- **Max features threshold** — Layers above this count will be auto-simplified

Settings persist in browser localStorage across sessions.

---

## Project Structure

```
gis-viewer/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Top navigation bar
│   │   ├── LayersPanel.jsx     # Left sidebar layer manager
│   │   ├── MapView.jsx         # Leaflet map (main canvas)
│   │   ├── FeatureInfo.jsx     # Hover/click attribute panel
│   │   ├── UploadModal.jsx     # Shapefile upload dialog
│   │   └── SettingsModal.jsx   # Settings dialog
│   ├── store/
│   │   └── useStore.js         # Zustand global state
│   ├── utils/
│   │   └── shapefileParser.js  # Shapefile → GeoJSON + reprojection
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── package.json
```

---

## Performance Notes

- Large shapefiles (10k+ polygons) are **automatically simplified** based on coordinate count
- Turf.js simplification runs in the browser before Leaflet rendering
- Coordinate reprojection from common UTM zones is handled automatically via `proj4`
- Leaflet's canvas renderer is used for point layers

---

## Supported Shapefile Projections

- **WGS84 / EPSG:4326** — Natively supported
- **UTM Zone 46N (EPSG:32646)** — Auto-reprojected
- **UTM Zone 47N (EPSG:32647)** — Auto-reprojected
- Other projections: Include the `.prj` file; if the format is recognized it will be reprojected automatically

---

## Tech Stack

| Library | Purpose |
|---|---|
| React 18 | UI framework |
| Leaflet + react-leaflet | Map rendering |
| shapefile.js | Parse .shp/.dbf files |
| proj4 | Coordinate reprojection |
| Zustand | Global state management |
| react-dropzone | File drag & drop |
| nginx | Production static file server |

---

## Auto Git Workflow

An automated process to detect changes, generate commit messages, and push to remote in a single command.

### Quick Prompts to Trigger the Process

Use **any** of these prompts:
- `"Auto commit and push"`
- `"Auto git workflow"`
- `"Run auto commit"`
- `"Execute auto git process"`

### Process Steps

1. **Detect Changes** — Scans the repository for all modified, staged, and new files
2. **Analyze Changes** — Reviews file diffs to determine the nature of changes (feature, fix, docs, etc.)
3. **Generate Commit Message** — Creates a meaningful, descriptive commit message based on analysis
4. **Auto-Stage Files** — Runs `git add .` to stage all changes
5. **Auto-Commit** — Commits with the generated message
6. **Auto-Push** — Pushes commits to the remote branch

### Example Output

```
✅ Process Complete!

Step 1: Auto-detected Changes — Found 5 modified files
Step 2: Generated Commit Message — "feat: add layer filtering UI"
Step 3: Auto-committed — 5 files changed, 142 insertions(+)
Step 4: Auto-pushed — Pushed to remote branch 'main'
```

### When to Use

- After making code changes and want to commit quickly
- When you want meaningful commit messages without manual typing
- During iterative development cycles
- Before taking breaks to save progress

### Notes

- Commit messages follow conventional commits format (`feat:`, `fix:`, `docs:`, etc.)
- All changed files are automatically staged and committed together
- Push happens immediately after commit
- No manual git commands needed