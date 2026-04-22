import { useEffect, useRef, useState, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import GraphCanvas from './components/GraphCanvas';
import Scoreboard from './components/Scoreboard';
import QueryBar from './components/QueryBar';
import { InsightStack } from './components/InsightCard';
import PlaybackControls from './components/PlaybackControls';
import NodeDetail from './components/NodeDetail';
import GraphLegend from './components/GraphLegend';
import ViralShareCard from './components/ViralShareCard';
import H2HModal from './components/H2HModal';
import { useWebSocket } from './hooks/useWebSocket';
import { useGraphState } from './hooks/useGraphState';

let insightIdCounter = 1;

function App() {
  const { status: wsStatus, on: onWsMessage, emit: wsEmit } = useWebSocket();
  const { graphState, score, lastDelivery, pressureIndex, timeline, updateFromMessage } = useGraphState();

  const [insights, setInsights] = useState([]);
  const [streamRunning, setStreamRunning] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [deliveryCommentary, setDeliveryCommentary] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [roasts, setRoasts] = useState([]);
  const [viralScreenshot, setViralScreenshot] = useState(null);
  const [h2hData, setH2hData] = useState(null);
  const [isStadiumTheme, setIsStadiumTheme] = useState(false);

  const graphRef = useRef(null);
  const commentaryTimerRef = useRef(null);

  // ── WebSocket handlers ───────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isStadiumTheme ? 'stadium' : 'default');
  }, [isStadiumTheme]);

  useEffect(() => {
    onWsMessage('initial_state', (msg) => {
      updateFromMessage(msg);
      if (msg.stream_running !== undefined) setStreamRunning(msg.stream_running);
    });

    onWsMessage('delivery', (msg) => {
      updateFromMessage(msg);
      // Flash commentary for 6s
      if (msg.delivery?.commentary) {
        setDeliveryCommentary(msg.delivery.commentary);
        clearTimeout(commentaryTimerRef.current);
        commentaryTimerRef.current = setTimeout(() => setDeliveryCommentary(''), 6000);
      }
      // Pulse affected nodes
      if (graphRef.current && msg.delivery) {
        const { batsman, bowler } = msg.delivery;
        if (batsman) setTimeout(() => graphRef.current?.pulseNode(batsman), 100);
        if (bowler) setTimeout(() => graphRef.current?.pulseNode(bowler), 200);
        // Glow on wicket
        if (msg.delivery.is_wicket && msg.delivery.bowler) {
          setTimeout(() => graphRef.current?.glowNode(msg.delivery.bowler), 300);
        }
      }
    });

    onWsMessage('invisible_shift', (msg) => {
      const insight = {
        ...msg.insight,
        id: insightIdCounter++,
      };
      setInsights((prev) => [insight, ...prev].slice(0, 5));
      
      // Highlight affected player node
      if (insight.affected_player) {
        setHighlightedNodeId(insight.affected_player);
        setTimeout(() => setHighlightedNodeId(null), 3500);
      }

      // Sassy Roast update
      if (insight.roast) {
        setRoasts(prev => [{ id: insight.id, text: insight.roast }, ...prev].slice(0, 4));
      }

      // AI Voice Commentator ("Auditory Wow")
      if ('speechSynthesis' in window && insight.body) {
        try {
          const u = new SpeechSynthesisUtterance(insight.body);
          u.rate = 1.05;
          u.pitch = 1.1;
          const voices = window.speechSynthesis.getVoices();
          const v = voices.find(v => v.lang.startsWith('en')) || voices[0];
          if (v) u.voice = v;
          window.speechSynthesis.speak(u);
        } catch (e) {
          console.error("Speech Synthesis Error", e);
        }
      }
    });

    onWsMessage('graph_reset', (msg) => {
      updateFromMessage(msg);
      setInsights([]);
      setSelectedNode(null);
      setDeliveryCommentary('');
      setRoasts([]);
      setStreamRunning(false);
    });

    onWsMessage('match_complete', () => {
      setStreamRunning(false);
      addInsight({
        type: 'match_complete',
        title: '🏆 Innings Complete',
        body: `${score.batting_team} finished their innings at ${score.runs}/${score.wickets} in ${score.overs}.${score.balls} overs.`,
        severity: 'info',
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Insight management ───────────────────────────────────────────────────
  const addInsight = useCallback((insight) => {
    setInsights((prev) => [{ ...insight, id: insightIdCounter++ }, ...prev].slice(0, 5));
  }, []);

  const dismissInsight = useCallback((id) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ── Node handlers ────────────────────────────────────────────────────────
  const handleNodeClick = useCallback((nodeData) => {
    setSelectedNode(nodeData);
  }, []);

  const handleEdgeClick = useCallback(async (edgeData) => {
    if (edgeData.edge_type === 'batting_against' || edgeData.edge_type === 'dismissal') {
      const srcNode = graphState.nodes?.find((n) => n.id === edgeData.source);
      const tgtNode = graphState.nodes?.find((n) => n.id === edgeData.target);
      if (srcNode && tgtNode) {
        setH2hData({ edge: edgeData, sourceNode: srcNode, targetNode: tgtNode });
      }
    }
  }, [graphState.nodes]);

  // ── Compute stats for legend ─────────────────────────────────────────────
  const nodeCount = graphState.nodes?.length || 0;
  const edgeCount = graphState.edges?.length || 0;

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <Scoreboard
        score={score}
        wsStatus={wsStatus}
        streamRunning={streamRunning}
        deliveryCommentary={deliveryCommentary}
        pressureIndex={pressureIndex}
        timeline={timeline}
      />

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 relative overflow-hidden">

        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="sidebar flex-shrink-0 flex flex-col overflow-hidden bg-white/5 border-r border-white/10 shadow-xl shadow-black/50"
              style={{ width: 300, zIndex: 20 }}
            >
              <div className="flex-1 p-4 scrollable overflow-y-auto">
                <div className="flex flex-col gap-5">
                  {/* Dashboard Header */}
                  <div className="mb-2 pb-3 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
                      <span>📊</span> DASHBOARD
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-1">Live Match Intel & Insights</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded text-[9px] text-green-400 font-mono border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        AI ACTIVE
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded text-[9px] text-cyan-400 font-mono border border-cyan-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                        STREAMING
                      </div>
                    </div>
                  </div>
                  {/* Graph Legend stats */}
                  <GraphLegend
                    pressureIndex={pressureIndex}
                    nodeCount={nodeCount}
                    edgeCount={edgeCount}
                  />

                  {/* Node detail (player clicked) */}
                  <AnimatePresence mode="wait">
                    {selectedNode && (
                      <div
                        key="node-detail-wrapper"
                        className="rounded-xl p-3"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-2">
                          Selected Node
                        </p>
                        <NodeDetail
                          player={selectedNode}
                          onClose={() => setSelectedNode(null)}
                        />
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Sassy Roast Feed */}
                  <AnimatePresence>
                    {roasts.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2">
                        <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                          <span>🔥</span> GraphOracle Roasts
                        </p>
                        {roasts.map(r => (
                          <motion.div
                            key={r.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-orange-500/10 border border-orange-500/20 p-2 rounded-lg text-[10px] text-orange-200"
                          >
                            <span className="font-bold mr-1">@GraphOracle:</span>
                            {r.text}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Graph Canvas (Hero) ───────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          <GraphCanvas
            ref={graphRef}
            graphState={graphState}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            highlightedNodeId={highlightedNodeId}
          />

          {/* ── Floating Controls Overlay ────────────────────────────────── */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-3 flex-wrap">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsStadiumTheme(!isStadiumTheme)}
              className={`btn flex items-center gap-1.5 px-3 py-1.5 font-bold tracking-widest rounded-lg transition-colors text-xs flex-shrink-0 ${
                isStadiumTheme
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 shadow-[0_0_15px_rgba(0,255,0,0.2)]'
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
              }`}
            >
              <span>{isStadiumTheme ? '🏟️' : '🌙'}</span>
              STADIUM LIGHTS
            </button>

            {/* Sidebar toggle */}
            <button
              onClick={() => setShowSidebar((s) => !s)}
              className="btn btn-ghost py-1 px-2 flex-shrink-0"
              title="Toggle sidebar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
            </button>

            {/* Query Bar */}
            <div className="flex-1 min-w-0 max-w-xl">
              <QueryBar onInsight={addInsight} />
            </div>

            {/* Viral Share Button */}
            <button
              onClick={() => {
                if (graphRef.current) {
                  const uri = graphRef.current.getScreenshot();
                  setViralScreenshot(uri);
                }
              }}
              className="btn flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/40 hover:border-violet-400 font-bold tracking-widest rounded-lg transition-colors text-xs"
            >
              🚀 SHARE
            </button>

            {/* Playback controls */}
            <PlaybackControls
              streamRunning={streamRunning}
              onToggle={setStreamRunning}
              onReset={() => {
                setInsights([]);
                setSelectedNode(null);
                setDeliveryCommentary('');
                setStreamRunning(false);
              }}
              speed={speed}
              onSpeedChange={setSpeed}
            />
          </div>

          {/* ── Fit/Reset View buttons ────────────────────────────────────── */}
          <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-2">
            <button
              onClick={() => graphRef.current?.fitGraph()}
              className="btn btn-ghost py-1.5 px-2 text-xs"
              title="Fit graph to screen"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            </button>
            <button
              onClick={() => graphRef.current?.resetView()}
              className="btn btn-ghost py-1.5 px-2 text-xs"
              title="Reset zoom"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
              </svg>
            </button>
          </div>

          {/* ── Graph info watermark ──────────────────────────────────────── */}
          <div className="absolute bottom-4 right-4 z-10 text-right pointer-events-none">
            <p className="text-[9px] text-slate-700 font-mono">
              {nodeCount} nodes · {edgeCount} edges · over {graphState.over}.{graphState.ball || 0}
            </p>
          </div>

          {/* ── Connection overlay (when disconnected) ─────────────────────── */}
          <AnimatePresence>
            {wsStatus === 'disconnected' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
                style={{ background: 'rgba(10, 14, 26, 0.7)', backdropFilter: 'blur(4px)' }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🔌</div>
                  <p className="text-sm font-semibold text-slate-300">Connecting to GraphOracle...</p>
                  <p className="text-xs text-slate-500 mt-1">Ensure backend is running on port 8000</p>
                  <div className="mt-3 flex justify-center">
                    <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Insight Stack (bottom-right overlay) ─────────────────────────── */}
      <InsightStack insights={insights} onDismiss={dismissInsight} />

      {/* Viral Share Modal */}
      <AnimatePresence>
        {viralScreenshot && (
          <ViralShareCard 
            screenshotUri={viralScreenshot} 
            score={score}
            onClose={() => setViralScreenshot(null)} 
          />
        )}
      </AnimatePresence>

      {/* H2H Battle Modal */}
      <AnimatePresence>
        {h2hData && (
          <H2HModal 
            {...h2hData}
            onClose={() => setH2hData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
