import React from 'react';
import { useStore } from '../store/useStore';

export default function Header({ onUpload, onSettings }) {
  const layers = useStore(s => s.layers);

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 1000,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent), var(--accent3))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800,
        }}>⬡</div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>
          GIS<span style={{ color: 'var(--accent)' }}>Viewer</span>
        </span>
        {layers.length > 0 && (
          <span style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            padding: '2px 8px', borderRadius: 12, fontSize: 11,
            fontFamily: "'Space Mono', monospace", color: 'var(--text-muted)',
          }}>
            {layers.length} layer{layers.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onUpload} style={btnStyle('var(--accent)')}>
          <span>+ Upload Layer</span>
        </button>
        <button onClick={onSettings} style={btnStyle('var(--surface2)', 'var(--border)')}>
          ⚙ Settings
        </button>
      </div>
    </header>
  );
}

function btnStyle(bg, border = 'transparent') {
  return {
    background: bg === 'var(--surface2)' ? 'var(--surface2)' : bg,
    border: `1px solid ${border === 'transparent' ? (bg === 'var(--surface2)' ? 'var(--border)' : 'transparent') : border}`,
    color: bg === 'var(--surface2)' ? 'var(--text)' : '#000',
    fontFamily: "'Syne', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s',
  };
}
