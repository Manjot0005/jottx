#!/usr/bin/env python3
"""
Large Dataset Generator for Kayak Platform
Generates 10,000+ listings, users, and 100,000+ billing records
for scalability and performance testing
"""

import json
import random
from datetime import datetime, timedelta
from faker import Faker
import os

fake = Faker()

# Configuration
OUTPUT_DIR = '../simple-backend/data'
COUNTS = {
    'flights': 10000,
    'hotels': 5000,
    'cars': 3000,
    'users': 10000,
    'bookings': 100000
}

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("╔════════════════════════════════════════╗")
print("║  LARGE DATASET GENERATOR               ║")
print("╚════════════════════════════════════════╝\n")

# =============================================
# Airport and City Data
# =============================================

AIRPORTS = [
    {'code': 'JFK', 'city': 'New York'},
    {'code': 'LAX', 'city': 'Los Angeles'},
    {'code': 'ORD', 'city': 'Chicago'},
    {'code': 'MIA', 'city': 'Miami'},
    {'code': 'SFO', 'city': 'San Francisco'},
    {'code': 'SEA', 'city': 'Seattle'},
    {'code': 'BOS', 'city': 'Boston'},
    {'code': 'LAS', 'city': 'Las Vegas'},
    {'code': 'DEN', 'city': 'Denver'},
    {'code': 'ATL', 'city': 'Atlanta'},
    {'code': 'PHX', 'city': 'Phoenix'},
    {'code': 'DFW', 'city': 'Dallas'},
    {'code': 'IAH', 'city': 'Houston'},
    {'code': 'MSP', 'city': 'Minneapolis'},
    {'code': 'DTW', 'city': 'Detroit'}
]

AIRLINES = [
    'United Airlines', 'American Airlines', 'Delta Airlines', 
    'Southwest Airlines', 'JetBlue Airways', 'Alaska Airlines',
    'Spirit Airlines', 'Frontier Airlines', 'Hawaiian Airlines'
]

CAR_COMPANIES = ['Hertz', 'Enterprise', 'Budget', 'Avis', 'National', 'Alamo', 'Thrifty']
CAR_TYPES = ['Economy', 'Sedan', 'SUV', 'Luxury', 'Convertible', 'Van']
CAR_MODELS = {
    'Economy': ['Toyota Corolla', 'Honda Civic', 'Nissan Versa', 'Hyundai Accent'],
    'Sedan': ['Honda Accord', 'Toyota Camry', 'Nissan Altima', 'Ford Fusion'],
    'SUV': ['Chevrolet Tahoe', 'Ford Explorer', 'Toyota RAV4', 'Jeep Grand Cherokee'],
    'Luxury': ['BMW 5 Series', 'Mercedes E-Class', 'Audi A6', 'Lexus ES'],
    'Convertible': ['Ford Mustang', 'Chevrolet Camaro', 'BMW 4 Series'],
    'Van': ['Chrysler Pacifica', 'Honda Odyssey', 'Toyota Sienna']
}

# =============================================
# Generate Flights
# =============================================

def generate_flights(count):
    print(f"✈️  Generating {count:,} flights...")
    flights = []
    
    for i in range(count):
        origin = random.choice(AIRPORTS)
        dest = random.choice([a for a in AIRPORTS if a['code'] != origin['code']])
        
        dept_hour = random.randint(5, 22)
        duration_hours = random.randint(1, 8)
        arr_hour = (dept_hour + duration_hours) % 24
        
        flight = {
            'flight_id': f"FL-{i+1:05d}",
            'airline_name': random.choice(AIRLINES),
            'departure_airport': origin['code'],
            'arrival_airport': dest['code'],
            'from': origin['city'],
            'to': dest['city'],
            'departure_time': f"{dept_hour:02d}:{random.randint(0,59):02d}",
            'arrival_time': f"{arr_hour:02d}:{random.randint(0,59):02d}",
            'duration': f"{duration_hours}h {random.randint(0,59):02d}m",
            'flight_class': random.choices(['Economy', 'Business', 'First'], weights=[80, 15, 5])[0],
            'price': round(random.uniform(150, 1200), 2),
            'total_seats': random.choice([150, 180, 200, 220, 250]),
            'seatsAvailable': random.randint(0, 200),
            'rating': round(random.uniform(3.5, 5.0), 1)
        }
        flights.append(flight)
    
    with open(f"{OUTPUT_DIR}/flights.json", 'w') as f:
        json.dump(flights, f, indent=2)
    
    print(f"   ✅ Created {count:,} flights")
    return flights

