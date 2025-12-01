"""
WebSocket Connection Manager for real-time updates
"""
import json
import asyncio
from typing import Dict, List, Set, Any
from fastapi import WebSocket
from datetime import datetime


class ConnectionManager:
    """
    Manages WebSocket connections and broadcasts events to clients.
    """
    
    def __init__(self):
        # All active connections
        self.active_connections: List[WebSocket] = []
        
        # Connections by session ID
        self.session_connections: Dict[str, WebSocket] = {}
        
        # Watch subscriptions: watch_id -> set of websockets
        self.watch_subscriptions: Dict[str, Set[WebSocket]] = {}
        
        # Deal subscriptions: deal_type -> set of websockets
        self.deal_subscriptions: Dict[str, Set[WebSocket]] = {
            'flight': set(),
            'hotel': set(),
            'all': set()
        }
    
    async def connect(self, websocket: WebSocket, session_id: str = None):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if session_id:
            self.session_connections[session_id] = websocket
        
        # Subscribe to all deals by default
        self.deal_subscriptions['all'].add(websocket)
        
        # Send welcome message
        await websocket.send_json({
            'type': 'connected',
            'message': 'Connected to Kayak AI Agent',
            'timestamp': datetime.utcnow().isoformat(),
            'session_id': session_id
        })
    
    def disconnect(self, websocket: WebSocket, session_id: str = None):
        """Remove a WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if session_id and session_id in self.session_connections:
            del self.session_connections[session_id]
        
        # Remove from all subscriptions
        for deal_type in self.deal_subscriptions:
            self.deal_subscriptions[deal_type].discard(websocket)
        
        for watch_id in list(self.watch_subscriptions.keys()):
            self.watch_subscriptions[watch_id].discard(websocket)
            if not self.watch_subscriptions[watch_id]:
                del self.watch_subscriptions[watch_id]
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send message to specific connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending to websocket: {e}")
            self.disconnect(websocket)
    
    async def send_to_session(self, session_id: str, message: dict):
        """Send message to specific session"""
        websocket = self.session_connections.get(session_id)
        if websocket:
            await self.send_personal(websocket, message)
    
    async def broadcast(self, message: dict, deal_type: str = 'all'):
        """Broadcast message to all relevant subscribers"""
        message['timestamp'] = datetime.utcnow().isoformat()
        
        # Get relevant connections
        connections = set()
        connections.update(self.deal_subscriptions.get('all', set()))
        
        if deal_type in self.deal_subscriptions:
            connections.update(self.deal_subscriptions[deal_type])
        
        # Send to all
        disconnected = []
        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)
        
        # Clean up disconnected
        for ws in disconnected:
            self.disconnect(ws)
    
    async def broadcast_watch_event(self, watch_id: str, event: dict):
        """Broadcast to watchers of specific deal/watch"""
        event['timestamp'] = datetime.utcnow().isoformat()
        
        connections = self.watch_subscriptions.get(watch_id, set())
        
        disconnected = []
        for websocket in connections:
            try:
                await websocket.send_json(event)
            except Exception:
                disconnected.append(websocket)
        
        for ws in disconnected:
            self.disconnect(ws)
    
    def subscribe_to_watch(self, websocket: WebSocket, watch_id: str):
        """Subscribe a connection to watch events"""
        if watch_id not in self.watch_subscriptions:
            self.watch_subscriptions[watch_id] = set()
        self.watch_subscriptions[watch_id].add(websocket)
    
    def subscribe_to_deals(self, websocket: WebSocket, deal_type: str):
        """Subscribe to deal updates for specific type"""
        if deal_type in self.deal_subscriptions:
            self.deal_subscriptions[deal_type].add(websocket)
    
    @property
    def connection_count(self) -> int:
        """Get current connection count"""
        return len(self.active_connections)


# Global instance
manager = ConnectionManager()

