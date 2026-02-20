import React, { useState, useRef } from 'react';
import Header from './components/Header';
import LayersPanel from './components/LayersPanel';
import MapView from './components/MapView';
import FeatureInfo from './components/FeatureInfo';
import UploadModal from './components/UploadModal';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fitLayerRef = useRef(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header
        onUpload={() => setShowUpload(true)}
        onSettings={() => setShowSettings(true)}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        <LayersPanel onFitLayer={(layer) => fitLayerRef.current?.(layer)} />
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <MapView fitLayerRef={fitLayerRef} />
          <FeatureInfo />
        </div>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
