-- Migration: 003_modify_digital_products_table.sql
-- Description: Add platform association and platform-specific pricing to digital products
-- Date: 2025-06-19
-- Author: Digital Subscription Management System Refactoring
-- Dependencies: 001_create_platforms_table.sql

-- Add platform association and pricing fields to digital_products table
ALTER TABLE digital_products 
ADD COLUMN IF NOT EXISTS platform_id VARCHAR(255) REFERENCES platforms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS platform_buying_price DECIMAL(10,2) DEFAULT 0 CHECK (platform_buying_price >= 0),
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2) DEFAULT 30.00 CHECK (profit_margin >= 0);

-- Update existing products to use default platform
-- This ensures all existing products have a platform association
UPDATE digital_products 
SET platform_id = 'default-platform', 
    platform_buying_price = COALESCE(average_purchase_price, 0),
    profit_margin = 30.00,
    updated_at = CURRENT_TIMESTAMP
WHERE platform_id IS NULL;

-- Create index for platform association (performance optimization)
CREATE INDEX IF NOT EXISTS idx_products_platform ON digital_products(platform_id);

-- Create composite index for platform-product lookups
CREATE INDEX IF NOT EXISTS idx_products_platform_active ON digital_products(platform_id, is_active);

-- Add constraint to ensure platform_buying_price is not negative
-- (This is already handled by the CHECK constraint above, but adding for clarity)

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 003_modify_digital_products_table.sql completed successfully';
  RAISE NOTICE 'All existing products have been associated with default-platform';
  RAISE NOTICE 'Platform buying prices have been set from average purchase prices';
END $$;
