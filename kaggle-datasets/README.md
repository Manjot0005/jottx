# 📊 Kaggle Dataset Integration for Kayak Platform

This directory contains scripts to download and process real Kaggle datasets for the Kayak travel booking platform.

---

## 🎯 Required Datasets (from Project Requirements)

As per the project specifications, the following Kaggle datasets are used:

### 1. **Inside Airbnb NYC** (Hotels/nightly prices)
- **URL:** https://www.kaggle.com/datasets/dominoweir/inside-airbnb-nyc
- **Usage:** Hotel pricing, availability, and amenities data

### 2. **Hotel Booking Demand** (City + Resort hotels)
- **URL:** https://www.kaggle.com/datasets/mojtaba142/hotel-booking
- **Usage:** Hotel booking patterns and customer preferences

### 3. **Flight Price Prediction** (EaseMyTrip—India)
- **URL:** https://www.kaggle.com/datasets/shubhambathwal/flight-price-prediction
- **Usage:** Flight pricing and route information

### 4. **Flight Prices** (Expedia, 2022 US routes)
- **URL:** https://www.kaggle.com/datasets/dilwong/flightprices
- **Usage:** US domestic flight data and pricing

### 5. **Global Airports** (IATA/ICAO/coords/timezone)
- **URL:** https://www.kaggle.com/datasets/samvelkoch/global-airports-iata-icao-timezone-geo
- **Usage:** Airport codes, locations, and metadata

### 6. **OpenFlights** (airlines, airports, routes)
- **URL:** https://www.kaggle.com/datasets/elmoallistair/airlines-airport-and-routes
- **Usage:** Airline routes and connections

---

## ⚙️ Setup Instructions

### Step 1: Get Kaggle API Credentials

1. Visit https://www.kaggle.com/settings
2. Scroll to the **API** section
3. Click **"Create New Token"**
4. This downloads `kaggle.json` to your Downloads folder

### Step 2: Install Kaggle API

```bash
# Install Kaggle CLI
pip3 install kaggle

# Set up credentials
mkdir -p ~/.kaggle
mv ~/Downloads/kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json
```

### Step 3: Download and Process Datasets

```bash
cd kayak-platform/kaggle-datasets

# Run the setup script
./setup_kaggle.sh
```

This will:
- ✅ Download all 6 required datasets from Kaggle
- ✅ Process and clean the data
- ✅ Convert to JSON format
- ✅ Load into the backend (`simple-backend/data/`)
- ✅ Generate 50+ flights, 30+ hotels, 40+ cars

---

## 🚀 Current Status

### ✅ Implemented (Using Sample Data Based on Kaggle Structures)

Currently, the platform is running with **sample data** that mimics the structure of the real Kaggle datasets:

- **50 flights** across 8 major US cities
- **30 hotels** with realistic pricing and amenities
- **40 car rentals** from major companies
- **8 airports** (JFK, LAX, ORD, MIA, SFO, SEA, BOS, LAS)

### 📈 Data Structure

#### Flights
```json
{
  "flight_id": "FL-535",
  "airline_name": "American Airlines",
  "departure_airport": "LAX",
  "arrival_airport": "SEA",
  "from": "Los Angeles",
  "to": "Seattle",
  "departure_time": "08:00",
  "arrival_time": "11:00",
  "price": 568.40,
  "total_seats": 180,
  "seatsAvailable": 95,
  "flight_class": "Economy",
  "duration": "3h 00m",
  "rating": 4.2
}
```

#### Hotels
```json
{
  "hotel_id": "HTL-MIA-758",
  "hotel_name": "Luxury Hotel",
  "city": "Miami",
  "state": "FL",
  "address": "1234 Main Street",
  "zip_code": "33101",
  "star_rating": 4,
  "total_rooms": 150,
  "roomsAvailable": 65,
  "room_type": "Deluxe Room",
  "price_per_night": 225.29,
  "amenities": ["WiFi", "Pool", "Gym", "Breakfast"],
  "rating": 4.5
}
```

#### Cars
```json
{
  "car_id": "CAR-SFO-898",
  "model": "Chevrolet Tahoe",
  "car_type": "SUV",
  "company": "Hertz",
  "location": "San Francisco",
  "cities": ["San Francisco"],
  "seats": 7,
  "transmission": "Automatic",
  "year": 2024,
  "daily_price": 132.76,
  "carsAvailable": 12,
  "rating": 4.3
}
```

---

## 🔄 Regenerating Data

To regenerate sample data or process new Kaggle datasets:

```bash
cd kayak-platform/kaggle-datasets

# Process datasets
python3 process_datasets.py

# Restart backend to load new data
cd ../simple-backend
lsof -ti :5001 | xargs kill -9
PORT=5001 node server.js &
```

---

## 📊 Data Statistics

### Current Sample Data:
- **Flights:** 50 routes between 8 major US cities
- **Hotels:** 30 properties across 8 cities
- **Cars:** 40 vehicles from 6 major rental companies
- **Airports:** 8 major US airports with IATA codes

### Price Ranges:
- **Flights:** $150 - $800 per person
- **Hotels:** $80 - $500 per night
- **Cars:** $50 - $250 per day

---

## 🎯 Next Steps

### To Use Real Kaggle Data:

1. **Set up Kaggle API credentials** (see Setup Instructions above)
2. **Run the setup script:** `./setup_kaggle.sh`
3. **Restart the backend** to load real data
4. **Verify:** Check the backend logs and API endpoints

### Data Will Include:
- ✅ **Real flight prices** from Expedia and EaseMyTrip
- ✅ **Real hotel data** from Airbnb and booking platforms
- ✅ **Global airport information** with coordinates
- ✅ **Airline route networks** from OpenFlights

---

## 📁 File Structure

```
kaggle-datasets/
├── README.md              # This file
├── setup_kaggle.sh        # Download script
├── process_datasets.py    # Data processor
└── data/                  # Downloaded datasets (after setup)
    ├── airbnb/
    ├── hotel-booking/
    ├── flight-prices/
    ├── expedia-flights/
    ├── airports/
    └── openflights/
```

---

## ✅ Verification

To verify the data is loaded correctly:

```bash
# Check flights
curl http://localhost:5001/api/admin/listings/flights | jq '.data | length'

# Check hotels
curl http://localhost:5001/api/admin/listings/hotels | jq '.data | length'

# Check cars
curl http://localhost:5001/api/admin/listings/cars | jq '.data | length'
```

Expected output:
- Flights: 50
- Hotels: 30
- Cars: 40

---

## 🔗 References

- [Kaggle API Documentation](https://github.com/Kaggle/kaggle-api)
- [Project Requirements PDF](../PROJECT_REQUIREMENTS.pdf)
- [Backend API Documentation](../simple-backend/README.md)

---

**Last Updated:** December 1, 2025  
**Status:** ✅ Sample data loaded, ready for real Kaggle integration

