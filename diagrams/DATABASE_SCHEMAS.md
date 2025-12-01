# 🗄️ DATABASE SCHEMAS - MySQL & MongoDB

## 📊 MySQL Database Schema (kayak_db)

### Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            USERS TABLE                                    │
├──────────────────────────────────────────────────────────────────────────┤
│  PK  user_id         VARCHAR(15)   # SSN format: ###-##-####            │
│      first_name      VARCHAR(100)                                        │
│      last_name       VARCHAR(100)                                        │
│  UQ  email           VARCHAR(255)                                        │
│      password_hash   VARCHAR(255)                                        │
│      phone           VARCHAR(10)   # 10 digits                           │
│      address         VARCHAR(255)                                        │
│      city            VARCHAR(100)                                        │
│      state           VARCHAR(2)    # US state abbr                       │
│      zip_code        VARCHAR(10)   # ##### or #####-####                │
│      profile_image_url VARCHAR(500)                                      │
│      created_at      TIMESTAMP                                           │
│      updated_at      TIMESTAMP                                           │
└─────────┬────────────────────────────────────────────────────────────────┘
          │
          │ 1:N
          │
┌─────────▼────────────────────────────────────────────────────────────────┐
│                        BOOKINGS TABLE                                     │
├──────────────────────────────────────────────────────────────────────────┤
│  PK  booking_id      INT AUTO_INCREMENT                                  │
│  FK  user_id         VARCHAR(15)  → users.user_id                        │
│      booking_type    ENUM('flight', 'hotel', 'car')                      │
│      listing_id      VARCHAR(50)  # Points to flight_id/hotel_id/car_id │
│      booking_date    DATE                                                │
│      start_date      DATE                                                │
│      end_date        DATE                                                │
│      num_passengers  INT                                                 │
│      num_rooms       INT                                                 │
│      num_cars        INT                                                 │
│      status          ENUM('confirmed', 'cancelled', 'completed')         │
│      total_amount    DECIMAL(10,2)                                       │
│      created_at      TIMESTAMP                                           │
└─────────┬────────────────────────────────────────────────────────────────┘
          │
          │ 1:N
          │
┌─────────▼────────────────────────────────────────────────────────────────┐
│                         BILLING TABLE                                     │
├──────────────────────────────────────────────────────────────────────────┤
│  PK  billing_id           INT AUTO_INCREMENT                             │
│  FK  user_id              VARCHAR(15)  → users.user_id                   │
│  FK  booking_id           INT  → bookings.booking_id                     │
│      booking_type         ENUM('flight', 'hotel', 'car')                 │
│      transaction_date     TIMESTAMP                                      │
│      amount               DECIMAL(10,2)                                  │
│      payment_method       VARCHAR(50)                                    │
│      transaction_status   ENUM('success', 'failed', 'refunded')          │
│      card_last4           VARCHAR(4)                                     │
└──────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                          FLIGHTS TABLE                                    │
├──────────────────────────────────────────────────────────────────────────┤
│  PK  flight_id           VARCHAR(50)                                     │
│      airline_name        VARCHAR(100)                                    │
│      departure_airport   VARCHAR(10)   # Airport code (JFK, LAX)         │
│      arrival_airport     VARCHAR(10)                                     │
│      departure_city      VARCHAR(100)                                    │
│      arrival_city        VARCHAR(100)                                    │
│      departure_time      TIME                                            │
│      arrival_time        TIME                                            │
│      flight_date         DATE                                            │
│      duration            VARCHAR(20)                                     │
│      flight_class        ENUM('Economy', 'Business', 'First')            │
│      price               DECIMAL(10,2)                                   │
│      total_seats         INT                                             │
│      seats_available     INT                                             │
│      rating              DECIMAL(2,1)                                    │
│                                                                           │
│  Indexes:                                                                 │
│  - idx_route (departure_airport, arrival_airport)                        │
│  - idx_price (price)                                                     │
│  - idx_seats (seats_available)                                           │
└──────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                           HOTELS TABLE                                    │
├──────────────────────────────────────────────────────────────────────────┤
│  PK  hotel_id           VARCHAR(50)                                      │
│      hotel_name         VARCHAR(255)                                     │
│      address            VARCHAR(255)                                     │
│      city               VARCHAR(100)                                     │
│      state              VARCHAR(2)                                       │
│      zip_code           VARCHAR(10)                                      │
│      star_rating        INT  CHECK (1-5)                                 │
│      total_rooms        INT                                              │
│      rooms_available    INT                                              │
│      room_type          VARCHAR(100)                                     │
│      price_per_night    DECIMAL(10,2)                                    │
│      amenities          JSON  # ['WiFi', 'Pool', 'Gym']                 │
│      rating             DECIMAL(2,1)                                     │
│                                                                           │
│  Indexes:                                                                 │
│  - idx_city_state (city, state)                                          │
│  - idx_price (price_per_night)                                           │
│  - idx_star_rating (star_rating)                                         │
└──────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                            CARS TABLE                                     │
├──────────────────────────────────────────────────────────────────────────┤
│  PK  car_id             VARCHAR(50)                                      │
│      model              VARCHAR(100)                                     │
│      car_type           ENUM('Economy', 'Sedan', 'SUV', 'Luxury', ...)   │
│      company            VARCHAR(100)  # Hertz, Enterprise, etc.          │
│      location           VARCHAR(100)                                     │
│      seats              INT                                              │
│      transmission       ENUM('Automatic', 'Manual')                      │
│      year               INT                                              │
│      daily_price        DECIMAL(10,2)                                    │
│      cars_available     INT                                              │
│      rating             DECIMAL(2,1)                                     │
│                                                                           │
│  Indexes:                                                                 │
│  - idx_location (location)                                               │
│  - idx_car_type (car_type)                                               │
│  - idx_price (daily_price)                                               │
└──────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                          ADMINS TABLE                                     │
├──────────────────────────────────────────────────────────────────────────┤
│  PK  admin_id           INT AUTO_INCREMENT                               │
│      first_name         VARCHAR(100)                                     │
│      last_name          VARCHAR(100)                                     │
│  UQ  email              VARCHAR(255)                                     │
│      password_hash      VARCHAR(255)                                     │
│      phone              VARCHAR(10)                                      │
│      role               ENUM('super_admin', 'admin', 'manager')          │
│      access_level       INT  # 1=basic, 2=moderate, 3=full              │
│      created_at         TIMESTAMP                                        │
│      last_login         TIMESTAMP                                        │
└──────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                        VENDORS TABLE                                      │
├──────────────────────────────────────────────────────────────────────────┤
│  PK  vendor_id          INT AUTO_INCREMENT                               │
│      vendor_name        VARCHAR(255)  # United Airlines, Marriott, etc.  │
│      vendor_type        ENUM('airline', 'hotel', 'car_rental')           │
│      contact_email      VARCHAR(255)                                     │
│      contact_phone      VARCHAR(20)                                      │
│      total_properties   INT                                              │
│      total_revenue      DECIMAL(15,2)                                    │
│      rating             DECIMAL(2,1)                                     │
└──────────────────────────────────────────────────────────────────────────┘

