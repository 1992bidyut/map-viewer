import { create } from 'zustand';

const COLORS = [
  '#00d4aa', '#ff6b35', '#7c3aed', '#f59e0b', '#06b6d4',
  '#ec4899', '#84cc16', '#f97316', '#8b5cf6', '#14b8a6'
];

const defaultSettings = {
  initialZoom: 7,
  initialLat: 23.685,
  initialLng: 90.356,
  simplifyTolerance: 0.001,
  maxFeaturesWithoutSimplify: 500,
};

function loadSettings() {
  try {
    const saved = localStorage.getItem('gis-viewer-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch { return defaultSettings; }
}

function saveSettings(settings) {
  try { localStorage.setItem('gis-viewer-settings', JSON.stringify(settings)); } catch {}
}

export const useStore = create((set, get) => ({
  layers: [],
  selectedFeature: null,
  hoverFeature: null,
  lastUploadedLayerId: null,
  settings: loadSettings(),
  colorIndex: 0,
  layerCounter: 0,

  addLayer: (layer) => {
    const state = get();
    const color = COLORS[state.colorIndex % COLORS.length];
    const id = `layer-${Date.now()}-${state.layerCounter}`;
    set(s => ({
      layers: [...s.layers, { ...layer, id, color, visible: true, opacity: 0.7 }],
      colorIndex: s.colorIndex + 1,
      layerCounter: s.layerCounter + 1,
      lastUploadedLayerId: id,
    }));
    return id;
  },

  setLastUploadedLayerId: (id) => set({ lastUploadedLayerId: id }),

  removeLayer: (id) => set(state => ({
    layers: state.layers.filter(l => l.id !== id),
    selectedFeature: state.selectedFeature?.layerId === id ? null : state.selectedFeature,
  })),

  toggleLayer: (id) => set(state => ({
    layers: state.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l),
  })),

  setLayerOpacity: (id, opacity) => set(state => ({
    layers: state.layers.map(l => l.id === id ? { ...l, opacity } : l),
  })),

  setLayerColor: (id, color) => set(state => ({
    layers: state.layers.map(l => l.id === id ? { ...l, color } : l),
  })),

  setSelectedFeature: (feature) => set({ selectedFeature: feature }),
  setHoverFeature: (feature) => set({ hoverFeature: feature }),

  updateSettings: (updates) => set(state => {
    const newSettings = { ...state.settings, ...updates };
    saveSettings(newSettings);
    return { settings: newSettings };
  }),

  resetSettings: () => {
    saveSettings(defaultSettings);
    set({ settings: defaultSettings });
  },
}));
