import { COLORS, EDGE_WIDTHS } from './constants';

// Compute node size based on role and performance stats
function getNodeSize(data) {
  const base = data.role === 'condition' ? 28 : data.role === 'pitch' ? 36 : 42;
  if (data.role === 'batsman' || data.role === 'allrounder') {
    const scale = Math.min(2.0, 1.0 + (data.runs || 0) / 80);
    return base * scale;
  }
  if (data.role === 'bowler' || data.role === 'allrounder') {
    const scale = Math.min(2.0, 1.0 + (data.wickets || 0) * 0.3 + (data.balls_bowled || 0) / 40);
    return base * scale;
  }
  return base;
}

function getNodeColor(role) {
  const map = {
    batsman: COLORS.batsman,
    bowler: COLORS.bowler,
    allrounder: COLORS.allrounder,
    condition: COLORS.condition,
    pitch: COLORS.pitch,
  };
  return map[role] || '#ffffff';
}

function getEdgeWidth(data) {
  const balls = data.balls || 1;
  const raw = Math.min(EDGE_WIDTHS.max, EDGE_WIDTHS.min + balls * EDGE_WIDTHS.weightScale);
  return raw;
}

function getEdgeColor(data) {
  if (data.edge_type === 'dismissal') return COLORS.edge.dismissal;
  if (data.edge_type === 'batting_against') {
    const sr = data.balls > 0 ? (data.runs / data.balls) * 100 : 100;
    if (sr > 150) return COLORS.edge.batting;
    if (sr < 80) return COLORS.edge.default;
    return COLORS.edge.batting;
  }
  if (data.edge_type === 'bowling_to') return COLORS.edge.bowling;
  if (data.edge_type === 'performs_in') return COLORS.edge.performs;
  return COLORS.edge.default;
}

export const buildCytoscapeStylesheet = () => [
  // ── Default Node ─────────────────────────────────────────────────────
  {
    selector: 'node',
    style: {
      'width': (ele) => getNodeSize(ele.data()),
      'height': (ele) => getNodeSize(ele.data()),
      'background-color': (ele) => getNodeColor(ele.data('role')),
      'background-opacity': 0.9,
      'border-width': 2.5,
      'border-color': (ele) => getNodeColor(ele.data('role')),
      'border-opacity': 0.7,
      'color': '#e2e8f0',
      'font-size': '11px',
      'font-family': 'Inter, system-ui',
      'font-weight': '600',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 6,
      'text-wrap': 'wrap',
      'text-max-width': '100px',
      'label': (ele) => {
        const name = ele.data('name') || '';
        const parts = name.split(' ');
        return parts.length > 1 ? parts[parts.length - 1] : name;
      },
      'text-outline-color': '#0a0e1a',
      'text-outline-width': 2,
      'shadow-blur': 15,
      'shadow-color': (ele) => getNodeColor(ele.data('role')),
      'shadow-opacity': 0.5,
      'shadow-offset-x': 0,
      'shadow-offset-y': 0,
      'z-index': 10,
      'transition-property': 'background-color, border-width, border-color, width, height, opacity',
      'transition-duration': '0.4s',
      'transition-timing-function': 'ease',
    },
  },

  // ── Condition Node ────────────────────────────────────────────────────
  {
    selector: 'node[role = "condition"]',
    style: {
      'shape': 'diamond',
      'font-size': '10px',
      'label': (ele) => ele.data('name') || '',
    },
  },

  // ── Pitch Node ────────────────────────────────────────────────────────
  {
    selector: 'node[role = "pitch"]',
    style: {
      'shape': 'hexagon',
      'font-size': '10px',
    },
  },

  // ── Dismissed Node ────────────────────────────────────────────────────
  {
    selector: 'node[status = "dismissed"]',
    style: {
      'opacity': 0.35,
      'background-color': '#374151',
      'border-color': '#4b5563',
      'shadow-opacity': 0,
    },
  },

  // ── Updated Node (just received data) ────────────────────────────────
  {
    selector: 'node.updated',
    style: {
      'border-width': 5,
      'border-opacity': 1,
    },
  },

  // ── Selected Node ─────────────────────────────────────────────────────
  {
    selector: 'node:selected',
    style: {
      'border-width': 4,
      'border-color': '#7c4dff',
      'border-opacity': 1,
      'z-index': 100,
    },
  },

  // ── Highlighted Node ──────────────────────────────────────────────────
  {
    selector: 'node.highlighted',
    style: {
      'border-width': 6,
      'border-color': '#00e5ff',
      'border-opacity': 1,
      'z-index': 50,
    },
  },

  // ── Fantasy Cheat Code (High Centrality) ─────────────────────────────
  {
    selector: 'node[centrality > 0.08]',
    style: {
      'underlay-color': '#facc15',
      'underlay-padding': 6,
      'underlay-opacity': 0.8,
      'underlay-shape': 'ellipse',
      'border-color': '#facc15',
      'border-width': 3.5,
    },
  },

  // ── Default Edge ──────────────────────────────────────────────────────
  {
    selector: 'edge',
    style: {
      'width': (ele) => getEdgeWidth(ele.data()),
      'line-color': (ele) => getEdgeColor(ele.data()),
      'line-opacity': 0.7,
      'target-arrow-color': (ele) => getEdgeColor(ele.data()),
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.8,
      'curve-style': 'bezier',
      'control-point-step-size': 40,
      'z-index': 1,
      'transition-property': 'width, line-color, line-opacity',
      'transition-duration': '0.4s',
    },
  },

  // ── Dismissal Edge ────────────────────────────────────────────────────
  {
    selector: 'edge[edge_type = "dismissal"]',
    style: {
      'width': 3,
      'line-color': '#ff1744',
      'line-style': 'dashed',
      'line-dash-pattern': [6, 3],
      'target-arrow-color': '#ff1744',
      'line-opacity': 0.85,
    },
  },

  // ── Performs In Edge ──────────────────────────────────────────────────
  {
    selector: 'edge[edge_type = "performs_in"]',
    style: {
      'width': 1.5,
      'line-style': 'dotted',
      'line-opacity': 0.35,
      'target-arrow-shape': 'none',
    },
  },

  // ── Highlighted Edge ──────────────────────────────────────────────────
  {
    selector: 'edge.highlighted',
    style: {
      'line-opacity': 1,
      'width': (ele) => Math.max(3, getEdgeWidth(ele.data())),
    },
  },

  // ── Hidden Element ────────────────────────────────────────────────────
  {
    selector: '.hidden',
    style: { 'display': 'none' },
  },
];
