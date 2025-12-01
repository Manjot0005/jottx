const { mysqlPool } = require('../config/database');
const { getKafkaProducer } = require('../config/kafka');

// Add Flight
const addFlight = async (req, res) => {
  const connection = await mysqlPool.getConnection();
  
  try {
    const {
      flight_id, airline_name, departure_airport, arrival_airport,
      departure_datetime, arrival_datetime, duration, flight_class,
      ticket_price, total_seats, available_seats
    } = req.body;

    // Validate required fields
    if (!flight_id || !airline_name || !departure_airport || !arrival_airport) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await connection.execute(
      `
        INSERT INTO flights (
          flight_id, airline_name, departure_airport, arrival_airport,
          departure_datetime, arrival_datetime, duration, flight_class,
          ticket_price, total_seats, available_seats
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        flight_id, airline_name, departure_airport, arrival_airport,
        departure_datetime, arrival_datetime, duration, flight_class,
        ticket_price, total_seats, available_seats
      ]
    );

    // Try to send Kafka message, but don't fail if Kafka is down
    try {
      const producer = getKafkaProducer();
      await producer.send({
        topic: 'flight-added',
        messages: [{ value: JSON.stringify({ flight_id, airline_name }) }]
      });
    } catch (kafkaError) {
      console.log('⚠️  Kafka not available, continuing without event publishing');
    }

    res.status(201).json({ 
      message: 'Flight added successfully',
      flight_id 
    });

  } catch (error) {
    console.error('Add flight error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        message: `Flight ID ${req.body.flight_id} already exists. Please use a different Flight ID.` 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to add flight',
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

// Get all flights
const getAllFlights = async (req, res) => {
  try {
    const [flights] = await mysqlPool.execute(
      'SELECT * FROM flights WHERE is_active = TRUE ORDER BY departure_datetime DESC'
    );
    
    res.json({ success: true, data: flights });
  } catch (error) {
    console.error('Get flights error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch flights' });
  }
};

// Add Hotel
const addHotel = async (req, res) => {
  const connection = await mysqlPool.getConnection();
  
  try {
    const {
      hotel_id, hotel_name, address, city, state, zip_code,
      star_rating, total_rooms, available_rooms, room_type,
      price_per_night, amenities
    } = req.body;

    if (!hotel_id || !hotel_name || !city) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Convert amenities array to JSON
    const amenitiesJson = Array.isArray(amenities) ? JSON.stringify(amenities) : JSON.stringify([amenities]);

    await connection.execute(
      `
        INSERT INTO hotels (
          hotel_id, hotel_name, address, city, state, zip_code,
          star_rating, total_rooms, available_rooms, room_type,
          price_per_night, amenities
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        hotel_id, hotel_name, address, city, state, zip_code,
        star_rating, total_rooms, available_rooms, room_type,
        price_per_night, amenitiesJson
      ]
    );

    res.status(201).json({ 
      message: 'Hotel added successfully',
      hotel_id 
    });

  } catch (error) {
    console.error('Add hotel error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        message: `Hotel ID ${req.body.hotel_id} already exists` 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to add hotel',
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

// Get all hotels
const getAllHotels = async (req, res) => {
  try {
    const [hotels] = await mysqlPool.execute(
      'SELECT * FROM hotels WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    
    // Parse amenities JSON for each hotel
    const hotelsWithAmenities = hotels.map(h => ({
      ...h,
      amenities: typeof h.amenities === 'string' ? JSON.parse(h.amenities) : h.amenities
    }));
    
    res.json({ success: true, data: hotelsWithAmenities });
  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch hotels' });
  }
};

// Add Car
const addCar = async (req, res) => {
  const connection = await mysqlPool.getConnection();
  
  try {
    const {
      car_id, car_type, company_name, model, year,
      transmission_type, seats, daily_rental_price,
      availability_status, pickup_location
    } = req.body;

    if (!car_id || !car_type || !company_name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await connection.execute(
      `
        INSERT INTO cars (
          car_id, car_type, company_name, model, year,
          transmission_type, seats, daily_rental_price,
          availability_status, pickup_location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        car_id, car_type, company_name, model, year,
        transmission_type, seats, daily_rental_price,
        availability_status || 'AVAILABLE', pickup_location
      ]
    );

    res.status(201).json({ 
      message: 'Car added successfully',
      car_id 
    });

  } catch (error) {
    console.error('Add car error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        message: `Car ID ${req.body.car_id} already exists` 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to add car',
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

// Get all cars
const getAllCars = async (req, res) => {
  try {
    const [cars] = await mysqlPool.execute(
      'SELECT * FROM cars WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    
    res.json({ success: true, data: cars });
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cars' });
  }
};

module.exports = {
  addFlight,
  getAllFlights,
  addHotel,
  getAllHotels,
  addCar,
  getAllCars
};
