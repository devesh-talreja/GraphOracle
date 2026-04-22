import { useState, useCallback } from 'react';

export function useGraphState() {
  const [graphState, setGraphState] = useState({ nodes: [], edges: [] });
  const [score, setScore] = useState({
    batting_team: 'MI',
    bowling_team: 'CSK',
    runs: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    run_rate: 0,
    required_rate: 0,
    target: 163,
    innings: 1,
  });
  const [lastDelivery, setLastDelivery] = useState(null);
  const [pressureIndex, setPressureIndex] = useState(0);

  const updateFromMessage = useCallback((msg) => {
    if (msg.graph_state) {
      setGraphState(msg.graph_state);
    }
    if (msg.score) {
      setScore(msg.score);
    }
    if (msg.delivery) {
      setLastDelivery(msg.delivery);
    }
    if (msg.pressure_index !== undefined) {
      setPressureIndex(msg.pressure_index);
    }
  }, []);

  return {
    graphState,
    score,
    lastDelivery,
    pressureIndex,
    updateFromMessage,
    setGraphState,
    setScore,
    setPressureIndex,
  };
}
