-- PostgreSQL database schema for Ravogen FMCG dashboard

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define custom enum for out of stock status if desired, or use check constraints
CREATE TYPE oos_status_enum AS ENUM ('in_stock', 'low_stock', 'out_of_stock');

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Individual Stock / Shelf Items Table
CREATE TABLE shelf_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    share_of_shelf INT NOT NULL CONSTRAINT check_share CHECK (share_of_shelf >= 0 AND share_of_shelf <= 100),
    price DECIMAL(10, 2) NOT NULL CONSTRAINT check_price CHECK (price >= 0),
    oos_status oos_status_enum NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Historical Sentiment Analytics Snapshots Table
CREATE TABLE sentiment_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_month DATE UNIQUE NOT NULL, -- First day of the month representing the YYYY-MM snapshot
    taste_score DECIMAL(5, 2) NOT NULL CONSTRAINT check_taste CHECK (taste_score >= 0 AND taste_score <= 100),
    price_score DECIMAL(5, 2) NOT NULL CONSTRAINT check_price_sentiment CHECK (price_score >= 0 AND price_score <= 100),
    sustainability_score DECIMAL(5, 2) NOT NULL CONSTRAINT check_sustainability CHECK (sustainability_score >= 0 AND sustainability_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX idx_shelf_items_category ON shelf_items(category_id);
CREATE INDEX idx_sentiment_snapshots_month ON sentiment_snapshots(snapshot_month);

-- Seed Initial Categories (Optional but helpful reference)
-- INSERT INTO categories (name) VALUES ('Energy Drinks'), ('Salty Snacks'), ('Oat Milk');
