import { motion, AnimatePresence } from 'framer-motion';

const severityConfig = {
  info: {
    gradient: 'from-violet-900/80 to-slate-900/90',
    border: 'border-violet-500/30',
    iconBg: 'bg-violet-500/20',
    icon: '⚡',
    glow: 'shadow-violet-500/20',
  },
  warning: {
    gradient: 'from-orange-900/80 to-slate-900/90',
    border: 'border-orange-500/30',
    iconBg: 'bg-orange-500/20',
    icon: '🔥',
    glow: 'shadow-orange-500/20',
  },
  critical: {
    gradient: 'from-red-900/70 to-slate-900/90',
    border: 'border-red-500/40',
    iconBg: 'bg-red-500/20',
    icon: '🚨',
    glow: 'shadow-red-500/30',
  },
};

function InsightCard({ insight, onDismiss, isQuery = false }) {
  if (!insight) return null;
  const cfg = severityConfig[insight.severity] || severityConfig.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${cfg.gradient}
        border ${cfg.border}
        rounded-2xl p-4 shadow-2xl ${cfg.glow}
        max-w-xs w-full
        backdrop-blur-xl
      `}
      style={{ backdropFilter: 'blur(20px)' }}
    >
      {/* Animated shimmer strip at top */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div
          className="h-full w-1/3 animate-data-stream"
          style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className={`${cfg.iconBg} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
            <span className="text-sm">{isQuery ? '🔍' : cfg.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/90 leading-tight truncate">
              {insight.title}
            </p>
            {insight.type === 'invisible_shift' && insight.centrality_delta !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-mono text-slate-400">centrality</span>
                <span
                  className={`text-xs font-mono font-bold ${
                    insight.centrality_delta > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {insight.centrality_delta > 0 ? '↑' : '↓'} {Math.abs(insight.centrality_delta).toFixed(3)}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-1"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <p className="text-xs text-slate-300 leading-relaxed">
        {insight.body}
      </p>

      {/* Tag */}
      <div className="flex items-center justify-between mt-3">
        <span
          className={`
            text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full
            ${insight.type === 'invisible_shift'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20'
              : 'bg-sky-500/20 text-sky-300 border border-sky-500/20'
            }
          `}
        >
          {insight.type === 'invisible_shift' ? '⚡ Invisible Shift' : '🔍 AI Analysis'}
        </span>
        <span className="text-[10px] text-slate-500">GraphOracle</span>
      </div>
    </motion.div>
  );
}

export function InsightStack({ insights, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence mode="sync">
        {insights.map((insight, i) => (
          <div key={insight.id || i} className="pointer-events-auto">
            <InsightCard
              insight={insight}
              onDismiss={() => onDismiss(insight.id || i)}
              isQuery={insight.type === 'nl_query_response'}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default InsightCard;
