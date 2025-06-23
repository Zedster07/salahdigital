-- Migration: 004_update_sales_table.sql
-- Description: Add platform integration and subscription features to stock_sales table
-- Date: 2025-06-19
-- Author: Digital Subscription Management System Refactoring
-- Dependencies: 001_create_platforms_table.sql, 003_modify_digital_products_table.sql

-- Add platform and subscription fields to stock_sales table
ALTER TABLE stock_sales 
ADD COLUMN IF NOT EXISTS platform_id VARCHAR(255) REFERENCES platforms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS platform_buying_price DECIMAL(10,2) DEFAULT 0 CHECK (platform_buying_price >= 0),
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'one-time' CHECK (payment_type IN ('one-time', 'recurring')),
ADD COLUMN IF NOT EXISTS subscription_duration INTEGER CHECK (subscription_duration > 0),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;

-- Update existing sales with platform information from their products
UPDATE stock_sales 
SET platform_id = (
  SELECT platform_id 
  FROM digital_products 
  WHERE digital_products.id = stock_sales.product_id
),
platform_buying_price = (
  SELECT platform_buying_price 
  FROM digital_products 
  WHERE digital_products.id = stock_sales.product_id
),
payment_type = 'one-time'
WHERE platform_id IS NULL;

-- Recalculate profit based on new platform buying prices
-- Only update where we have valid platform buying price data
UPDATE stock_sales 
SET profit = total_price - (platform_buying_price * quantity)
WHERE platform_buying_price > 0 AND platform_buying_price IS NOT NULL;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_sales_platform ON stock_sales(platform_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_type ON stock_sales(payment_type);
CREATE INDEX IF NOT EXISTS idx_sales_subscription_dates ON stock_sales(subscription_start_date, subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_sales_platform_date ON stock_sales(platform_id, sale_date);

-- Add constraint to ensure subscription fields are consistent
-- If payment_type is 'recurring', subscription_duration must be set
ALTER TABLE stock_sales 
ADD CONSTRAINT check_recurring_subscription 
CHECK (
  (payment_type = 'one-time' AND subscription_duration IS NULL) OR
  (payment_type = 'recurring' AND subscription_duration IS NOT NULL AND subscription_duration > 0)
);

-- Log migration completion and provide summary
DO $$
DECLARE
  updated_sales_count INTEGER;
  total_sales_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_sales_count FROM stock_sales;
  SELECT COUNT(*) INTO updated_sales_count FROM stock_sales WHERE platform_id IS NOT NULL;
  
  RAISE NOTICE 'Migration 004_update_sales_table.sql completed successfully';
  RAISE NOTICE 'Total sales records: %', total_sales_count;
  RAISE NOTICE 'Sales with platform association: %', updated_sales_count;
  RAISE NOTICE 'Platform integration fields added to stock_sales table';
  RAISE NOTICE 'Subscription support enabled with payment_type and duration fields';
END $$;
