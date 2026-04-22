import networkx as nx
from .graph_engine import GraphEngine
from .gemini_client import GeminiClient


SHIFT_THRESHOLD = 0.08  # Tuned for ~30 node cricket graph


class InsightEngine:
    def __init__(self, graph_engine: GraphEngine, gemini: GeminiClient):
        self.graph_engine = graph_engine
        self.gemini = gemini
        self.centrality_snapshots: dict[int, dict] = {}
        self.last_checked_over = 0

    async def check_for_shift(self, over_number: int):
        """Called at the end of each over. Returns insight dict or None."""
        if over_number == self.last_checked_over:
            return None
        self.last_checked_over = over_number

        current_snapshot = self.graph_engine.get_centrality_snapshot()
        prev_snapshot = self.centrality_snapshots.get(over_number - 1, {})
        self.centrality_snapshots[over_number] = current_snapshot

        if not prev_snapshot:
            return None

        # Find significant shifts
        shifts = []
        for node_id, curr_val in current_snapshot.items():
            prev_val = prev_snapshot.get(node_id, 0.0)
            delta = curr_val - prev_val
            if abs(delta) > SHIFT_THRESHOLD:
                node_name = self.graph_engine.G.nodes[node_id].get("name", node_id)
                node_role = self.graph_engine.G.nodes[node_id].get("role", "")
                # Only report on player nodes (not conditions/pitch)
                if node_role in ("batsman", "bowler", "allrounder"):
                    shifts.append({
                        "node_id": node_id,
                        "name": node_name,
                        "previous": round(prev_val, 4),
                        "current": round(curr_val, 4),
                        "delta": round(delta, 4),
                        "direction": "rising" if delta > 0 else "falling",
                    })

        if not shifts:
            return None

        # Sort by magnitude
        shifts.sort(key=lambda x: abs(x["delta"]), reverse=True)

        # Get graph context and explain via Gemini
        context = self.graph_engine.get_full_context_string()
        insight = await self.gemini.explain_invisible_shift(shifts, over_number, context)
        return insight

    def get_pressure_index(self) -> float:
        """
        Pressure = runs needed vs available balls / capacity.
        Returns 0.0 (calm) to 1.0 (maximum pressure).
        """
        score = self.graph_engine.score
        target = score.get("target", 163)
        runs = score.get("runs", 0)
        overs = score.get("overs", 0)
        balls = score.get("balls", 0)
        wickets = score.get("wickets", 0)

        runs_needed = target - runs
        balls_remaining = (20 - overs) * 6 - balls

        if balls_remaining <= 0 or runs_needed <= 0:
            return 0.0

        required_rate = (runs_needed / balls_remaining) * 6
        wickets_factor = wickets / 10.0

        # Normalize: RRR of 6 = low pressure, RRR of 18+ = max pressure
        rate_pressure = min(1.0, max(0.0, (required_rate - 6) / 12))
        pressure = (rate_pressure * 0.7) + (wickets_factor * 0.3)
        return round(min(1.0, pressure), 3)
