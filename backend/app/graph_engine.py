import networkx as nx
import json
import time
from pathlib import Path
from typing import Optional


class GraphEngine:
    def __init__(self):
        self.G = nx.DiGraph()
        self.match_info = {}
        self.players = {}
        self.score = {
            "batting_team": "MI",
            "bowling_team": "CSK",
            "runs": 0,
            "wickets": 0,
            "overs": 0,
            "balls": 0,
            "run_rate": 0.0,
            "required_rate": 0.0,
            "target": 163,
            "innings": 1,
        }
        self.current_over = 0
        self.current_ball = 0
        self.deliveries_processed = 0
        self._load_match_data()

    def _load_match_data(self):
        data_path = Path(__file__).parent.parent / "data" / "mock_match.json"
        with open(data_path) as f:
            data = json.load(f)
        self.match_info = data["match_info"]
        self.players = data["players"]
        self.all_deliveries = data["deliveries"] + data["live_deliveries"]
        self.preload_deliveries = data["deliveries"]
        self.live_deliveries = data["live_deliveries"]

        # Initialize static nodes
        for player_id, player in self.players.items():
            self._add_player_node(player_id, player)

    def _add_player_node(self, node_id: str, player: dict):
        if not self.G.has_node(node_id):
            self.G.add_node(
                node_id,
                id=node_id,
                name=player["name"],
                team=player["team"],
                role=player["role"],
                runs=0,
                balls_faced=0,
                strike_rate=0.0,
                wickets=0,
                runs_conceded=0,
                economy=0.0,
                balls_bowled=0,
                status="active",
                centrality=0.0,
                updated=False,
            )

    def preload(self):
        """Load first N overs of data so the graph is dense on demo start."""
        for delivery in self.preload_deliveries:
            self._process_delivery(delivery, update_score=True)
        self._update_centrality()
        return self.get_graph_state()

    def process_next_delivery(self) -> Optional[dict]:
        """Process next live delivery, return the delivery + updated graph state."""
        idx = self.deliveries_processed - len(self.preload_deliveries)
        if idx < 0 or idx >= len(self.live_deliveries):
            return None
        delivery = self.live_deliveries[idx]
        self.deliveries_processed += 1
        self._process_delivery(delivery, update_score=True)
        return delivery

    def _process_delivery(self, delivery: dict, update_score=False):
        batsman_id = delivery["batsman"]
        bowler_id = delivery["bowler"]
        runs = delivery["runs"]
        is_wicket = delivery["is_wicket"]
        phase = delivery["phase"]
        over = delivery["over"]
        ball = delivery["ball"]

        self.current_over = over
        self.current_ball = ball
        self.deliveries_processed += 1 if not update_score else 0

        # Reset update flags
        for node in self.G.nodes():
            self.G.nodes[node]["updated"] = False

        # Ensure nodes exist (they should from init)
        if batsman_id not in self.players:
            return
        if bowler_id not in self.players:
            return

        # Update batsman stats
        bat_node = self.G.nodes[batsman_id]
        bat_node["balls_faced"] += 1
        bat_node["runs"] += runs
        bat_node["strike_rate"] = round(
            (bat_node["runs"] / bat_node["balls_faced"]) * 100, 1
        ) if bat_node["balls_faced"] > 0 else 0.0
        bat_node["updated"] = True

        # Update bowler stats
        bowl_node = self.G.nodes[bowler_id]
        bowl_node["balls_bowled"] += 1
        bowl_node["runs_conceded"] += runs
        overs_bowled = bowl_node["balls_bowled"] / 6
        bowl_node["economy"] = round(
            bowl_node["runs_conceded"] / overs_bowled, 2
        ) if overs_bowled > 0 else 0.0
        bowl_node["updated"] = True

        # Handle wicket
        if is_wicket:
            bat_node["status"] = "dismissed"
            bowl_node["wickets"] += 1
            self._add_or_update_edge(
                batsman_id, bowler_id, "dismissal", runs=runs, balls=1, wickets=1
            )
            if update_score:
                self.score["wickets"] += 1

        # Add/update batting_against edge
        self._add_or_update_edge(
            batsman_id, bowler_id, "batting_against", runs=runs, balls=1
        )

        # Add/update performs_in edges (condition)
        condition_id = f"{phase}_cond"
        if condition_id in self.players:
            self._add_or_update_edge(batsman_id, condition_id, "performs_in", runs=runs, balls=1)
            self._add_or_update_edge(bowler_id, condition_id, "performs_in", runs=runs, balls=1)

        # Add plays_for edge if not existing
        bat_team_id = f"{self.players[batsman_id]['team'].lower()}_team" if f"{self.players[batsman_id]['team'].lower()}_team" in self.G else None
        
        # Update score
        if update_score:
            self.score["runs"] += runs
            balls = self.score["overs"] * 6 + self.score["balls"] + 1
            self.score["balls"] = (self.score["balls"] + 1) % 6
            if self.score["balls"] == 0:
                self.score["overs"] += 1
            total_balls = self.score["overs"] * 6 + self.score["balls"]
            self.score["run_rate"] = round(
                (self.score["runs"] / total_balls) * 6, 2
            ) if total_balls > 0 else 0.0

    def _add_or_update_edge(self, source: str, target: str, edge_type: str,
                            runs: int = 0, balls: int = 0, wickets: int = 0):
        edge_id = f"{source}_{target}_{edge_type}"

        if self.G.has_edge(source, target) and self.G[source][target].get("edge_type") == edge_type:
            e = self.G[source][target]
            e["balls"] = e.get("balls", 0) + balls
            e["runs"] = e.get("runs", 0) + runs
            e["wickets"] = e.get("wickets", 0) + wickets
            e["weight"] = max(1.0, e.get("balls", 0) / 3.0)
        else:
            self.G.add_edge(
                source, target,
                id=edge_id,
                edge_type=edge_type,
                balls=balls,
                runs=runs,
                wickets=wickets,
                weight=1.0,
            )

    def _update_centrality(self):
        if len(self.G.nodes) < 2:
            return
        try:
            centrality = nx.betweenness_centrality(self.G.to_undirected(), weight="weight", normalized=True)
            for node_id, val in centrality.items():
                if self.G.has_node(node_id):
                    self.G.nodes[node_id]["centrality"] = round(val, 4)
        except Exception:
            pass

    def get_centrality_snapshot(self) -> dict:
        self._update_centrality()
        return {
            node: self.G.nodes[node]["centrality"]
            for node in self.G.nodes()
        }

    def get_graph_state(self) -> dict:
        nodes = []
        for node_id in self.G.nodes():
            node_data = dict(self.G.nodes[node_id])
            node_data["id"] = node_id
            nodes.append(node_data)

        edges = []
        for source, target, edge_data in self.G.edges(data=True):
            e = dict(edge_data)
            e["source"] = source
            e["target"] = target
            edges.append(e)

        return {
            "nodes": nodes,
            "edges": edges,
            "over": self.current_over,
            "ball": self.current_ball,
            "score": dict(self.score),
            "timestamp": time.time(),
        }

    def get_player_context(self, player_id: str) -> dict:
        if not self.G.has_node(player_id):
            return {}
        node = dict(self.G.nodes[player_id])
        neighbors = []
        for neighbor in self.G.neighbors(player_id):
            neighbors.append({
                "id": neighbor,
                "name": self.G.nodes[neighbor].get("name", neighbor),
                "edge": dict(self.G[player_id][neighbor]),
            })
        return {"player": node, "matchups": neighbors}

    def get_full_context_string(self) -> str:
        """Serialize graph as a context string for Gemini."""
        lines = [
            f"Match: {self.match_info.get('title', 'MI vs CSK')}",
            f"Venue: {self.match_info.get('venue', 'Wankhede')} ({self.match_info.get('pitch_type', 'pace-friendly')})",
            f"Score: {self.score['batting_team']} {self.score['runs']}/{self.score['wickets']} in {self.score['overs']}.{self.score['balls']} overs",
            f"Run Rate: {self.score['run_rate']} | Target: {self.score.get('target', 'N/A')}",
            "",
            "=== PLAYER NODES ===",
        ]
        for node_id in self.G.nodes():
            n = self.G.nodes[node_id]
            if n.get("role") in ("batsman", "bowler", "allrounder"):
                if n.get("role") in ("batsman", "allrounder") and n.get("balls_faced", 0) > 0:
                    lines.append(
                        f"{n['name']} ({n['team']}, {n['role']}): "
                        f"{n['runs']} runs off {n['balls_faced']} balls, SR={n['strike_rate']}, "
                        f"Status={n['status']}, Centrality={n['centrality']}"
                    )
                if n.get("role") in ("bowler", "allrounder") and n.get("balls_bowled", 0) > 0:
                    lines.append(
                        f"{n['name']} ({n['team']}, bowler): "
                        f"{n['wickets']}W/{n['runs_conceded']}R, Economy={n['economy']}, "
                        f"Centrality={n['centrality']}"
                    )

        lines.append("")
        lines.append("=== KEY MATCHUP EDGES ===")
        for source, target, ed in self.G.edges(data=True):
            if ed.get("edge_type") == "batting_against" and ed.get("balls", 0) >= 3:
                src_name = self.G.nodes[source].get("name", source)
                tgt_name = self.G.nodes[target].get("name", target)
                lines.append(
                    f"{src_name} vs {tgt_name}: {ed['runs']}R off {ed['balls']}B"
                    + (f", DISMISSED" if ed.get("wickets", 0) > 0 else "")
                )
        return "\n".join(lines)
