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
      'SELECT * FROM flights ORDER BY departure_datetime DESC'
    );
    
    res.json({ flights });
  } catch (error) {
    console.error('Get flights error:', error);
    res.status(500).json({ message: 'Failed to fetch flights' });
  }
};

module.exports = {
  addFlight,
  getAllFlights
};
