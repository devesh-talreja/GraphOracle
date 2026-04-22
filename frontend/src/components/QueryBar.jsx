import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL, QUERY_SUGGESTIONS } from '../utils/constants';

function QueryBar({ onInsight }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const runQuery = useCallback(async (q) => {
    const text = (q || query).trim();
    if (!text || loading) return;
    setLoading(true);
    setShowSuggestions(false);
    try {
      const res = await fetch(`${API_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();
      if (data.insight) {
        onInsight({ ...data.insight, id: Date.now(), query: text });
      }
    } catch (e) {
      onInsight({
        id: Date.now(),
        type: 'nl_query_response',
        title: `🔍 ${text.slice(0, 50)}`,
        body: 'Failed to reach GraphOracle backend. Ensure the server is running on port 8000.',
        severity: 'warning',
      });
    } finally {
      setLoading(false);
      setQuery('');
    }
  }, [query, loading, onInsight]);

  const handleKey = (e) => {
    if (e.key === 'Enter') runQuery();
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  return (
    <div className="relative w-full">
      {/* Main input row */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Search icon */}
        <svg
          className="flex-shrink-0 text-slate-500"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Ask GraphOracle anything... (e.g. 'How is Bumrah performing?')"
          className="query-input flex-1 bg-transparent text-sm min-w-0"
          style={{ fontSize: '13px' }}
          disabled={loading}
        />

        {loading ? (
          <div className="flex-shrink-0 w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <button
            onClick={() => runQuery()}
            disabled={!query.trim()}
            className="flex-shrink-0 btn btn-primary py-1 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Ask
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
            style={{
              background: 'rgba(13, 18, 32, 0.97)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="p-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 px-2 py-1 mb-1">
                Suggested queries
              </p>
              {QUERY_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => { setQuery(s); runQuery(s); }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-violet-500/10 hover:text-white rounded-lg transition-colors"
                >
                  <span className="text-violet-400 mr-2">→</span> {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QueryBar;
