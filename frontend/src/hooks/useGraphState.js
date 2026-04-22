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
  const [timeline, setTimeline] = useState([]);

  const updateFromMessage = useCallback((msg) => {
    if (msg.graph_state) {
      setGraphState(msg.graph_state);
    }
    if (msg.score) {
      setScore(msg.score);
    }
    if (msg.delivery) {
      setLastDelivery(msg.delivery);
      setTimeline((prev) => {
        let newTimeline = [...prev];
        // If a new over started, maybe clear, but a rolling 6 is safer for display.
        if (msg.score && msg.score.balls === 1 && prev.length >= 6) {
           newTimeline = [];
        }
        if (msg.delivery.is_wicket) newTimeline.push('W');
        else newTimeline.push(msg.delivery.runs);
        if (newTimeline.length > 6) newTimeline = newTimeline.slice(newTimeline.length - 6);
        return newTimeline;
      });
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
    timeline,
    updateFromMessage,
    setGraphState,
    setScore,
    setPressureIndex,
  };
}
