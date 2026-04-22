import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../utils/constants';

function LiveMatchImporter({ onClose, onSelect }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/live-matches`)
      .then(res => res.json())
      .then(data => {
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Live fetch error", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0f1423] border border-white/20 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="animate-pulse">📡</span> Live CricAPI Stream
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ✖
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-cyan-400 font-mono tracking-widest">POLLING LIVE SERVERS...</p>
            </div>
          ) : matches.length === 0 ? (
            <p className="text-center text-slate-400 p-8">No live matches found currently.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {matches.map(m => (
                <div key={m.id} className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex flex-col gap-2 cursor-pointer group" onClick={() => onSelect(m)}>
                  <p className="text-white font-bold text-sm leading-tight group-hover:text-cyan-400 transition-colors">{m.name}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-2">
                    <span className={m.status.includes('won') ? 'text-green-400' : 'text-orange-400'}>{m.status}</span>
                    <span>•</span>
                    <span className="truncate">{m.venue}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/40">
          <p className="text-xs text-slate-500 text-center">
            API Note: Some matches do not have Ball-by-ball (bbb) enabled. GraphOracle will fall back to the live simulated "What-If" engine if stream is blocked.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LiveMatchImporter;
