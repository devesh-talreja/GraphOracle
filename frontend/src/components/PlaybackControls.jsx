import { motion } from 'framer-motion';
import { API_URL } from '../utils/constants';

function PlaybackControls({ streamRunning, onToggle, onReset, speed, onSpeedChange }) {
  const speeds = [0.5, 1, 2, 3, 5];

  const handleToggle = async () => {
    try {
      await fetch(`${API_URL}/api/stream/${streamRunning ? 'pause' : 'start'}`, { method: 'POST' });
      onToggle(!streamRunning);
    } catch (e) {
      console.error('Stream control error', e);
    }
  };

  const handleSpeedChange = async (s) => {
    try {
      await fetch(`${API_URL}/api/stream/speed?speed=${s}`, { method: 'POST' });
      onSpeedChange(s);
    } catch (e) {
      console.error('Speed change error', e);
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${API_URL}/api/stream/reset`, { method: 'POST' });
      onReset();
    } catch (e) {
      console.error('Reset error', e);
    }
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{
        background: 'rgba(10, 14, 26, 0.9)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Play/Pause */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
          ${streamRunning
            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'
            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
          }
        `}
        title={streamRunning ? 'Pause stream' : 'Start stream'}
      >
        {streamRunning ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
            </svg>
            Pause
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            Play
          </>
        )}
      </motion.button>

      {/* Speed selector */}
      <div className="flex items-center gap-1">
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => handleSpeedChange(4 / s)} // invert: higher speed = lower delay
            className={`
              w-8 h-7 text-[10px] font-bold rounded-md transition-all
              ${Math.abs(1 / speed - s / 4) < 0.1 || (s === 1 && Math.abs(speed - 3) < 0.5)
                ? 'bg-violet-600 text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }
            `}
            title={`${s}x speed`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/10" />

      {/* Reset */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleReset}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
        title="Reset match"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
        </svg>
        Reset
      </motion.button>
    </div>
  );
}

export default PlaybackControls;
