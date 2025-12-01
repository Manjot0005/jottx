#!/bin/bash

# Kaggle Dataset Setup Script
# This script downloads and processes Kaggle datasets for the Kayak platform

echo "🚀 Kaggle Dataset Integration Setup"
echo "===================================="
echo ""

# Check for Kaggle credentials
if [ ! -f ~/.kaggle/kaggle.json ]; then
    echo "⚠️  Kaggle API credentials not found!"
    echo ""
    echo "📋 Setup Instructions:"
    echo "   1. Visit: https://www.kaggle.com/settings"
    echo "   2. Scroll to 'API' section"
    echo "   3. Click 'Create New Token' (downloads kaggle.json)"
    echo "   4. Run: mkdir -p ~/.kaggle && mv ~/Downloads/kaggle.json ~/.kaggle/"
    echo "   5. Run: chmod 600 ~/.kaggle/kaggle.json"
    echo "   6. Re-run this script"
    echo ""
    exit 1
fi

echo "✅ Kaggle credentials found!"
echo ""

# Create datasets directory
mkdir -p data
cd data

echo "📥 Downloading datasets..."
echo ""

# 1. Inside Airbnb NYC (Hotels/nightly prices)
echo "1️⃣  Inside Airbnb NYC..."
kaggle datasets download -d dominoweir/inside-airbnb-nyc -p airbnb --unzip

# 2. Hotel Booking Demand
echo "2️⃣  Hotel Booking Demand..."
kaggle datasets download -d mojtaba142/hotel-booking -p hotel-booking --unzip

# 3. Flight Price Prediction (EaseMyTrip)
echo "3️⃣  Flight Price Prediction..."
kaggle datasets download -d shubhambathwal/flight-price-prediction -p flight-prices --unzip

# 4. Flight Prices (Expedia)
echo "4️⃣  Expedia Flight Prices..."
kaggle datasets download -d dilwong/flightprices -p expedia-flights --unzip

# 5. Global Airports
echo "5️⃣  Global Airports..."
kaggle datasets download -d samvelkoch/global-airports-iata-icao-timezone-geo -p airports --unzip

# 6. OpenFlights
echo "6️⃣  OpenFlights Database..."
kaggle datasets download -d elmoallistair/airlines-airport-and-routes -p openflights --unzip

echo ""
echo "✅ All datasets downloaded!"
echo ""
echo "📊 Processing datasets..."

# Run the Python processing script
cd ..
python3 process_datasets.py

echo ""
echo "🎉 Dataset integration complete!"
echo "   Data has been loaded into the backend."

