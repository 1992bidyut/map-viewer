import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function SettingsModal({ onClose }) {
  const { settings, updateSettings, resetSettings } = useStore();
  const [local, setLocal] = useState({ ...settings });

  const handleSave = () => {
    updateSettings(local);
    onClose();
  };

  const field = (label, key, type = 'number', min, max, step, hint) => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{hint}</p>}
      <input
        type={type}
        value={local[key]}
        min={min} max={max} step={step}
        onChange={e => setLocal(s => ({ ...s, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
        style={inputStyle}
      />
    </div>
  );

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: 20 }}>Settings</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>MAP DEFAULTS</div>
          {field('Initial Zoom Level', 'initialZoom', 'number', 1, 20, 1, 'Default zoom when the app loads (1-20)')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Initial Latitude</label>
              <input type="number" value={local.initialLat} step="0.001"
                onChange={e => setLocal(s => ({ ...s, initialLat: parseFloat(e.target.value) }))}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Initial Longitude</label>
              <input type="number" value={local.initialLng} step="0.001"
                onChange={e => setLocal(s => ({ ...s, initialLng: parseFloat(e.target.value) }))}
                style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>PERFORMANCE</div>
          {field(
            'Simplification Tolerance',
            'simplifyTolerance',
            'number', 0, 0.1, 0.0001,
            'Higher = faster rendering but less detail. 0 = no simplification.'
          )}
          {field(
            'Max Features (no simplify)',
            'maxFeaturesWithoutSimplify',
            'number', 10, 10000, 10,
            'Layers with more features than this will be auto-simplified.'
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={handleSave} style={saveBtnStyle}>Save Settings</button>
          <button onClick={() => { resetSettings(); setLocal({ ...settings }); }} style={resetBtnStyle}>
            Reset Defaults
          </button>
        </div>

        <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          Settings are saved to your browser's local storage.
        </p>
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
  borderRadius: 16, padding: 24, width: 440, maxWidth: '95vw',
  animation: 'fadeIn 0.2s ease', maxHeight: '90vh', overflowY: 'auto',
};

const closeBtnStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  color: 'var(--text-muted)', borderRadius: 8, padding: '4px 10px',
  cursor: 'pointer', fontFamily: "'Space Mono', monospace",
};

const sectionStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 10, padding: 16, marginBottom: 16,
};

const sectionHeaderStyle = {
  fontSize: 10, letterSpacing: '0.1em', color: 'var(--accent)',
  fontFamily: "'Space Mono', monospace", fontWeight: 700, marginBottom: 14,
};

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text)',
};

const inputStyle = {
  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
  color: 'var(--text)', borderRadius: 8, padding: '8px 12px', fontSize: 13,
  fontFamily: "'Space Mono', monospace",
};

const saveBtnStyle = {
  flex: 1, background: 'var(--accent)', border: 'none', color: '#000',
  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14,
  padding: '10px', borderRadius: 8, cursor: 'pointer',
};

const resetBtnStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  color: 'var(--text-muted)', fontFamily: "'Syne', sans-serif",
  fontSize: 13, padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
};
