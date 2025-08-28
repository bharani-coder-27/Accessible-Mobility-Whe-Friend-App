-- create database
CREATE DATABASE IF NOT EXISTS wheelchair_bus;
USE wheelchair_bus;

-- users: role = 'wheelchair' or 'conductor'. conductor has bus_id to identify which bus they're on.
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone_number VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  role ENUM('passenger','conductor') DEFAULT 'passenger',
  bus_id INT DEFAULT NULL,
  is_active TINYINT
);

CREATE TABLE IF NOT EXISTS buses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  route_number VARCHAR(20),
  capacity INT,
  wheelchair_accessible TINYINT
);

CREATE TABLE IF NOT EXISTS bus_stops (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150),
  latitude DOUBLE,
  longitude DOUBLE
);

CREATE TABLE IF NOT EXISTS bus_timings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bus_id INT,
  bus_stop_id INT,
  arrival_time TIME,
  FOREIGN KEY (bus_id) REFERENCES buses(id),
  FOREIGN KEY (bus_stop_id) REFERENCES bus_stops(id)
);

-- Notifications: created on booking; conductor polls for pending notifications for their bus.
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bus_id INT,
  bus_stop_id INT,
  user_id INT,
  timing TIME,
  status ENUM('pending','seen') DEFAULT 'pending',
  message VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id),
  FOREIGN KEY (bus_stop_id) REFERENCES bus_stops(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