# =============================================
# Generate Hotels
# =============================================

def generate_hotels(count):
    print(f"🏨 Generating {count:,} hotels...")
    hotels = []
    
    hotel_prefixes = ['Grand', 'Royal', 'Plaza', 'Luxury', 'Downtown', 'Historic', 'Modern', 'Boutique']
    hotel_suffixes = ['Hotel', 'Inn', 'Resort', 'Suites', 'Lodge', 'Residences']
    amenities_pool = ['WiFi', 'Breakfast', 'Pool', 'Gym', 'Spa', 'Parking', 'Bar', 'Restaurant', 'Room Service']
    
    for i in range(count):
        city_data = random.choice(AIRPORTS)
        
        hotel = {
            'hotel_id': f"HTL-{i+1:05d}",
            'hotel_name': f"{random.choice(hotel_prefixes)} {random.choice(hotel_suffixes)}",
            'city': city_data['city'],
            'state': 'CA',  # Simplified
            'address': fake.street_address(),
            'zip_code': fake.zipcode(),
            'star_rating': random.choices([3, 4, 5], weights=[30, 50, 20])[0],
            'total_rooms': random.choice([80, 100, 150, 200, 300]),
            'roomsAvailable': random.randint(0, 150),
            'room_type': random.choice(['Standard Room', 'Deluxe Room', 'Suite', 'Executive Suite', 'Presidential Suite']),
            'price_per_night': round(random.uniform(80, 800), 2),
            'amenities': random.sample(amenities_pool, k=random.randint(3, 7)),
            'rating': round(random.uniform(3.5, 5.0), 1)
        }
        hotels.append(hotel)
    
    with open(f"{OUTPUT_DIR}/hotels.json", 'w') as f:
        json.dump(hotels, f, indent=2)
    
    print(f"   ✅ Created {count:,} hotels")
    return hotels

# =============================================
# Generate Cars
# =============================================

def generate_cars(count):
    print(f"🚗 Generating {count:,} cars...")
    cars = []
    
    for i in range(count):
        car_type = random.choice(CAR_TYPES)
        city_data = random.choice(AIRPORTS)
        
        car = {
            'car_id': f"CAR-{i+1:05d}",
            'model': random.choice(CAR_MODELS[car_type]),
            'car_type': car_type,
            'company': random.choice(CAR_COMPANIES),
            'location': city_data['city'],
            'cities': [city_data['city']],
            'seats': random.choice([4, 5, 7, 8]),
            'transmission': random.choices(['Automatic', 'Manual'], weights=[90, 10])[0],
            'year': random.randint(2020, 2025),
            'daily_price': round(random.uniform(45, 350), 2),
            'carsAvailable': random.randint(0, 25),
            'rating': round(random.uniform(3.5, 5.0), 1)
        }
        cars.append(car)
    
    with open(f"{OUTPUT_DIR}/cars.json", 'w') as f:
        json.dump(cars, f, indent=2)
    
    print(f"   ✅ Created {count:,} cars")
    return cars

# =============================================
# Generate Users
# =============================================

