-- Database creation and schema setup for ShoppingCS-LB
-- PostgreSQL database schema for shopping cart system with load balancer

-- Create database (run this separately as superuser)
-- CREATE DATABASE "ShoppingCS-LB";

-- Connect to the database
-- \c "ShoppingCS-LB"

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    category VARCHAR(100) NOT NULL,
    in_stock BOOLEAN DEFAULT true,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table (PostgreSQL backup, Redis is primary)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    session_id VARCHAR(255),
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, session_id),
    UNIQUE(product_id, user_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_address TEXT,
    customer_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Insert sample products data
INSERT INTO products (id, name, price, description, image, category, in_stock, rating) VALUES
('1', 'Smartphone Pro', 599.99, 'Latest smartphone with advanced camera and performance', 'https://via.placeholder.com/300x300?text=Smartphone', 'Electronics', true, 5.00),
('2', 'Laptop Ultra', 1299.99, 'High-performance laptop for professionals', 'https://via.placeholder.com/300x300?text=Laptop', 'Electronics', true, 5.00),
('3', 'Wireless Headphones', 199.99, 'Premium noise-canceling wireless headphones', 'https://via.placeholder.com/300x300?text=Headphones', 'Electronics', true, 4.00),
('4', 'Smart Watch', 299.99, 'Fitness tracking smartwatch with health monitoring', 'https://via.placeholder.com/300x300?text=Smart+Watch', 'Electronics', true, 4.00),
('5', 'Coffee Maker', 89.99, 'Automatic coffee maker with programmable features', 'https://via.placeholder.com/300x300?text=Coffee+Maker', 'Home', true, 4.00),
('6', 'Running Shoes', 129.99, 'Comfortable running shoes for all terrains', 'https://via.placeholder.com/300x300?text=Running+Shoes', 'Sports', true, 5.00),
('7', 'Backpack', 79.99, 'Durable backpack for travel and daily use', 'https://via.placeholder.com/300x300?text=Backpack', 'Accessories', false, 4.00),
('8', 'Bluetooth Speaker', 149.99, 'Portable Bluetooth speaker with excellent sound quality', 'https://via.placeholder.com/300x300?text=Speaker', 'Electronics', true, 4.00)
ON CONFLICT (id) DO NOTHING;
