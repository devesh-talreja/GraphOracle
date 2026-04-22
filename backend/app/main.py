import asyncio
import json
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .graph_engine import GraphEngine
from .gemini_client import GeminiClient
from .insight_engine import InsightEngine
from .websocket_manager import ConnectionManager
from .models import NLQueryRequest, SimulateRequest

# ── Global instances ──────────────────────────────────────────────────────────
graph_engine = GraphEngine()
gemini_client = GeminiClient()
insight_engine = InsightEngine(graph_engine, gemini_client)
ws_manager = ConnectionManager()

# Stream state
stream_running = False
stream_speed = 3.0  # seconds per delivery
stream_task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load match data on startup
    print("[GraphOracle] Pre-loading match data...")
    graph_engine.preload()
    print(f"[GraphOracle] Graph ready: {len(graph_engine.G.nodes)} nodes, {len(graph_engine.G.edges)} edges")
    
    # Take initial centrality snapshot
    snapshot = graph_engine.get_centrality_snapshot()
    insight_engine.centrality_snapshots[graph_engine.current_over] = snapshot
    print(f"[GraphOracle] Initial over snapshot taken: over {graph_engine.current_over}")
    yield
    print("[GraphOracle] Shutting down.")


app = FastAPI(title="GraphOracle", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── REST Endpoints ────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "nodes": len(graph_engine.G.nodes), "edges": len(graph_engine.G.edges)}


@app.get("/api/graph")
async def get_graph():
    return JSONResponse(graph_engine.get_graph_state())


@app.get("/api/pressure")
async def get_pressure():
    return {"pressure_index": insight_engine.get_pressure_index(), "score": graph_engine.score}


@app.post("/api/query")
async def nl_query(request: NLQueryRequest):
    context = graph_engine.get_full_context_string()
    insight = await gemini_client.query_nl(request.query, context)
    return {"query": request.query, "insight": insight}


@app.get("/api/player/{player_id}")
async def get_player(player_id: str):
    context = graph_engine.get_player_context(player_id)
    if not context:
        return JSONResponse({"error": "Player not found"}, status_code=404)
    return context


@app.post("/api/simulate")
async def simulate_scenario(req: SimulateRequest):
    context = graph_engine.get_player_context(req.node_id)
    if not context:
        return JSONResponse({"error": "Player not found"}, status_code=404)
        
    prompt = f"""You are the What-If Scenario Engine for a cricket analytics app.
    
    Given this player's context in the match:
    {context}
    
    Simulate their next over (6 balls).
    Generate a JSON response with exactly one key "balls" containing a list of exactly 6 strings.
    Each string should be a brief, realistic outcome (e.g. "Dot ball, sharp yorker.", "4 runs, pulled to deep mid-wicket", "WICKET! Caught at slip.").
    Do not use generic formatting. Keep it short.
    """
    try:
        if gemini_client.client:
            from google.genai import types
            response = gemini_client.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.9
                )
            )
            data = json.loads(response.text.strip())
            return data
    except Exception as e:
        print(f"Simulation error: {e}")
        
    # Mock fallback
    return {"balls": [
        "Good length, defended.",
        "Short ball, pulled for 4!",
        "Yorker, squeezed out for 1.",
        "Slower ball, swung and missed.",
        "Full toss, hit straight to cover.",
        "Wicket! Edged to the keeper."
    ]}


@app.post("/api/stream/start")
async def start_stream():
    global stream_running, stream_task
    if not stream_running:
        stream_running = True
        stream_task = asyncio.create_task(_stream_deliveries())
    return {"status": "streaming", "speed": stream_speed}


@app.post("/api/stream/pause")
async def pause_stream():
    global stream_running
    stream_running = False
    return {"status": "paused"}


@app.post("/api/stream/speed")
async def set_speed(speed: float = 3.0):
    global stream_speed
    stream_speed = max(0.5, min(10.0, speed))
    return {"speed": stream_speed}


@app.post("/api/stream/reset")
async def reset_stream():
    global stream_running, graph_engine, insight_engine
    stream_running = False
    graph_engine = GraphEngine()
    graph_engine.preload()
    insight_engine = InsightEngine(graph_engine, gemini_client)
    snapshot = graph_engine.get_centrality_snapshot()
    insight_engine.centrality_snapshots[graph_engine.current_over] = snapshot
    state = graph_engine.get_graph_state()
    await ws_manager.broadcast({
        "type": "graph_reset",
        "graph_state": state,
        "score": graph_engine.score,
    })
    return {"status": "reset"}


# ── WebSocket Endpoint ────────────────────────────────────────────────────────

@app.websocket("/ws/match")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial full graph state immediately
        state = graph_engine.get_graph_state()
        pressure = insight_engine.get_pressure_index()
        await ws_manager.send_json(websocket, {
            "type": "initial_state",
            "graph_state": state,
            "score": graph_engine.score,
            "pressure_index": pressure,
            "stream_running": stream_running,
        })

        # Keep connection alive, listen for client messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await ws_manager.send_json(websocket, {"type": "pong"})
                elif msg.get("type") == "stream_control":
                    action = msg.get("action", "")
                    if action == "start":
                        await start_stream()
                    elif action == "pause":
                        await pause_stream()
                    elif action == "set_speed":
                        await set_speed(msg.get("speed", 3.0))
            except asyncio.TimeoutError:
                # Send heartbeat
                await ws_manager.send_json(websocket, {"type": "heartbeat", "timestamp": time.time()})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS] Error: {e}")
        ws_manager.disconnect(websocket)


# ── Background Stream Task ────────────────────────────────────────────────────

async def _stream_deliveries():
    global stream_running
    while stream_running:
        delivery = graph_engine.process_next_delivery()
        if delivery is None:
            # End of deliveries - loop back for demo
            print("[Stream] End of deliveries, looping...")
            stream_running = False
            await ws_manager.broadcast({"type": "match_complete", "score": graph_engine.score})
            break

        state = graph_engine.get_graph_state()
        pressure = insight_engine.get_pressure_index()

        broadcast_msg = {
            "type": "delivery",
            "delivery": delivery,
            "graph_state": state,
            "score": graph_engine.score,
            "pressure_index": pressure,
        }
        await ws_manager.broadcast(broadcast_msg)

        # Check for invisible shift at end of each over
        if delivery["ball"] == 6:
            insight = await insight_engine.check_for_shift(delivery["over"])
            if insight:
                await ws_manager.broadcast({
                    "type": "invisible_shift",
                    "insight": insight,
                    "over": delivery["over"],
                })

        await asyncio.sleep(stream_speed)
