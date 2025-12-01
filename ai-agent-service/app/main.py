"""
Kayak Agentic AI Recommendation Service

Multi-agent travel concierge that:
- Discovers deals (Deals Agent)
- Recommends bundles (Concierge Agent)
- Pushes real-time updates (WebSocket)

FastAPI + Pydantic v2 + SQLModel + Kafka
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime

from app.models.schemas import (
    BundleRequest, BundleResponse, ChatRequest, ChatResponse,
    WatchRequest, WatchEvent
)
from app.models.database import create_db_and_tables
from app.agents.deals_agent import DealsAgent
from app.agents.concierge_agent import ConciergeAgent
from app.services.websocket_manager import manager


# Global agent instances
deals_agent: Optional[DealsAgent] = None
concierge_agent: Optional[ConciergeAgent] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown"""
    global deals_agent, concierge_agent
    
    # Startup
    print("🚀 Starting Kayak AI Agent Service...")
    
    # Initialize database
    create_db_and_tables()
    print("✅ Database initialized")
    
    # Initialize agents
    deals_agent = DealsAgent(websocket_manager=manager)
    concierge_agent = ConciergeAgent(websocket_manager=manager)
    print("✅ Agents initialized")
    
    # Run initial data scan
    print("📊 Running initial deal scan...")
    await deals_agent.run_feed_scan()
    
    # Start background deals scanner (every 5 minutes)
    scan_task = asyncio.create_task(deals_agent.start(interval_seconds=300))
    
    print("=" * 50)
    print("🎯 Kayak AI Agent Service Ready!")
    print("=" * 50)
    
    yield
    
    # Shutdown
    print("🛑 Shutting down AI Agent Service...")
    deals_agent.stop()
    scan_task.cancel()
    try:
        await scan_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Kayak Agentic AI Service",
    description="Multi-agent travel recommendation service with real-time deal detection",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# HEALTH & STATUS
# ==========================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "kayak-ai-agent",
        "timestamp": datetime.utcnow().isoformat(),
        "connections": manager.connection_count
    }


@app.get("/status")
async def service_status():
    """Detailed service status"""
    return {
        "service": "kayak-ai-agent",
        "version": "1.0.0",
        "agents": {
            "deals_agent": "running" if deals_agent and deals_agent._running else "stopped",
            "concierge_agent": "ready" if concierge_agent else "not_initialized"
        },
        "connections": manager.connection_count,
        "timestamp": datetime.utcnow().isoformat()
    }


# ==========================================
# BUNDLES API (HTTP)
# ==========================================

@app.post("/bundles", response_model=BundleResponse)
async def find_bundles(request: BundleRequest):
    """
    Find travel bundles matching user criteria.
    
    Returns flight + hotel combinations sorted by fit score.
    """
    if not concierge_agent:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    intent = {
        'origin': request.origin,
        'destination': request.destination,
        'departure_date': request.departure_date,
        'return_date': request.return_date,
        'budget': request.budget,
        'travelers': request.travelers,
        'pet_friendly': request.pet_friendly,
        'avoid_red_eye': request.avoid_red_eye,
        'breakfast_required': request.breakfast_required,
        'refundable_preferred': request.refundable_preferred,
        'near_transit': request.near_transit,
    }
    
    # Parse natural language query if provided
    if request.query:
        parsed = concierge_agent.parse_intent(request.query)
        # Merge parsed intent with explicit fields (explicit wins)
        for key, value in parsed.items():
            if key not in intent or intent[key] is None:
                intent[key] = value
    
    bundles = concierge_agent.find_bundles(intent, limit=5)
    
    # Build constraints list for response
    constraints = []
    if request.pet_friendly:
        constraints.append("pet-friendly")
    if request.avoid_red_eye:
        constraints.append("no red-eye flights")
    if request.breakfast_required:
        constraints.append("breakfast included")
    if request.refundable_preferred:
        constraints.append("refundable")
    if request.near_transit:
        constraints.append("near transit")
    
    return BundleResponse(
        bundles=bundles,
        total_found=len(bundles),
        query_understood=request.query or f"Searching {request.origin or 'any'} to {request.destination or 'any'}",
        constraints_applied=constraints,
        suggestions=["Try adjusting dates for better deals", "Consider nearby airports"] if not bundles else []
    )


@app.get("/bundles/{bundle_id}")
async def get_bundle(bundle_id: str):
    """Get specific bundle details"""
    # In full implementation, would fetch from database
    raise HTTPException(status_code=404, detail="Bundle not found")


