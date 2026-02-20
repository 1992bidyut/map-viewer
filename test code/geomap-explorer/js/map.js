/* ============================================================
   js/map.js — Core D3 map rendering
   Responsibilities:
     - Create SVG projection (Mercator, fit to data)
     - Render land polygons
     - Render graticule grid
     - Expose { svg, g, path, zoom } for other modules
   ============================================================ */

import { CONFIG } from './config.js';

/**
 * Initialise and render the map inside #map SVG.
 * @param {Object} geojson  - Loaded GeoJSON FeatureCollection
 * @returns {{ svg, g, paths, path, zoom }} D3 selections & helpers
 */
export function initMap(geojson) {
  const { width, height } = CONFIG.map;

  const svg = d3.select('#map');

  /* ── Projection ─────────────────────────────────────────── */
  const projection = d3.geoMercator()
    .fitSize([width - 40, height - 40], geojson)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  /* ── Root group (transform target for pan/zoom) ─────────── */
  const g = svg.append('g');

  /* ── Graticule (1° grid) ────────────────────────────────── */
  const graticule = d3.geoGraticule().step(CONFIG.map.graticuleStep);
  g.append('path')
    .datum(graticule())
    .attr('class', 'graticule')
    .attr('d', path);

  /* ── Land polygons ──────────────────────────────────────── */
  const paths = g.selectAll('path.land')
    .data(geojson.features)
    .join('path')
    .attr('class', 'land')
    .attr('d', path);

  /* ── Zoom behaviour ─────────────────────────────────────── */
  const zoom = d3.zoom()
    .scaleExtent(CONFIG.map.zoomExtent)
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
      // Keep stroke width visually constant regardless of zoom level
      g.selectAll('.land')
        .attr('stroke-width', CONFIG.map.strokeWidth / event.transform.k);
    });

  svg.call(zoom);

  return { svg, g, paths, path, zoom };
}
