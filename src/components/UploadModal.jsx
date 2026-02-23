import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseShapefile } from '../utils/shapefileParser';
import { useStore } from '../store/useStore';

export default function UploadModal({ onClose }) {
  const [status, setStatus] = useState('idle'); // idle | parsing | success | error
  const [message, setMessage] = useState('');
  const addLayer = useStore(s => s.addLayer);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    console.log(`Files dropped: ${acceptedFiles.map(f => f.name).join(', ')}`);

    // Group files by base name (support multiple shapefiles in one drop)
    const groups = {};
    acceptedFiles.forEach(file => {
      const parts = file.name.split('.');
      const ext = parts.pop().toLowerCase();
      const base = parts.join('.');
      if (!groups[base]) groups[base] = [];
      groups[base].push(file);
    });

    // Also handle single group drops
    const shpExts = ['shp', 'dbf', 'shx', 'prj', 'cpg', 'sbn', 'sbx', 'xml'];
    const hasShp = acceptedFiles.some(f => f.name.toLowerCase().endsWith('.shp'));
    
    if (!hasShp) {
      console.error('No .shp file in upload');
      setStatus('error');
      setMessage('No .shp file found. Please upload a shapefile set (.shp, .dbf, .prj, etc.)');
      return;
    }

    setStatus('parsing');
    setMessage('Parsing shapefile...');

    let successCount = 0;
    const errors = [];

    for (const [base, files] of Object.entries(groups)) {
      const hasShpInGroup = files.some(f => f.name.toLowerCase().endsWith('.shp'));
      if (!hasShpInGroup) continue;

      try {
        console.log(`Processing group: ${base}`);
        setMessage(`Parsing ${base}...`);
        const geojson = await parseShapefile(files);
        console.log(`Successfully parsed ${base}, features:`, geojson.features.length);
        addLayer({ geojson, name: geojson.name });
        successCount++;
      } catch (err) {
        console.error(`Error parsing ${base}:`, err);
        errors.push(`${base}: ${err.message}`);
      }
    }

    if (successCount > 0) {
      setStatus('success');
      setMessage(`Successfully loaded ${successCount} layer${successCount > 1 ? 's' : ''}!`);
      console.log(`✓ Upload complete: ${successCount} layers loaded`);
      setTimeout(onClose, 1200);
    } else {
      setStatus('error');
      setMessage(errors[0] || 'Failed to parse shapefile');
      console.error('All uploads failed:', errors);
    }
  }, [addLayer, onClose]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.shp', '.dbf', '.shx', '.prj', '.sbn', '.sbx', '.cpg'],
      'text/xml': ['.xml'],
      'application/json': ['.geojson', '.json'],
      'application/geo+json': ['.geojson'],
    },
    multiple: true,
  });

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontWeight: 800, fontSize: 20 }}>Upload Shapefile Layer</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div {...getRootProps()} style={dropzoneStyle(isDragActive, status)}>
          <input {...getInputProps()} />
          {status === 'parsing' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={spinnerStyle} />
              <p style={{ color: 'var(--accent)', marginTop: 12, fontFamily: "'Space Mono', monospace", fontSize: 12 }}>{message}</p>
            </div>
          ) : status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40 }}>✓</div>
              <p style={{ color: 'var(--success)', marginTop: 8 }}>{message}</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>⬡</div>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                {isDragActive ? 'Drop files here...' : 'Drop shapefile or GeoJSON here'}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                or click to browse
              </p>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['.shp', '.dbf', '.shx', '.prj', '.geojson'].map(ext => (
                  <span key={ext} style={tagStyle}>{ext}</span>
                ))}
              </div>
              {status === 'error' && (
                <p style={{ color: 'var(--danger)', marginTop: 12, fontSize: 13 }}>{message}</p>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, padding: 12, background: 'var(--surface2)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text)' }}>Tip:</strong> Upload shapefiles (.shp + .dbf + .prj) or GeoJSON files. You can upload multiple layers at once. 
          Select all files for a layer (.shp, .dbf, .prj, .shx) together.
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, backdropFilter: 'blur(4px)',
};

const modalStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 16, padding: 24, width: 480, maxWidth: '95vw',
  animation: 'fadeIn 0.2s ease',
};

const closeBtnStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  color: 'var(--text-muted)', borderRadius: 8, padding: '4px 10px',
  cursor: 'pointer', fontFamily: "'Space Mono', monospace",
};

function dropzoneStyle(isDragActive, status) {
  return {
    border: `2px dashed ${isDragActive ? 'var(--accent)' : status === 'error' ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: 12, padding: '40px 20px',
    background: isDragActive ? 'rgba(0,212,170,0.05)' : 'var(--surface2)',
    cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 180,
  };
}

const spinnerStyle = {
  width: 36, height: 36, border: '3px solid var(--border)',
  borderTopColor: 'var(--accent)', borderRadius: '50%',
  animation: 'spin 0.8s linear infinite', margin: '0 auto',
};

const tagStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  padding: '2px 8px', borderRadius: 4,
  fontFamily: "'Space Mono', monospace", fontSize: 11,
  color: 'var(--text-muted)',
};
