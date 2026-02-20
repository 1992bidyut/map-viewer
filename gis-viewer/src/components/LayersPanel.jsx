import React, { useState } from 'react';
import { useStore } from '../store/useStore';

const PRESET_COLORS = [
  '#00d4aa','#ff6b35','#7c3aed','#f59e0b','#06b6d4',
  '#ec4899','#84cc16','#ef4444','#8b5cf6','#14b8a6'
];

export default function LayersPanel({ onFitLayer }) {
  const { layers, toggleLayer, removeLayer, setLayerOpacity, setLayerColor } = useStore();
  const [expandedId, setExpandedId] = useState(null);

  if (layers.length === 0) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>LAYERS</span>
        </div>
        <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>⬡</div>
          <p>No layers loaded</p>
          <p style={{ marginTop: 4 }}>Upload a shapefile to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>LAYERS</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>
          {layers.length}
        </span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {[...layers].reverse().map(layer => (
          <LayerItem
            key={layer.id}
            layer={layer}
            expanded={expandedId === layer.id}
            onToggleExpand={() => setExpandedId(expandedId === layer.id ? null : layer.id)}
            onVisibility={() => toggleLayer(layer.id)}
            onRemove={() => removeLayer(layer.id)}
            onOpacity={(v) => setLayerOpacity(layer.id, v)}
            onColor={(c) => setLayerColor(layer.id, c)}
            onFit={() => onFitLayer(layer)}
          />
        ))}
      </div>
    </div>
  );
}

function LayerItem({ layer, expanded, onToggleExpand, onVisibility, onRemove, onOpacity, onColor, onFit }) {
  const shortName = layer.name.length > 22 ? layer.name.slice(0, 22) + '…' : layer.name;
  
  return (
    <div style={{
      borderBottom: '1px solid var(--border)',
      background: expanded ? 'var(--surface2)' : 'transparent',
    }}>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 12, height: 12, borderRadius: 2, flexShrink: 0,
          background: layer.visible ? layer.color : 'transparent',
          border: `2px solid ${layer.color}`,
          cursor: 'pointer', transition: 'all 0.15s',
        }} onClick={onVisibility} />
        <span
          style={{ flex: 1, fontSize: 12, fontFamily: "'Space Mono', monospace", cursor: 'pointer', opacity: layer.visible ? 1 : 0.4 }}
          title={layer.name}
          onClick={onToggleExpand}
        >
          {shortName}
        </span>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <IconBtn title="Fit to layer" onClick={onFit}>⊕</IconBtn>
          <IconBtn title="Expand options" onClick={onToggleExpand} active={expanded}>≡</IconBtn>
          <IconBtn title="Remove layer" onClick={onRemove} danger>✕</IconBtn>
        </div>
      </div>

      {layer.geojson && (
        <div style={{ padding: '0 12px 8px', fontSize: 10, color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}>
          {layer.geojson.featureCount} features · {layer.geojson.features[0]?.geometry?.type || '?'}
        </div>
      )}

      {expanded && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={labelStyle}>Opacity: {Math.round(layer.opacity * 100)}%</label>
            <input
              type="range" min="0.05" max="1" step="0.05"
              value={layer.opacity}
              onChange={e => onOpacity(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: layer.color }}
            />
          </div>
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(c => (
                <div key={c} onClick={() => onColor(c)} style={{
                  width: 18, height: 18, borderRadius: 3, background: c, cursor: 'pointer',
                  border: layer.color === c ? '2px solid white' : '2px solid transparent',
                  transition: 'all 0.1s',
                }} />
              ))}
              <input type="color" value={layer.color} onChange={e => onColor(e.target.value)}
                style={{ width: 18, height: 18, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
              />
            </div>
          </div>
          {layer.geojson?.properties?.length > 0 && (
            <div>
              <label style={labelStyle}>Fields</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {layer.geojson.properties.slice(0, 8).map(p => (
                  <span key={p} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    padding: '1px 6px', borderRadius: 3, fontSize: 9,
                    fontFamily: "'Space Mono', monospace", color: 'var(--text-muted)',
                  }}>{p}</span>
                ))}
                {layer.geojson.properties.length > 8 && (
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{layer.geojson.properties.length - 8} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title, active, danger }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: active ? 'var(--surface)' : 'transparent',
      border: 'none', color: danger ? 'var(--danger)' : active ? 'var(--accent)' : 'var(--text-muted)',
      cursor: 'pointer', padding: '2px 5px', borderRadius: 4, fontSize: 12,
      transition: 'all 0.1s', lineHeight: 1,
    }}>
      {children}
    </button>
  );
}

const panelStyle = {
  width: 240, background: 'var(--surface)', borderRight: '1px solid var(--border)',
  display: 'flex', flexDirection: 'column', flexShrink: 0,
  overflowY: 'auto',
};

const headerStyle = {
  padding: '12px 12px 8px',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  borderBottom: '1px solid var(--border)',
  letterSpacing: '0.08em',
};

const labelStyle = {
  display: 'block', fontSize: 10, color: 'var(--text-muted)',
  fontFamily: "'Space Mono', monospace", marginBottom: 4, letterSpacing: '0.05em',
};
