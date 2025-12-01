-- ===============================================
-- KAYAK PLATFORM - MySQL Database Schema
-- ===============================================

-- Create database
CREATE DATABASE IF NOT EXISTS kayak_db;
USE kayak_db;

-- ===============================================
-- USERS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(15) PRIMARY KEY COMMENT 'SSN format: ###-##-####',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(10) COMMENT '10 digits, no dashes',
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2) COMMENT 'US state abbreviation',
    zip_code VARCHAR(10) COMMENT '##### or #####-####',
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_city_state (city, state),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- PAYMENT METHODS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS payment_methods (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    card_number_last4 VARCHAR(4),
    card_type ENUM('Visa', 'Mastercard', 'Amex', 'Discover') DEFAULT 'Visa',
    expiry_month CHAR(2),
    expiry_year CHAR(4),
    billing_zip VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- FLIGHTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS flights (
    flight_id VARCHAR(50) PRIMARY KEY,
    airline_name VARCHAR(100) NOT NULL,
    departure_airport VARCHAR(10) NOT NULL,
    arrival_airport VARCHAR(10) NOT NULL,
    departure_city VARCHAR(100),
    arrival_city VARCHAR(100),
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    flight_date DATE,
    duration VARCHAR(20),
    flight_class ENUM('Economy', 'Business', 'First') DEFAULT 'Economy',
    price DECIMAL(10, 2) NOT NULL,
    total_seats INT NOT NULL,
    seats_available INT NOT NULL,
    rating DECIMAL(2, 1) DEFAULT 4.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_route (departure_airport, arrival_airport),
    INDEX idx_cities (departure_city, arrival_city),
    INDEX idx_price (price),
    INDEX idx_date (flight_date),
    INDEX idx_seats (seats_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- HOTELS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS hotels (
    hotel_id VARCHAR(50) PRIMARY KEY,
    hotel_name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2),
    zip_code VARCHAR(10),
    star_rating INT CHECK (star_rating BETWEEN 1 AND 5),
    total_rooms INT NOT NULL,
    rooms_available INT NOT NULL,
    room_type VARCHAR(100),
    price_per_night DECIMAL(10, 2) NOT NULL,
    amenities JSON,
    rating DECIMAL(2, 1) DEFAULT 4.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city_state (city, state),
    INDEX idx_price (price_per_night),
    INDEX idx_star_rating (star_rating),
    INDEX idx_rooms (rooms_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- CARS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS cars (
    car_id VARCHAR(50) PRIMARY KEY,
    model VARCHAR(100) NOT NULL,
    car_type ENUM('Economy', 'Sedan', 'SUV', 'Luxury', 'Convertible', 'Van') DEFAULT 'Economy',
    company VARCHAR(100),
    location VARCHAR(100) NOT NULL,
    seats INT,
    transmission ENUM('Automatic', 'Manual') DEFAULT 'Automatic',
    year INT,
    daily_price DECIMAL(10, 2) NOT NULL,
    cars_available INT NOT NULL,
    rating DECIMAL(2, 1) DEFAULT 4.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (location),
    INDEX idx_car_type (car_type),
    INDEX idx_price (daily_price),
    INDEX idx_available (cars_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- BOOKINGS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    booking_type ENUM('flight', 'hotel', 'car') NOT NULL,
    listing_id VARCHAR(50) NOT NULL COMMENT 'flight_id, hotel_id, or car_id',
    booking_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    num_passengers INT DEFAULT 1,
    num_rooms INT DEFAULT 1,
    num_cars INT DEFAULT 1,
    status ENUM('confirmed', 'cancelled', 'completed', 'pending') DEFAULT 'confirmed',
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_booking_type (booking_type),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- BILLING TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS billing (
    billing_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    booking_id INT NOT NULL,
    booking_type ENUM('flight', 'hotel', 'car') NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_status ENUM('success', 'failed', 'refunded') DEFAULT 'success',
    card_last4 VARCHAR(4),
    INDEX idx_user_id (user_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_status (transaction_status),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- ADMINS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(10),
    role ENUM('super_admin', 'admin', 'manager') DEFAULT 'admin',
    access_level INT DEFAULT 1 COMMENT '1=basic, 2=moderate, 3=full',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- CLICK TRACKING TABLE (for analytics)
-- ===============================================
CREATE TABLE IF NOT EXISTS click_tracker (
    click_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(15),
    page_url VARCHAR(500),
    element_type VARCHAR(100) COMMENT 'flight, hotel, car, button, link',
    element_id VARCHAR(100),
    click_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    user_agent TEXT,
    INDEX idx_user_id (user_id),
    INDEX idx_element_type (element_type),
    INDEX idx_timestamp (click_timestamp),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- SEARCH HISTORY TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS search_history (
    search_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(15),
    search_type ENUM('flight', 'hotel', 'car') NOT NULL,
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    start_date DATE,
    end_date DATE,
    passengers INT,
    search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    results_count INT,
    INDEX idx_user_id (user_id),
    INDEX idx_search_type (search_type),
    INDEX idx_timestamp (search_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- VENDORS/PROVIDERS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type ENUM('airline', 'hotel', 'car_rental') NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    total_properties INT DEFAULT 0,
    total_revenue DECIMAL(15, 2) DEFAULT 0.00,
    rating DECIMAL(2, 1) DEFAULT 4.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vendor_type (vendor_type),
    INDEX idx_revenue (total_revenue)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- Insert some demo data
-- ===============================================

-- Demo admin user
INSERT INTO admins (first_name, last_name, email, password_hash, role, access_level) VALUES
('Super', 'Admin', 'superadmin@kayak.com', '$2b$10$rZ8Z4Q4Q4Q4Q4Q4Q4Q4Q4uXxXxXxXxXxXxXxXxXxXxXxXxXxXxX', 'super_admin', 3),
('John', 'Admin', 'admin@kayak.com', '$2b$10$rZ8Z4Q4Q4Q4Q4Q4Q4Q4Q4uXxXxXxXxXxXxXxXxXxXxXxXxXxXxX', 'admin', 2)
ON DUPLICATE KEY UPDATE email=email;

-- Demo vendors
INSERT INTO vendors (vendor_name, vendor_type, contact_email) VALUES
('United Airlines', 'airline', 'contact@united.com'),
('American Airlines', 'airline', 'contact@aa.com'),
('Delta Airlines', 'airline', 'contact@delta.com'),
('Marriott Hotels', 'hotel', 'contact@marriott.com'),
('Hilton Hotels', 'hotel', 'contact@hilton.com'),
('Hertz', 'car_rental', 'contact@hertz.com'),
('Enterprise', 'car_rental', 'contact@enterprise.com')
ON DUPLICATE KEY UPDATE vendor_name=vendor_name;

-- Show created tables
SHOW TABLES;