def generate_users(count):
    print(f"👥 Generating {count:,} users...")
    users = []
    
    for i in range(count):
        user = {
            'user_id': f"{random.randint(100,999)}-{random.randint(10,99)}-{random.randint(1000,9999)}",
            'first_name': fake.first_name(),
            'last_name': fake.last_name(),
            'email': fake.email(),
            'phone': f"{random.randint(2000000000,9999999999)}",
            'address': fake.street_address(),
            'city': random.choice(AIRPORTS)['city'],
            'state': fake.state_abbr(),
            'zip_code': fake.zipcode(),
            'created_at': (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat()
        }
        users.append(user)
    
    with open(f"{OUTPUT_DIR}/users.json", 'w') as f:
        json.dump(users, f, indent=2)
    
    print(f"   ✅ Created {count:,} users")
    return users

# =============================================
# Generate Bookings/Billing
# =============================================

def generate_bookings(count, users, flights, hotels, cars):
    print(f"💳 Generating {count:,} bookings and billing records...")
    bookings = []
    
    listing_types = ['flight', 'hotel', 'car']
    
    for i in range(count):
        user = random.choice(users)
        booking_type = random.choice(listing_types)
        
        if booking_type == 'flight':
            listing = random.choice(flights)
            amount = listing['price'] * random.randint(1, 4)  # passengers
            listing_id = listing['flight_id']
        elif booking_type == 'hotel':
            listing = random.choice(hotels)
            nights = random.randint(1, 7)
            amount = listing['price_per_night'] * nights
            listing_id = listing['hotel_id']
        else:  # car
            listing = random.choice(cars)
            days = random.randint(1, 14)
            amount = listing['daily_price'] * days
            listing_id = listing['car_id']
        
        booking_date = datetime.now() - timedelta(days=random.randint(0, 180))
        
        booking = {
            'booking_id': i + 1,
            'user_id': user['user_id'],
            'listing_type': booking_type,
            'listing_id': listing_id,
            'booking_date': booking_date.isoformat(),
            'amount': round(amount, 2),
            'status': random.choices(['confirmed', 'completed', 'cancelled'], weights=[60, 35, 5])[0],
            'payment_method': random.choice(['Credit Card', 'Debit Card', 'PayPal']),
            'card_last4': f"{random.randint(1000, 9999)}"
        }
        bookings.append(booking)
    
    with open(f"{OUTPUT_DIR}/bookings.json", 'w') as f:
        json.dump(bookings, f, indent=2)
    
    print(f"   ✅ Created {count:,} bookings/billing records")
    return bookings

# =============================================
# Main Generation
# =============================================

def main():
    try:
        # Check if faker is installed
        try:
            from faker import Faker
        except ImportError:
            print("📦 Installing faker...")
            import subprocess
            subprocess.run(['pip3', 'install', 'faker'], check=True, capture_output=True)
            from faker import Faker
        
        print(f"📁 Output directory: {OUTPUT_DIR}\n")
        
        # Generate all data
        flights = generate_flights(COUNTS['flights'])
        hotels = generate_hotels(COUNTS['hotels'])
        cars = generate_cars(COUNTS['cars'])
        users = generate_users(COUNTS['users'])
        bookings = generate_bookings(COUNTS['bookings'], users, flights, hotels, cars)
        
        # Summary
        print("\n╔════════════════════════════════════════╗")
        print("║  GENERATION COMPLETE                   ║")
        print("╚════════════════════════════════════════╝\n")
        
        print(f"✈️  Flights:  {len(flights):>10,}")
        print(f"🏨 Hotels:   {len(hotels):>10,}")
        print(f"🚗 Cars:     {len(cars):>10,}")
        print(f"👥 Users:    {len(users):>10,}")
        print(f"💳 Bookings: {len(bookings):>10,}")
        print(f"━━━━━━━━━━━━━━━━━━━")
        total = len(flights) + len(hotels) + len(cars) + len(users) + len(bookings)
        print(f"📊 TOTAL:    {total:>10,} records\n")
        
        print("✅ All data saved to:", OUTPUT_DIR)
        print("\n🔄 Restart the backend to load new data:")
        print("   cd simple-backend && node server.js\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()

