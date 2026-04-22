import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, API_URL } from '../utils/constants';

function StatRow({ label, value, highlight = false }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className={`text-xs font-semibold font-mono ${highlight ? 'text-cyan-400' : 'text-slate-200'}`}>
        {value}
      </span>
    </div>
  );
}

function NodeDetail({ player, onClose }) {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!player) return null;

  const roleColor = COLORS[player.role] || '#ffffff';
  const isBatter = ['batsman', 'allrounder'].includes(player.role);
  const isBowler = ['bowler', 'allrounder'].includes(player.role);

  const handleSimulate = async () => {
    setLoading(true);
    setSimulation(null);
    try {
      const res = await fetch(`${API_URL}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: player.id })
      });
      const data = await res.json();
      setSimulation(data.balls || ["Simulation failed."]);
    } catch (e) {
      console.error("Simulation Error:", e);
      setSimulation(["Error reaching simulation engine."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="node-detail"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex flex-col gap-3"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{ background: `${roleColor}18`, border: `1px solid ${roleColor}30` }}
            >
              {player.role === 'batsman' ? '🏏' : player.role === 'bowler' ? '⚡' : player.role === 'allrounder' ? '🌟' : player.role === 'condition' ? '📍' : '🟫'}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">{player.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                  style={{ background: `${roleColor}20`, color: roleColor }}
                >
                  {player.team}
                </span>
                <span className="text-[9px] text-slate-500 capitalize">{player.role}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setSimulation(null);
              onClose();
            }}
            className="text-slate-600 hover:text-slate-400 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Status indicator */}
        {player.status === 'dismissed' && (
          <div className="px-2 py-1.5 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/20 text-center font-semibold">
            ⬤ DISMISSED
          </div>
        )}

        {/* Stats */}
        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {isBatter && player.balls_faced > 0 && (
            <>
              <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-2">Batting</p>
              <StatRow label="Runs" value={player.runs} highlight />
              <StatRow label="Balls Faced" value={player.balls_faced} />
              <StatRow label="Strike Rate" value={`${player.strike_rate?.toFixed(1)}%`} highlight />
            </>
          )}
          {isBowler && player.balls_bowled > 0 && (
            <>
              <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-2 mt-2">Bowling</p>
              <StatRow label="Wickets" value={player.wickets} highlight />
              <StatRow label="Runs Conceded" value={player.runs_conceded} />
              <StatRow label="Economy" value={player.economy?.toFixed(2)} highlight={player.economy < 7} />
              <StatRow label="Overs" value={(player.balls_bowled / 6).toFixed(1)} />
            </>
          )}
          {['condition', 'pitch'].includes(player.role) && (
            <>
              <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-2">Condition</p>
              <p className="text-xs text-slate-300">{player.name}</p>
            </>
          )}
        </div>

        {/* Centrality */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${roleColor}, ${roleColor}88)` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (player.centrality || 0) * 300)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {((player.centrality || 0) * 100).toFixed(1)}% centrality
          </span>
        </div>

        {/* What-If Simulation */}
        <div className="mt-2 pt-3 border-t border-white/10">
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full py-1.5 rounded-lg text-xs font-semibold bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/40 transition-colors disabled:opacity-50"
          >
            {loading ? 'Simulating...' : '🔮 Simulate Next Over'}
          </button>
          
          <AnimatePresence>
            {simulation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex flex-col gap-1.5"
              >
                <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">Predicted Sequence</p>
                {simulation.map((ball, i) => (
                  <div key={i} className="flex gap-2 items-start text-[10px] text-slate-300 bg-white/5 p-1.5 rounded">
                    <span className="font-mono text-violet-400 opacity-80 mt-0.5">{i+1}.</span>
                    <span>{ball}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default NodeDetail;
