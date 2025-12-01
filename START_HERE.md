# ⚡ START HERE - Kayak Platform

## ✅ Current Status:
- **Backend is RUNNING** on port 5001 ✅
- **Compilation errors FIXED** ✅
- **Ready to start frontends** 🚀

---

## 🎯 Quick Start (3 Simple Steps)

### Step 1: Open Terminal 1 - Start Admin
```bash
cd ~/Desktop/CodeNest/JotX/kayak-platform
./START_FRONTENDS.sh
```
This will:
- Start admin on **http://localhost:3000**
- Auto-open in browser after 10 seconds
- Leave this terminal running

### Step 2: Open Terminal 2 - Start Traveler
```bash
cd ~/Desktop/CodeNest/JotX/kayak-platform
./START_TRAVELER.sh
```
This will:
- Start traveler on **http://localhost:3001**
- Auto-open in browser after 10 seconds
- Leave this terminal running

### Step 3: Test the Connection!

**In Admin (localhost:3000):**
1. Login: `superadmin@kayak.com` / `Admin@123`
2. Go to **Listings** → **Flights**
3. Add a flight:
   ```
   Flight ID: TEST-123
   Airline: Test Airlines
   From: Chicago
   To: Miami
   Price: $299
   Seats: 100
   ```

**In Traveler (localhost:3001):**
1. Select **Round Trip** or **One Way**
2. Search: **Chicago** → **Miami**
3. **Your TEST-123 flight will appear!** 🎉

---

## 🛑 To Stop Everything

Press `Ctrl+C` in each terminal window

OR run:
```bash
lsof -ti:5001,3000,3001 | xargs kill -9
```

---

## 📊 Service URLs

| Service | URL | Status |
|---------|-----|--------|
| Backend | http://localhost:5001/health | ✅ RUNNING |
| Admin | http://localhost:3000 | Ready to start |
| Traveler | http://localhost:3001 | Ready to start |

---

## 🐛 Troubleshooting

### "Backend not found"
The backend should auto-start, but if not:
```bash
cd ~/Desktop/CodeNest/JotX/kayak-platform/simple-backend
npm start
```

### "Port already in use"
```bash
# Kill processes on that port
lsof -ti:3000 | xargs kill -9  # For admin
lsof -ti:3001 | xargs kill -9  # For traveler
```

### "Module not found"
```bash
# Reinstall dependencies
cd frontend && npm install
cd traveler-frontend && npm install
```

---

## ✨ What You'll See

**Admin Panel:**
- Modern dashboard
- Add flights, hotels, cars
- View users
- Analytics charts

**Traveler Site:**
- Search interface
- One-way / Round-trip toggle
- Book flights, hotels, cars
- Profile & bookings

---

**🎉 Everything is ready! Just run the 2 start scripts above!**

