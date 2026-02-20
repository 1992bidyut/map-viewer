import * as shapefile from 'shapefile';
import proj4 from 'proj4';

// Register common projections
proj4.defs('EPSG:32646', '+proj=utm +zone=46 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:32647', '+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs');

// Parse GeoJSON files
async function parseGeoJSON(files) {
  const geojsonFile = files.find(f => f.name.toLowerCase().endsWith('.geojson') || f.name.toLowerCase().endsWith('.json'));
  
  if (!geojsonFile) throw new Error('No .geojson or .json file found');
  
  const text = await geojsonFile.text();
  const geojson = JSON.parse(text);
  
  if (!geojson.features || !Array.isArray(geojson.features)) {
    throw new Error('Invalid GeoJSON: missing features array');
  }
  
  console.log(`Parsed GeoJSON with ${geojson.features.length} features`);
  
  return {
    type: 'FeatureCollection',
    features: geojson.features,
    name: geojsonFile.name.replace(/\.(geojson|json)$/i, ''),
    featureCount: geojson.features.length,
    properties: geojson.features.length > 0 ? Object.keys(geojson.features[0].properties || {}) : [],
  };
}

function detectProjection(prjText) {
  if (!prjText) return null;
  if (prjText.includes('GCS_WGS_1984') || prjText.includes('WGS84') || prjText.includes('WGS 1984')) {
    return null; // Already WGS84
  }
  if (prjText.includes('UTM') && prjText.includes('46')) return 'EPSG:32646';
  if (prjText.includes('UTM') && prjText.includes('47')) return 'EPSG:32647';
  return null;
}

function reprojectCoord(coord, fromProj) {
  if (!fromProj) return coord;
  try {
    return proj4(fromProj, 'WGS84', coord);
  } catch { return coord; }
}

function reprojectGeometry(geometry, fromProj) {
  if (!fromProj || !geometry) return geometry;
  
  function reprojectCoords(coords, depth = 0) {
    if (depth === 0) return reprojectCoord(coords, fromProj);
    return coords.map(c => reprojectCoords(c, depth - 1));
  }

  const clone = JSON.parse(JSON.stringify(geometry));
  
  switch (geometry.type) {
    case 'Point':
      clone.coordinates = reprojectCoord(geometry.coordinates, fromProj);
      break;
    case 'LineString':
    case 'MultiPoint':
      clone.coordinates = geometry.coordinates.map(c => reprojectCoord(c, fromProj));
      break;
    case 'Polygon':
    case 'MultiLineString':
      clone.coordinates = geometry.coordinates.map(ring => ring.map(c => reprojectCoord(c, fromProj)));
      break;
    case 'MultiPolygon':
      clone.coordinates = geometry.coordinates.map(poly => poly.map(ring => ring.map(c => reprojectCoord(c, fromProj))));
      break;
    default: break;
  }
  return clone;
}

export async function parseShapefile(files) {
  // Check if this is a GeoJSON upload
  const hasGeojson = files.some(f => f.name.toLowerCase().endsWith('.geojson') || f.name.toLowerCase().endsWith('.json'));
  const hasShp = files.some(f => f.name.toLowerCase().endsWith('.shp'));
  
  if (hasGeojson && !hasShp) {
    console.log('Detected GeoJSON file upload');
    return parseGeoJSON(files);
  }

  // Otherwise, parse as shapefile
  const fileMap = {};
  for (const file of files) {
    const ext = file.name.split('.').pop().toLowerCase();
    fileMap[ext] = file;
  }

  if (!fileMap.shp) throw new Error('No .shp file found');

  const shpBuffer = await fileMap.shp.arrayBuffer();
  const dbfBuffer = fileMap.dbf ? await fileMap.dbf.arrayBuffer() : null;
  const prjText = fileMap.prj ? await fileMap.prj.text() : null;
  const fromProj = detectProjection(prjText);

  console.log(`Parsing shapefile: ${fileMap.shp.name}, projection detected:`, fromProj);

  const features = [];
  const source = await shapefile.open(shpBuffer, dbfBuffer);
  
  let result = await source.read();
  while (!result.done) {
    if (result.value && result.value.geometry) {
      const geometry = fromProj 
        ? reprojectGeometry(result.value.geometry, fromProj)
        : result.value.geometry;
      features.push({ ...result.value, geometry });
    }
    result = await source.read();
  }

  console.log(`✓ Extracted ${features.length} features from shapefile`);
  
  if (features.length === 0) {
    console.warn('Warning: No features found in shapefile');
  } else {
    console.log(`Sample feature:`, features[0]);
  }

  const fileName = fileMap.shp.name.replace('.shp', '');
  
  const geojson = {
    type: 'FeatureCollection',
    features,
    name: fileName,
    featureCount: features.length,
    properties: features.length > 0 ? Object.keys(features[0].properties || {}) : [],
  };

  console.log(`GeoJSON created:`, geojson);
  
  return geojson;
}

export function getBounds(geojson) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  
  function processCoords(coords) {
    if (typeof coords[0] === 'number') {
      minLng = Math.min(minLng, coords[0]);
      maxLng = Math.max(maxLng, coords[0]);
      minLat = Math.min(minLat, coords[1]);
      maxLat = Math.max(maxLat, coords[1]);
    } else {
      coords.forEach(processCoords);
    }
  }
  
  geojson.features.forEach(f => {
    if (f.geometry) processCoords(f.geometry.coordinates);
  });
  
  return [[minLat, minLng], [maxLat, maxLng]];
}

export function formatValue(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}
