"""
Concierge Agent - Chat-Facing

Responsibilities:
1. Intent Understanding: Parse user queries for dates, budget, constraints
2. Trip Planning: Compose flight+hotel bundles from cached deals
3. Explanations: Generate "Why this" and tradeoff explanations
4. Policy Q&A: Answer questions about cancellation, pets, etc.
5. Watches: Set price/inventory alerts
"""
import re
import uuid
import json
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional, Tuple
from sqlmodel import Session, select

from app.models.schemas import (
    TravelBundle, BundleRequest, BundleResponse,
    ChatRequest, ChatResponse, ChatMessage,
    FlightDeal, HotelDeal, DealTag,
    WatchRequest, WatchEvent, WatchEventType
)
from app.models.database import Flight, Hotel, Bundle, ChatSession, Watch, engine


class ConciergeAgent:
    """
    Chat-facing agent that understands user intent and recommends bundles.
    """
    
    def __init__(self, websocket_manager=None):
        self.websocket_manager = websocket_manager
        
        # Common cities and their airports
        self.city_airports = {
            'new york': 'JFK', 'nyc': 'JFK', 'manhattan': 'JFK',
            'los angeles': 'LAX', 'la': 'LAX',
            'san francisco': 'SFO', 'sf': 'SFO',
            'miami': 'MIA',
            'chicago': 'ORD',
            'boston': 'BOS',
            'seattle': 'SEA',
            'denver': 'DEN',
            'dallas': 'DFW',
            'atlanta': 'ATL',
        }
        
        # Warm destinations
        self.warm_destinations = ['MIA', 'LAX', 'SAN', 'HNL', 'TPA']
    
    # ==========================================
    # INTENT PARSING
    # ==========================================
    
    def parse_intent(self, message: str, session: Optional[ChatSession] = None) -> Dict[str, Any]:
        """
        Parse user message to extract intent and constraints.
        Returns dict with: origin, destination, dates, budget, constraints
        """
        message_lower = message.lower()
        intent = {
            'origin': session.origin if session else None,
            'destination': session.destination if session else None,
            'departure_date': session.departure_date if session else None,
            'return_date': session.return_date if session else None,
            'budget': session.budget if session else None,
            'travelers': session.travelers if session else 1,
            'pet_friendly': session.pet_friendly if session else False,
            'avoid_red_eye': session.avoid_red_eye if session else False,
            'breakfast_required': session.breakfast_required if session else False,
            'refundable_preferred': session.refundable_preferred if session else False,
            'near_transit': False,
            'query_type': 'search',  # search, refine, watch, policy_question
        }
        
        # Detect query type
        if any(word in message_lower for word in ['track', 'watch', 'alert', 'notify']):
            intent['query_type'] = 'watch'
        elif any(word in message_lower for word in ['is it good', 'worth it', 'actually good', 'compare']):
            intent['query_type'] = 'policy_question'
        elif session and (session.origin or session.destination):
            intent['query_type'] = 'refine'
        
        # Parse origin
        for city, code in self.city_airports.items():
            if f'from {city}' in message_lower or f'{city} to' in message_lower:
                intent['origin'] = code
                break
        
        # Parse destination
        if 'anywhere warm' in message_lower or 'somewhere warm' in message_lower:
            intent['destination'] = 'WARM'  # Special flag
        else:
            for city, code in self.city_airports.items():
                if f'to {city}' in message_lower or f'{city},' in message_lower:
                    intent['destination'] = code
                    break
        
        # Parse dates (simple patterns)
        date_patterns = [
            r'(\w+\s+\d{1,2})\s*[-–to]+\s*(\d{1,2})',  # "Oct 25-27"
            r'(\d{1,2}/\d{1,2})\s*[-–to]+\s*(\d{1,2}/\d{1,2})',  # "10/25-10/27"
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, message)
            if match:
                # Simplified date parsing
                try:
                    # For demo, set dates to next month
                    today = datetime.now()
                    intent['departure_date'] = today + timedelta(days=30)
                    intent['return_date'] = today + timedelta(days=33)
                except:
                    pass
                break
        
        # Parse budget
        budget_match = re.search(r'\$\s*([\d,]+)', message)
        if budget_match and budget_match.group(1):
            try:
                intent['budget'] = float(budget_match.group(1).replace(',', ''))
            except ValueError:
                pass
        
        # Parse travelers
        travelers_match = re.search(r'(\d+)\s*(people|travelers|guests|of us|persons)', message_lower)
        if travelers_match:
            intent['travelers'] = int(travelers_match.group(1))
        elif 'for two' in message_lower or 'for 2' in message_lower:
            intent['travelers'] = 2
        
        # Parse constraints
        if 'pet' in message_lower or 'dog' in message_lower or 'cat' in message_lower:
            intent['pet_friendly'] = True
        
        if 'no red' in message_lower or 'avoid red' in message_lower or 'not red' in message_lower:
            intent['avoid_red_eye'] = True
        
        if 'breakfast' in message_lower:
            intent['breakfast_required'] = True
        
        if 'refund' in message_lower or 'cancel' in message_lower:
            intent['refundable_preferred'] = True
        
        if 'transit' in message_lower or 'metro' in message_lower or 'subway' in message_lower:
            intent['near_transit'] = True
        
        return intent
    
    def get_clarifying_question(self, intent: Dict[str, Any]) -> Optional[str]:
        """
        Return a clarifying question if critical info is missing.
        Only ask ONE question max.
        """
        if not intent.get('departure_date'):
            return "When would you like to travel? (e.g., Oct 25-27)"
        
        if not intent.get('origin'):
            return "Where will you be flying from?"
        
        if not intent.get('budget'):
            return "What's your total budget for flights and hotel?"
        
        return None
    
    # ==========================================
    # BUNDLE CREATION
    # ==========================================
    
    def calculate_fit_score(
        self,
        flight: Flight,
        hotel: Hotel,
        intent: Dict[str, Any]
    ) -> int:
        """
        Calculate how well a bundle fits user constraints (0-100).
        """
        score = 50  # Base score
        
        # Price vs budget (40 points max)
        total_price = flight.price + (hotel.price_per_night * 3)  # Assume 3 nights
        budget = intent.get('budget', total_price * 2)
        
        if total_price <= budget * 0.7:
            score += 40  # Great deal
        elif total_price <= budget * 0.85:
            score += 30
        elif total_price <= budget:
            score += 20
        elif total_price <= budget * 1.1:
            score += 5
        else:
            score -= 20  # Over budget
        
        # Constraint matching (30 points max)
        if intent.get('pet_friendly') and hotel.pet_friendly:
            score += 10
        elif intent.get('pet_friendly') and not hotel.pet_friendly:
            score -= 20
        
        if intent.get('breakfast_required') and hotel.breakfast_included:
            score += 10
        elif intent.get('breakfast_required') and not hotel.breakfast_included:
            score -= 10
        
        if intent.get('near_transit') and hotel.near_transit:
            score += 10
        
        if intent.get('refundable_preferred'):
            if 'refundable' in hotel.cancellation_policy.lower():
                score += 10
        
        # Avoid red-eye
        if intent.get('avoid_red_eye'):
            hour = flight.departure_time.hour
            if 23 <= hour or hour <= 5:
                score -= 30
        
        # Deal quality bonus (20 points max)
        avg_deal_score = (flight.deal_score + hotel.deal_score) / 2
        score += int(avg_deal_score / 5)  # Up to 20 points
        
        return max(0, min(100, score))
    
    def create_bundle(
        self,
        flight: Flight,
        hotel: Hotel,
        intent: Dict[str, Any]
    ) -> TravelBundle:
        """Create a TravelBundle from flight and hotel"""
        nights = 3  # Default
        if intent.get('return_date') and intent.get('departure_date'):
            nights = (intent['return_date'] - intent['departure_date']).days
        
        total_price = flight.price + (hotel.price_per_night * nights)
        original_total = flight.original_price + (hotel.original_price * nights)
        savings = original_total - total_price
        
        fit_score = self.calculate_fit_score(flight, hotel, intent)
        
        # Generate explanations
        why_bundle = self._generate_bundle_why(flight, hotel, fit_score, intent)
        tradeoffs = self._generate_tradeoffs(flight, hotel, intent)
        what_to_watch = self._generate_bundle_watch(flight, hotel)
        
        flight_deal = FlightDeal(
            deal_id=flight.deal_id,
            origin=flight.origin,
            destination=flight.destination,
            airline=flight.airline,
            departure_time=flight.departure_time,
            arrival_time=flight.arrival_time,
            duration_minutes=flight.duration_minutes,
            stops=flight.stops,
            price=flight.price,
            seats_available=flight.seats_available,
            fare_class=flight.fare_class,
            original_price=flight.original_price,
            discount_percent=flight.discount_percent,
            deal_score=flight.deal_score,
            tags=[DealTag(t) for t in flight.tags],
            avg_30d_price=flight.avg_30d_price,
            why_this=flight.why_this,
            what_to_watch=flight.what_to_watch
        )
        
        hotel_deal = HotelDeal(
            deal_id=hotel.deal_id,
            name=hotel.name,
            city=hotel.city,
            neighborhood=hotel.neighborhood,
            stars=hotel.stars,
            price_per_night=hotel.price_per_night,
            rooms_available=hotel.rooms_available,
            amenities=hotel.amenities,
            cancellation_policy=hotel.cancellation_policy,
            pet_friendly=hotel.pet_friendly,
            breakfast_included=hotel.breakfast_included,
            near_transit=hotel.near_transit,
            original_price=hotel.original_price,
            discount_percent=hotel.discount_percent,
            deal_score=hotel.deal_score,
            tags=[DealTag(t) for t in hotel.tags],
            avg_30d_price=hotel.avg_30d_price,
            why_this=hotel.why_this,
            what_to_watch=hotel.what_to_watch
        )
        
        return TravelBundle(
            bundle_id=f"BDL-{uuid.uuid4().hex[:8]}",
            flight=flight_deal,
            hotel=hotel_deal,
            total_price=round(total_price, 2),
            savings=round(max(0, savings), 2),
            fit_score=fit_score,
            why_this_bundle=why_bundle,
            tradeoffs=tradeoffs,
            what_to_watch=what_to_watch
        )
    
    def _generate_bundle_why(self, flight: Flight, hotel: Hotel, fit_score: int, intent: Dict[str, Any]) -> str:
        """Generate 'Why this bundle' explanation"""
        parts = []
        
        budget = intent.get('budget', 0)
        total = flight.price + (hotel.price_per_night * 3)
        
        if budget and total <= budget * 0.8:
            parts.append(f"${budget - total:.0f} under budget")
        
        if flight.stops == 0:
            parts.append("nonstop flight")
        
        if hotel.stars >= 4:
            parts.append(f"{hotel.stars}-star hotel")
        
        if hotel.pet_friendly and intent.get('pet_friendly'):
            parts.append("pet-friendly")
        
        if hotel.breakfast_included:
            parts.append("breakfast included")
        
        if fit_score >= 80:
            parts.append("great match for your needs")
        
        return ". ".join(parts[:3]) if parts else "Good value combination"
    
    def _generate_tradeoffs(self, flight: Flight, hotel: Hotel, intent: Dict[str, Any]) -> str:
        """Generate tradeoff explanation"""
        tradeoffs = []
        
        if flight.stops > 0:
            tradeoffs.append(f"{flight.stops} stop{'s' if flight.stops > 1 else ''}")
        
        if not hotel.breakfast_included and intent.get('breakfast_required'):
            tradeoffs.append("no breakfast")
        
        if 'non-refund' in hotel.cancellation_policy.lower():
            tradeoffs.append("non-refundable")
        
        hour = flight.departure_time.hour
        if 6 <= hour <= 8:
            tradeoffs.append("early departure")
        elif 20 <= hour <= 23:
            tradeoffs.append("late departure")
        
        return ". ".join(tradeoffs) if tradeoffs else "No significant tradeoffs"
    
    def _generate_bundle_watch(self, flight: Flight, hotel: Hotel) -> str:
        """Generate what to watch for bundle"""
        parts = []
        
        if flight.seats_available < 10:
            parts.append(f"{flight.seats_available} seats left")
        
        if hotel.rooms_available < 5:
            parts.append(f"{hotel.rooms_available} rooms left")
        
        if flight.expires_at:
            days = (flight.expires_at - datetime.utcnow()).days
            if days <= 3:
                parts.append(f"price expires in {days} days")
        
        return "; ".join(parts) if parts else "Prices may change"
    
    # ==========================================
    # SEARCH & RECOMMENDATIONS
    # ==========================================
    
    def find_bundles(self, intent: Dict[str, Any], limit: int = 3) -> List[TravelBundle]:
        """Find matching flight+hotel bundles based on intent"""
        bundles = []
        
        with Session(engine) as session:
            # Query flights
            flight_query = select(Flight).where(Flight.is_active == True)
            
            if intent.get('origin'):
                flight_query = flight_query.where(Flight.origin == intent['origin'])
            
            if intent.get('destination') and intent['destination'] != 'WARM':
                flight_query = flight_query.where(Flight.destination == intent['destination'])
            elif intent.get('destination') == 'WARM':
                flight_query = flight_query.where(Flight.destination.in_(self.warm_destinations))
            
            flights = session.exec(flight_query.order_by(Flight.deal_score.desc()).limit(20)).all()
            
            # Query hotels
            hotel_query = select(Hotel).where(Hotel.is_active == True)
            
            if intent.get('pet_friendly'):
                hotel_query = hotel_query.where(Hotel.pet_friendly == True)
            
            if intent.get('breakfast_required'):
                hotel_query = hotel_query.where(Hotel.breakfast_included == True)
            
            if intent.get('near_transit'):
                hotel_query = hotel_query.where(Hotel.near_transit == True)
            
            hotels = session.exec(hotel_query.order_by(Hotel.deal_score.desc()).limit(20)).all()
            
            # Create bundles
            for flight in flights:
                # Match hotels to flight destination city
                matching_hotels = [h for h in hotels if self._city_matches_airport(h.city, flight.destination)]
                
                for hotel in matching_hotels[:3]:
                    bundle = self.create_bundle(flight, hotel, intent)
                    
                    # Filter by budget
                    if intent.get('budget') and bundle.total_price > intent['budget'] * 1.1:
                        continue
                    
                    bundles.append(bundle)
            
            # Sort by fit score and limit
            bundles.sort(key=lambda b: b.fit_score, reverse=True)
            return bundles[:limit]
    
    def _city_matches_airport(self, city: str, airport: str) -> bool:
        """Check if city matches airport code"""
        city_lower = city.lower()
        airport_to_city = {
            'JFK': ['new york', 'nyc', 'manhattan', 'brooklyn'],
            'LAX': ['los angeles', 'la', 'hollywood'],
            'SFO': ['san francisco', 'sf'],
            'MIA': ['miami', 'south beach'],
            'ORD': ['chicago'],
            'BOS': ['boston'],
            'SEA': ['seattle'],
            'DEN': ['denver'],
        }
        
        cities = airport_to_city.get(airport, [])
        return any(c in city_lower for c in cities) or city_lower in str(airport).lower()
    
    # ==========================================
    # CHAT HANDLING
    # ==========================================
    
    async def handle_message(self, request: ChatRequest) -> ChatResponse:
        """Handle incoming chat message"""
        session_id = request.session_id or f"session-{uuid.uuid4().hex[:8]}"
        
        # Load or create session
        with Session(engine) as db_session:
            chat_session = db_session.exec(
                select(ChatSession).where(ChatSession.session_id == session_id)
            ).first()
            
            if not chat_session:
                chat_session = ChatSession(session_id=session_id)
                db_session.add(chat_session)
                db_session.commit()
                db_session.refresh(chat_session)
        
        # Parse intent
        intent = self.parse_intent(request.message, chat_session)
        
        # Check if we need clarification
        clarifying = self.get_clarifying_question(intent)
        if clarifying and intent['query_type'] == 'search':
            return ChatResponse(
                message="I'd love to help you find the perfect trip!",
                clarifying_question=clarifying,
                session_id=session_id
            )
        
        # Handle different query types
        if intent['query_type'] == 'watch':
            return await self._handle_watch_request(request.message, session_id)
        
        if intent['query_type'] == 'policy_question':
            return self._handle_policy_question(request.message, session_id)
        
        # Search for bundles
        bundles = self.find_bundles(intent)
        
        # Update session with extracted constraints
        with Session(engine) as db_session:
            chat_session = db_session.exec(
                select(ChatSession).where(ChatSession.session_id == session_id)
            ).first()
            
            if chat_session:
                chat_session.origin = intent.get('origin')
                chat_session.destination = intent.get('destination')
                chat_session.budget = intent.get('budget')
                chat_session.travelers = intent.get('travelers', 1)
                chat_session.pet_friendly = intent.get('pet_friendly', False)
                chat_session.avoid_red_eye = intent.get('avoid_red_eye', False)
                chat_session.breakfast_required = intent.get('breakfast_required', False)
                chat_session.updated_at = datetime.utcnow()
                db_session.add(chat_session)
                db_session.commit()
        
        # Generate response
        if bundles:
            constraints = []
            if intent.get('pet_friendly'):
                constraints.append("pet-friendly")
            if intent.get('breakfast_required'):
                constraints.append("breakfast included")
            if intent.get('avoid_red_eye'):
                constraints.append("no red-eye flights")
            if intent.get('refundable_preferred'):
                constraints.append("refundable")
            
            response_msg = f"I found {len(bundles)} great options for you!"
            if constraints:
                response_msg += f" Filtered for: {', '.join(constraints)}."
            
            response_msg += f"\n\nTop pick: {bundles[0].why_this_bundle}"
            
            return ChatResponse(
                message=response_msg,
                bundles=bundles,
                action_taken=f"Found {len(bundles)} bundles matching your criteria",
                session_id=session_id
            )
        else:
            return ChatResponse(
                message="I couldn't find exact matches, but let me suggest some alternatives. Try adjusting your dates or budget?",
                bundles=[],
                session_id=session_id
            )
    
    async def _handle_watch_request(self, message: str, session_id: str) -> ChatResponse:
        """Handle watch/alert request"""
        # Parse thresholds from message
        price_match = re.search(r'below\s*\$?([\d,]+)', message.lower())
        inventory_match = re.search(r'under\s*(\d+)\s*rooms', message.lower())
        
        price_threshold = float(price_match.group(1).replace(',', '')) if price_match else None
        inventory_threshold = int(inventory_match.group(1)) if inventory_match else None
        
        # Create watch (simplified)
        watch_id = f"watch-{uuid.uuid4().hex[:8]}"
        
        with Session(engine) as db_session:
            watch = Watch(
                watch_id=watch_id,
                user_id=session_id,
                deal_id="current",  # Would be specific deal in full implementation
                deal_type="bundle",
                price_threshold=price_threshold,
                inventory_threshold=inventory_threshold
            )
            db_session.add(watch)
            db_session.commit()
        
        conditions = []
        if price_threshold:
            conditions.append(f"price drops below ${price_threshold}")
        if inventory_threshold:
            conditions.append(f"inventory drops under {inventory_threshold}")
        
        return ChatResponse(
            message=f"I'll keep an eye on that! I'll alert you when: {' or '.join(conditions)}.",
            action_taken=f"Created watch {watch_id}",
            session_id=session_id
        )
    
    def _handle_policy_question(self, message: str, session_id: str) -> ChatResponse:
        """Handle policy/comparison questions"""
        message_lower = message.lower()
        
        # Detect what they're asking about
        if 'marriott' in message_lower or 'rate' in message_lower or 'good' in message_lower:
            # Price comparison question
            return ChatResponse(
                message="Based on our data, this rate is 19% below its 60-day rolling average for these dates. Similar 4-star options nearby are $25-$60 higher per night. This is a good deal!",
                session_id=session_id
            )
        
        if 'cancel' in message_lower or 'refund' in message_lower:
            return ChatResponse(
                message="This booking has a 'Free cancellation until 48 hours before check-in' policy. After that, you'll be charged for the first night. The flight is non-refundable but changeable for a $75 fee.",
                session_id=session_id
            )
        
        if 'pet' in message_lower:
            return ChatResponse(
                message="This hotel is pet-friendly! They allow dogs and cats up to 50 lbs with a $50 per stay pet fee. Service animals are always welcome at no charge.",
                session_id=session_id
            )
        
        if 'parking' in message_lower:
            return ChatResponse(
                message="The hotel offers valet parking at $45/night or self-parking at $30/night. Street parking is limited in this area. I'd recommend booking parking in advance.",
                session_id=session_id
            )
        
        return ChatResponse(
            message="I can help answer questions about cancellation policies, pet policies, parking, amenities, and more. What would you like to know?",
            session_id=session_id
        )

