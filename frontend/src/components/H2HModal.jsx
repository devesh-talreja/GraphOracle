import { motion } from 'framer-motion';

function H2HModal({ edge, sourceNode, targetNode, onClose }) {
  if (!edge || !sourceNode || !targetNode) return null;

  const getMetricColor = (val, max) => {
    if (val > (max * 0.7)) return 'text-cyan-400';
    if (val < (max * 0.3)) return 'text-orange-400';
    return 'text-slate-200';
  };

  const sr = edge.balls > 0 ? ((edge.runs / edge.balls) * 100).toFixed(1) : 0;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="bg-[#0f1423] border border-white/20 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-lg w-full overflow-hidden relative"
      >
        {/* Header background sweep */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-cyan-900/40 to-orange-900/40 opacity-50 pointer-events-none" />
        
        <div className="p-4 border-b border-white/10 flex justify-between items-center relative z-10 bg-black/20">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span>⚔️</span> HEAD-TO-HEAD CLASH
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full p-1.5 hover:bg-white/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center">
          {/* Versus Header */}
          <div className="flex items-center justify-between w-full relative mb-10">
            {/* Batter */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border-2 border-cyan-400/50 flex items-center justify-center text-2xl mb-3 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                🏏
              </div>
              <h3 className="text-white font-black text-xl leading-tight">{sourceNode.name}</h3>
              <span className="text-[10px] text-cyan-400 uppercase font-black tracking-widest">{sourceNode.team}</span>
            </div>

            {/* VS Badge */}
            <div className="flex-shrink-0 mx-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-sm italic shadow-[0_0_15px_rgba(124,77,255,0.5)]">
                VS
              </div>
              <div className="w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent absolute left-1/2 top-4 -translate-x-1/2 -z-10" />
            </div>

            {/* Bowler */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border-2 border-orange-400/50 flex items-center justify-center text-2xl mb-3 shadow-[0_0_20px_rgba(255,109,0,0.2)]">
                ⚡
              </div>
              <h3 className="text-white font-black text-xl leading-tight">{targetNode.name}</h3>
              <span className="text-[10px] text-orange-400 uppercase font-black tracking-widest">{targetNode.team}</span>
            </div>
          </div>

          {/* Stats Breakdown */}
          <div className="w-full bg-black/40 rounded-2xl border border-white/5 p-5">
            <div className="grid grid-cols-3 gap-y-4">
              {/* Runs */}
              <div className="flex flex-col items-center border-r border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Runs</p>
                <div className={`text-2xl font-black ${getMetricColor(edge.runs, 20)}`}>{edge.runs}</div>
              </div>
              
               {/* Balls */}
               <div className="flex flex-col items-center border-r border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Balls</p>
                <div className="text-2xl font-black text-slate-200">{edge.balls}</div>
              </div>

               {/* Strike Rate */}
               <div className="flex flex-col items-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Strike Rate</p>
                <div className={`text-2xl font-black ${getMetricColor(sr, 150)}`}>{sr}</div>
              </div>
            </div>

            {/* Wickets Alert */}
            {edge.wickets > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="mt-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-3"
              >
                <span className="text-red-500 font-bold text-lg leading-none">💥</span>
                <span className="text-red-400 font-black tracking-widest text-sm uppercase">Dismissed! ({edge.wickets} Wickets)</span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default H2HModal;
