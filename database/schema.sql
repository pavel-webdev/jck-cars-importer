-- Database schema for JCK Cars Importer
-- Created: November 2024

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    year INT,
    price DECIMAL(12,2),
    engine DECIMAL(4,2),
    country ENUM('Japan', 'China', 'Korea'),
    currency ENUM('JPY', 'CNY', 'KRW') DEFAULT 'JPY',
    horsepower INT DEFAULT 0,
    mileage INT DEFAULT 0,
    image_path VARCHAR(500),
    images_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_brand (brand),
    INDEX idx_country (country),
    INDEX idx_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(10),
    code_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    user_id INT,
    vehicle_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, vehicle_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Temp data for Telegram bot
CREATE TABLE IF NOT EXISTS car_temp_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chat_id BIGINT NOT NULL,
    step INT DEFAULT 1,
    country VARCHAR(50),
    currency VARCHAR(10),
    brand VARCHAR(100),
    model VARCHAR(100),
    title VARCHAR(255),
    year INT,
    price DECIMAL(12,2),
    engine DECIMAL(4,2),
    horsepower INT,
    mileage INT,
    photos_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chat_id (chat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample data for demonstration
INSERT INTO vehicles (title, brand, model, year, price, engine, country, currency, horsepower, mileage) VALUES
('Toyota Camry Hybrid', 'Toyota', 'Camry', 2023, 2850000, 2.5, 'Japan', 'JPY', 215, 15000),
('Honda Civic Turbo', 'Honda', 'Civic', 2022, 2200000, 1.5, 'Japan', 'JPY', 182, 25000),
('BYD Han EV', 'BYD', 'Han', 2023, 3500000, 0.0, 'China', 'CNY', 517, 5000),
('Kia K5 GT-Line', 'Kia', 'K5', 2021, 2800000, 2.5, 'Korea', 'KRW', 290, 30000),
('Toyota Land Cruiser', 'Toyota', 'Land Cruiser', 2020, 8500000, 4.5, 'Japan', 'JPY', 309, 45000),
('Geely Coolray', 'Geely', 'Coolray', 2022, 1800000, 1.5, 'China', 'CNY', 177, 12000),
('Hyundai Tucson', 'Hyundai', 'Tucson', 2021, 3200000, 2.0, 'Korea', 'KRW', 186, 22000),
('Mazda CX-5', 'Mazda', 'CX-5', 2023, 3800000, 2.5, 'Japan', 'JPY', 194, 8000);

-- Sample user (password: demo123)
INSERT INTO users (name, email, password_hash, email_verified) VALUES
('Demo User', 'demo@jckcars.ru', '$2y$12$ABCDEFGHIJKLMNOPQRSTUVwxyz0123456789ABCDEFGHIJK', 1);

-- Sample favorites
INSERT INTO favorites (user_id, vehicle_id) VALUES
(1, 1),
(1, 3),
(1, 5);