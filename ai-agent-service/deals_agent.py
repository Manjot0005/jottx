"""
AI Deals Agent - Backend Worker
Ingests feeds via Kafka, detects deals, tags offers, and emits updates
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import random

try:
    from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False
    print("⚠️  aiokafka not installed. Run: pip install aiokafka")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = 'localhost:9092'
TOPICS = {
    'input': 'deals.normalized',
    'scored': 'deals.scored',
    'tagged': 'deals.tagged',
    'events': 'deal.events'
}

class DealsAgent:
    """
    Deals Agent that processes flight and hotel data
    - Detects deals (15% below 30-day average)
    - Scores deals based on price drop
    - Tags deals with amenities (pet-friendly, refundable, etc.)
    - Emits updates via Kafka
    """
    
    def __init__(self):
        self.consumer = None
        self.producer = None
        self.price_history = {}  # Store 30-day price averages
        self.running = False
        
    async def initialize(self):
        """Initialize Kafka consumer and producer"""
        if not KAFKA_AVAILABLE:
            logger.error("Kafka not available - install aiokafka")
            return False
            
        try:
            # Create consumer
            self.consumer = AIOKafkaConsumer(
                TOPICS['input'],
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                group_id='deals-agent-group',
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='earliest'
            )
            
            # Create producer
            self.producer = AIOKafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            
            await self.consumer.start()
            await self.producer.start()
            
            logger.info("✅ Deals Agent initialized with Kafka")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Kafka: {e}")
            return False
    
    def calculate_30day_average(self, listing_id: str, current_price: float) -> float:
        """
        Calculate 30-day average price for a listing
        (In production, this would query historical data from database)
        """
        if listing_id not in self.price_history:
            # Initialize with mock historical prices (simulate variance)
            base_price = current_price * random.uniform(1.0, 1.3)
            self.price_history[listing_id] = {
                'prices': [base_price + random.uniform(-50, 50) for _ in range(30)],
                'last_updated': datetime.now()
            }
        
        # Calculate average
        history = self.price_history[listing_id]
        avg_price = sum(history['prices']) / len(history['prices'])
        
        # Add current price to history (rolling window)
        history['prices'].pop(0)
        history['prices'].append(current_price)
        
        return avg_price
    
    def detect_deal(self, listing: Dict) -> Optional[Dict]:
        """
        Detect if listing is a deal (≥15% below 30-day average)
        Returns deal info with score if it's a deal, None otherwise
        """
        listing_id = listing.get('id') or listing.get('flight_id') or listing.get('hotel_id')
        current_price = listing.get('price') or listing.get('price_per_night') or listing.get('daily_price')
        
        if not listing_id or not current_price:
            return None
        
        # Get 30-day average
        avg_price = self.calculate_30day_average(listing_id, current_price)
        
        # Calculate discount percentage
        discount_pct = ((avg_price - current_price) / avg_price) * 100
        
        # Check if it's a deal (≥15% discount)
        if discount_pct >= 15:
            # Calculate deal score (0-100)
            deal_score = min(int(discount_pct * 2), 100)
            
            # Check for limited availability
            availability = listing.get('seatsAvailable') or listing.get('roomsAvailable') or listing.get('carsAvailable')
            limited_availability = availability and availability < 5
            
            if limited_availability:
                deal_score += 10  # Boost score for scarcity
            
            return {
                'listing_id': listing_id,
                'listing_type': listing.get('type', 'unknown'),
                'current_price': current_price,
                'average_price': round(avg_price, 2),
                'discount_percent': round(discount_pct, 2),
                'deal_score': min(deal_score, 100),
                'limited_availability': limited_availability,
                'detected_at': datetime.now().isoformat()
            }
        
        return None
    
    def tag_offer(self, listing: Dict, deal_info: Dict) -> Dict:
        """
        Tag deals with amenities and features
        - Pet-friendly
        - Refundable/Non-refundable
        - Near transit
        - Breakfast included
        etc.
        """
        tags = []
        
        # Check amenities for hotels
        amenities = listing.get('amenities', [])
        if amenities:
            if 'Pet-friendly' in amenities or 'Pets' in str(amenities):
                tags.append('pet-friendly')
            if 'Breakfast' in str(amenities):
                tags.append('breakfast-included')
            if 'WiFi' in str(amenities):
                tags.append('wifi')
            if 'Pool' in str(amenities) or 'Gym' in str(amenities):
                tags.append('facilities')
        
        # Check for near transit (mock - would use real location data)
        city = listing.get('city') or listing.get('location') or listing.get('from')
        if city in ['New York', 'Chicago', 'San Francisco', 'Seattle']:
            tags.append('near-transit')
        
        # Check cancellation policy (mock)
        # In production, this would be in the listing data
        if random.random() > 0.5:
            tags.append('refundable')
        else:
            tags.append('non-refundable')
        
        # Check for business class flights
        if listing.get('flight_class') == 'Business':
            tags.append('business-class')
            tags.append('premium')
        
        # Add tags to deal info
        deal_info['tags'] = tags
        deal_info['tag_count'] = len(tags)
        
        return deal_info
    
    async def process_listing(self, listing: Dict):
        """Process a single listing through the deals pipeline"""
        try:
            # Step 1: Detect deal
            deal_info = self.detect_deal(listing)
            
            if deal_info:
                logger.info(f"🎯 Deal detected: {deal_info['listing_id']} - {deal_info['discount_percent']}% off")
                
                # Step 2: Publish to deals.scored topic
                await self.producer.send(TOPICS['scored'], value=deal_info)
                
                # Step 3: Tag the offer
                tagged_deal = self.tag_offer(listing, deal_info)
                logger.info(f"🏷️  Tagged with: {', '.join(tagged_deal['tags'])}")
                
                # Step 4: Publish to deals.tagged topic
                await self.producer.send(TOPICS['tagged'], value=tagged_deal)
                
                # Step 5: Emit event for WebSocket notifications
                event = {
                    'event_type': 'deal_found',
                    'listing_id': tagged_deal['listing_id'],
                    'discount': tagged_deal['discount_percent'],
                    'score': tagged_deal['deal_score'],
                    'tags': tagged_deal['tags'],
                    'timestamp': datetime.now().isoformat()
                }
                await self.producer.send(TOPICS['events'], value=event)
                
                return tagged_deal
            
            return None
            
        except Exception as e:
            logger.error(f"Error processing listing: {e}")
            return None
    
    async def run(self):
        """Main loop - consume from Kafka and process listings"""
        self.running = True
        logger.info("🚀 Deals Agent started - listening for listings...")
        
        try:
            async for message in self.consumer:
                if not self.running:
                    break
                
                listing = message.value
                logger.debug(f"Received listing: {listing.get('id')}")
                
                # Process the listing
                await self.process_listing(listing)
                
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
        finally:
            await self.shutdown()
    
    async def shutdown(self):
        """Clean shutdown"""
        self.running = False
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()
        logger.info("👋 Deals Agent shutdown complete")

# =============================================
# Standalone Runner (for testing without Kafka)
# =============================================

async def test_without_kafka():
    """Test the deals agent with mock data (no Kafka required)"""
    logger.info("🧪 Running in test mode (no Kafka)")
    
    agent = DealsAgent()
    
    # Mock listings
    mock_listings = [
        {
            'id': 'FL-123',
            'type': 'flight',
            'airline_name': 'United Airlines',
            'from': 'San Francisco',
            'to': 'New York',
            'price': 250.00,
            'seatsAvailable': 3,
            'flight_class': 'Economy'
        },
        {
            'id': 'HTL-456',
            'type': 'hotel',
            'hotel_name': 'Grand Hotel',
            'city': 'Chicago',
            'price_per_night': 150.00,
            'roomsAvailable': 2,
            'amenities': ['WiFi', 'Breakfast', 'Pet-friendly', 'Pool']
        },
        {
            'id': 'CAR-789',
            'type': 'car',
            'model': 'Toyota Camry',
            'location': 'Seattle',
            'daily_price': 45.00,
            'carsAvailable': 8
        }
    ]
    
    # Process each mock listing
    for listing in mock_listings:
        deal = agent.detect_deal(listing)
        if deal:
            tagged = agent.tag_offer(listing, deal)
            logger.info(f"✅ Deal found and tagged:")
            logger.info(json.dumps(tagged, indent=2))
        else:
            logger.info(f"   No deal for {listing['id']}")
        
        await asyncio.sleep(0.5)

# =============================================
# Main Entry Point
# =============================================

async def main():
    """Main entry point"""
    agent = DealsAgent()
    
    # Try to initialize with Kafka
    kafka_ready = await agent.initialize()
    
    if kafka_ready:
        # Run with Kafka
        await agent.run()
    else:
        # Run in test mode
        logger.warning("Running in test mode without Kafka")
        await test_without_kafka()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n👋 Shutting down...")