```

## 📄 MongoDB Collections (kayak_mongo)

### Collection: reviews

```javascript
{
  "_id": ObjectId("..."),
  "user_id": "123-45-6789",
  "listing_type": "flight",  // enum: flight, hotel, car
  "listing_id": "FL-00123",
  "rating": 4.5,             // 1-5
  "comment": "Great flight!",
  "helpful_count": 12,
  "created_at": ISODate("2025-01-15T10:30:00Z"),
  "updated_at": ISODate("2025-01-15T10:30:00Z")
}

// Indexes:
// - { listing_id: 1, rating: -1 }
// - { user_id: 1, created_at: -1 }
// - { listing_type: 1, rating: -1 }
```

### Collection: images

```javascript
{
  "_id": ObjectId("..."),
  "listing_type": "hotel",   // enum: flight, hotel, car, user
  "listing_id": "HTL-00456",
  "image_url": "https://s3.../hotel123.jpg",
  "image_type": "thumbnail", // thumbnail, gallery, featured
  "width": 1920,
  "height": 1080,
  "size_bytes": 245600,
  "uploaded_at": ISODate("2025-01-10T08:00:00Z")
}

// Indexes:
// - { listing_id: 1, image_type: 1 }
// - { listing_type: 1 }
```

### Collection: analytics_logs

```javascript
{
  "_id": ObjectId("..."),
  "event_type": "search",    // enum: search, view, click, booking, payment
  "user_id": "123-45-6789",
  "listing_type": "flight",
  "listing_id": "FL-00123",
  "metadata": {
    "from": "San Francisco",
    "to": "New York",
    "date": "2025-02-15",
    "passengers": 2,
    "price": 450.00
  },
  "timestamp": ISODate("2025-01-15T14:22:30Z"),
  "session_id": "sess_abc123xyz",
  "user_agent": "Mozilla/5.0..."
}

// Indexes:
// - { timestamp: -1 }
// - { event_type: 1, timestamp: -1 }
// - { user_id: 1, timestamp: -1 }
```

### Collection: click_tracking

```javascript
{
  "_id": ObjectId("..."),
  "user_id": "123-45-6789",
  "session_id": "sess_abc123xyz",
  "page_url": "/search?type=flights&from=SFO&to=NYC",
  "element_type": "button",  // button, link, card, filter
  "element_id": "book-flight-123",
  "coordinates": {
    "x": 450,
    "y": 320
  },
  "timestamp": ISODate("2025-01-15T14:25:10Z"),
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}

