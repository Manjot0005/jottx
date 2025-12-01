"""
Deals Agent - Backend Worker

Responsibilities:
1. Feed Ingestion: Consume CSV/mock feeds via Kafka
2. Deal Detection: Apply rules (≥15% below 30-day avg, limited inventory, promo)
3. Offer Tagging: Tag with metadata (refundable, pet-friendly, etc.)
4. Emit Updates: Publish to Kafka topics for downstream consumers
"""
import asyncio
import json
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlmodel import Session, select

from app.models.schemas import (
    DealTag, DealScore, DealDetectionResult,
    FlightDeal, HotelDeal, DealType
)
from app.models.database import (
    Flight, Hotel, PriceHistory, engine, create_db_and_tables
)


class DealsAgent:
    """
    Backend worker that processes feeds, detects deals, and emits events.
    """
    
    def __init__(self, kafka_producer=None, websocket_manager=None):
        self.kafka_producer = kafka_producer
        self.websocket_manager = websocket_manager
        self._running = False
        create_db_and_tables()
    
    # ==========================================
    # DEAL DETECTION
    # ==========================================
    
    def detect_deal(
        self,
        current_price: float,
        avg_30d_price: Optional[float],
        inventory: int,
        is_promo: bool = False,
        promo_end_days: int = 0
    ) -> DealDetectionResult:
        """
        Detect if this is a deal based on rules:
        - Price drop ≥15% below 30-day avg
        - Limited inventory (<5 items)
        - Limited-time promo (ends within 3 days)
        """
        tags = []
        
        # Price Score (0-40)
        price_score = 0
        if avg_30d_price and avg_30d_price > 0:
            discount_pct = (avg_30d_price - current_price) / avg_30d_price * 100
            if discount_pct >= 25:
                price_score = 40
                tags.append(DealTag.PRICE_DROP)
            elif discount_pct >= 20:
                price_score = 35
                tags.append(DealTag.PRICE_DROP)
            elif discount_pct >= 15:
                price_score = 30
                tags.append(DealTag.PRICE_DROP)
            elif discount_pct >= 10:
                price_score = 20
            elif discount_pct >= 5:
                price_score = 10
        
        # Availability Score (0-30)
        availability_score = 0
        if inventory <= 2:
            availability_score = 30
            tags.append(DealTag.LIMITED_AVAILABILITY)
        elif inventory <= 5:
            availability_score = 25
            tags.append(DealTag.LIMITED_AVAILABILITY)
        elif inventory <= 10:
            availability_score = 15
        
        # Promo Score (0-30)
        promo_score = 0
        if is_promo:
            if promo_end_days <= 1:
                promo_score = 30
                tags.append(DealTag.PROMO)
            elif promo_end_days <= 3:
                promo_score = 25
                tags.append(DealTag.PROMO)
            elif promo_end_days <= 7:
                promo_score = 15
                tags.append(DealTag.PROMO)
        
        total_score = price_score + availability_score + promo_score
        is_deal = total_score >= 30 or len(tags) >= 2
        
        score = DealScore(
            price_score=price_score,
            availability_score=availability_score,
            promo_score=promo_score,
            total_score=total_score
        )
        
        # Generate explanation
        explanations = []
        if DealTag.PRICE_DROP in tags:
            discount = ((avg_30d_price - current_price) / avg_30d_price * 100) if avg_30d_price else 0
            explanations.append(f"{discount:.0f}% below 30-day avg")
        if DealTag.LIMITED_AVAILABILITY in tags:
            explanations.append(f"Only {inventory} left")
        if DealTag.PROMO in tags:
            explanations.append(f"Promo ends in {promo_end_days} days")
        
        return DealDetectionResult(
            is_deal=is_deal,
            score=score,
            tags=tags,
            explanation=" • ".join(explanations) if explanations else "Standard pricing"
        )
    
    # ==========================================
    # OFFER TAGGING
    # ==========================================
    
    def tag_flight(self, flight_data: Dict[str, Any]) -> List[DealTag]:
        """Tag flight with metadata"""
        tags = []
        
        # Refundability
        fare_class = flight_data.get('fare_class', '').lower()
        if fare_class in ['business', 'first', 'flex']:
            tags.append(DealTag.REFUNDABLE)
        else:
            tags.append(DealTag.NON_REFUNDABLE)
        
        # Red-eye detection (departure between 11pm-5am)
        departure = flight_data.get('departure_time')
        if departure:
            hour = departure.hour if isinstance(departure, datetime) else 0
            if 23 <= hour or hour <= 5:
                # Not a tag, but tracked for filtering
                flight_data['is_red_eye'] = True
        
        return tags
    
    def tag_hotel(self, hotel_data: Dict[str, Any]) -> List[DealTag]:
        """Tag hotel with metadata from amenities"""
        tags = []
        amenities = hotel_data.get('amenities', [])
        amenities_lower = [a.lower() for a in amenities]
        
        # Pet-friendly
        if any('pet' in a for a in amenities_lower):
            tags.append(DealTag.PET_FRIENDLY)
            hotel_data['pet_friendly'] = True
        
        # Near transit
        if any('transit' in a or 'metro' in a or 'subway' in a for a in amenities_lower):
            tags.append(DealTag.NEAR_TRANSIT)
            hotel_data['near_transit'] = True
        
        # Breakfast
        if any('breakfast' in a for a in amenities_lower):
            tags.append(DealTag.BREAKFAST_INCLUDED)
            hotel_data['breakfast_included'] = True
        
        # Refundability
        policy = hotel_data.get('cancellation_policy', '').lower()
        if 'free' in policy or 'refund' in policy:
            tags.append(DealTag.REFUNDABLE)
        else:
            tags.append(DealTag.NON_REFUNDABLE)
        
        return tags
    
    # ==========================================
    # EXPLANATION GENERATION
    # ==========================================
    
    def generate_why_this(self, deal_type: str, data: Dict[str, Any], tags: List[DealTag]) -> str:
        """Generate 'Why this' explanation (≤25 words)"""
        parts = []
        
        if DealTag.PRICE_DROP in tags:
            discount = data.get('discount_percent', 0)
            parts.append(f"{discount:.0f}% off")
        
        if deal_type == 'flight':
            if data.get('stops', 0) == 0:
                parts.append("nonstop")
            airline = data.get('airline', '')
            if airline:
                parts.append(f"on {airline}")
        
        elif deal_type == 'hotel':
            stars = data.get('stars', 0)
            if stars >= 4:
                parts.append(f"{stars}-star")
            if DealTag.PET_FRIENDLY in tags:
                parts.append("pet-friendly")
            if DealTag.BREAKFAST_INCLUDED in tags:
                parts.append("breakfast included")
            neighborhood = data.get('neighborhood', '')
            if neighborhood:
                parts.append(f"in {neighborhood}")
        
        return ", ".join(parts[:5]) if parts else "Good value option"
    
    def generate_what_to_watch(self, tags: List[DealTag], inventory: int, expires_at: Optional[datetime]) -> str:
        """Generate 'What to watch' (≤12 words)"""
        parts = []
        
        if DealTag.LIMITED_AVAILABILITY in tags:
            parts.append(f"Only {inventory} left")
        
        if expires_at:
            days_left = (expires_at - datetime.utcnow()).days
            if days_left <= 3:
                parts.append(f"expires in {days_left} days")
        
        if DealTag.NON_REFUNDABLE in tags:
            parts.append("non-refundable")
        
        return "; ".join(parts[:2]) if parts else "Book when ready"
    
    # ==========================================
    # MOCK DATA GENERATION (for demo)
    # ==========================================
    
    def generate_mock_flights(self, count: int = 50) -> List[Dict[str, Any]]:
        """Generate mock flight data for demo"""
        airlines = ['United', 'Delta', 'American', 'JetBlue', 'Southwest', 'Alaska']
        routes = [
            ('SFO', 'JFK'), ('SFO', 'LAX'), ('SFO', 'MIA'), ('SFO', 'ORD'),
            ('LAX', 'JFK'), ('LAX', 'MIA'), ('LAX', 'SEA'), ('LAX', 'DEN'),
            ('JFK', 'MIA'), ('JFK', 'ORD'), ('JFK', 'DFW'), ('JFK', 'BOS'),
        ]
        
        flights = []
        base_date = datetime.now() + timedelta(days=30)
        
        for i in range(count):
            origin, dest = random.choice(routes)
            base_price = random.uniform(150, 500)
            
            # Simulate price variation (some deals)
            is_deal = random.random() < 0.3
            if is_deal:
                price = base_price * random.uniform(0.7, 0.85)
            else:
                price = base_price * random.uniform(0.95, 1.1)
            
            departure = base_date + timedelta(days=random.randint(0, 60), hours=random.randint(6, 22))
            duration = random.randint(120, 360)
            
            flights.append({
                'deal_id': f"FLT-{uuid.uuid4().hex[:8]}",
                'origin': origin,
                'destination': dest,
                'airline': random.choice(airlines),
                'departure_time': departure,
                'arrival_time': departure + timedelta(minutes=duration),
                'duration_minutes': duration,
                'stops': random.choices([0, 1, 2], weights=[0.5, 0.4, 0.1])[0],
                'price': round(price, 2),
                'original_price': round(base_price, 2),
                'avg_30d_price': round(base_price, 2),
                'seats_available': random.randint(1, 50),
                'fare_class': random.choice(['Economy', 'Economy Plus', 'Business']),
                'is_promo': is_deal and random.random() < 0.3,
            })
        
        return flights
    
    def generate_mock_hotels(self, count: int = 50) -> List[Dict[str, Any]]:
        """Generate mock hotel data for demo"""
        cities = {
            'New York': ['Manhattan', 'Brooklyn', 'Times Square', 'SoHo', 'Chelsea'],
            'Miami': ['South Beach', 'Downtown', 'Brickell', 'Coral Gables'],
            'Los Angeles': ['Hollywood', 'Santa Monica', 'Beverly Hills', 'Downtown'],
            'San Francisco': ['Union Square', 'Fishermans Wharf', 'SOMA', 'Marina'],
            'Chicago': ['Loop', 'River North', 'Magnificent Mile', 'Lincoln Park'],
        }
        
        hotel_names = [
            'Grand Hotel', 'Plaza Inn', 'Marriott', 'Hilton', 'Hyatt Regency',
            'Sheraton', 'Westin', 'Four Seasons', 'Ritz Carlton', 'Boutique Hotel'
        ]
        
        amenities_pool = [
            'Free WiFi', 'Pool', 'Gym', 'Spa', 'Pet-friendly', 'Free breakfast',
            'Near metro', 'Parking', 'Room service', 'Bar', 'Restaurant'
        ]
        
        hotels = []
        
        for i in range(count):
            city = random.choice(list(cities.keys()))
            neighborhood = random.choice(cities[city])
            base_price = random.uniform(100, 400)
            
            is_deal = random.random() < 0.3
            if is_deal:
                price = base_price * random.uniform(0.7, 0.85)
            else:
                price = base_price * random.uniform(0.95, 1.1)
            
            selected_amenities = random.sample(amenities_pool, random.randint(3, 7))
            
            hotels.append({
                'deal_id': f"HTL-{uuid.uuid4().hex[:8]}",
                'name': f"{random.choice(hotel_names)} {neighborhood}",
                'city': city,
                'neighborhood': neighborhood,
                'stars': random.choices([3, 4, 5], weights=[0.3, 0.5, 0.2])[0],
                'price_per_night': round(price, 2),
                'original_price': round(base_price, 2),
                'avg_30d_price': round(base_price, 2),
                'rooms_available': random.randint(1, 30),
                'amenities': selected_amenities,
                'cancellation_policy': random.choice(['Free cancellation', 'Non-refundable', 'Partial refund']),
                'pet_friendly': 'Pet-friendly' in selected_amenities,
                'breakfast_included': 'Free breakfast' in selected_amenities,
                'near_transit': 'Near metro' in selected_amenities,
                'is_promo': is_deal and random.random() < 0.3,
            })
        
        return hotels
    
    # ==========================================
    # DATA PROCESSING
    # ==========================================
    
    async def process_flight(self, flight_data: Dict[str, Any]) -> Optional[Flight]:
        """Process a single flight, detect deal, tag, and save"""
        # Detect deal
        detection = self.detect_deal(
            current_price=flight_data['price'],
            avg_30d_price=flight_data.get('avg_30d_price'),
            inventory=flight_data.get('seats_available', 100),
            is_promo=flight_data.get('is_promo', False),
            promo_end_days=random.randint(1, 7) if flight_data.get('is_promo') else 0
        )
        
        if not detection.is_deal:
            return None
        
        # Add deal detection tags
        tags = list(set(detection.tags + self.tag_flight(flight_data)))
        
        # Calculate discount
        discount = 0
        if flight_data.get('avg_30d_price'):
            discount = (flight_data['avg_30d_price'] - flight_data['price']) / flight_data['avg_30d_price'] * 100
        
        flight_data['discount_percent'] = discount
        
        # Generate explanations
        why_this = self.generate_why_this('flight', flight_data, tags)
        what_to_watch = self.generate_what_to_watch(
            tags, 
            flight_data.get('seats_available', 100),
            datetime.utcnow() + timedelta(days=random.randint(1, 7)) if DealTag.PROMO in tags else None
        )
        
        # Create database record
        flight = Flight(
            deal_id=flight_data['deal_id'],
            origin=flight_data['origin'],
            destination=flight_data['destination'],
            airline=flight_data['airline'],
            departure_time=flight_data['departure_time'],
            arrival_time=flight_data['arrival_time'],
            duration_minutes=flight_data['duration_minutes'],
            stops=flight_data.get('stops', 0),
            price=flight_data['price'],
            original_price=flight_data.get('original_price', flight_data['price']),
            avg_30d_price=flight_data.get('avg_30d_price'),
            discount_percent=discount,
            seats_available=flight_data.get('seats_available', 100),
            fare_class=flight_data.get('fare_class', 'Economy'),
            deal_score=detection.score.total_score,
            tags_json=json.dumps([t.value for t in tags]),
            why_this=why_this,
            what_to_watch=what_to_watch,
            expires_at=datetime.utcnow() + timedelta(days=random.randint(1, 7)) if DealTag.PROMO in tags else None
        )
        
        # Save to database
        with Session(engine) as session:
            # Check if exists
            existing = session.exec(select(Flight).where(Flight.deal_id == flight.deal_id)).first()
            if existing:
                # Update
                for key, value in flight.model_dump(exclude={'id'}).items():
                    setattr(existing, key, value)
                session.add(existing)
            else:
                session.add(flight)
            session.commit()
            session.refresh(flight if not existing else existing)
        
        # Emit event via WebSocket
        if self.websocket_manager:
            await self.websocket_manager.broadcast({
                'type': 'new_deal',
                'deal_type': 'flight',
                'deal_id': flight.deal_id,
                'score': detection.score.total_score,
                'why_this': why_this
            })
        
        return flight
    
    async def process_hotel(self, hotel_data: Dict[str, Any]) -> Optional[Hotel]:
        """Process a single hotel, detect deal, tag, and save"""
        # Detect deal
        detection = self.detect_deal(
            current_price=hotel_data['price_per_night'],
            avg_30d_price=hotel_data.get('avg_30d_price'),
            inventory=hotel_data.get('rooms_available', 100),
            is_promo=hotel_data.get('is_promo', False),
            promo_end_days=random.randint(1, 7) if hotel_data.get('is_promo') else 0
        )
        
        if not detection.is_deal:
            return None
        
        # Add deal detection tags
        tags = list(set(detection.tags + self.tag_hotel(hotel_data)))
        
        # Calculate discount
        discount = 0
        if hotel_data.get('avg_30d_price'):
            discount = (hotel_data['avg_30d_price'] - hotel_data['price_per_night']) / hotel_data['avg_30d_price'] * 100
        
        hotel_data['discount_percent'] = discount
        
        # Generate explanations
        why_this = self.generate_why_this('hotel', hotel_data, tags)
        what_to_watch = self.generate_what_to_watch(
            tags,
            hotel_data.get('rooms_available', 100),
            datetime.utcnow() + timedelta(days=random.randint(1, 7)) if DealTag.PROMO in tags else None
        )
        
        # Create database record
        hotel = Hotel(
            deal_id=hotel_data['deal_id'],
            name=hotel_data['name'],
            city=hotel_data['city'],
            neighborhood=hotel_data['neighborhood'],
            stars=hotel_data.get('stars', 3),
            price_per_night=hotel_data['price_per_night'],
            original_price=hotel_data.get('original_price', hotel_data['price_per_night']),
            avg_30d_price=hotel_data.get('avg_30d_price'),
            discount_percent=discount,
            rooms_available=hotel_data.get('rooms_available', 100),
            amenities_json=json.dumps(hotel_data.get('amenities', [])),
            cancellation_policy=hotel_data.get('cancellation_policy', 'Non-refundable'),
            pet_friendly=hotel_data.get('pet_friendly', False),
            breakfast_included=hotel_data.get('breakfast_included', False),
            near_transit=hotel_data.get('near_transit', False),
            deal_score=detection.score.total_score,
            tags_json=json.dumps([t.value for t in tags]),
            why_this=why_this,
            what_to_watch=what_to_watch,
            expires_at=datetime.utcnow() + timedelta(days=random.randint(1, 7)) if DealTag.PROMO in tags else None
        )
        
        # Save to database
        with Session(engine) as session:
            existing = session.exec(select(Hotel).where(Hotel.deal_id == hotel.deal_id)).first()
            if existing:
                for key, value in hotel.model_dump(exclude={'id'}).items():
                    setattr(existing, key, value)
                session.add(existing)
            else:
                session.add(hotel)
            session.commit()
            session.refresh(hotel if not existing else existing)
        
        # Emit event
        if self.websocket_manager:
            await self.websocket_manager.broadcast({
                'type': 'new_deal',
                'deal_type': 'hotel',
                'deal_id': hotel.deal_id,
                'score': detection.score.total_score,
                'why_this': why_this
            })
        
        return hotel
    
    # ==========================================
    # SCHEDULED JOBS
    # ==========================================
    
    async def run_feed_scan(self):
        """Scheduled job to scan feeds and process deals"""
        print(f"[DealsAgent] Starting feed scan at {datetime.utcnow()}")
        
        # Generate mock data for demo
        flights = self.generate_mock_flights(50)
        hotels = self.generate_mock_hotels(50)
        
        flight_deals = 0
        hotel_deals = 0
        
        for flight in flights:
            result = await self.process_flight(flight)
            if result:
                flight_deals += 1
        
        for hotel in hotels:
            result = await self.process_hotel(hotel)
            if result:
                hotel_deals += 1
        
        print(f"[DealsAgent] Scan complete. Found {flight_deals} flight deals, {hotel_deals} hotel deals")
        
        return {'flight_deals': flight_deals, 'hotel_deals': hotel_deals}
    
    async def start(self, interval_seconds: int = 300):
        """Start the deals agent background worker"""
        self._running = True
        print(f"[DealsAgent] Starting with scan interval of {interval_seconds}s")
        
        while self._running:
            try:
                await self.run_feed_scan()
            except Exception as e:
                print(f"[DealsAgent] Error during scan: {e}")
            
            await asyncio.sleep(interval_seconds)
    
    def stop(self):
        """Stop the deals agent"""
        self._running = False
        print("[DealsAgent] Stopped")

