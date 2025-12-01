"""
Pydantic v2 Schemas for the Agentic AI Recommendation Service
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, date
from enum import Enum


# ==========================================
# ENUMS
# ==========================================

class DealType(str, Enum):
    FLIGHT = "flight"
    HOTEL = "hotel"


class DealTag(str, Enum):
    PRICE_DROP = "price_drop"
    LIMITED_AVAILABILITY = "limited_availability"
    PROMO = "promo"
    PET_FRIENDLY = "pet_friendly"
    NEAR_TRANSIT = "near_transit"
    BREAKFAST_INCLUDED = "breakfast_included"
    REFUNDABLE = "refundable"
    NON_REFUNDABLE = "non_refundable"


class WatchEventType(str, Enum):
    PRICE_DROP = "price_drop"
    PRICE_INCREASE = "price_increase"
    INVENTORY_LOW = "inventory_low"
    SOLD_OUT = "sold_out"
    DEAL_EXPIRED = "deal_expired"


# ==========================================
# FLIGHT SCHEMAS
# ==========================================

class FlightBase(BaseModel):
    """Base flight schema"""
    model_config = ConfigDict(from_attributes=True)
    
    origin: str = Field(..., min_length=3, max_length=3, description="Origin airport IATA code")
    destination: str = Field(..., min_length=3, max_length=3, description="Destination airport IATA code")
    airline: str
    departure_time: datetime
    arrival_time: datetime
    duration_minutes: int
    stops: int = 0
    price: float
    seats_available: int
    fare_class: str = "Economy"


class FlightDeal(FlightBase):
    """Flight with deal information"""
    deal_id: str
    original_price: float
    discount_percent: float
    deal_score: int = Field(..., ge=0, le=100)
    tags: List[DealTag] = []
    avg_30d_price: Optional[float] = None
    expires_at: Optional[datetime] = None
    
    # Explanation fields
    why_this: str = ""
    what_to_watch: str = ""


# ==========================================
# HOTEL SCHEMAS
# ==========================================

class HotelBase(BaseModel):
    """Base hotel schema"""
    model_config = ConfigDict(from_attributes=True)
    
    name: str
    city: str
    neighborhood: str
    stars: int = Field(..., ge=1, le=5)
    price_per_night: float
    rooms_available: int
    amenities: List[str] = []
    cancellation_policy: str = "Non-refundable"
    pet_friendly: bool = False
    breakfast_included: bool = False
    near_transit: bool = False


class HotelDeal(HotelBase):
    """Hotel with deal information"""
    deal_id: str
    original_price: float
    discount_percent: float
    deal_score: int = Field(..., ge=0, le=100)
    tags: List[DealTag] = []
    avg_30d_price: Optional[float] = None
    expires_at: Optional[datetime] = None
    
    # Explanation fields
    why_this: str = ""
    what_to_watch: str = ""


# ==========================================
# BUNDLE SCHEMAS
# ==========================================

class TravelBundle(BaseModel):
    """Complete flight + hotel bundle"""
    model_config = ConfigDict(from_attributes=True)
    
    bundle_id: str
    flight: FlightDeal
    hotel: HotelDeal
    
    # Calculated fields
    total_price: float
    savings: float
    fit_score: int = Field(..., ge=0, le=100, description="How well bundle matches user constraints")
    
    # Explanations
    why_this_bundle: str
    tradeoffs: str
    what_to_watch: str
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BundleRequest(BaseModel):
    """User request for travel bundles"""
    origin: Optional[str] = None
    destination: Optional[str] = None
    departure_date: date
    return_date: date
    budget: float
    travelers: int = 1
    
    # Constraints
    pet_friendly: bool = False
    avoid_red_eye: bool = False
    breakfast_required: bool = False
    refundable_preferred: bool = False
    near_transit: bool = False
    
    # Natural language query (optional)
    query: Optional[str] = None


class BundleResponse(BaseModel):
    """Response with recommended bundles"""
    bundles: List[TravelBundle]
    total_found: int
    query_understood: str
    constraints_applied: List[str]
    suggestions: List[str] = []


# ==========================================
# CHAT SCHEMAS
# ==========================================

class ChatMessage(BaseModel):
    """Chat message from user or agent"""
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    """User chat request"""
    message: str
    session_id: Optional[str] = None
    context: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    """Agent chat response"""
    message: str
    bundles: Optional[List[TravelBundle]] = None
    clarifying_question: Optional[str] = None
    action_taken: Optional[str] = None
    session_id: str


# ==========================================
# WATCH / ALERT SCHEMAS
# ==========================================

class WatchRequest(BaseModel):
    """Request to watch a deal/bundle"""
    bundle_id: Optional[str] = None
    deal_id: Optional[str] = None
    deal_type: DealType
    
    # Thresholds
    price_threshold: Optional[float] = None
    inventory_threshold: Optional[int] = None
    
    # User info
    user_id: str
    notify_via: Literal["websocket", "email"] = "websocket"


class WatchEvent(BaseModel):
    """Event when watch condition is triggered"""
    watch_id: str
    event_type: WatchEventType
    deal_id: str
    deal_type: DealType
    
    # Changes
    previous_value: float
    current_value: float
    threshold: float
    
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ==========================================
# DEAL DETECTION SCHEMAS
# ==========================================

class DealScore(BaseModel):
    """Scoring for deal detection"""
    price_score: int = Field(..., ge=0, le=40, description="Based on price vs 30-day avg")
    availability_score: int = Field(..., ge=0, le=30, description="Based on scarcity")
    promo_score: int = Field(..., ge=0, le=30, description="Based on promo/limited time")
    total_score: int = Field(..., ge=0, le=100)


class DealDetectionResult(BaseModel):
    """Result of deal detection"""
    is_deal: bool
    score: DealScore
    tags: List[DealTag]
    explanation: str


# ==========================================
# KAFKA EVENT SCHEMAS
# ==========================================

class KafkaEvent(BaseModel):
    """Base Kafka event"""
    event_id: str
    event_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload: dict


class DealNormalizedEvent(KafkaEvent):
    """Event for normalized deal data"""
    event_type: str = "deal.normalized"
    

class DealScoredEvent(KafkaEvent):
    """Event for scored deal"""
    event_type: str = "deal.scored"


class DealTaggedEvent(KafkaEvent):
    """Event for tagged deal"""
    event_type: str = "deal.tagged"