# ==========================================
# CHAT API (HTTP + WebSocket)
# ==========================================

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with the Concierge Agent.
    
    Understands natural language queries about travel.
    """
    if not concierge_agent:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    return await concierge_agent.handle_message(request)


# ==========================================
# WATCHES API
# ==========================================

@app.post("/watches")
async def create_watch(request: WatchRequest):
    """Create a price/inventory watch"""
    if not concierge_agent:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    # Simplified - in full implementation would use database
    from app.models.database import Watch, engine
    from sqlmodel import Session
    import uuid
    
    watch_id = f"watch-{uuid.uuid4().hex[:8]}"
    
    with Session(engine) as session:
        watch = Watch(
            watch_id=watch_id,
            user_id=request.user_id,
            deal_id=request.deal_id or "current",
            deal_type=request.deal_type.value,
            bundle_id=request.bundle_id,
            price_threshold=request.price_threshold,
            inventory_threshold=request.inventory_threshold,
            notify_via=request.notify_via
        )
        session.add(watch)
        session.commit()
    
    return {
        "watch_id": watch_id,
        "message": "Watch created successfully",
        "thresholds": {
            "price": request.price_threshold,
            "inventory": request.inventory_threshold
        }
    }


@app.get("/watches/{user_id}")
async def get_user_watches(user_id: str):
    """Get all watches for a user"""
    from app.models.database import Watch, engine
    from sqlmodel import Session, select
    
    with Session(engine) as session:
        watches = session.exec(
            select(Watch).where(Watch.user_id == user_id, Watch.is_active == True)
        ).all()
        
        return {
            "user_id": user_id,
            "watches": [
                {
                    "watch_id": w.watch_id,
                    "deal_id": w.deal_id,
                    "deal_type": w.deal_type,
                    "price_threshold": w.price_threshold,
                    "inventory_threshold": w.inventory_threshold,
                    "created_at": w.created_at.isoformat() if w.created_at else None
                }
                for w in watches
            ]
        }


@app.delete("/watches/{watch_id}")
async def delete_watch(watch_id: str):
    """Delete/deactivate a watch"""
    from app.models.database import Watch, engine
    from sqlmodel import Session, select
    
    with Session(engine) as session:
        watch = session.exec(select(Watch).where(Watch.watch_id == watch_id)).first()
        if not watch:
            raise HTTPException(status_code=404, detail="Watch not found")
        
        watch.is_active = False
        session.add(watch)
        session.commit()
    
    return {"message": "Watch deleted"}


# ==========================================
# DEALS API
# ==========================================

@app.get("/deals/flights")
async def get_flight_deals(
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50)
):
    """Get current flight deals"""
    from app.models.database import Flight, engine
    from sqlmodel import Session, select
    
    with Session(engine) as session:
        query = select(Flight).where(Flight.is_active == True)
        
        if origin:
            query = query.where(Flight.origin == origin.upper())
        if destination:
            query = query.where(Flight.destination == destination.upper())
        
        flights = session.exec(query.order_by(Flight.deal_score.desc()).limit(limit)).all()
        
        return {
            "deals": [
                {
                    "deal_id": f.deal_id,
                    "origin": f.origin,
                    "destination": f.destination,
                    "airline": f.airline,
                    "price": f.price,
                    "original_price": f.original_price,
                    "discount_percent": f.discount_percent,
                    "deal_score": f.deal_score,
                    "seats_available": f.seats_available,
                    "departure_time": f.departure_time.isoformat() if f.departure_time else None,
                    "why_this": f.why_this,
                    "what_to_watch": f.what_to_watch
                }
                for f in flights
            ],
            "count": len(flights)
        }


@app.get("/deals/hotels")
async def get_hotel_deals(
    city: Optional[str] = Query(None),
    pet_friendly: Optional[bool] = Query(None),
    limit: int = Query(10, ge=1, le=50)
):
    """Get current hotel deals"""
    from app.models.database import Hotel, engine
    from sqlmodel import Session, select
    
    with Session(engine) as session:
        query = select(Hotel).where(Hotel.is_active == True)
        
        if city:
            query = query.where(Hotel.city.ilike(f"%{city}%"))
        if pet_friendly is not None:
            query = query.where(Hotel.pet_friendly == pet_friendly)
        
        hotels = session.exec(query.order_by(Hotel.deal_score.desc()).limit(limit)).all()
        
        return {
            "deals": [
                {
                    "deal_id": h.deal_id,
                    "name": h.name,
                    "city": h.city,
                    "neighborhood": h.neighborhood,
                    "stars": h.stars,
                    "price_per_night": h.price_per_night,
                    "original_price": h.original_price,
                    "discount_percent": h.discount_percent,
                    "deal_score": h.deal_score,
                    "rooms_available": h.rooms_available,
                    "pet_friendly": h.pet_friendly,
                    "breakfast_included": h.breakfast_included,
                    "why_this": h.why_this,
                    "what_to_watch": h.what_to_watch
                }
                for h in hotels
            ],
            "count": len(hotels)
        }


# ==========================================
# WEBSOCKET ENDPOINTS
# ==========================================

@app.websocket("/events")
async def websocket_events(websocket: WebSocket, session_id: Optional[str] = None):
    """
    WebSocket endpoint for real-time updates.
    
    Receives:
    - New deal notifications
    - Watch alerts
    - Price changes
    """
    await manager.connect(websocket, session_id)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            
            message_type = data.get('type')
            
            if message_type == 'subscribe_deals':
                # Subscribe to deal updates
                deal_type = data.get('deal_type', 'all')
                manager.subscribe_to_deals(websocket, deal_type)
                await websocket.send_json({
                    'type': 'subscribed',
                    'subscription': f'deals:{deal_type}'
                })
            
            elif message_type == 'subscribe_watch':
                # Subscribe to watch alerts
                watch_id = data.get('watch_id')
                if watch_id:
                    manager.subscribe_to_watch(websocket, watch_id)
                    await websocket.send_json({
                        'type': 'subscribed',
                        'subscription': f'watch:{watch_id}'
                    })
            
            elif message_type == 'chat':
                # Handle chat via WebSocket
                if concierge_agent:
                    request = ChatRequest(
                        message=data.get('message', ''),
                        session_id=session_id
                    )
                    response = await concierge_agent.handle_message(request)
                    await websocket.send_json({
                        'type': 'chat_response',
                        'data': response.model_dump()
                    })
            
            elif message_type == 'ping':
                await websocket.send_json({'type': 'pong'})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, session_id)


# ==========================================
# TRIGGER SCAN (for testing)
# ==========================================

@app.post("/admin/scan")
async def trigger_scan():
    """Manually trigger a deal scan (for testing)"""
    if not deals_agent:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    result = await deals_agent.run_feed_scan()
    return {
        "message": "Scan completed",
        "result": result
    }


# ==========================================
# RUN SERVER
# ==========================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

