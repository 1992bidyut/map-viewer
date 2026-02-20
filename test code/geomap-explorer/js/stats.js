/* ============================================================
   js/stats.js — Populate the info bar with GeoJSON metadata
   Responsibilities:
     - Count polygons / rings in the loaded feature
     - Write values into #polyCount and any other stat slots
   ============================================================ */

/**
 * Populate info-bar stat elements from the loaded GeoJSON.
 * @param {Object} geojson - Loaded GeoJSON FeatureCollection
 */
export function populateStats(geojson) {
  const feature = geojson.features[0];
  if (!feature) return;

  const geom = feature.geometry;

  let polyCount = 0;
  let pointCount = 0;

  if (geom.type === 'MultiPolygon') {
    polyCount  = geom.coordinates.length;
    pointCount = geom.coordinates
      .flat(2)          // flatten polygon → ring → point
      .length;
  } else if (geom.type === 'Polygon') {
    polyCount  = 1;
    pointCount = geom.coordinates.flat().length;
  }

  setEl('polyCount',  polyCount.toLocaleString());
  setEl('pointCount', pointCount.toLocaleString());
}

/** Safely update an element's text content by id. */
function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
