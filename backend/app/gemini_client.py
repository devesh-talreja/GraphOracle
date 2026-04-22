import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Pre-written mock insights for fallback
MOCK_INSIGHTS = [
    {
        "title": "🔄 Invisible Shift Detected",
        "body": "Bumrah's gravitational pull has become the central axis of MI's bowling strategy. Three batsmen now structure their shot selection around him — even the ones yet to face him. The tactical web is tightening.",
        "severity": "critical"
    },
    {
        "title": "⚡ Momentum Shift Alert",
        "body": "After Suryakumar Yadav's dismissal, the scoring rate has dropped by 40%. CSK's bowlers have shifted to targeting the stumps — a signal they sense vulnerability. The matchup dynamics have fundamentally changed.",
        "severity": "warning"
    },
    {
        "title": "🎯 Tactical Pattern Emerging",
        "body": "Jadeja is being used as a containment bowler with 2 fielders in the ring. The left-arm spin against right-handers is yielding a 4.2 economy — a key strategic anchor for CSK in the middle phase.",
        "severity": "info"
    },
    {
        "title": "🔥 Death Over Setup",
        "body": "CSK's captain is establishing the field now for death over bowling. Matheesha Pathirana's yorker length is being fine-tuned against Tim David's powerzone — the short ball trap is being laid.",
        "severity": "warning"
    },
    {
        "title": "📊 Pressure Index Rising",
        "body": "Required run rate has crossed 10.5 — a psychological threshold. CSK's fielding intensity graph shows 3 misfields in the last over, suggesting the pressure is affecting the fielding side too.",
        "severity": "critical"
    },
]

_mock_index = 0


def _get_mock_insight(idx=None):
    global _mock_index
    if idx is not None:
        return MOCK_INSIGHTS[idx % len(MOCK_INSIGHTS)]
    insight = MOCK_INSIGHTS[_mock_index % len(MOCK_INSIGHTS)]
    _mock_index += 1
    return insight


class GeminiClient:
    def __init__(self):
        self.client = None
        if GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=GEMINI_API_KEY)
                print("[Gemini] OK - Initialized with google-genai SDK")
            except Exception as e:
                print(f"[Gemini] FAILED to initialize: {e}")
        else:
            print("[Gemini] WARNING - No API key, using mock responses")

    async def _generate(self, prompt: str) -> str:
        """Call Gemini 1.5 Flash and return response text."""
        if not self.client:
            return None
        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    max_output_tokens=200,
                    temperature=0.7,
                ),
            )
            return response.text.strip()
        except Exception as e:
            print(f"[Gemini] Generation error: {e}")
            return None

    async def query_nl(self, question: str, graph_context: str) -> dict:
        """Handle a natural language query with graph context."""
        prompt = f"""You are GraphOracle, an elite cricket analytics AI that analyzes live knowledge graphs.

Current match graph context:
{graph_context}

User question: {question}

Respond with a sharp, data-driven tactical insight in 2-3 sentences. 
Focus on: matchup dynamics, tactical implications, what the graph reveals that commentators miss.
Start with one punchy sentence that directly answers the question.
Tone: confident, analytical, like a world-class cricket analyst.
Do NOT use generic phrases. Be specific to the data above."""

        text = await self._generate(prompt)
        if text:
            return {
                "title": f"🏏 {question[:60]}",
                "body": text,
                "severity": "info",
                "type": "nl_query_response",
            }
        
        m = _get_mock_insight()
        return {
            "title": f"🏏 {question[:60]}",
            "body": f"Based on current graph analysis: {m['body']}",
            "severity": m["severity"],
            "type": "nl_query_response",
        }

    async def explain_invisible_shift(self, shifts: list, over_number: int,
                                      graph_context: str):
        """Generate tactical explanation for an invisible shift."""
        if not shifts:
            return None

        top_shift = max(shifts, key=lambda x: abs(x["delta"]))
        player_name = top_shift.get("name", top_shift["node_id"])
        prev = top_shift["previous"]
        curr = top_shift["current"]
        delta = top_shift["delta"]
        direction = "risen" if delta > 0 else "fallen"

        prompt = f"""You are GraphOracle's Invisible Shift detector — an AI that finds tactical patterns nobody else sees.

Match context:
{graph_context}

Graph centrality analysis between over {over_number - 1} and over {over_number}:
{player_name}'s betweenness centrality shifted from {prev:.3f} → {curr:.3f} (Δ{delta:+.3f})

This means {player_name} has {"become a more critical tactical bridge" if delta > 0 else "become less central to the match dynamics"}.

Generate a JSON response with exactly these two keys:
{{
  "tactical_insight": "A sharp, specific 2-sentence tactical explanation for WHY this happened and WHAT it means.",
  "sassy_roast": "A witty, slightly biased, 1-sentence internet-style roast/meme commentary about this player or situation (Reddit/Twitter style humor)."
}}

Return ONLY raw JSON, with no markdown formatting or codeblocks."""

        # Use new generic config to enforce JSON
        try:
            if self.client:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        max_output_tokens=300,
                        temperature=0.8,
                        response_mime_type="application/json"
                    ),
                )
                text = response.text.strip()
            else:
                text = None
        except Exception as e:
            print(f"[Gemini] Error generating explanation: {e}")
            text = None

        severity = "critical" if abs(delta) > 0.25 else "warning"

        if text:
            import json
            try:
                data = json.loads(text)
                return {
                    "title": f"⚡ Invisible Shift: {player_name}",
                    "body": data.get("tactical_insight", "Shift detected."),
                    "roast": data.get("sassy_roast", ""),
                    "affected_player": top_shift["node_id"],
                    "centrality_delta": delta,
                    "severity": severity,
                    "type": "invisible_shift",
                }
            except json.JSONDecodeError:
                pass


        m = _get_mock_insight()
        return {
            "title": f"⚡ Invisible Shift: {player_name}",
            "body": f"{player_name}'s centrality {direction} by {abs(delta):.3f}. {m['body']}",
            "roast": f"Bro really thought changing centrality would hide the fact he's struggling. Typical {player_name} moment.",
            "affected_player": top_shift["node_id"],
            "centrality_delta": delta,
            "severity": severity,
            "type": "invisible_shift",
        }
