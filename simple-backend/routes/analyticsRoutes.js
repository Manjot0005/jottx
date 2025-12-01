const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Data paths
const DATA_DIR = path.join(__dirname, '../data');

// Helper to read JSON files
async function readJSON(filename) {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// =============================================
// ADMIN ANALYTICS ENDPOINTS
// =============================================

// 1. Top 10 Properties by Revenue
router.get('/admin/top-properties', async (req, res) => {
  try {
    const flights = await readJSON('flights.json');
    const hotels = await readJSON('hotels.json');
    const cars = await readJSON('cars.json');
    
    // Calculate revenue (mock data based on price * estimated bookings)
    const allListings = [
      ...flights.map(f => ({
        id: f.flight_id,
        name: `${f.airline_name} ${f.flight_id}`,
        type: 'flight',
        price: f.price,
        revenue: f.price * Math.floor(Math.random() * 50 + 10) // Random bookings
      })),
      ...hotels.map(h => ({
        id: h.hotel_id,
        name: h.hotel_name,
        type: 'hotel',
        price: h.price_per_night,
        revenue: h.price_per_night * Math.floor(Math.random() * 30 + 5)
      })),
      ...cars.map(c => ({
        id: c.car_id,
        name: `${c.model} (${c.location})`,
        type: 'car',
        price: c.daily_price,
        revenue: c.daily_price * Math.floor(Math.random() * 20 + 3)
      }))
    ];
    
    // Sort by revenue and get top 10
    const top10 = allListings
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(item => ({
        name: item.name,
        revenue: Math.round(item.revenue),
        type: item.type
      }));
    
    res.json({ success: true, data: top10 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. City-wise Revenue
router.get('/admin/city-revenue', async (req, res) => {
  try {
    const flights = await readJSON('flights.json');
    const hotels = await readJSON('hotels.json');
    const cars = await readJSON('cars.json');
    
    const cityRevenue = {};
    
    // Aggregate flight revenue by departure city
    flights.forEach(f => {
      const city = f.from || f.departure_city || 'Unknown';
      if (!cityRevenue[city]) cityRevenue[city] = 0;
      cityRevenue[city] += f.price * Math.floor(Math.random() * 30 + 5);
    });
    
    // Aggregate hotel revenue by city
    hotels.forEach(h => {
      const city = h.city || 'Unknown';
      if (!cityRevenue[city]) cityRevenue[city] = 0;
      cityRevenue[city] += h.price_per_night * Math.floor(Math.random() * 25 + 5);
    });
    
    // Aggregate car rental revenue by location
    cars.forEach(c => {
      const city = c.location || 'Unknown';
      if (!cityRevenue[city]) cityRevenue[city] = 0;
      cityRevenue[city] += c.daily_price * Math.floor(Math.random() * 15 + 3);
    });
    
    // Convert to array and sort
    const cityData = Object.entries(cityRevenue)
      .map(([city, revenue]) => ({
        city,
        revenue: Math.round(revenue)
      }))
      .sort((a, b) => b.revenue - a.revenue);
    
    res.json({ success: true, data: cityData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Top 10 Providers/Vendors by Revenue
router.get('/admin/top-providers', async (req, res) => {
  try {
    const flights = await readJSON('flights.json');
    const hotels = await readJSON('hotels.json');
    const cars = await readJSON('cars.json');
    
    const providerRevenue = {};
    
    // Aggregate airline revenue
    flights.forEach(f => {
      const provider = f.airline_name || 'Unknown Airline';
      if (!providerRevenue[provider]) {
        providerRevenue[provider] = { name: provider, type: 'airline', revenue: 0, properties: 0 };
      }
      providerRevenue[provider].revenue += f.price * Math.floor(Math.random() * 25 + 5);
      providerRevenue[provider].properties += 1;
    });
    
    // Aggregate hotel revenue (by hotel name as provider)
    hotels.forEach(h => {
      const provider = h.hotel_name || 'Unknown Hotel';
      if (!providerRevenue[provider]) {
        providerRevenue[provider] = { name: provider, type: 'hotel', revenue: 0, properties: 0 };
      }
      providerRevenue[provider].revenue += h.price_per_night * Math.floor(Math.random() * 20 + 5);
      providerRevenue[provider].properties += 1;
    });
    
    // Aggregate car rental company revenue
    cars.forEach(c => {
      const provider = c.company || 'Unknown Company';
      if (!providerRevenue[provider]) {
        providerRevenue[provider] = { name: provider, type: 'car_rental', revenue: 0, properties: 0 };
      }
      providerRevenue[provider].revenue += c.daily_price * Math.floor(Math.random() * 15 + 3);
      providerRevenue[provider].properties += 1;
    });
    
    // Convert to array, sort, and get top 10
    const top10Providers = Object.values(providerRevenue)
      .map(p => ({
        name: p.name,
        type: p.type,
        revenue: Math.round(p.revenue),
        properties: p.properties
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    res.json({ success: true, data: top10Providers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// HOST/PROVIDER ANALYTICS ENDPOINTS
// =============================================

// 4. Clicks per Page (mock data based on page types)
router.get('/analytics/clicks-per-page', async (req, res) => {
  try {
    const clickData = [
      { page: 'Home', clicks: Math.floor(Math.random() * 5000 + 1000) },
      { page: 'Flights Search', clicks: Math.floor(Math.random() * 4000 + 800) },
      { page: 'Hotels Search', clicks: Math.floor(Math.random() * 3500 + 700) },
      { page: 'Cars Search', clicks: Math.floor(Math.random() * 2500 + 500) },
      { page: 'Search Results', clicks: Math.floor(Math.random() * 4500 + 900) },
      { page: 'Booking Page', clicks: Math.floor(Math.random() * 2000 + 400) },
      { page: 'Payment', clicks: Math.floor(Math.random() * 1500 + 300) },
      { page: 'My Trips', clicks: Math.floor(Math.random() * 1000 + 200) },
      { page: 'Admin Dashboard', clicks: Math.floor(Math.random() * 500 + 100) },
      { page: 'AI Assistant', clicks: Math.floor(Math.random() * 800 + 150) }
    ];
    
    res.json({ success: true, data: clickData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Property/Listing Clicks
router.get('/analytics/listing-clicks', async (req, res) => {
  try {
    const listingClicks = [
      { type: 'Flights', clicks: Math.floor(Math.random() * 3000 + 600) },
      { type: 'Hotels', clicks: Math.floor(Math.random() * 2500 + 500) },
      { type: 'Cars', clicks: Math.floor(Math.random() * 1800 + 400) }
    ];
    
    res.json({ success: true, data: listingClicks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Heatmap Data (least seen sections)
router.get('/analytics/heatmap', async (req, res) => {
  try {
    const heatmapData = {
      mostViewed: [
        { section: 'Search Bar', views: 8500, engagement: 95 },
        { section: 'Popular Destinations', views: 6200, engagement: 78 },
        { section: 'Flight Results', views: 5800, engagement: 85 }
      ],
      leastViewed: [
        { section: 'Footer Links', views: 450, engagement: 12 },
        { section: 'Terms & Conditions', views: 230, engagement: 8 },
        { section: 'Help Center', views: 680, engagement: 22 }
      ]
    };
    
    res.json({ success: true, data: heatmapData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Reviews on Properties
router.get('/analytics/reviews', async (req, res) => {
  try {
    const reviewStats = {
      totalReviews: Math.floor(Math.random() * 1000 + 200),
      averageRating: 4.2,
      ratingDistribution: [
        { rating: 5, count: Math.floor(Math.random() * 500 + 100) },
        { rating: 4, count: Math.floor(Math.random() * 300 + 80) },
        { rating: 3, count: Math.floor(Math.random() * 150 + 30) },
        { rating: 2, count: Math.floor(Math.random() * 50 + 10) },
        { rating: 1, count: Math.floor(Math.random() * 30 + 5) }
      ],
      byType: [
        { type: 'Flights', avgRating: 4.1, count: Math.floor(Math.random() * 400 + 80) },
        { type: 'Hotels', avgRating: 4.3, count: Math.floor(Math.random() * 350 + 70) },
        { type: 'Cars', avgRating: 4.0, count: Math.floor(Math.random() * 250 + 50) }
      ]
    };
    
    res.json({ success: true, data: reviewStats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. User Cohort Tracking (e.g., users from San Jose, CA)
router.get('/analytics/user-cohorts', async (req, res) => {
  try {
    const cohortData = [
      { location: 'San Jose, CA', users: 245, avgBookings: 3.2, totalRevenue: 45600 },
      { location: 'New York, NY', users: 892, avgBookings: 2.8, totalRevenue: 125400 },
      { location: 'Los Angeles, CA', users: 654, avgBookings: 3.5, totalRevenue: 98200 },
      { location: 'Chicago, IL', users: 423, avgBookings: 2.9, totalRevenue: 62300 },
      { location: 'Miami, FL', users: 356, avgBookings: 4.1, totalRevenue: 71800 },
      { location: 'Seattle, WA', users: 289, avgBookings: 3.3, totalRevenue: 54200 }
    ];
    
    res.json({ success: true, data: cohortData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. User Activity Tracking Summary
router.get('/analytics/user-activity', async (req, res) => {
  try {
    const activityData = {
      totalPageViews: 12458,
      totalButtonClicks: 8932,
      totalSearches: 3241,
      avgSessionDuration: '6.5 min',
      bounceRate: '32%',
      conversionRate: '4.2%',
      dailyActiveUsers: Math.floor(Math.random() * 500 + 100),
      monthlyActiveUsers: Math.floor(Math.random() * 3000 + 800)
    };
    
    res.json({ success: true, data: activityData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Booking Trends Over Time
router.get('/analytics/booking-trends', async (req, res) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = months.map(month => ({
      month,
      flights: Math.floor(Math.random() * 150 + 50),
      hotels: Math.floor(Math.random() * 120 + 40),
      cars: Math.floor(Math.random() * 80 + 20),
      revenue: Math.floor(Math.random() * 50000 + 10000)
    }));
    
    res.json({ success: true, data: trendData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

