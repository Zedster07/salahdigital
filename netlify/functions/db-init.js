const { Pool } = require('pg');

let pool;
let initError = null;

// Initialize database connection with the provided credentials
try {
  const connectionString = process.env.NETLIFY_DATABASE_URL || 'postgresql://neondb_owner:npg_2kYdLiNtQE7P@ep-nameless-feather-a54wld9p-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';
  
  if (!connectionString) {
    throw new Error('Database connection string is not available');
  }
  
  pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  });

  // Test the connection
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  console.log('Database pool initialized successfully');
} catch (error) {
  initError = error;
  console.error('Database initialization error:', error);
}

// Database schema initialization
const initSchema = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Starting database schema initialization...');
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        email_verified BOOLEAN DEFAULT false,
        email_verification_token VARCHAR(255),
        email_verification_expires TIMESTAMP,
        login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        two_factor_enabled BOOLEAN DEFAULT false,
        two_factor_secret VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        wilaya VARCHAR(100),
        facebook VARCHAR(255),
        instagram VARCHAR(255),
        email VARCHAR(255),
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS digital_products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        duration_type VARCHAR(50) NOT NULL,
        description TEXT,
        current_stock INTEGER DEFAULT 0,
        min_stock_alert INTEGER DEFAULT 5,
        average_purchase_price DECIMAL(10,2) DEFAULT 0,
        suggested_sell_price DECIMAL(10,2) DEFAULT 0,
        platform_id VARCHAR(255) REFERENCES platforms(id) ON DELETE SET NULL,
        platform_buying_price DECIMAL(10,2) DEFAULT 0 CHECK (platform_buying_price >= 0),
        profit_margin DECIMAL(5,2) DEFAULT 30.00 CHECK (profit_margin >= 0),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add missing columns to digital_products table if they don't exist (for existing databases)
    try {
      await client.query(`
        ALTER TABLE digital_products
        ADD COLUMN IF NOT EXISTS average_purchase_price DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS platform_buying_price DECIMAL(10,2) DEFAULT 0 CHECK (platform_buying_price >= 0),
        ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2) DEFAULT 30.00 CHECK (profit_margin >= 0);
      `);
      console.log('Digital products table columns updated successfully');
    } catch (alterError) {
      console.log('Note: Some columns may already exist in digital_products table:', alterError.message);
    }

    // Create platforms table FIRST (before stock_sales) to avoid foreign key issues
    await client.query(`
      CREATE TABLE IF NOT EXISTS platforms (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(255),
        credit_balance DECIMAL(10,2) DEFAULT 0 CHECK (credit_balance >= 0),
        low_balance_threshold DECIMAL(10,2) DEFAULT 100,
        is_active BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Now add platform_id to digital_products after platforms table exists
    try {
      await client.query(`
        ALTER TABLE digital_products
        ADD COLUMN IF NOT EXISTS platform_id VARCHAR(255) REFERENCES platforms(id) ON DELETE SET NULL;
      `);
      console.log('Digital products platform_id column added successfully');
    } catch (alterError) {
      console.log('Note: platform_id column may already exist in digital_products table:', alterError.message);
    }

    // Note: stock_purchases table removed as part of platform migration
    // The system now uses platform-based credit management instead of direct purchases

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_sales (
        id VARCHAR(255) PRIMARY KEY,
        product_id VARCHAR(255) REFERENCES digital_products(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        subscriber_id VARCHAR(255) REFERENCES subscribers(id) ON DELETE SET NULL,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        sale_date TIMESTAMP NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        paid_amount DECIMAL(10,2) DEFAULT 0,
        remaining_amount DECIMAL(10,2) DEFAULT 0,
        profit DECIMAL(10,2) DEFAULT 0,
        platform_id VARCHAR(255) REFERENCES platforms(id) ON DELETE SET NULL,
        platform_buying_price DECIMAL(10,2) DEFAULT 0 CHECK (platform_buying_price >= 0),
        payment_type VARCHAR(50) DEFAULT 'one-time' CHECK (payment_type IN ('one-time', 'recurring')),
        subscription_duration INTEGER CHECK (subscription_duration > 0),
        subscription_start_date TIMESTAMP,
        subscription_end_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT check_recurring_subscription
        CHECK (
          (payment_type = 'one-time' AND subscription_duration IS NULL) OR
          (payment_type = 'recurring' AND subscription_duration IS NOT NULL AND subscription_duration > 0)
        )
      );
    `);

    // Add missing columns to stock_sales table if they don't exist (for existing databases)
    try {
      await client.query(`
        ALTER TABLE stock_sales
        ADD COLUMN IF NOT EXISTS platform_id VARCHAR(255) REFERENCES platforms(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS platform_buying_price DECIMAL(10,2) DEFAULT 0 CHECK (platform_buying_price >= 0),
        ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'one-time',
        ADD COLUMN IF NOT EXISTS subscription_duration INTEGER,
        ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
        ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP,
        ADD COLUMN IF NOT EXISTS notes TEXT;
      `);

      // Add constraint for payment_type if it doesn't exist
      await client.query(`
        ALTER TABLE stock_sales
        DROP CONSTRAINT IF EXISTS check_payment_type,
        ADD CONSTRAINT check_payment_type CHECK (payment_type IN ('one-time', 'recurring'));
      `);

      // Add constraint for recurring subscription if it doesn't exist
      await client.query(`
        ALTER TABLE stock_sales
        DROP CONSTRAINT IF EXISTS check_recurring_subscription,
        ADD CONSTRAINT check_recurring_subscription
        CHECK (
          (payment_type = 'one-time' AND subscription_duration IS NULL) OR
          (payment_type = 'recurring' AND subscription_duration IS NOT NULL AND subscription_duration > 0)
        );
      `);

      console.log('Stock sales table columns updated successfully');
    } catch (alterError) {
      console.log('Note: Some columns may already exist in stock_sales table:', alterError.message);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id VARCHAR(255) PRIMARY KEY,
        product_id VARCHAR(255) REFERENCES digital_products(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        reference VARCHAR(255),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'main',
        settings JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Platforms table already created above to avoid foreign key issues

    // Create platform credit movements table for audit trail
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_credit_movements (
        id VARCHAR(255) PRIMARY KEY,
        platform_id VARCHAR(255) NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('credit_added', 'credit_deducted', 'sale_deduction', 'adjustment')),
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        previous_balance DECIMAL(10,2) NOT NULL,
        new_balance DECIMAL(10,2) NOT NULL,
        reference VARCHAR(255),
        description TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_history (
        id VARCHAR(255) PRIMARY KEY,
        sale_id VARCHAR(255) REFERENCES stock_sales(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        date TIMESTAMP NOT NULL,
        method VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_subscribers_phone ON subscribers(phone);
      CREATE INDEX IF NOT EXISTS idx_subscribers_name ON subscribers(name);
      CREATE INDEX IF NOT EXISTS idx_stock_sales_date ON stock_sales(sale_date);
      CREATE INDEX IF NOT EXISTS idx_stock_sales_status ON stock_sales(payment_status);
      CREATE INDEX IF NOT EXISTS idx_sales_platform ON stock_sales(platform_id);
      CREATE INDEX IF NOT EXISTS idx_sales_payment_type ON stock_sales(payment_type);
      CREATE INDEX IF NOT EXISTS idx_sales_subscription_dates ON stock_sales(subscription_start_date, subscription_end_date);
      CREATE INDEX IF NOT EXISTS idx_sales_platform_date ON stock_sales(platform_id, sale_date);
      -- Note: idx_stock_purchases_date removed as stock_purchases table no longer exists
      CREATE INDEX IF NOT EXISTS idx_digital_products_category ON digital_products(category);
      CREATE INDEX IF NOT EXISTS idx_digital_products_active ON digital_products(is_active);
      CREATE INDEX IF NOT EXISTS idx_products_platform ON digital_products(platform_id);
      CREATE INDEX IF NOT EXISTS idx_products_platform_active ON digital_products(platform_id, is_active);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_payment_history_sale ON payment_history(sale_id);
      CREATE INDEX IF NOT EXISTS idx_platforms_name ON platforms(name);
      CREATE INDEX IF NOT EXISTS idx_platforms_active ON platforms(is_active);
      CREATE INDEX IF NOT EXISTS idx_platforms_credit_balance ON platforms(credit_balance);
      CREATE INDEX IF NOT EXISTS idx_credit_movements_platform ON platform_credit_movements(platform_id);
      CREATE INDEX IF NOT EXISTS idx_credit_movements_type ON platform_credit_movements(type);
      CREATE INDEX IF NOT EXISTS idx_credit_movements_date ON platform_credit_movements(created_at);
      CREATE INDEX IF NOT EXISTS idx_credit_movements_reference ON platform_credit_movements(reference);
    `);

    // Insert default admin user if not exists
    await client.query(`
      INSERT INTO users (id, username, email, role, status, email_verified, created_at)
      VALUES ('admin', 'admin', 'admin@digitalmanager.com', 'admin', 'verified', true, CURRENT_TIMESTAMP)
      ON CONFLICT (username) DO NOTHING;
    `);

    // Insert default platform for existing data migration
    await client.query(`
      INSERT INTO platforms (id, name, description, credit_balance, low_balance_threshold, is_active, created_at, updated_at)
      VALUES ('default-platform', 'Default Platform', 'Default platform for migrated products and existing data', 0, 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert default settings if not exists
    const defaultSettings = {
      language: 'fr',
      currency: 'DZD',
      notifications: true,
      autoBackup: false,
      defaultProfitMargin: 30,
      exchangeRates: {
        EUR_DZD: 145,
        USD_DZD: 135
      },
      categoryPricing: {
        iptv: 1500,
        'digital-account': 800,
        digitali: 2000
      },
      productCategories: ['iptv', 'digital-account', 'digitali', 'netflix', 'spotify', 'adobe'],
      productStatuses: ['actif', 'en rupture', 'expiré', 'archivé'],
      lowStockNotifications: true,
      expirationNotifications: true,
      emailNotifications: false,
      paymentMethods: ['cash', 'transfer', 'baridimob', 'ccp', 'paypal'],
      transactionFees: {
        baridimob: 2.5,
        transfer: 1.0,
        other: 0
      },
      theme: 'light',
      companyName: 'Digital Manager',
      welcomeMessage: 'Bienvenue dans votre gestionnaire d\'abonnements digitaux',
      autoExportEnabled: false,
      exportFormat: 'csv',
      backupFrequency: 'weekly',
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      emailVerificationExpiry: 24,
      requireEmailVerification: true,
      twoFactorRequired: false
    };

    await client.query(`
      INSERT INTO app_settings (id, settings)
      VALUES ('main', $1)
      ON CONFLICT (id) DO NOTHING;
    `, [JSON.stringify(defaultSettings)]);

    console.log('Database schema initialized successfully');
    return { success: true, message: 'Database schema initialized successfully' };
    
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Check for initialization errors first
  if (initError) {
    console.error('Database initialization error:', initError);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Database connection failed',
        message: initError.message,
        details: 'Database connection could not be established. Please check the connection string and network connectivity.'
      })
    };
  }

  try {
    // Test database connection before initializing schema
    const client = await pool.connect();
    console.log('Database connection test successful');
    client.release();
    
    // Initialize schema
    const result = await initSchema();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Database initialization error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      })
    };
  }
};

initSchema()