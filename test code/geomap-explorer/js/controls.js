/* ============================================================
   js/controls.js — Zoom button controls
   Responsibilities:
     - Wire up +, −, and reset (⌂) buttons to the D3 zoom
   ============================================================ */

import { CONFIG } from './config.js';

/**
 * Bind zoom buttons to the D3 zoom behaviour.
 * @param {d3.Selection} svg   - The root SVG selection
 * @param {d3.ZoomBehavior} zoom - The zoom instance from map.js
 */
export function initControls(svg, zoom) {
  const { zoomStep } = CONFIG.controls;

  d3.select('#zoomIn').on('click', () =>
    svg.transition().duration(300).call(zoom.scaleBy, zoomStep)
  );

  d3.select('#zoomOut').on('click', () =>
    svg.transition().duration(300).call(zoom.scaleBy, 1 / zoomStep)
  );

  d3.select('#reset').on('click', () =>
    svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity)
  );
}
