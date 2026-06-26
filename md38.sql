-- MD38 Database Schema
CREATE DATABASE IF NOT EXISTS md38 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE md38;

-- Admins
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  full_name VARCHAR(100),
  role ENUM('super','admin') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2),
  category_id INT,
  stock INT DEFAULT 0,
  sizes JSON,
  images JSON,
  featured BOOLEAN DEFAULT FALSE,
  new_arrival BOOLEAN DEFAULT FALSE,
  promotion BOOLEAN DEFAULT FALSE,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Orders
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('pending','accepted','rejected','delivered') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(200),
  size VARCHAR(10),
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Settings
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default admin (password: admin123 — change immediately)
INSERT INTO admins (username, password, email, full_name, role) VALUES
('admin', '$2b$10$E9m8XQ7vZ5pLqR2kN3jY0eT4wU6yI8oA1sD3fG5hJ7kL9mN2pQ4rS', 'admin@md38.com', 'MD38 Admin', 'super');

-- Default categories
INSERT INTO categories (name, slug, description) VALUES
('Men', 'men', 'Men collection'),
('Women', 'women', 'Women collection'),
('Accessories', 'accessories', 'Accessories & more'),
('Shoes', 'shoes', 'Footwear collection');

-- Default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('site_name', 'MD38'),
('site_tagline', 'Luxury Fashion House'),
('currency', 'MAD'),
('delivery_fee', '30'),
('instagram_url', '#'),
('phone', '+212 600 000 000'),
('email', 'contact@md38.com'),
('address', 'Casablanca, Morocco'),
('hero_title', 'Redefine Your Style'),
('hero_subtitle', 'Discover the new MD38 collection'),
('newsletter_text', 'Subscribe to receive exclusive offers');

-- Sample products
INSERT INTO products (name, slug, description, price, old_price, category_id, stock, sizes, images, featured, new_arrival) VALUES
('Premium Oversized Tee', 'premium-oversized-tee', 'High-quality cotton oversized tee with minimalist MD38 design.', 299.00, 399.00, 1, 50, '["S","M","L","XL"]', '["/assets/p1.jpg","/assets/p1-2.jpg"]', 1, 1),
('Luxury Hoodie', 'luxury-hoodie', 'Premium heavyweight hoodie with embroidered logo.', 599.00, NULL, 1, 30, '["M","L","XL"]', '["/assets/p2.jpg"]', 1, 1),
('Elegant Dress', 'elegant-dress', 'Sophisticated evening dress for special occasions.', 899.00, 1199.00, 2, 20, '["S","M","L"]', '["/assets/p3.jpg"]', 1, 0),
('Classic Sneakers', 'classic-sneakers', 'Handcrafted leather sneakers.', 799.00, NULL, 4, 15, '["40","41","42","43","44"]', '["/assets/p4.jpg"]', 0, 1),
('Leather Belt', 'leather-belt', 'Genuine leather belt with premium buckle.', 249.00, NULL, 3, 40, '["M","L"]', '["/assets/p5.jpg"]', 0, 0),
('Designer Jacket', 'designer-jacket', 'Limited edition designer jacket.', 1499.00, 1899.00, 1, 8, '["M","L","XL"]', '["/assets/p6.jpg"]', 1, 1);