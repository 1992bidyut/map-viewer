/* ============================================================
   js/tooltip.js — Hover tooltip for map features
   Responsibilities:
     - Show/hide the .tooltip element on path hover
     - Position tooltip relative to the map container
     - Build tooltip text from feature properties
   ============================================================ */

/**
 * Attach tooltip behaviour to the land path selection.
 * @param {d3.Selection} paths         - D3 selection of .land paths
 * @param {HTMLElement}  tooltipEl     - The .tooltip DOM element
 * @param {HTMLElement}  containerEl   - The .map-container DOM element
 */
export function initTooltip(paths, tooltipEl, containerEl) {
  paths
    .on('mousemove', function (event, d) {
      const bounds = containerEl.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;

      tooltipEl.style.opacity = '1';
      tooltipEl.style.left = `${x + 14}px`;
      tooltipEl.style.top  = `${y - 12}px`;
      tooltipEl.textContent = buildLabel(d);
    })
    .on('mouseleave', function () {
      tooltipEl.style.opacity = '0';
    });
}

/**
 * Build the tooltip label from a GeoJSON feature.
 * Extend this function to display richer property data
 * once higher-resolution ADM1/ADM2 layers are loaded.
 *
 * @param   {Object} feature - GeoJSON Feature
 * @returns {string}
 */
function buildLabel(feature) {
  const props = feature.properties || {};

  // ADM0 boundary only has a name at country level
  return props.ADM0_EN
    ? `${props.ADM0_EN} · ADM0 Boundary`
    : 'Bangladesh · ADM0 Boundary';
}
