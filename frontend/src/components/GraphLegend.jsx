import { motion } from 'framer-motion';
import { COLORS } from '../utils/constants';

const LEGEND_ITEMS = [
  { role: 'batsman', color: COLORS.batsman, label: 'Batsman', shape: 'circle' },
  { role: 'bowler', color: COLORS.bowler, label: 'Bowler', shape: 'circle' },
  { role: 'allrounder', color: COLORS.allrounder, label: 'All-rounder', shape: 'circle' },
  { role: 'condition', color: COLORS.condition, label: 'Phase/Condition', shape: 'diamond' },
  { role: 'pitch', color: COLORS.pitch, label: 'Pitch', shape: 'hex' },
];

const EDGE_LEGEND = [
  { color: '#2d9cdb', label: 'Batting matchup' },
  { color: '#cc5500', label: 'Bowling matchup', style: 'solid' },
  { color: '#ff1744', label: 'Dismissal', style: 'dashed' },
  { color: '#1a5433', label: 'Phase activity', style: 'dotted' },
];

function GraphLegend({ pressureIndex = 0, nodeCount = 0, edgeCount = 0 }) {
  const pressurePct = Math.round(pressureIndex * 100);
  const pressureColor = pressureIndex < 0.3 ? COLORS.success : pressureIndex < 0.6 ? COLORS.warning : COLORS.danger;

  return (
    <div className="flex flex-col gap-4">
      {/* Pressure Index */}
      <div
        className="rounded-xl p-3"
        style={{
          background: `${pressureColor}10`,
          border: `1px solid ${pressureColor}25`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: pressureColor }}>
            Pressure Index
          </p>
          <span className="text-sm font-black font-mono" style={{ color: pressureColor }}>
            {pressurePct}%
          </span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${COLORS.success}, ${pressureColor})` }}
            animate={{ width: `${pressurePct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="text-[9px] text-slate-500 mt-1.5">
          {pressureIndex < 0.3 ? 'Comfortable chase' : pressureIndex < 0.6 ? 'Building pressure' : 'High pressure zone'}
        </p>
      </div>

      {/* Graph stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="stat-card text-center">
          <p className="text-lg font-black text-violet-400">{nodeCount}</p>
          <p className="text-[9px] text-slate-500">Nodes</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-lg font-black text-cyan-400">{edgeCount}</p>
          <p className="text-[9px] text-slate-500">Edges</p>
        </div>
      </div>

      {/* Node legend */}
      <div>
        <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-2">Node Types</p>
        <div className="flex flex-col gap-1.5">
          {LEGEND_ITEMS.map(({ role, color, label, shape }) => (
            <div key={role} className="flex items-center gap-2">
              {shape === 'circle' && (
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: `0 0 6px ${color}66` }} />
              )}
              {shape === 'diamond' && (
                <div className="w-2.5 h-2.5 flex-shrink-0" style={{ background: color, transform: 'rotate(45deg)' }} />
              )}
              {shape === 'hex' && (
                <div className="w-3 h-2.5 flex-shrink-0 rounded-sm" style={{ background: color }} />
              )}
              <span className="text-[10px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edge legend */}
      <div>
        <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-2">Edge Types</p>
        <div className="flex flex-col gap-1.5">
          {EDGE_LEGEND.map(({ color, label, style }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="h-0 flex-shrink-0"
                style={{
                  width: 20,
                  borderTop: `2px ${style || 'solid'} ${color}`,
                }}
              />
              <span className="text-[10px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GraphLegend;
