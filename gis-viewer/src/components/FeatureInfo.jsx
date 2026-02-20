import React from 'react';
import { useStore } from '../store/useStore';
import { formatValue } from '../utils/shapefileParser';

export default function FeatureInfo() {
  const { selectedFeature, hoverFeature, setSelectedFeature } = useStore();
  const feature = selectedFeature || hoverFeature;

  if (!feature) return null;

  const props = feature.properties || {};
  const entries = Object.entries(props).filter(([, v]) => v !== null && v !== undefined && v !== '');
  const isSelected = !!selectedFeature;

  return (
    <div style={{
      position: 'absolute', bottom: 20, right: 20,
      width: 280, maxHeight: 380,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, zIndex: 1000,
      animation: 'fadeIn 0.15s ease',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        padding: '12px 14px 10px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontSize: 10, color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily: "'Space Mono', monospace", letterSpacing: '0.08em', marginBottom: 2,
          }}>
            {isSelected ? '● SELECTED' : '○ HOVER'}
          </div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>
            {feature.layerName || 'Feature'}
          </div>
        </div>
        {isSelected && (
          <button onClick={() => setSelectedFeature(null)} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', borderRadius: 6, padding: '3px 8px',
            cursor: 'pointer', fontSize: 11,
          }}>✕</button>
        )}
      </div>

      <div style={{ overflowY: 'auto', padding: '8px 0', flex: 1 }}>
        {entries.length === 0 ? (
          <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 12 }}>
            No attributes available
          </div>
        ) : entries.map(([key, value]) => (
          <div key={key} style={{
            display: 'flex', padding: '5px 14px', gap: 8,
            borderBottom: '1px solid rgba(255,255,255,0.03)',
          }}>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              color: 'var(--text-muted)', minWidth: 90, flexShrink: 0,
              paddingTop: 1, letterSpacing: '0.03em',
            }}>
              {key}
            </span>
            <span style={{
              fontSize: 12, color: 'var(--text)',
              wordBreak: 'break-word', fontWeight: 500,
            }}>
              {formatValue(value)}
            </span>
          </div>
        ))}
      </div>

      {entries.length > 0 && (
        <div style={{
          padding: '8px 14px', borderTop: '1px solid var(--border)',
          fontSize: 10, color: 'var(--text-muted)',
          fontFamily: "'Space Mono', monospace",
        }}>
          {entries.length} attributes
        </div>
      )}
    </div>
  );
}
