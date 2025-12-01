# Start All Services for Kayak Platform

## Prerequisites
Make sure MySQL, Redis, and Kafka are running:

```bash
# Check if MySQL is running
mysql -u root -p -e "SELECT 1"

# Check if Redis is running  
redis-cli ping

# If not running, start them:
brew services start mysql
brew services start redis
# Kafka: check docker-compose
```

## Step 1: Start Backend (Terminal 1)
```bash
cd ~/Desktop/CodeNest/JotX/kayak-platform/backend
npm start
```
Backend should start on **http://localhost:5001**

## Step 2: Start Admin Frontend (Terminal 2)
```bash
cd ~/Desktop/CodeNest/JotX/kayak-platform/frontend
npm start
```
Admin should start on **http://localhost:3000**
- Login: `superadmin@kayak.com` / `Admin@123`

## Step 3: Start Traveler Frontend (Terminal 3)
```bash
cd ~/Desktop/CodeNest/JotX/kayak-platform/traveler-frontend
npm start
```
Traveler should start on **http://localhost:3001**

## Testing the Data Sync

### On Admin (http://localhost:3000):
1. Login with `superadmin@kayak.com` / `Admin@123`
2. Go to **Listings** → Add a Flight
   - Flight ID: `CHI-MIA-001`
   - Airline: `American Airlines`
   - From: `Chicago`
   - To: `Miami`
   - Price: `$199`
   - Add dates and seats

### On Traveler (http://localhost:3001):
1. Select **Round Trip** or **One Way**
2. Search: Chicago → Miami
3. **You should now see your added flight!**

## Troubleshooting

### "Error fetching users" on Admin
- Make sure backend is running on port 5001
- Check backend logs for errors
- Verify MySQL is running and `kayak_db` database exists

### Flights not showing on Traveler
- Check browser console for errors
- Verify backend is running on port 5001
- Try: `curl http://localhost:5001/api/admin/listings/flights`

### Backend won't start
```bash
cd ~/Desktop/CodeNest/JotX/kayak-platform/backend
npm install
# Initialize database
mysql -u root -p kayak_db < scripts/init-db.sql
npm start
```

## Architecture
```
Admin (3000) ←→ Backend API (5001) ←→ MySQL Database
                      ↕
Traveler (3001) ←→ Backend API (5001) ←→ Redis Cache
```

Both frontends now share data through the backend API and MySQL database!

