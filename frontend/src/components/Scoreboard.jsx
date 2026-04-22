import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '../utils/constants';

function Scoreboard({ score, wsStatus, streamRunning, deliveryCommentary, pressureIndex = 0 }) {
  const inningsLabel = score.innings === 1 ? '1st Innings' : '2nd Innings';
  const progressBalls = (score.overs * 6 + score.balls);
  const maxBalls = 120;
  const progressPct = Math.min(100, (progressBalls / maxBalls) * 100);

  const statusColor = wsStatus === 'connected' ? '#00e676' : wsStatus === 'connecting' ? '#ff9100' : '#ff1744';
  const statusLabel = wsStatus === 'connected' ? (streamRunning ? 'LIVE' : 'CONNECTED') : wsStatus.toUpperCase();

  const indoreStress = Math.min(100, Math.max(0, pressureIndex * 100 * 1.5));
  const stressEmoji = indoreStress > 80 ? '🤬' : indoreStress > 50 ? '😰' : indoreStress > 20 ? '😬' : '😎';

  return (
    <div className="scoreboard px-4 py-2 flex items-center gap-4 relative" style={{ minHeight: '64px' }}>
      {/* Left: Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c4dff, #00e5ff)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold text-gradient leading-none">GraphOracle</p>
          <p className="text-[9px] text-slate-500 leading-none mt-0.5">Knowledge Graph Engine</p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 flex-shrink-0" />

      {/* Center: Score */}
      <div className="flex items-center gap-6 flex-1 justify-center">
        {/* Batting team */}
        <div className="text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{score.batting_team}</p>
          <p className="text-2xl font-black text-white leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {score.runs}
            <span className="text-slate-400">/{score.wickets}</span>
          </p>
        </div>

        {/* Overs + bar */}
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-mono mb-1">
            {score.overs}.{score.balls} overs
          </p>
          {/* Progress bar */}
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.batsman})`,
              }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5">{inningsLabel}</p>
        </div>

        {/* Target / CRR */}
        <div className="text-center">
          {score.innings === 2 && score.target ? (
            <>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Need</p>
              <p className="text-xl font-black text-orange-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {Math.max(0, score.target - score.runs)}
              </p>
              <p className="text-[9px] text-slate-500">in {120 - progressBalls} balls</p>
            </>
          ) : (
            <>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">vs {score.bowling_team}</p>
              <p className="text-xl font-black text-cyan-400">
                {score.run_rate?.toFixed(2)}
              </p>
              <p className="text-[9px] text-slate-500">run rate</p>
            </>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 flex-shrink-0" />

      {/* Indore Fan Pulse */}
      <div className="flex flex-col items-center justify-center flex-shrink-0 w-24">
        <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-1 leading-none text-center">
          Indore Pulse
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xl">{stressEmoji}</span>
          <div className="text-[10px] font-mono text-orange-400">{Math.round(indoreStress)}%</div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 flex-shrink-0" />

      {/* Right col: status + commentary ticker */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-0">
        {/* Status badge */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
              animation: streamRunning ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <span className="text-[10px] font-bold" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>

        {/* Live commentary ticker */}
        <AnimatePresence mode="wait">
          {deliveryCommentary && (
            <motion.div
              key={deliveryCommentary}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="commentary-ticker px-2 py-1 max-w-xs"
            >
              <p className="text-[10px] text-cyan-300 leading-tight line-clamp-2">
                {deliveryCommentary}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Scoreboard;
