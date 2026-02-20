/* ============================================================
   js/main.js — Application entry point
   Responsibilities:
     - Fetch GeoJSON data
     - Coordinate module initialisation
     - Handle loading / error states
   ============================================================ */

import { CONFIG }        from './config.js';
import { initMap }       from './map.js';
import { initControls }  from './controls.js';
import { initTooltip }   from './tooltip.js';
import { populateStats } from './stats.js';

async function bootstrap() {
  /* ── 1. Fetch data ────────────────────────────────────── */
  let geojson;
  try {
    const res = await fetch(CONFIG.dataPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    geojson = await res.json();
  } catch (err) {
    showError(`Failed to load map data: ${err.message}`);
    return;
  }

  /* ── 2. Render map ────────────────────────────────────── */
  const { svg, paths, zoom } = initMap(geojson);

  /* ── 3. Wire zoom controls ────────────────────────────── */
  initControls(svg, zoom);

  /* ── 4. Wire tooltip ──────────────────────────────────── */
  const tooltipEl   = document.getElementById('tooltip');
  const containerEl = document.querySelector('.map-container');
  initTooltip(paths, tooltipEl, containerEl);

  /* ── 5. Populate info bar stats ───────────────────────── */
  populateStats(geojson);
}

/** Render an error message into the map container. */
function showError(message) {
  const container = document.querySelector('.map-container');
  if (container) {
    container.innerHTML = `
      <div style="
        display:flex; align-items:center; justify-content:center;
        height:400px; color:var(--red); font-size:0.75rem;
        letter-spacing:0.1em; text-transform:uppercase; gap:0.5rem;
      ">
        <span>⚠</span> ${message}
      </div>`;
  }
}

/* ── Kick off ─────────────────────────────────────────────── */
bootstrap();
