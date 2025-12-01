# 🚀 QUICK START - Kayak Platform

## ⚡ Start Everything (1 Command)

```bash
cd ~/Desktop/CodeNest/JotX/kayak-platform
./START_PROJECT.sh
```

This will start:
- ✅ Backend API (port 5001) - **Data sharing layer**
- ✅ Admin Frontend (port 3000) - **Add flights/hotels/cars**
- ✅ Traveler Frontend (port 3001) - **Book flights/hotels/cars**

---

## 🧪 Testing Admin → Traveler Connection

### Step 1: Add a Flight (Admin)
1. Open **http://localhost:3000**
2. Login: `superadmin@kayak.com` / `Admin@123`
3. Go to **Listings** → **Add Flight**
4. Fill in:
   - Flight ID: `TEST-001`
   - Airline: `Test Airlines`
   - From: `Chicago`
   - To: `Miami`
   - Departure: (any future date)
   - Arrival: (any future date)
   - Price: `299`
   - Seats: `100`
   - Available Seats: `100`
5. Click **Add Flight**

### Step 2: See it on Traveler Site
1. Open **http://localhost:3001**
2. Select **Round Trip** or **One Way**
3. Search: **Chicago** → **Miami**
4. **You should see your TEST-001 flight! 🎉**

---

## 📂 How It Works

```
┌─────────────────┐
│  Admin (3000)   │
│  Add listings   │
└────────┬────────┘
         │
         │ POST /api/admin/listings/flight
         ▼
┌─────────────────────────┐
│  Backend (5001)         │
│  Stores in JSON files   │
│  /simple-backend/data/  │
└─────────┬───────────────┘
          │
          │ GET /api/admin/listings/flights
          ▼
┌─────────────────┐
│ Traveler (3001) │
│ Shows listings  │
└─────────────────┘
```

---

## 🛑 Stop All Services

```bash
lsof -ti:5001,3000,3001 | xargs kill -9
```

---

## 📁 Data Location

All data is stored in:
```
/simple-backend/data/
├── flights.json
├── hotels.json
├── cars.json
└── users.json
```

You can manually edit these files if needed!

---

## 🐛 Troubleshooting

**Backend won't start?**
```bash
cd ~/Desktop/CodeNest/JotX/kayak-platform/simple-backend
npm install
npm start
```

**Frontend won't start?**
```bash
# Admin
cd ~/Desktop/CodeNest/JotX/kayak-platform/frontend
npm install
npm start

# Traveler
cd ~/Desktop/CodeNest/JotX/kayak-platform/traveler-frontend
npm install
npm start
```

**Still not working?**
Check the logs:
```bash
tail -f ~/Desktop/CodeNest/JotX/kayak-platform/simple-backend/backend.log
tail -f ~/Desktop/CodeNest/JotX/kayak-platform/frontend/admin.log
tail -f ~/Desktop/CodeNest/JotX/kayak-platform/traveler-frontend/traveler.log
```

---

## ✅ Success Indicators

- Backend: `curl http://localhost:5001/health` returns `{"success":true}`
- Admin: http://localhost:3000 loads and you can login
- Traveler: http://localhost:3001 loads with search interface
- **Data sync: Flight added in admin appears in traveler search!** ⭐

---

**Project is ready to use! 🎊**

