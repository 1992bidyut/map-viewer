import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '../store/useStore';
import { getBounds } from '../utils/shapefileParser';

// Simplify polygon coordinates for large datasets
function simplifyFeatures(geojson, tolerance) {
  if (!tolerance || tolerance === 0) return geojson;
  try {
    return {
      ...geojson,
      features: geojson.features.map(f => {
        if (!f.geometry || !['Polygon', 'MultiPolygon'].includes(f.geometry.type)) return f;
        return {
          ...f,
          geometry: simplifyGeometry(f.geometry, tolerance),
        };
      }),
    };
  } catch { return geojson; }
}

function simplifyGeometry(geometry, tolerance) {
  function simplifyRing(ring) {
    if (ring.length <= 4) return ring;
    return ring.filter((point, i) => {
      if (i === 0 || i === ring.length - 1) return true;
      const prev = ring[i - 1];
      const dx = point[0] - prev[0];
      const dy = point[1] - prev[1];
      return Math.sqrt(dx * dx + dy * dy) > tolerance;
    });
  }
  if (geometry.type === 'Polygon') {
    return { ...geometry, coordinates: geometry.coordinates.map(simplifyRing) };
  }
  if (geometry.type === 'MultiPolygon') {
    return { ...geometry, coordinates: geometry.coordinates.map(poly => poly.map(simplifyRing)) };
  }
  return geometry;
}

