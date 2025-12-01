#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║  MYSQL SCHEMA DEPLOYMENT               ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL not installed"
    echo "Install: brew install mysql"
    exit 1
fi

echo "✅ MySQL is installed"
echo ""

# Deploy schema
echo "📊 Deploying schema to MySQL..."
mysql -u root < database/mysql/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema deployed successfully!"
    echo ""
    echo "Verifying tables..."
    mysql -u root kayak_db -e "SHOW TABLES;"
else
    echo "❌ Schema deployment failed"
    echo ""
    echo "Try:"
    echo "  1. Start MySQL: brew services start mysql"
    echo "  2. Or run manually: mysql -u root < database/mysql/schema.sql"
fi

echo ""
echo "✅ Done!"
