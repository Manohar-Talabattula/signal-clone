import json
from typing import Dict, List, Set
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Map user_id to set of active WebSocket connections (allows multiple tabs/devices per user)
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            data = json.dumps(message)
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_text(data)
                except Exception:
                    self.active_connections[user_id].discard(connection)

    async def broadcast_to_users(self, message: dict, user_ids: List[int]):
        data = json.dumps(message)
        for uid in user_ids:
            if uid in self.active_connections:
                for connection in list(self.active_connections[uid]):
                    try:
                        await connection.send_text(data)
                    except Exception:
                        self.active_connections[uid].discard(connection)

manager = ConnectionManager()
