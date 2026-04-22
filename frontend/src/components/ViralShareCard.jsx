import { motion } from 'framer-motion';

function ViralShareCard({ screenshotUri, score, onClose }) {
  const shareText = `Check out this live Match Knowledge Graph from GraphOracle! 🤯🏏\n${score.batting_team} is at ${score.runs}/${score.wickets} in ${score.overs}.${score.balls} overs.\n#GraphOracle #CricketAnalytics #Hackathon`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0f1423] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span>🚀</span> Viral Card Generator
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center gap-4 bg-[url('/bg-pattern.svg')] bg-[length:20px_20px]">
          <div className="w-full relative rounded-xl overflow-hidden border border-white/20 shadow-[0_0_30px_rgba(0,229,255,0.2)] bg-[#0a0e1a]">
            {/* Mock Header for the card */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-widest">GRAPH ORACLE LIVE</span>
            </div>
            <img src={screenshotUri} alt="Match Graph" className="w-full h-auto object-cover" style={{ maxHeight: '60vh' }} />
            {/* Watermark */}
            <div className="absolute bottom-4 right-4 z-10 text-right">
              <p className="text-white font-black text-xl leading-none" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{score.batting_team} {score.runs}/{score.wickets}</p>
              <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{score.overs}.{score.balls} Overs</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
          <p className="text-xs text-slate-400">Right-click image to save, or share directly.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
              Close
            </button>
            <a 
              href={shareUrl} 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-bold bg-[#1da1f2] hover:bg-[#1a91da] text-white flex items-center gap-2 transition-all shadow-lg shadow-[#1da1f2]/30"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Post to X
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ViralShareCard;
