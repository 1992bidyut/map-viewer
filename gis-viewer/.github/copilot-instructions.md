# GIS Viewer — AI Agent Instructions

## Architecture Overview

This is a **React-based GIS map visualization tool** with a three-layer architecture:

1. **State Layer** (`src/store/useStore.js`): Zustand store managing layers, feature selection, user settings, and color assignment. Settings persist to localStorage.
2. **Parser Layer** (`src/utils/shapefileParser.js`): Handles shapefile parsing (`.shp`, `.dbf`, `.prj`) with automatic projection detection and coordinate reprojection (UTM zones 46-47 → WGS84).
3. **UI Layer** (`src/components/`): React components for map interaction, layer controls, feature info, and modal dialogs.

**Data Flow:** Shapefile Upload → Parse (via Web Workers capable through async parsing) → Store Layer → MapView renders GeoJSON → User interactions (hover/click) update Store → FeatureInfo displays attributes.

## Key Patterns & Conventions

### Layer Management
- Layers are stored with unique IDs (`layer-${timestamp}-${counter}`), colors, opacity, visibility state, and GeoJSON features
- Colors auto-cycle from 10-color palette in `useStore.js`
- Each layer can be toggled, removed, or customized independently
- Layer removal cascades: selected/hovered features belonging to deleted layers are cleared

### Projection Handling
- `shapefileParser.js` detects projections from `.prj` files: checks for WGS84 keywords or UTM zone patterns
- UTM coordinates are reprojected to WGS84 via `proj4` before storage (required for Leaflet compatibility)
- If projection detection fails, coordinates pass through unchanged—assume WGS84
- **Example:** A UTM zone 46 shapefile will be auto-detected in `detectProjection()` and reprojected via `createOrthogonal()` → `reprojectGeometry()`

### Simplification Strategy
- Large geometry datasets (500+ features) trigger automatic simplification in `MapView.jsx`
- Tolerance controlled by `useStore.settings.simplifyTolerance` (default 0.001 degrees ≈ 100m)
- Simplification filters collinear points to reduce coordinate count without distortion
- **Do not skip simplification:** impacts rendering performance on large files

### Component Communication
- **Leaf props drilling:** `fitLayerRef` passed through App → MapView allows layer-to-map communication without prop chains
- **Store subscriptions:** Components destructure only needed selectors (`useStore(s => s.layers)`) to minimize re-renders
- Modal dialogs (UploadModal, SettingsModal) are conditional renders in App, not route-based

### Error Handling Patterns
- Async operations (shapefile parsing) use try-catch with user-facing messages
- `UploadModal.jsx` groups multiple file uploads by base name, parses each independently, collects errors
- Parser returns GeoJSON with `name` property derived from file name
- If parsing fails, error persists in UI until dismissed; partial uploads show success count + error list

## Developer Workflows

### Local Development
```bash
npm install
npm start            # Starts react-scripts dev server at http://localhost:3000
```

### Production Build
```bash
npm run build        # Outputs to /build
npx serve build      # Local preview
```

### Docker Deployment
- Multi-stage build: Node builder → nginx production
- `nginx.conf` configured for SPA: fallback to `index.html` for client-side routing (currently not used; all UI is in App.jsx)
- Port 80 exposed; serves static assets

## Integration Points & External Dependencies

| Package | Purpose | Integration Notes |
|---------|---------|-------------------|
| `leaflet@1.9.4` | Map rendering | MapView initializes L.Map; handles icon URL fixes for CDN resources |
| `react-leaflet@4.2.1` | React bindings (not currently used) | Could replace manual L.Map management; currently using raw Leaflet |
| `shapefile@0.6.6` | Shapefile parsing | Handles `.shp` + `.dbf` binary buffers; returns features with geometry |
| `proj4@2.10.0` | Projection transforms | Pre-registered EPSG:32646/32647 (UTM zones 46-47); extend with `proj4.defs()` for new zones |
| `@turf/bbox` | Geometry bounds | Used by Leaflet fitBounds for layer zoom-to-fit |
| `react-dropzone` | File drag-drop | UploadModal integrates via `useDropzone` hook; accepts multiple file groups |
| `zustand@4.5.2` | State management | Single store; subscribe via hook syntax; auto-subscribe for updates |

## Testing & Debugging

- **No test suite present.** Consider adding Jest + React Testing Library for component and parser safety.
- **Projection debugging:** Check `.prj` file content with `detectProjection()` log output; manually test with `reprojectCoord([lng, lat], fromProj)`
- **Performance:** Monitor browser DevTools during large file uploads; simplification tolerance can be tuned via Settings modal
- **Browser console:** Logs from parse errors, reprojection failures, and Leaflet interactions visible in DevTools

## When Adding Features

1. **New layer property?** Add to store state in `useStore.js` and include in layer initialization (`addLayer` action)
2. **New projection?** Register in `shapefileParser.js` via `proj4.defs('EPSG:XXXX', ...)` before `detectProjection()` check
3. **New file format?** Extend `parseShapefile()` to accept additional buffers; ensure geojson.features match shapefile schema
4. **Map interaction?** Add handler in `MapView.jsx` and dispatch via `setSelectedFeature()` or `setHoverFeature()`
5. **Settings?** Add to `defaultSettings` in store, expose UI in `SettingsModal.jsx`, update `localStorage` key consistently

## Common Pitfalls

- **Leaflet icon URLs:** Default icon path points to CDN; must be fixed (already done in MapView)
- **Projection loss:** Forgetting to reproject non-WGS84 coordinates breaks map positioning
- **Large files:** Skipping simplification causes browser freezes; always respect `simplifyTolerance`
- **Async file I/O:** `parseShapefile()` is async; ensure callers use `await` or `.then()`
- **Store mutations:** Zustand actions must return new state objects, never mutate existing state directly
