// ── Color Palette ─────────────────────────────────────────────────────────── //
export const COLORS = {
  batsman: '#00e5ff',
  bowler: '#ff6d00',
  allrounder: '#aa00ff',
  condition: '#00e676',
  pitch: '#78909c',
  accent: '#7c4dff',
  danger: '#ff1744',
  success: '#00e676',
  warning: '#ff9100',
  bgPrimary: '#0a0e1a',
  edge: {
    default: '#2d3748',
    batting: '#00b5cc',
    bowling: '#cc5500',
    dismissal: '#ff1744',
    performs: '#1a5433',
  },
};

// ── Node Size Configs ──────────────────────────────────────────────────────── //
export const NODE_SIZES = {
  base: 40,
  maxScale: 2.2,
  conditionSize: 28,
  pitchSize: 36,
};

// ── Edge Width Configs ────────────────────────────────────────────────────── //
export const EDGE_WIDTHS = {
  min: 1.5,
  max: 10,
  weightScale: 0.8,
};

// ── Websocket ─────────────────────────────────────────────────────────────── //
const envApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_URL = envApiUrl;
export const WS_URL = import.meta.env.VITE_WS_URL || envApiUrl.replace('http', 'ws') + '/ws/match';

// ── Graph Layout Options ──────────────────────────────────────────────────── //
export const LAYOUT_OPTIONS = {
  name: 'fcose',
  animate: true,
  animationDuration: 600,
  animationEasing: 'ease-out',
  randomize: false,
  quality: 'default',
  nodeDimensionsIncludeLabels: true,
  uniformNodeDimensions: false,
  packComponents: true,
  step: 'all',
  nodeRepulsion: () => 6500,
  idealEdgeLength: () => 120,
  edgeElasticity: () => 0.45,
  nestingFactor: 0.1,
  gravity: 0.25,
  numIter: 2500,
  tile: true,
  tilingPaddingVertical: 10,
  tilingPaddingHorizontal: 10,
  gravityRangeCompound: 1.5,
  gravityCompound: 1.0,
  gravityRange: 3.8,
};

// ── Role Labels ────────────────────────────────────────────────────────────── //
export const ROLE_LABELS = {
  batsman: '🏏',
  bowler: '⚡',
  allrounder: '⚡🏏',
  condition: '📍',
  pitch: '🟫',
};

// ── Phase Config ──────────────────────────────────────────────────────────── //
export const PHASE_COLORS = {
  powerplay: '#7c4dff',
  middle: '#ff9100',
  death: '#ff1744',
};

// ── Query Suggestions ─────────────────────────────────────────────────────── //
export const QUERY_SUGGESTIONS = [
  'How is Bumrah performing against left-handers?',
  'Who is the most dominant batsman currently?',
  'What bowler has the best economy in death overs?',
  'Which matchup is most dangerous right now?',
  'Explain the current pressure situation.',
  'Who should CSK target next?',
];
