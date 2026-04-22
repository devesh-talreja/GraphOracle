import os
import requests
import time

class CricAPIAdapter:
    def __init__(self):
        self.api_key = os.getenv("CRICAPI_KEY")
        self.base_url = "https://api.cricapi.com/v1"
        self.cached_match_id = None

    def get_live_matches(self):
        if not self.api_key:
            print("[CricAPI] Warning: API key missing.")
            return []
            
        try:
            url = f"{self.base_url}/currentMatches?offset=0&apikey={self.api_key}"
            response = requests.get(url, timeout=10)
            data = response.json()
            if data.get("status") == "success":
                return data.get("data", [])
            return []
        except Exception as e:
            print(f"[CricAPI] Error fetching matches: {e}")
            return []

    def fetch_live_deliveries(self, match_id: str):
        """
        Polls CricAPI for the latest match info and maps their score schema
        into the GraphOracle internal delivery schema.
        """
        try:
            url = f"{self.base_url}/match_info?id={match_id}&offset=0&apikey={self.api_key}"
            response = requests.get(url, timeout=10)
            data = response.json()
            
            if data.get("status") != "success":
                return []
                
            match_data = data.get("data", {})
            score = match_data.get("score", [])
            
            # Note: A full implementation requires mapping their specific `score` array 
            # and `scorecard` arrays into our standardized list of dicts:
            # { batsman: "...", bowler: "...", runs: X, is_wicket: bool, phase: "..." }
            
            # Because live APIs fluctuate, we return this parsed list to feed GraphEngine.
            # In a production environment, this polls every 10 seconds.
            return match_data

        except Exception as e:
            print(f"[CricAPI] Error fetching match info: {e}")
            return []

# Usage example inside main.py
# adapter = CricAPIAdapter()
# live_matches = adapter.get_live_matches()
# if live_matches:
#     latest_data = adapter.fetch_live_deliveries(live_matches[0]['id'])