export default function MapView({ fitLayerRef }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupsRef = useRef({});
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const { layers, settings, setSelectedFeature, setHoverFeature } = useStore();
  const lastUploadedLayerId = useStore(s => s.lastUploadedLayerId);

  // Load keys from environment variables
  const GOOGLE_MAP_KEY = process.env.REACT_APP_GOOGLE_MAP_KEY;
  const GOOGLE_MAP_ID = process.env.REACT_APP_GOOGLE_MAP_ID;

  // Initialize Google Maps
  useEffect(() => {
    if (mapInstanceRef.current) return;

    // Load Google Maps JS API dynamically
    const loadGoogleMaps = () => new Promise((resolve, reject) => {
      if (window.google && window.google.maps) return resolve(window.google.maps);
      const script = document.createElement('script');
      const src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAP_KEY}&map_ids=${GOOGLE_MAP_ID}`;
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google.maps);
      script.onerror = reject;
      document.head.appendChild(script);
    });

    let cancelled = false;
    // fail-safe timeout
    const timeout = setTimeout(() => {
      console.error('Google Maps API load timed out');
      setMapLoadFailed(true);
    }, 10000);

    loadGoogleMaps().then((gmaps) => {
      if (cancelled) return;
      clearTimeout(timeout);
      try {
        console.log('Initializing Google Map...', { mapRef: mapRef.current, containerSize: mapRef.current ? { width: mapRef.current.clientWidth, height: mapRef.current.clientHeight } : 'N/A' });
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: settings.initialLat, lng: settings.initialLng },
          zoom: settings.initialZoom,
          mapId: GOOGLE_MAP_ID,
          gestureHandling: 'auto',
          fullscreenControl: false,
        });
        console.log('✓ Google Map initialized successfully', map);
        mapInstanceRef.current = map;
      } catch (err) {
        console.error('Error creating Google Map instance', err);
        setMapLoadFailed(true);
      }
    }).catch((e) => {
      clearTimeout(timeout);
      console.error('Failed to load Google Maps API', e);
      setMapLoadFailed(true);
    });

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []); // eslint-disable-line

  // Handle fit layer from parent
  useEffect(() => {
    if (fitLayerRef) {
      fitLayerRef.current = (layer) => {
        if (!mapInstanceRef.current || !layer.geojson) return;
        try {
          const bounds = getBounds(layer.geojson);
          if (bounds[0][0] !== Infinity) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
          }
        } catch {}
      };
    }
  }, [fitLayerRef]);

  const createLayerStyle = useCallback((color, opacity) => ({
    fillColor: color,
    fillOpacity: opacity * 0.4,
    color: color,
    weight: 1.5,
    opacity: 0.9,
  }), []);

  // Sync layers to Google Maps
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google || !window.google.maps) return;

    const currentIds = new Set(layers.map(l => l.id));

    // Remove deleted layers
    Object.keys(layerGroupsRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        const d = layerGroupsRef.current[id];
        if (d && d.setMap) d.setMap(null);
        delete layerGroupsRef.current[id];
      }
    });

    layers.forEach(layer => {
      if (!layer.geojson || !layer.geojson.features || layer.geojson.features.length === 0) return;

      const existing = layerGroupsRef.current[layer.id];
      if (existing) {
        // update visibility
        existing.setStyle(createLayerStyle(layer.color, layer.opacity));
        existing.setMap(layer.visible ? map : null);
        return;
      }

      const shouldSimplify = (layer.geojson.featureCount || layer.geojson.features.length) > settings.maxFeaturesWithoutSimplify;
      const dataGeo = shouldSimplify ? simplifyFeatures(layer.geojson, settings.simplifyTolerance) : layer.geojson;

      const dataLayer = new window.google.maps.Data({ map: layer.visible ? map : null });
      dataLayer.addGeoJson(dataGeo);

      dataLayer.setStyle(() => ({
        fillColor: layer.color,
        fillOpacity: layer.opacity * 0.6,
        strokeColor: layer.color,
        strokeWeight: 1,
      }));

      dataLayer.addListener('mouseover', (e) => {
        const feature = e.feature;
        dataLayer.overrideStyle(feature, { fillOpacity: Math.min(1, layer.opacity * 0.9), strokeWeight: 2.5 });
        const info = { ...feature.toGeoJson(), layerName: layer.name, layerId: layer.id };
        setHoverFeature(info);
      });

      dataLayer.addListener('mouseout', (e) => {
        const feature = e.feature;
        dataLayer.revertStyle(feature);
        setHoverFeature(null);
      });

      dataLayer.addListener('click', (e) => {
        const feature = e.feature;
        const info = { ...feature.toGeoJson(), layerName: layer.name, layerId: layer.id };
        setSelectedFeature(info);
        // zoom to feature bounds
        try {
          const bounds = new window.google.maps.LatLngBounds();
          const geom = feature.toGeoJson().geometry;
          const extendCoords = (coords) => {
            if (typeof coords[0] === 'number') {
              bounds.extend(new window.google.maps.LatLng(coords[1], coords[0]));
            } else {
              coords.forEach(c => extendCoords(c));
            }
          };
          extendCoords(geom.coordinates);
          map.fitBounds(bounds, { padding: 40 });
        } catch (err) {}
      });

      layerGroupsRef.current[layer.id] = dataLayer;

      // Auto fit to layer when first added
      try {
        const bounds = new window.google.maps.LatLngBounds();
        dataGeo.features.forEach(f => {
          const geom = f.geometry;
          const extendCoords = (coords) => {
            if (typeof coords[0] === 'number') {
              bounds.extend(new window.google.maps.LatLng(coords[1], coords[0]));
            } else {
              coords.forEach(c => extendCoords(c));
            }
          };
          extendCoords(geom.coordinates);
        });
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 40 });
      } catch (e) {}
    });

    // clear selected when clicking map background
    if (window.google && google.maps && google.maps.event) {
      google.maps.event.clearListeners(map, 'click');
      google.maps.event.addListener(map, 'click', () => setSelectedFeature(null));
    }

  }, [layers, settings, createLayerStyle, setSelectedFeature, setHoverFeature]);

  // Fit to last uploaded layer when requested
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !lastUploadedLayerId) return;
    const layer = layers.find(l => l.id === lastUploadedLayerId);
    if (!layer || !layer.geojson) return;

    try {
      const bounds = new window.google.maps.LatLngBounds();
      const extendCoords = (coords) => {
        if (typeof coords[0] === 'number') {
          bounds.extend(new window.google.maps.LatLng(coords[1], coords[0]));
        } else {
          coords.forEach(c => extendCoords(c));
        }
      };
      layer.geojson.features.forEach(f => {
        if (f.geometry && f.geometry.coordinates) extendCoords(f.geometry.coordinates);
      });
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 40 });
    } catch (e) { console.error('Error fitting to uploaded layer', e); }
  }, [lastUploadedLayerId, layers]);

  return (
    <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 600,
        background: 'rgba(17,20,25,0.9)', border: '1px solid var(--border)',
        padding: '6px 10px', borderRadius: 8, fontWeight: 700,
        color: 'var(--text)', fontSize: 13, pointerEvents: 'none'
      }}>Map View {layers.length > 0 && <span style={{ color: 'var(--accent)' }}>({layers.length})</span>}</div>
      <div ref={mapRef} style={{ position: 'absolute', top: 36, left: 0, right: 0, bottom: 0, width: '100%', height: 'calc(100% - 36px)', background: '#1a1f28' }} />
      <MapCoords mapRef={mapInstanceRef} />
      {mapLoadFailed && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(17,20,25,0.95)', border: '2px solid var(--danger)',
          padding: '24px 32px', borderRadius: 12, textAlign: 'center',
          zIndex: 500, backdropFilter: 'blur(8px)', minWidth: 320,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12, color: 'var(--danger)' }}>⚠</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--danger)' }}>Map Failed to Load</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Unable to initialize Google Maps. Check console for API errors or your API key configuration.
          </p>
        </div>
      )}
      {!mapLoadFailed && layers.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(17,20,25,0.95)', border: '2px solid var(--accent)',
          padding: '24px 32px', borderRadius: 12, textAlign: 'center',
          zIndex: 500, backdropFilter: 'blur(8px)', minWidth: 280,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>⬡</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--accent)' }}>No Data Layers Loaded</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Click <strong>+ Upload Layer</strong> in the header to add shapefile data
          </p>
        </div>
      )}
    </div>
  );
}

function MapCoords({ mapRef }) {
  const [coords, setCoords] = React.useState(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Google Maps
    if (window.google && map instanceof window.google.maps.Map) {
      const listener = map.addListener('mousemove', (e) => {
        if (!e || !e.latLng) return;
        setCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
      return () => {
        if (listener) window.google.maps.event.removeListener(listener);
      };
    }

    // Fallback for Leaflet-style maps
    if (map.on) {
      const handler = (e) => setCoords(e.latlng);
      map.on('mousemove', handler);
      return () => map.off('mousemove', handler);
    }
  }, [mapRef]);

  if (!coords) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 10, left: 10, zIndex: 999,
      background: 'rgba(17,20,25,0.9)', border: '1px solid var(--border)',
      padding: '4px 10px', borderRadius: 6,
      fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--text-muted)',
      backdropFilter: 'blur(8px)',
    }}>
      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
    </div>
  );
}
