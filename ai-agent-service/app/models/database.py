"""
SQLModel Database Models for persistent storage
"""
from sqlmodel import SQLModel, Field, create_engine, Session, Relationship
from typing import Optional, List
from datetime import datetime
import json


# ==========================================
# DATABASE SETUP
# ==========================================

DATABASE_URL = "sqlite:///./data/kayak_ai.db"
engine = create_engine(DATABASE_URL, echo=False)


def get_session():
    with Session(engine) as session:
        yield session


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# ==========================================
# FLIGHT MODELS
# ==========================================

class Flight(SQLModel, table=True):
    """Persistent flight record"""
    id: Optional[int] = Field(default=None, primary_key=True)
    deal_id: str = Field(index=True, unique=True)
    
    origin: str = Field(index=True)
    destination: str = Field(index=True)
    airline: str
    departure_time: datetime
    arrival_time: datetime
    duration_minutes: int
    stops: int = 0
    
    # Pricing
    price: float
    original_price: float
    avg_30d_price: Optional[float] = None
    discount_percent: float = 0
    
    # Availability
    seats_available: int
    fare_class: str = "Economy"
    
    # Deal info
    deal_score: int = 0
    tags_json: str = "[]"  # JSON string of tags
    is_active: bool = True
    expires_at: Optional[datetime] = None
    
    # Explanations
    why_this: str = ""
    what_to_watch: str = ""
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @property
    def tags(self) -> List[str]:
        return json.loads(self.tags_json)
    
    @tags.setter
    def tags(self, value: List[str]):
        self.tags_json = json.dumps(value)


# ==========================================
# HOTEL MODELS
# ==========================================

class Hotel(SQLModel, table=True):
    """Persistent hotel record"""
    id: Optional[int] = Field(default=None, primary_key=True)
    deal_id: str = Field(index=True, unique=True)
    
    name: str
    city: str = Field(index=True)
    neighborhood: str
    stars: int
    
    # Pricing
    price_per_night: float
    original_price: float
    avg_30d_price: Optional[float] = None
    discount_percent: float = 0
    
    # Availability
    rooms_available: int
    
    # Features
    amenities_json: str = "[]"
    cancellation_policy: str = "Non-refundable"
    pet_friendly: bool = False
    breakfast_included: bool = False
    near_transit: bool = False
    
    # Deal info
    deal_score: int = 0
    tags_json: str = "[]"
    is_active: bool = True
    expires_at: Optional[datetime] = None
    
    # Explanations
    why_this: str = ""
    what_to_watch: str = ""
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @property
    def tags(self) -> List[str]:
        return json.loads(self.tags_json)
    
    @property
    def amenities(self) -> List[str]:
        return json.loads(self.amenities_json)


# ==========================================
# BUNDLE MODELS
# ==========================================

class Bundle(SQLModel, table=True):
    """Saved bundle combinations"""
    id: Optional[int] = Field(default=None, primary_key=True)
    bundle_id: str = Field(index=True, unique=True)
    
    flight_deal_id: str = Field(foreign_key="flight.deal_id")
    hotel_deal_id: str = Field(foreign_key="hotel.deal_id")
    
    total_price: float
    savings: float
    fit_score: int = 0
    
    why_this_bundle: str = ""
    tradeoffs: str = ""
    what_to_watch: str = ""
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ==========================================
# WATCH MODELS
# ==========================================

class Watch(SQLModel, table=True):
    """Price/inventory watches"""
    id: Optional[int] = Field(default=None, primary_key=True)
    watch_id: str = Field(index=True, unique=True)
    
    user_id: str = Field(index=True)
    deal_id: str
    deal_type: str  # 'flight' or 'hotel'
    bundle_id: Optional[str] = None
    
    # Thresholds
    price_threshold: Optional[float] = None
    inventory_threshold: Optional[int] = None
    
    # Status
    is_active: bool = True
    last_checked: Optional[datetime] = None
    last_notified: Optional[datetime] = None
    
    # Notification
    notify_via: str = "websocket"
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ==========================================
# CHAT SESSION MODELS
# ==========================================

class ChatSession(SQLModel, table=True):
    """Chat session with context"""
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True, unique=True)
    
    user_id: Optional[str] = None
    context_json: str = "[]"  # JSON array of messages
    
    # Extracted constraints
    origin: Optional[str] = None
    destination: Optional[str] = None
    departure_date: Optional[datetime] = None
    return_date: Optional[datetime] = None
    budget: Optional[float] = None
    travelers: int = 1
    
    # Preferences
    pet_friendly: bool = False
    avoid_red_eye: bool = False
    breakfast_required: bool = False
    refundable_preferred: bool = False
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ==========================================
# PRICE HISTORY (for 30-day averages)
# ==========================================

class PriceHistory(SQLModel, table=True):
    """Historical prices for deal detection"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    deal_id: str = Field(index=True)
    deal_type: str
    price: float
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

