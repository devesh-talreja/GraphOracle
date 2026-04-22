from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class NLQueryRequest(BaseModel):
    query: str

class SimulateRequest(BaseModel):
    node_id: str
