#!/bin/bash

# ===============================================
# Kafka Setup Script for Kayak Platform
# ===============================================

echo "╔════════════════════════════════════════╗"
echo "║  KAFKA SETUP FOR KAYAK PLATFORM        ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if Kafka is installed
if ! command -v kafka-topics &> /dev/null; then
    echo "📦 Installing Kafka..."
    brew install kafka
else
    echo "✅ Kafka is already installed"
    kafka-topics --version 2>/dev/null | head -1
fi

echo ""
echo "🚀 Starting Kafka services..."
echo ""

# Start Zookeeper in background
echo "1️⃣  Starting Zookeeper..."
zkServer start &
sleep 3

# Check if Zookeeper is running
if nc -z localhost 2181 2>/dev/null; then
    echo "✅ Zookeeper is running on port 2181"
else
    echo "⚠️  Starting Zookeeper with Kafka's built-in version..."
    /opt/homebrew/bin/zookeeper-server-start /opt/homebrew/etc/kafka/zookeeper.properties > /tmp/zookeeper.log 2>&1 &
    sleep 5
fi

# Start Kafka server in background
echo "2️⃣  Starting Kafka server..."
/opt/homebrew/bin/kafka-server-start /opt/homebrew/etc/kafka/server.properties > /tmp/kafka-server.log 2>&1 &
KAFKA_PID=$!
sleep 10

echo "✅ Kafka server starting (PID: $KAFKA_PID)"
echo ""

# Wait for Kafka to be ready
echo "⏳ Waiting for Kafka to be ready..."
for i in {1..30}; do
    if nc -z localhost 9092 2>/dev/null; then
        echo "✅ Kafka is ready on port 9092"
        break
    fi
    sleep 1
    echo -n "."
done
echo ""

# Create topics
echo ""
echo "📋 Creating Kafka topics..."
echo ""

TOPICS=(
    "user.actions:3:1"          # User actions (searches, clicks)
    "bookings.created:3:1"       # New bookings
    "bookings.updated:3:1"       # Booking updates
    "payments.processed:3:1"     # Payment events
    "search.events:3:1"          # Search queries
    "analytics.clicks:3:1"       # Click tracking
    "deals.normalized:3:1"       # Normalized deal data (for AI)
    "deals.scored:3:1"           # Scored deals (for AI)
    "deals.tagged:3:1"           # Tagged deals (for AI)
    "deal.events:3:1"            # Deal update events (for AI)
)

for topic_config in "${TOPICS[@]}"; do
    IFS=':' read -r topic partitions replication <<< "$topic_config"
    
    echo "Creating topic: $topic (partitions: $partitions, replication: $replication)"
    
    kafka-topics --create \
        --bootstrap-server localhost:9092 \
        --topic "$topic" \
        --partitions "$partitions" \
        --replication-factor "$replication" \
        --if-not-exists 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Topic '$topic' created"
    else
        echo "ℹ️  Topic '$topic' already exists or Kafka not ready yet"
    fi
done

echo ""
echo "📊 Listing all topics..."
kafka-topics --list --bootstrap-server localhost:9092 2>/dev/null

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  KAFKA SETUP COMPLETE                  ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "✅ Zookeeper running on: localhost:2181"
echo "✅ Kafka broker running on: localhost:9092"
echo ""
echo "📝 Logs:"
echo "   - Zookeeper: /tmp/zookeeper.log"
echo "   - Kafka: /tmp/kafka-server.log"
echo ""
echo "🔄 To stop Kafka:"
echo "   kafka-server-stop"
echo "   zkServer stop"
echo ""