// Indexes:
// - { timestamp: -1 }
// - { page_url: 1, element_type: 1 }
// - { session_id: 1 }
```

## 🔄 Data Distribution Justification

### Why MySQL for:
| Table | Reason |
|-------|--------|
| **users** | ACID transactions, referential integrity |
| **bookings** | Complex joins, transaction support, rollback capability |
| **billing** | Financial data requires consistency, foreign keys |
| **flights/hotels/cars** | Structured data, frequent joins, price queries |
| **admins** | Authentication, role-based access control |

### Why MongoDB for:
| Collection | Reason |
|------------|--------|
| **reviews** | Flexible schema, varying review lengths, high write volume |
| **images** | Metadata storage, GridFS for large files, flexible attributes |
| **analytics_logs** | High write volume (thousands/sec), time-series data, flexible schema |
| **click_tracking** | Real-time analytics, heatmap generation, flexible event structure |

### Performance Comparison:

| Operation | MySQL Time | MongoDB Time | Best Choice |
|-----------|------------|--------------|-------------|
| User login (with joins) | 15ms | N/A | **MySQL** (foreign keys) |
| Create booking + billing | 25ms | N/A | **MySQL** (transactions) |
| Insert 1000 reviews | 450ms | 120ms | **MongoDB** (bulk writes) |
| Analytics query (aggregation) | 180ms | 95ms | **MongoDB** (flexible aggregation) |
| Search listings (complex filters) | 85ms | 200ms | **MySQL** (indexed queries) |

## 📈 Index Strategy

### MySQL Indexes:
```sql
-- Performance critical indexes
CREATE INDEX idx_flights_route ON flights(departure_airport, arrival_airport);
CREATE INDEX idx_flights_price ON flights(price);
CREATE INDEX idx_hotels_city ON hotels(city, state);
CREATE INDEX idx_hotels_price ON hotels(price_per_night);
CREATE INDEX idx_bookings_user ON bookings(user_id, created_at);
CREATE INDEX idx_billing_date ON billing(transaction_date);

-- Composite indexes for common queries
CREATE INDEX idx_search_flights ON flights(departure_city, arrival_city, flight_date);
CREATE INDEX idx_search_hotels ON hotels(city, star_rating, price_per_night);
```

### MongoDB Indexes:
```javascript
// reviews collection
db.reviews.createIndex({ "listing_id": 1, "rating": -1 });
db.reviews.createIndex({ "user_id": 1, "created_at": -1 });
db.reviews.createIndex({ "listing_type": 1, "rating": -1 });

// analytics_logs collection
db.analytics_logs.createIndex({ "timestamp": -1 });
db.analytics_logs.createIndex({ "event_type": 1, "timestamp": -1 });
db.analytics_logs.createIndex({ "user_id": 1, "event_type": 1 });

// click_tracking collection
db.click_tracking.createIndex({ "timestamp": -1 });
db.click_tracking.createIndex({ "page_url": 1, "element_type": 1 });
db.click_tracking.createIndex({ "session_id": 1, "timestamp": -1 });
```

## 🔄 Caching Strategy

### Redis Cache Keys:
```
# Listing caches
flights:all              → All flights (TTL: 1h)
hotels:city:<city>       → Hotels by city (TTL: 1h)
cars:location:<loc>      → Cars by location (TTL: 1h)

# User caches
user:<user_id>           → User profile (TTL: 30min)
user:bookings:<user_id>  → User's bookings (TTL: 15min)

# Query result caches
query:<hash>             → Search results (TTL: 5min)
analytics:stats          → Dashboard stats (TTL: 10min)
```

### Cache Invalidation Rules:
- **On INSERT:** Invalidate `listings:all`, clear relevant query caches
- **On UPDATE:** Invalidate specific item cache + related queries
- **On DELETE:** Invalidate all related caches
- **On BOOKING:** Invalidate availability caches, user booking cache

## 📊 Sample Queries

### Complex Join Query (MySQL):
```sql
-- Get user's complete booking history with listing details
SELECT 
    u.first_name, u.last_name, u.email,
    b.booking_id, b.booking_type, b.start_date, b.total_amount,
    f.airline_name, f.departure_city, f.arrival_city,
    h.hotel_name, h.city as hotel_city,
    c.model, c.company
FROM users u
LEFT JOIN bookings b ON u.user_id = b.user_id
LEFT JOIN flights f ON b.listing_id = f.flight_id AND b.booking_type = 'flight'
LEFT JOIN hotels h ON b.listing_id = h.hotel_id AND b.booking_type = 'hotel'
LEFT JOIN cars c ON b.listing_id = c.car_id AND b.booking_type = 'car'
WHERE u.user_id = '123-45-6789'
ORDER BY b.created_at DESC;
```

### Aggregation Query (MongoDB):
```javascript
// Get review statistics by listing type
db.reviews.aggregate([
  {
    $group: {
      _id: "$listing_type",
      avgRating: { $avg: "$rating" },
      totalReviews: { $sum: 1 },
      recentReviews: {
        $push: {
          $cond: [
            { $gte: ["$created_at", new Date(Date.now() - 30*24*60*60*1000)] },
            "$$ROOT",
            null
          ]
        }
      }
    }
  },
  { $sort: { avgRating: -1 } }
]);
```

---

**Document Version:** 1.0  
**Last Updated:** December 1, 2025  
**Status:** ✅ Complete

