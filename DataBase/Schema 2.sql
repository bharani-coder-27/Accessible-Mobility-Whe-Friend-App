-- Drop the database
DROP DATABASE IF EXISTS wheelchair_bus;

-- Create database
CREATE DATABASE IF NOT EXISTS wheelchair_bus;
USE wheelchair_bus;

-- Buses table: Must be created first due to foreign key references
CREATE TABLE IF NOT EXISTS buses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL, -- e.g., "Madukkarai-Saibaba Colony"
  tripCode VARCHAR(20) NOT NULL,
  deviceId VARCHAR(50) NOT NULL UNIQUE, -- String format, e.g., "MGR976883094"
  wheelchair_accessible TINYINT DEFAULT 0
);

-- Users table: References buses(id)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone_number VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  role ENUM('passenger', 'conductor') DEFAULT 'passenger',
  bus_id INT DEFAULT NULL,
  is_active TINYINT,
  `from` VARCHAR(150) DEFAULT NULL,
  `to` VARCHAR(150) DEFAULT NULL,
  tripCode VARCHAR(20) DEFAULT NULL,
  classOfService VARCHAR(50) DEFAULT NULL,
  deviceId VARCHAR(50) DEFAULT NULL, -- Temporary for conductors, cleared by trigger
  FOREIGN KEY (bus_id) REFERENCES buses(id)
);

-- Bus stops table: No foreign keys, referenced by bus_timings and notifications
CREATE TABLE IF NOT EXISTS bus_stops (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150),
  latitude DOUBLE,
  longitude DOUBLE
);

-- Bus timings table: References buses
CREATE TABLE bus_timings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT NOT NULL,
    stop_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    arrival_time TIME NOT NULL,
    FOREIGN KEY (bus_id) REFERENCES buses(id)
);

-- Notifications table: References buses, bus_stops, and users
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bus_id INT,
  bus_stop_id INT,
  user_id INT,
  timing TIME,
  status ENUM('pending', 'seen') DEFAULT 'pending',
  message VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id),
  FOREIGN KEY (bus_stop_id) REFERENCES bus_stops(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE bus_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stop_name VARCHAR(255) NOT NULL UNIQUE,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Trigger to handle bus creation or lookup based on deviceId for conductors
DELIMITER //
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.role = 'conductor' AND NEW.from IS NOT NULL AND NEW.to IS NOT NULL AND NEW.tripCode IS NOT NULL AND NEW.deviceId IS NOT NULL THEN
    -- Check if a bus with the provided deviceId already exists
    SET @bus_id = (SELECT id FROM buses WHERE deviceId = NEW.deviceId);
    
    -- If no bus exists with the deviceId, create a new one
    IF @bus_id IS NULL THEN
      INSERT INTO buses (name, tripCode, deviceId, wheelchair_accessible)
      VALUES (CONCAT(NEW.from, '-', NEW.to), NEW.tripCode, NEW.deviceId, 0);
      SET @bus_id = LAST_INSERT_ID();
    END IF;
    
    -- Update the user's bus_id and clear deviceId
    UPDATE users
    SET bus_id = @bus_id, deviceId = NULL
    WHERE id = NEW.id;
  END IF;
END //
DELIMITER ;