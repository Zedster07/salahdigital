-- Migration: 005_migrate_existing_data.sql
-- Description: Comprehensive data migration and validation for platform-based model
-- Date: 2025-06-19
-- Author: Digital Subscription Management System Refactoring
-- Dependencies: 001_create_platforms_table.sql, 002_create_credit_movements_table.sql, 003_modify_digital_products_table.sql, 004_update_sales_table.sql

-- Data Migration and Validation Script
-- This script ensures all existing data is properly migrated to the new platform-based model

DO $$
DECLARE
  product_count INTEGER;
  sales_count INTEGER;
  orphaned_products INTEGER;
  orphaned_sales INTEGER;
  products_without_platform INTEGER;
  sales_without_platform INTEGER;
  products_without_buying_price INTEGER;
  sales_with_invalid_profit INTEGER;
  default_platform_exists INTEGER;
  migration_start_time TIMESTAMP;
  migration_end_time TIMESTAMP;
BEGIN
  migration_start_time := CURRENT_TIMESTAMP;
  RAISE NOTICE '🚀 Starting comprehensive data migration and validation...';
  RAISE NOTICE 'Migration started at: %', migration_start_time;
  
  -- Step 1: Verify default platform exists
  SELECT COUNT(*) INTO default_platform_exists FROM platforms WHERE id = 'default-platform';
  
  IF default_platform_exists = 0 THEN
    RAISE EXCEPTION 'Default platform not found. Please run 001_create_platforms_table.sql first.';
  END IF;
  
  RAISE NOTICE '✅ Default platform verified';
  
  -- Step 2: Count existing data before migration
  SELECT COUNT(*) INTO product_count FROM digital_products;
  SELECT COUNT(*) INTO sales_count FROM stock_sales;
  
  RAISE NOTICE '📊 Pre-migration data counts:';
  RAISE NOTICE '  - Digital Products: %', product_count;
  RAISE NOTICE '  - Stock Sales: %', sales_count;
  
  -- Step 3: Ensure all products have platform associations
  UPDATE digital_products 
  SET platform_id = 'default-platform', 
      platform_buying_price = COALESCE(average_purchase_price, 0),
      profit_margin = 30.00,
      updated_at = CURRENT_TIMESTAMP
  WHERE platform_id IS NULL;
  
  GET DIAGNOSTICS products_without_platform = ROW_COUNT;
  RAISE NOTICE '✅ Updated % products with default platform association', products_without_platform;
  
  -- Step 4: Ensure all sales have platform associations
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
  
  GET DIAGNOSTICS sales_without_platform = ROW_COUNT;
  RAISE NOTICE '✅ Updated % sales with platform associations', sales_without_platform;
  
  -- Step 5: Recalculate profit for all sales with valid platform buying prices
  UPDATE stock_sales 
  SET profit = total_price - (platform_buying_price * quantity)
  WHERE platform_buying_price > 0 AND platform_buying_price IS NOT NULL;
  
  GET DIAGNOSTICS sales_with_invalid_profit = ROW_COUNT;
  RAISE NOTICE '✅ Recalculated profit for % sales', sales_with_invalid_profit;
  
  -- Step 6: Data Validation Checks
  RAISE NOTICE '🔍 Performing data validation checks...';
  
  -- Check for orphaned products (products without platform)
  SELECT COUNT(*) INTO orphaned_products 
  FROM digital_products 
  WHERE platform_id IS NULL;
  
  -- Check for orphaned sales (sales without platform)
  SELECT COUNT(*) INTO orphaned_sales 
  FROM stock_sales 
  WHERE platform_id IS NULL;
  
  -- Check for products without buying prices
  SELECT COUNT(*) INTO products_without_buying_price
  FROM digital_products 
  WHERE platform_buying_price IS NULL OR platform_buying_price < 0;
  
  -- Check for sales with invalid platform references
  SELECT COUNT(*) INTO sales_with_invalid_profit
  FROM stock_sales s
  LEFT JOIN platforms p ON s.platform_id = p.id
  WHERE s.platform_id IS NOT NULL AND p.id IS NULL;
  
  -- Step 7: Report validation results
  RAISE NOTICE '📋 Data Validation Results:';
  RAISE NOTICE '  - Total Products: %', product_count;
  RAISE NOTICE '  - Total Sales: %', sales_count;
  RAISE NOTICE '  - Orphaned Products: %', orphaned_products;
  RAISE NOTICE '  - Orphaned Sales: %', orphaned_sales;
  RAISE NOTICE '  - Products without buying price: %', products_without_buying_price;
  RAISE NOTICE '  - Sales with invalid platform refs: %', sales_with_invalid_profit;
  
  -- Step 8: Additional data integrity checks
  RAISE NOTICE '🔍 Performing additional integrity checks...';
  
  -- Check for negative balances or prices
  DECLARE
    negative_prices INTEGER;
    negative_profits INTEGER;
  BEGIN
    SELECT COUNT(*) INTO negative_prices
    FROM digital_products 
    WHERE platform_buying_price < 0 OR suggested_sell_price < 0;
    
    SELECT COUNT(*) INTO negative_profits
    FROM stock_sales 
    WHERE profit < 0;
    
    RAISE NOTICE '  - Products with negative prices: %', negative_prices;
    RAISE NOTICE '  - Sales with negative profit: %', negative_profits;
  END;
  
  -- Step 9: Verify foreign key integrity
  DECLARE
    invalid_product_sales INTEGER;
    invalid_platform_products INTEGER;
    invalid_platform_sales INTEGER;
  BEGIN
    -- Sales referencing non-existent products
    SELECT COUNT(*) INTO invalid_product_sales
    FROM stock_sales s
    LEFT JOIN digital_products p ON s.product_id = p.id
    WHERE s.product_id IS NOT NULL AND p.id IS NULL;
    
    -- Products referencing non-existent platforms
    SELECT COUNT(*) INTO invalid_platform_products
    FROM digital_products dp
    LEFT JOIN platforms p ON dp.platform_id = p.id
    WHERE dp.platform_id IS NOT NULL AND p.id IS NULL;
    
    -- Sales referencing non-existent platforms
    SELECT COUNT(*) INTO invalid_platform_sales
    FROM stock_sales s
    LEFT JOIN platforms p ON s.platform_id = p.id
    WHERE s.platform_id IS NOT NULL AND p.id IS NULL;
    
    RAISE NOTICE '  - Sales with invalid product refs: %', invalid_product_sales;
    RAISE NOTICE '  - Products with invalid platform refs: %', invalid_platform_products;
    RAISE NOTICE '  - Sales with invalid platform refs: %', invalid_platform_sales;
    
    -- Fail migration if critical integrity issues found
    IF invalid_product_sales > 0 OR invalid_platform_products > 0 OR invalid_platform_sales > 0 THEN
      RAISE EXCEPTION 'Migration failed: Critical foreign key integrity issues found';
    END IF;
  END;
  
  -- Step 10: Final validation
  IF orphaned_products > 0 OR orphaned_sales > 0 THEN
    RAISE EXCEPTION 'Migration failed: Found orphaned records after migration';
  END IF;
  
  migration_end_time := CURRENT_TIMESTAMP;
  
  -- Step 11: Success summary
  RAISE NOTICE '🎉 Migration completed successfully!';
  RAISE NOTICE 'Migration ended at: %', migration_end_time;
  RAISE NOTICE 'Total migration time: %', migration_end_time - migration_start_time;
  RAISE NOTICE '📊 Final Summary:';
  RAISE NOTICE '  - All % products successfully associated with platforms', product_count;
  RAISE NOTICE '  - All % sales successfully associated with platforms', sales_count;
  RAISE NOTICE '  - Data integrity verified';
  RAISE NOTICE '  - Platform-based model migration complete';
  
END $$;
