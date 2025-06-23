// Data Validation Script for Platform Migration
// This script validates the integrity of the migrated data

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL || 'postgresql://neondb_owner:npg_2kYdLiNtQE7P@ep-nameless-feather-a54wld9p-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

class MigrationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {};
  }

  async validateMigration() {
    console.log('🔍 Starting comprehensive migration validation...');
    
    try {
      await this.validatePlatformStructure();
      await this.validateProductMigration();
      await this.validateSalesMigration();
      await this.validateDataIntegrity();
      await this.validateBusinessLogic();
      await this.generateReport();
      
      return {
        success: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings,
        stats: this.stats
      };
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }

  async validatePlatformStructure() {
    console.log('\n📋 Validating platform structure...');
    const client = await pool.connect();
    
    try {
      // Check if platforms table exists
      const platformTableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'platforms'
        );
      `);
      
      if (!platformTableExists.rows[0].exists) {
        this.errors.push('Platforms table does not exist');
        return;
      }
      
      // Check if default platform exists
      const defaultPlatform = await client.query(`
        SELECT * FROM platforms WHERE id = 'default-platform'
      `);
      
      if (defaultPlatform.rows.length === 0) {
        this.errors.push('Default platform does not exist');
      } else {
        console.log('✅ Default platform exists');
      }
      
      // Count total platforms
      const platformCount = await client.query('SELECT COUNT(*) as count FROM platforms');
      this.stats.totalPlatforms = parseInt(platformCount.rows[0].count);
      console.log(`✅ Total platforms: ${this.stats.totalPlatforms}`);
      
      // Check platform credit movements table
      const movementsTableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'platform_credit_movements'
        );
      `);
      
      if (!movementsTableExists.rows[0].exists) {
        this.errors.push('Platform credit movements table does not exist');
      } else {
        console.log('✅ Platform credit movements table exists');
      }
      
    } finally {
      client.release();
    }
  }

  async validateProductMigration() {
    console.log('\n📦 Validating product migration...');
    const client = await pool.connect();
    
    try {
      // Count total products
      const productCount = await client.query('SELECT COUNT(*) as count FROM digital_products');
      this.stats.totalProducts = parseInt(productCount.rows[0].count);
      console.log(`📊 Total products: ${this.stats.totalProducts}`);
      
      // Check products without platform association
      const orphanedProducts = await client.query(`
        SELECT COUNT(*) as count FROM digital_products WHERE platform_id IS NULL
      `);
      const orphanedCount = parseInt(orphanedProducts.rows[0].count);
      
      if (orphanedCount > 0) {
        this.errors.push(`${orphanedCount} products without platform association`);
      } else {
        console.log('✅ All products have platform associations');
      }
      
      // Check products with invalid platform references
      const invalidPlatformRefs = await client.query(`
        SELECT COUNT(*) as count 
        FROM digital_products dp
        LEFT JOIN platforms p ON dp.platform_id = p.id
        WHERE dp.platform_id IS NOT NULL AND p.id IS NULL
      `);
      const invalidCount = parseInt(invalidPlatformRefs.rows[0].count);
      
      if (invalidCount > 0) {
        this.errors.push(`${invalidCount} products with invalid platform references`);
      } else {
        console.log('✅ All platform references are valid');
      }
      
      // Check products without buying prices
      const noBuyingPrice = await client.query(`
        SELECT COUNT(*) as count 
        FROM digital_products 
        WHERE platform_buying_price IS NULL OR platform_buying_price < 0
      `);
      const noPriceCount = parseInt(noBuyingPrice.rows[0].count);
      
      if (noPriceCount > 0) {
        this.warnings.push(`${noPriceCount} products without valid buying prices`);
      } else {
        console.log('✅ All products have valid buying prices');
      }
      
      // Check profit margins
      const invalidMargins = await client.query(`
        SELECT COUNT(*) as count 
        FROM digital_products 
        WHERE profit_margin IS NULL OR profit_margin < 0
      `);
      const invalidMarginCount = parseInt(invalidMargins.rows[0].count);
      
      if (invalidMarginCount > 0) {
        this.warnings.push(`${invalidMarginCount} products with invalid profit margins`);
      }
      
    } finally {
      client.release();
    }
  }

  async validateSalesMigration() {
    console.log('\n💰 Validating sales migration...');
    const client = await pool.connect();
    
    try {
      // Count total sales
      const salesCount = await client.query('SELECT COUNT(*) as count FROM stock_sales');
      this.stats.totalSales = parseInt(salesCount.rows[0].count);
      console.log(`📊 Total sales: ${this.stats.totalSales}`);
      
      // Check sales without platform association
      const orphanedSales = await client.query(`
        SELECT COUNT(*) as count FROM stock_sales WHERE platform_id IS NULL
      `);
      const orphanedSalesCount = parseInt(orphanedSales.rows[0].count);
      
      if (orphanedSalesCount > 0) {
        this.errors.push(`${orphanedSalesCount} sales without platform association`);
      } else {
        console.log('✅ All sales have platform associations');
      }
      
      // Check sales with invalid platform references
      const invalidSalesPlatformRefs = await client.query(`
        SELECT COUNT(*) as count 
        FROM stock_sales s
        LEFT JOIN platforms p ON s.platform_id = p.id
        WHERE s.platform_id IS NOT NULL AND p.id IS NULL
      `);
      const invalidSalesCount = parseInt(invalidSalesPlatformRefs.rows[0].count);
      
      if (invalidSalesCount > 0) {
        this.errors.push(`${invalidSalesCount} sales with invalid platform references`);
      } else {
        console.log('✅ All sales platform references are valid');
      }
      
      // Check sales with invalid product references
      const invalidProductRefs = await client.query(`
        SELECT COUNT(*) as count 
        FROM stock_sales s
        LEFT JOIN digital_products p ON s.product_id = p.id
        WHERE s.product_id IS NOT NULL AND p.id IS NULL
      `);
      const invalidProductCount = parseInt(invalidProductRefs.rows[0].count);
      
      if (invalidProductCount > 0) {
        this.errors.push(`${invalidProductCount} sales with invalid product references`);
      } else {
        console.log('✅ All sales product references are valid');
      }
      
      // Check payment types
      const invalidPaymentTypes = await client.query(`
        SELECT COUNT(*) as count 
        FROM stock_sales 
        WHERE payment_type NOT IN ('one-time', 'recurring')
      `);
      const invalidPaymentCount = parseInt(invalidPaymentTypes.rows[0].count);
      
      if (invalidPaymentCount > 0) {
        this.errors.push(`${invalidPaymentCount} sales with invalid payment types`);
      }
      
    } finally {
      client.release();
    }
  }

  async validateDataIntegrity() {
    console.log('\n🔍 Validating data integrity...');
    const client = await pool.connect();
    
    try {
      // Check for negative prices
      const negativePrices = await client.query(`
        SELECT COUNT(*) as count 
        FROM digital_products 
        WHERE platform_buying_price < 0 OR suggested_sell_price < 0
      `);
      const negativePriceCount = parseInt(negativePrices.rows[0].count);
      
      if (negativePriceCount > 0) {
        this.warnings.push(`${negativePriceCount} products with negative prices`);
      }
      
      // Check for negative profits
      const negativeProfits = await client.query(`
        SELECT COUNT(*) as count 
        FROM stock_sales 
        WHERE profit < 0
      `);
      const negativeProfitCount = parseInt(negativeProfits.rows[0].count);
      
      if (negativeProfitCount > 0) {
        this.warnings.push(`${negativeProfitCount} sales with negative profit`);
      }
      
      // Check profit calculation accuracy
      const incorrectProfits = await client.query(`
        SELECT COUNT(*) as count 
        FROM stock_sales 
        WHERE ABS(profit - (total_price - (platform_buying_price * quantity))) > 0.01
        AND platform_buying_price > 0
      `);
      const incorrectProfitCount = parseInt(incorrectProfits.rows[0].count);
      
      if (incorrectProfitCount > 0) {
        this.warnings.push(`${incorrectProfitCount} sales with incorrect profit calculations`);
      } else {
        console.log('✅ Profit calculations are accurate');
      }
      
    } finally {
      client.release();
    }
  }

  async validateBusinessLogic() {
    console.log('\n💼 Validating business logic...');
    const client = await pool.connect();
    
    try {
      // Check subscription consistency
      const inconsistentSubscriptions = await client.query(`
        SELECT COUNT(*) as count 
        FROM stock_sales 
        WHERE (payment_type = 'recurring' AND subscription_duration IS NULL)
           OR (payment_type = 'one-time' AND subscription_duration IS NOT NULL)
      `);
      const inconsistentCount = parseInt(inconsistentSubscriptions.rows[0].count);
      
      if (inconsistentCount > 0) {
        this.errors.push(`${inconsistentCount} sales with inconsistent subscription data`);
      } else {
        console.log('✅ Subscription data is consistent');
      }
      
      // Check platform credit balances
      const negativeBalances = await client.query(`
        SELECT COUNT(*) as count 
        FROM platforms 
        WHERE credit_balance < 0
      `);
      const negativeBalanceCount = parseInt(negativeBalances.rows[0].count);
      
      if (negativeBalanceCount > 0) {
        this.warnings.push(`${negativeBalanceCount} platforms with negative credit balances`);
      }
      
    } finally {
      client.release();
    }
  }

  async generateReport() {
    console.log('\n📊 Generating validation report...');
    
    const hasErrors = this.errors.length > 0;
    const hasWarnings = this.warnings.length > 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 MIGRATION VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log('\n📊 Statistics:');
    console.log(`  - Total Platforms: ${this.stats.totalPlatforms || 0}`);
    console.log(`  - Total Products: ${this.stats.totalProducts || 0}`);
    console.log(`  - Total Sales: ${this.stats.totalSales || 0}`);
    
    if (hasErrors) {
      console.log('\n❌ ERRORS FOUND:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (hasWarnings) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    if (!hasErrors && !hasWarnings) {
      console.log('\n🎉 ALL VALIDATIONS PASSED!');
      console.log('✅ Migration completed successfully with no issues');
    } else if (!hasErrors) {
      console.log('\n✅ MIGRATION SUCCESSFUL');
      console.log('⚠️  Some warnings found but no critical errors');
    } else {
      console.log('\n❌ MIGRATION VALIDATION FAILED');
      console.log('🔧 Please address the errors before proceeding');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run validation if script is executed directly
async function runValidation() {
  const validator = new MigrationValidator();
  
  try {
    const result = await validator.validateMigration();
    
    if (result.success) {
      console.log('\n🎉 Migration validation completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Migration validation failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Validation process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runValidation();
}

module.exports = { MigrationValidator };
