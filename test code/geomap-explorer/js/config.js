/* ============================================================
   js/config.js — Central configuration / constants
   Change values here to tune map behaviour app-wide.
   ============================================================ */

export const CONFIG = {
  /* GeoJSON data path (relative to index.html) */
  dataPath: 'data/bangladesh.geojson',

  map: {
    /** SVG canvas dimensions (viewBox units) */
    width:  800,
    height: 700,

    /** D3 zoom scale range [min, max] */
    zoomExtent: [0.5, 20],

    /** Default land path stroke width (scales inversely with zoom) */
    strokeWidth: 0.5,

    /** Graticule grid step in degrees [longitude, latitude] */
    graticuleStep: [1, 1],
  },

  controls: {
    /** Multiplicative zoom step for + / − buttons */
    zoomStep: 1.5,
  },

  meta: {
    countryName: 'Bangladesh',
    adminLevel:  'ADM0',
    source:      'OCHA / BBS',
    date:        '2020-11-13',
    projection:  'WGS84 (EPSG:4326)',
    bboxText:    '88.009°E — 92.680°E, 20.591°N — 26.635°N',
  },
};
