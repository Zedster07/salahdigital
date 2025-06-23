const { Pool } = require('pg');
const CreditManagementService = require('./services/CreditManagementService.cjs');
const FinancialReportingService = require('./services/FinancialReportingService.cjs');
const {
  platformSchemas,
  salesSchemas,
  productSchemas,
  financialReportingSchemas,
  querySchemas,
  validateData,
  validateQueryParams,
  validatePlatformId,
  formatValidationError,
  formatSuccessResponse,
  formatErrorResponse
} = require('./utils/validation.cjs');
const {
  formatPlatformProfitabilityCSV,
  formatCreditUtilizationCSV,
  formatSalesProfitCSV,
  formatLowCreditPlatformsCSV,
  paginateData,
  sortData,
  getFormatHeaders
} = require('./utils/reportFormatters.cjs');
const { requireAuth, getUserFromEvent, rateLimit } = require('./utils/auth.cjs');

let pool;
let creditService;
let financialReportingService;
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
    initError = err;
  });

  // Initialize services
  creditService = new CreditManagementService(pool);
  financialReportingService = new FinancialReportingService(pool);

  console.log('API Database pool initialized successfully');
} catch (error) {
  initError = error;
  console.error('API Database initialization error:', error);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Helper function to generate ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 11);
};

// Database operations with enhanced error handling
const dbOperations = {
  // Users
  async getUsers() {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users ORDER BY created_at DESC');
      return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        email: row.email,
        role: row.role,
        status: row.status,
        emailVerified: row.email_verified,
        emailVerificationToken: row.email_verification_token,
        emailVerificationExpires: row.email_verification_expires,
        loginAttempts: row.login_attempts,
        lockedUntil: row.locked_until,
        twoFactorEnabled: row.two_factor_enabled,
        twoFactorSecret: row.two_factor_secret,
        createdAt: row.created_at,
        lastLogin: row.last_login
      }));
    } finally {
      client.release();
    }
  },

  async createUser(userData) {
    const client = await pool.connect();
    try {
      const id = userData.id || generateId();
      const query = `
        INSERT INTO users (id, username, email, role, status, email_verified, login_attempts, two_factor_enabled, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const values = [
        id,
        userData.username,
        userData.email,
        userData.role || 'user',
        userData.status || 'pending',
        userData.emailVerified || false,
        userData.loginAttempts || 0,
        userData.twoFactorEnabled || false
      ];
      const result = await client.query(query, values);
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        email: row.email,
        role: row.role,
        status: row.status,
        emailVerified: row.email_verified,
        loginAttempts: row.login_attempts,
        twoFactorEnabled: row.two_factor_enabled,
        createdAt: row.created_at
      };
    } finally {
      client.release();
    }
  },

  async updateUser(userId, userData) {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE users 
        SET username = $2, email = $3, role = $4, status = $5, email_verified = $6, 
            login_attempts = $7, locked_until = $8, last_login = $9, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const values = [
        userId,
        userData.username,
        userData.email,
        userData.role,
        userData.status,
        userData.emailVerified,
        userData.loginAttempts,
        userData.lockedUntil || null,
        userData.lastLogin || null
      ];
      const result = await client.query(query, values);
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        email: row.email,
        role: row.role,
        status: row.status,
        emailVerified: row.email_verified,
        loginAttempts: row.login_attempts,
        lockedUntil: row.locked_until,
        lastLogin: row.last_login,
        twoFactorEnabled: row.two_factor_enabled,
        createdAt: row.created_at
      };
    } finally {
      client.release();
    }
  },

  async deleteUser(userId) {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      return { success: true };
    } finally {
      client.release();
    }
  },

  // Subscribers
  async getSubscribers() {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM subscribers ORDER BY created_at DESC');
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        wilaya: row.wilaya,
        facebook: row.facebook,
        instagram: row.instagram,
        email: row.email,
        address: row.address,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  },

  async createSubscriber(subscriberData) {
    const client = await pool.connect();
    try {
      const id = subscriberData.id || generateId();
      const query = `
        INSERT INTO subscribers (id, name, phone, wilaya, facebook, instagram, email, address, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const values = [
        id,
        subscriberData.name,
        subscriberData.phone,
        subscriberData.wilaya || null,
        subscriberData.facebook || null,
        subscriberData.instagram || null,
        subscriberData.email || null,
        subscriberData.address || null,
        subscriberData.notes || null
      ];
      const result = await client.query(query, values);
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        wilaya: row.wilaya,
        facebook: row.facebook,
        instagram: row.instagram,
        email: row.email,
        address: row.address,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  },

  async updateSubscriber(subscriberId, subscriberData) {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE subscribers 
        SET name = $2, phone = $3, wilaya = $4, facebook = $5, instagram = $6, 
            email = $7, address = $8, notes = $9, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const values = [
        subscriberId,
        subscriberData.name,
        subscriberData.phone,
        subscriberData.wilaya || null,
        subscriberData.facebook || null,
        subscriberData.instagram || null,
        subscriberData.email || null,
        subscriberData.address || null,
        subscriberData.notes || null
      ];
      const result = await client.query(query, values);
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        wilaya: row.wilaya,
        facebook: row.facebook,
        instagram: row.instagram,
        email: row.email,
        address: row.address,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  },

  async deleteSubscriber(subscriberId) {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM subscribers WHERE id = $1', [subscriberId]);
      return { success: true };
    } finally {
      client.release();
    }
  },

  // Digital Products (Updated for Task 9 - Platform Integration)
  async getDigitalProducts() {
    const client = await pool.connect();
    try {
      // Join with platforms table to get platform information
      const result = await client.query(`
        SELECT
          dp.*,
          p.name as platform_name,
          p.is_active as platform_active
        FROM digital_products dp
        LEFT JOIN platforms p ON dp.platform_id = p.id
        ORDER BY dp.created_at DESC
      `);
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        durationType: row.duration_type,
        description: row.description,
        currentStock: row.current_stock,
        minStockAlert: row.min_stock_alert,
        averagePurchasePrice: parseFloat(row.average_purchase_price || 0),
        suggestedSellPrice: parseFloat(row.suggested_sell_price || 0),
        // Platform-related fields (Task 9)
        platformId: row.platform_id,
        platformBuyingPrice: parseFloat(row.platform_buying_price || 0),
        profitMargin: parseFloat(row.profit_margin || 0),
        // Platform metadata for display
        platformName: row.platform_name,
        platformActive: row.platform_active,
        // Calculate selling price based on platform buying price + margin
        calculatedSellPrice: row.platform_buying_price && row.profit_margin
          ? parseFloat(row.platform_buying_price) * (1 + parseFloat(row.profit_margin) / 100)
          : parseFloat(row.suggested_sell_price || 0),
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  },

  async createDigitalProduct(productData) {
    const client = await pool.connect();
    try {
      const id = productData.id || generateId();

      // Validate platform association if provided
      if (productData.platformId) {
        const platformCheck = await client.query('SELECT id, is_active FROM platforms WHERE id = $1', [productData.platformId]);
        if (platformCheck.rows.length === 0) {
          throw new Error(`Platform with ID ${productData.platformId} does not exist`);
        }
        if (!platformCheck.rows[0].is_active) {
          throw new Error(`Platform ${productData.platformId} is not active`);
        }
      }

      // Calculate suggested sell price if platform buying price and margin are provided
      let calculatedSellPrice = productData.suggestedSellPrice || 0;
      if (productData.platformBuyingPrice && productData.profitMargin) {
        calculatedSellPrice = productData.platformBuyingPrice * (1 + productData.profitMargin / 100);
      }

      const query = `
        INSERT INTO digital_products (id, name, category, duration_type, description, current_stock,
                                    min_stock_alert, average_purchase_price, suggested_sell_price,
                                    platform_id, platform_buying_price, profit_margin, is_active,
                                    created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const values = [
        id,
        productData.name,
        productData.category,
        productData.durationType,
        productData.description || null,
        productData.currentStock || 0,
        productData.minStockAlert || 5,
        productData.averagePurchasePrice || 0,
        calculatedSellPrice,
        productData.platformId || null,
        productData.platformBuyingPrice || 0,
        productData.profitMargin || 0,
        productData.isActive !== false
      ];
      const result = await client.query(query, values);
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        durationType: row.duration_type,
        description: row.description,
        currentStock: row.current_stock,
        minStockAlert: row.min_stock_alert,
        averagePurchasePrice: parseFloat(row.average_purchase_price || 0),
        suggestedSellPrice: parseFloat(row.suggested_sell_price || 0),
        // Platform-related fields (Task 9)
        platformId: row.platform_id,
        platformBuyingPrice: parseFloat(row.platform_buying_price || 0),
        profitMargin: parseFloat(row.profit_margin || 0),
        calculatedSellPrice: row.platform_buying_price && row.profit_margin
          ? parseFloat(row.platform_buying_price) * (1 + parseFloat(row.profit_margin) / 100)
          : parseFloat(row.suggested_sell_price || 0),
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  },

  async updateDigitalProduct(productId, productData) {
    const client = await pool.connect();
    try {
      // Validate platform association if provided
      if (productData.platformId) {
        const platformCheck = await client.query('SELECT id, is_active FROM platforms WHERE id = $1', [productData.platformId]);
        if (platformCheck.rows.length === 0) {
          throw new Error(`Platform with ID ${productData.platformId} does not exist`);
        }
        if (!platformCheck.rows[0].is_active) {
          throw new Error(`Platform ${productData.platformId} is not active`);
        }
      }

      // Calculate suggested sell price if platform buying price and margin are provided
      let calculatedSellPrice = productData.suggestedSellPrice || 0;
      if (productData.platformBuyingPrice && productData.profitMargin) {
        calculatedSellPrice = productData.platformBuyingPrice * (1 + productData.profitMargin / 100);
      }

      const query = `
        UPDATE digital_products
        SET name = $2, category = $3, duration_type = $4, description = $5, current_stock = $6,
            min_stock_alert = $7, average_purchase_price = $8, suggested_sell_price = $9,
            platform_id = $10, platform_buying_price = $11, profit_margin = $12,
            is_active = $13, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const values = [
        productId,
        productData.name,
        productData.category,
        productData.durationType,
        productData.description || null,
        productData.currentStock || 0,
        productData.minStockAlert || 5,
        productData.averagePurchasePrice || 0,
        calculatedSellPrice,
        productData.platformId || null,
        productData.platformBuyingPrice || 0,
        productData.profitMargin || 0,
        productData.isActive !== false
      ];
      const result = await client.query(query, values);
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        durationType: row.duration_type,
        description: row.description,
        currentStock: row.current_stock,
        minStockAlert: row.min_stock_alert,
        averagePurchasePrice: parseFloat(row.average_purchase_price || 0),
        suggestedSellPrice: parseFloat(row.suggested_sell_price || 0),
        // Platform-related fields (Task 9)
        platformId: row.platform_id,
        platformBuyingPrice: parseFloat(row.platform_buying_price || 0),
        profitMargin: parseFloat(row.profit_margin || 0),
        calculatedSellPrice: row.platform_buying_price && row.profit_margin
          ? parseFloat(row.platform_buying_price) * (1 + parseFloat(row.profit_margin) / 100)
          : parseFloat(row.suggested_sell_price || 0),
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  },

  async deleteDigitalProduct(productId) {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM digital_products WHERE id = $1', [productId]);
      return { success: true };
    } finally {
      client.release();
    }
  },

  // Platform-specific product operations (Task 9)
  async getProductsByPlatform(platformId) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT
          dp.*,
          p.name as platform_name,
          p.is_active as platform_active,
          p.credit_balance as platform_balance
        FROM digital_products dp
        JOIN platforms p ON dp.platform_id = p.id
        WHERE dp.platform_id = $1
        ORDER BY dp.created_at DESC
      `, [platformId]);

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        durationType: row.duration_type,
        description: row.description,
        currentStock: row.current_stock,
        minStockAlert: row.min_stock_alert,
        averagePurchasePrice: parseFloat(row.average_purchase_price || 0),
        suggestedSellPrice: parseFloat(row.suggested_sell_price || 0),
        platformId: row.platform_id,
        platformBuyingPrice: parseFloat(row.platform_buying_price || 0),
        profitMargin: parseFloat(row.profit_margin || 0),
        platformName: row.platform_name,
        platformActive: row.platform_active,
        platformBalance: parseFloat(row.platform_balance || 0),
        calculatedSellPrice: row.platform_buying_price && row.profit_margin
          ? parseFloat(row.platform_buying_price) * (1 + parseFloat(row.profit_margin) / 100)
          : parseFloat(row.suggested_sell_price || 0),
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  },

  async calculateProductPricing(platformBuyingPrice, profitMargin) {
    // Utility method to calculate selling price based on buying price and margin
    if (!platformBuyingPrice || !profitMargin) {
      return {
        buyingPrice: platformBuyingPrice || 0,
        profitMargin: profitMargin || 0,
        sellingPrice: 0,
        profitAmount: 0
      };
    }

    const sellingPrice = platformBuyingPrice * (1 + profitMargin / 100);
    const profitAmount = sellingPrice - platformBuyingPrice;

    return {
      buyingPrice: platformBuyingPrice,
      profitMargin: profitMargin,
      sellingPrice: Math.round(sellingPrice * 100) / 100, // Round to 2 decimal places
      profitAmount: Math.round(profitAmount * 100) / 100
    };
  },

  async updateProductPlatformAssociation(productId, platformId) {
    const client = await pool.connect();
    try {
      // Validate platform exists and is active
      if (platformId) {
        const platformCheck = await client.query('SELECT id, is_active FROM platforms WHERE id = $1', [platformId]);
        if (platformCheck.rows.length === 0) {
          throw new Error(`Platform with ID ${platformId} does not exist`);
        }
        if (!platformCheck.rows[0].is_active) {
          throw new Error(`Platform ${platformId} is not active`);
        }
      }

      const result = await client.query(`
        UPDATE digital_products
        SET platform_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [productId, platformId]);

      if (result.rows.length === 0) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      const row = result.rows[0];
      return {
        id: row.id,
        platformId: row.platform_id,
        updated: true,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  },

  // Note: Stock Purchases functionality removed as part of platform migration
  // The system now uses platform-based credit management instead of direct purchases

  // Note: All stock purchase methods removed as part of platform migration
  // The system now uses platform-based credit management instead

  // Stock Sales (Updated for Task 11 - Platform Integration)
  async getStockSales() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT s.*,
               p.name as platform_name,
               p.is_active as platform_active,
               ph.payment_history
        FROM stock_sales s
        LEFT JOIN platforms p ON s.platform_id = p.id
        LEFT JOIN (
          SELECT sale_id,
                 JSON_AGG(JSON_BUILD_OBJECT('id', id, 'amount', amount, 'date', date, 'method', method, 'notes', notes) ORDER BY created_at) as payment_history
          FROM payment_history
          GROUP BY sale_id
        ) ph ON s.id = ph.sale_id
        ORDER BY s.sale_date DESC
      `);
      return result.rows.map(row => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        subscriberId: row.subscriber_id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        quantity: row.quantity,
        unitPrice: parseFloat(row.unit_price),
        totalPrice: parseFloat(row.total_price),
        saleDate: row.sale_date,
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        paidAmount: parseFloat(row.paid_amount || 0),
        remainingAmount: parseFloat(row.remaining_amount || 0),
        profit: parseFloat(row.profit || 0),
        // Platform-related fields (Task 11)
        platformId: row.platform_id,
        platformBuyingPrice: parseFloat(row.platform_buying_price || 0),
        paymentType: row.payment_type || 'one-time',
        subscriptionDuration: row.subscription_duration,
        subscriptionStartDate: row.subscription_start_date,
        subscriptionEndDate: row.subscription_end_date,
        // Platform metadata for display
        platformName: row.platform_name,
        platformActive: row.platform_active,
        notes: row.notes,
        paymentHistory: row.payment_history || [],
        createdAt: row.created_at
      }));
    } finally {
      client.release();
    }
  },

  async createStockSale(saleData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First, let's check what columns actually exist in the stock_sales table
      const tableInfo = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'stock_sales'
        ORDER BY ordinal_position
      `);
      console.log('=== STOCK_SALES TABLE SCHEMA ===');
      console.log(tableInfo.rows);

      // Also check if the table exists at all
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'stock_sales'
        )
      `);
      console.log('Table exists:', tableExists.rows[0].exists);

      // Validate platform and check credit balance if platform is specified (Task 11)
      if (saleData.platformId) {
        const platformCheck = await client.query('SELECT id, credit_balance, is_active FROM platforms WHERE id = $1', [saleData.platformId]);
        if (platformCheck.rows.length === 0) {
          throw new Error(`Platform with ID ${saleData.platformId} does not exist`);
        }

        const platform = platformCheck.rows[0];
        if (!platform.is_active) {
          throw new Error(`Platform ${saleData.platformId} is not active`);
        }

        // Check if platform has sufficient credits
        const requiredCredits = (saleData.platformBuyingPrice || 0) * saleData.quantity;
        if (platform.credit_balance < requiredCredits) {
          throw new Error(`Insufficient platform credits. Required: ${requiredCredits}, Available: ${platform.credit_balance}`);
        }
      }

      // Calculate subscription dates if recurring payment
      let subscriptionStartDate = null;
      let subscriptionEndDate = null;
      if (saleData.paymentType === 'recurring' && saleData.subscriptionDuration) {
        subscriptionStartDate = saleData.subscriptionStartDate || new Date().toISOString();
        const endDate = new Date(subscriptionStartDate);
        endDate.setMonth(endDate.getMonth() + saleData.subscriptionDuration);
        subscriptionEndDate = endDate.toISOString();
      }

      const id = saleData.id || generateId();
      const query = `
        INSERT INTO stock_sales (id, product_id, product_name, subscriber_id, customer_name, customer_phone,
                               quantity, unit_price, total_price, sale_date, payment_method, payment_status,
                               paid_amount, remaining_amount, profit, platform_id, platform_buying_price,
                               payment_type, subscription_duration, subscription_start_date, subscription_end_date,
                               notes, created_at)
        VALUES ($1::VARCHAR, $2::VARCHAR, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, 
                $7::INTEGER, $8::DECIMAL, $9::DECIMAL, $10::TIMESTAMP, $11::VARCHAR, $12::VARCHAR,
                $13::DECIMAL, $14::DECIMAL, $15::DECIMAL, $16::VARCHAR, $17::DECIMAL,
                $18::VARCHAR, $19::INTEGER, $20::TIMESTAMP, $21::TIMESTAMP, $22::TEXT, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      // Calculate remaining amount based on payment status
      const paymentStatus = saleData.paymentStatus || 'pending';
      const paidAmount = saleData.paidAmount || 0;
      const totalPrice = saleData.totalPrice;
      let remainingAmount;

      if (saleData.remainingAmount !== undefined) {
        remainingAmount = saleData.remainingAmount;
      } else if (paymentStatus === 'paid') {
        remainingAmount = 0;
      } else {
        remainingAmount = totalPrice - paidAmount;
      }

      // Ensure proper type conversion for PostgreSQL
      const values = [
        id,                                                  // $1: VARCHAR
        saleData.productId || null,                         // $2: VARCHAR
        saleData.productName || null,                       // $3: VARCHAR
        saleData.subscriberId || null,                      // $4: VARCHAR
        saleData.customerName || null,                      // $5: VARCHAR
        saleData.customerPhone || null,                     // $6: VARCHAR
        parseInt(saleData.quantity, 10) || 1,               // $7: INTEGER
        parseFloat(saleData.unitPrice) || 0,                // $8: DECIMAL
        parseFloat(totalPrice) || 0,                        // $9: DECIMAL
        saleData.saleDate || new Date().toISOString(),      // $10: TIMESTAMP
        saleData.paymentMethod || 'cash',                   // $11: VARCHAR
        paymentStatus || 'pending',                         // $12: VARCHAR
        parseFloat(paidAmount) || 0,                        // $13: DECIMAL
        parseFloat(remainingAmount) || 0,                   // $14: DECIMAL
        parseFloat(saleData.profit || 0),                   // $15: DECIMAL
        saleData.platformId || null,                        // $16: VARCHAR
        parseFloat(saleData.platformBuyingPrice || 0),      // $17: DECIMAL
        saleData.paymentType || 'one-time',                 // $18: VARCHAR
        saleData.subscriptionDuration ? parseInt(saleData.subscriptionDuration, 10) : null, // $19: INTEGER
        subscriptionStartDate || null,                      // $20: TIMESTAMP
        subscriptionEndDate || null,                        // $21: TIMESTAMP
        saleData.notes || null                              // $22: TEXT
      ];

      // Debug logging with detailed value inspection
      console.log('=== STOCK SALE CREATION DEBUG ===');
      console.log('Original saleData:', JSON.stringify(saleData, null, 2));
      console.log('Query:', query);
      console.log('Values array length:', values.length);

      // Check each value individually
      values.forEach((value, index) => {
        console.log(`Parameter $${index + 1}:`, {
          value: value,
          type: typeof value,
          isNull: value === null,
          isUndefined: value === undefined,
          constructor: value?.constructor?.name
        });
      });

      // Try a simpler query first to test basic insertion
      try {
        console.log('Testing basic table access...');
        const testQuery = 'SELECT COUNT(*) FROM stock_sales';
        const testResult = await client.query(testQuery);
        console.log('Table access test successful, row count:', testResult.rows[0].count);
      } catch (testError) {
        console.error('Basic table access failed:', testError);
        throw new Error(`Table access failed: ${testError.message}`);
      }

      const result = await client.query(query, values);

      // Deduct credits from platform if platform is specified (Task 11)
      if (saleData.platformId && saleData.platformBuyingPrice > 0) {
        const creditDeduction = saleData.platformBuyingPrice * saleData.quantity;

        // Update platform balance
        await client.query(`
          UPDATE platforms
          SET credit_balance = credit_balance - $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [creditDeduction, saleData.platformId]);

        // Record credit movement
        await client.query(`
          INSERT INTO platform_credit_movements (id, platform_id, type, amount, previous_balance, new_balance,
                                                reference, description, created_by, created_at)
          SELECT $1, $2, 'sale_deduction', $3, credit_balance + $3, credit_balance, $4, $5, $6, CURRENT_TIMESTAMP
          FROM platforms WHERE id = $2
        `, [
          generateId(),
          saleData.platformId,
          creditDeduction,
          id, // sale ID as reference
          `Credit deduction for sale: ${saleData.quantity}x ${saleData.productName}`,
          saleData.createdBy || 'system'
        ]);
      }

      // Add payment history if provided
      if (saleData.paymentHistory && saleData.paymentHistory.length > 0) {
        for (const payment of saleData.paymentHistory) {
          await client.query(`
            INSERT INTO payment_history (id, sale_id, amount, date, method, notes, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          `, [
            payment.id || generateId(),
            id,
            payment.amount,
            payment.date,
            payment.method,
            payment.notes || null
          ]);
        }
      }

      await client.query('COMMIT');
      const row = result.rows[0];
      return {
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        subscriberId: row.subscriber_id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        quantity: row.quantity,
        unitPrice: parseFloat(row.unit_price),
        totalPrice: parseFloat(row.total_price),
        saleDate: row.sale_date,
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        paidAmount: parseFloat(row.paid_amount || 0),
        remainingAmount: parseFloat(row.remaining_amount || 0),
        profit: parseFloat(row.profit || 0),
        // Platform-related fields (Task 11)
        platformId: row.platform_id,
        platformBuyingPrice: parseFloat(row.platform_buying_price || 0),
        paymentType: row.payment_type || 'one-time',
        subscriptionDuration: row.subscription_duration,
        subscriptionStartDate: row.subscription_start_date,
        subscriptionEndDate: row.subscription_end_date,
        notes: row.notes,
        paymentHistory: saleData.paymentHistory || [],
        createdAt: row.created_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateStockSale(saleId, saleData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Calculate subscription dates if recurring payment (Task 11)
      let subscriptionStartDate = saleData.subscriptionStartDate;
      let subscriptionEndDate = saleData.subscriptionEndDate;
      if (saleData.paymentType === 'recurring' && saleData.subscriptionDuration) {
        if (!subscriptionStartDate) {
          subscriptionStartDate = new Date().toISOString();
        }
        const endDate = new Date(subscriptionStartDate);
        endDate.setMonth(endDate.getMonth() + saleData.subscriptionDuration);
        subscriptionEndDate = endDate.toISOString();
      }

      const query = `
        UPDATE stock_sales
        SET product_id = $2, product_name = $3, subscriber_id = $4, customer_name = $5, customer_phone = $6,
            quantity = $7, unit_price = $8, total_price = $9, sale_date = $10, payment_method = $11,
            payment_status = $12, paid_amount = $13, remaining_amount = $14, profit = $15,
            platform_id = $16, platform_buying_price = $17, payment_type = $18,
            subscription_duration = $19, subscription_start_date = $20, subscription_end_date = $21, notes = $22
        WHERE id = $1
        RETURNING *
      `;
      const values = [
        saleId,
        saleData.productId,
        saleData.productName,
        saleData.subscriberId || null,
        saleData.customerName || null,
        saleData.customerPhone || null,
        saleData.quantity,
        saleData.unitPrice,
        saleData.totalPrice,
        saleData.saleDate,
        saleData.paymentMethod,
        saleData.paymentStatus,
        saleData.paidAmount || 0,
        saleData.remainingAmount || 0,
        saleData.profit || 0,
        saleData.platformId || null,
        saleData.platformBuyingPrice || 0,
        saleData.paymentType || 'one-time',
        saleData.subscriptionDuration || null,
        subscriptionStartDate,
        subscriptionEndDate,
        saleData.notes || null
      ];
      const result = await client.query(query, values);
      
      // Update payment history if provided
      if (saleData.paymentHistory) {
        // Delete existing payment history
        await client.query('DELETE FROM payment_history WHERE sale_id = $1', [saleId]);
        
        // Insert new payment history
        for (const payment of saleData.paymentHistory) {
          await client.query(`
            INSERT INTO payment_history (id, sale_id, amount, date, method, notes, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          `, [
            payment.id || generateId(),
            saleId,
            payment.amount,
            payment.date,
            payment.method,
            payment.notes || null
          ]);
        }
      }
      
      await client.query('COMMIT');
      const row = result.rows[0];
      return {
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        subscriberId: row.subscriber_id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        quantity: row.quantity,
        unitPrice: parseFloat(row.unit_price),
        totalPrice: parseFloat(row.total_price),
        saleDate: row.sale_date,
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        paidAmount: parseFloat(row.paid_amount || 0),
        remainingAmount: parseFloat(row.remaining_amount || 0),
        profit: parseFloat(row.profit || 0),
        // Platform-related fields (Task 11)
        platformId: row.platform_id,
        platformBuyingPrice: parseFloat(row.platform_buying_price || 0),
        paymentType: row.payment_type || 'one-time',
        subscriptionDuration: row.subscription_duration,
        subscriptionStartDate: row.subscription_start_date,
        subscriptionEndDate: row.subscription_end_date,
        notes: row.notes,
        paymentHistory: saleData.paymentHistory || [],
        createdAt: row.created_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async deleteStockSale(saleId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM payment_history WHERE sale_id = $1', [saleId]);
      await client.query('DELETE FROM stock_sales WHERE id = $1', [saleId]);
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Stock Movements
  async getStockMovements() {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM stock_movements ORDER BY date DESC');
      return result.rows.map(row => ({
        id: row.id,
        productId: row.product_id,
        type: row.type,
        quantity: row.quantity,
        previousStock: row.previous_stock,
        newStock: row.new_stock,
        reference: row.reference,
        date: row.date,
        notes: row.notes
      }));
    } finally {
      client.release();
    }
  },

  async createStockMovement(movementData) {
    const client = await pool.connect();
    try {
      const id = movementData.id || generateId();
      const query = `
        INSERT INTO stock_movements (id, product_id, type, quantity, previous_stock, new_stock, reference, date, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const values = [
        id,
        movementData.productId,
        movementData.type,
        movementData.quantity,
        movementData.previousStock,
        movementData.newStock,
        movementData.reference || null,
        movementData.date || new Date().toISOString(),
        movementData.notes || null
      ];
      const result = await client.query(query, values);
      const row = result.rows[0];
      return {
        id: row.id,
        productId: row.product_id,
        type: row.type,
        quantity: row.quantity,
        previousStock: row.previous_stock,
        newStock: row.new_stock,
        reference: row.reference,
        date: row.date,
        notes: row.notes
      };
    } finally {
      client.release();
    }
  },

  // Settings
  async getSettings() {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT settings FROM app_settings WHERE id = $1', ['main']);
      return result.rows[0]?.settings || {};
    } finally {
      client.release();
    }
  },

  async updateSettings(settings) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO app_settings (id, settings, updated_at)
        VALUES ('main', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (id)
        DO UPDATE SET settings = $1, updated_at = CURRENT_TIMESTAMP
        RETURNING settings
      `;
      const result = await client.query(query, [JSON.stringify(settings)]);
      return result.rows[0].settings;
    } finally {
      client.release();
    }
  },

  // Platforms
  async getPlatforms(queryParams = {}) {
    const client = await pool.connect();
    try {
      // Validate query parameters
      const validation = validateQueryParams(querySchemas.pagination, queryParams);
      if (!validation.isValid) {
        throw new Error(`Invalid query parameters: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const { page, limit, search, sortBy, sortOrder, isActive } = validation.data;
      const offset = (page - 1) * limit;

      // Build query with filters
      let whereClause = '';
      let queryValues = [];
      let paramIndex = 1;

      const conditions = [];

      if (search) {
        conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
        queryValues.push(`%${search}%`);
        paramIndex++;
      }

      if (isActive !== undefined) {
        conditions.push(`is_active = $${paramIndex}`);
        queryValues.push(isActive);
        paramIndex++;
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM platforms ${whereClause}`;
      const countResult = await client.query(countQuery, queryValues);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const dataQuery = `
        SELECT * FROM platforms
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryValues.push(limit, offset);

      const result = await client.query(dataQuery, queryValues);

      const platforms = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        creditBalance: parseFloat(row.credit_balance || 0),
        lowBalanceThreshold: parseFloat(row.low_balance_threshold || 100),
        isActive: row.is_active,
        metadata: row.metadata || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return formatSuccessResponse(platforms, {
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          search,
          isActive,
          sortBy,
          sortOrder
        }
      });
    } finally {
      client.release();
    }
  },

  async getPlatform(platformId) {
    const client = await pool.connect();
    try {
      // Validate platform ID
      const validation = validatePlatformId(platformId);
      if (!validation.isValid) {
        throw new Error(validation.errors[0].message);
      }

      const result = await client.query('SELECT * FROM platforms WHERE id = $1', [platformId]);

      if (result.rows.length === 0) {
        return formatErrorResponse('Platform not found', 404);
      }

      const row = result.rows[0];
      const platform = {
        id: row.id,
        name: row.name,
        description: row.description,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        creditBalance: parseFloat(row.credit_balance || 0),
        lowBalanceThreshold: parseFloat(row.low_balance_threshold || 100),
        isActive: row.is_active,
        metadata: row.metadata || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      return formatSuccessResponse(platform);
    } finally {
      client.release();
    }
  },

  async createPlatform(platformData, user = null) {
    // Validate input data
    const validation = validateData(platformSchemas.create, platformData);
    if (!validation.isValid) {
      return formatValidationError(validation);
    }

    const client = await pool.connect();
    try {
      const validatedData = validation.data;
      const id = generateId();

      // Check for duplicate platform name
      const existingPlatform = await client.query('SELECT id FROM platforms WHERE name = $1', [validatedData.name]);
      if (existingPlatform.rows.length > 0) {
        return formatErrorResponse('Platform name already exists', 409);
      }

      const query = `
        INSERT INTO platforms (id, name, description, contact_name, contact_email, contact_phone,
                             credit_balance, low_balance_threshold, is_active, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const values = [
        id,
        validatedData.name,
        validatedData.description || null,
        validatedData.contactName || null,
        validatedData.contactEmail || null,
        validatedData.contactPhone || null,
        validatedData.creditBalance,
        validatedData.lowBalanceThreshold,
        validatedData.isActive,
        JSON.stringify(validatedData.metadata)
      ];

      const result = await client.query(query, values);
      const row = result.rows[0];

      const platform = {
        id: row.id,
        name: row.name,
        description: row.description,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        creditBalance: parseFloat(row.credit_balance || 0),
        lowBalanceThreshold: parseFloat(row.low_balance_threshold || 100),
        isActive: row.is_active,
        metadata: row.metadata || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      return formatSuccessResponse(platform, {
        message: 'Platform created successfully',
        createdBy: user?.id || 'system'
      });
    } finally {
      client.release();
    }
  },

  async updatePlatform(platformId, platformData) {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE platforms
        SET name = $2, description = $3, contact_name = $4, contact_email = $5, contact_phone = $6,
            credit_balance = $7, low_balance_threshold = $8, is_active = $9, metadata = $10, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const values = [
        platformId,
        platformData.name,
        platformData.description || null,
        platformData.contactName || null,
        platformData.contactEmail || null,
        platformData.contactPhone || null,
        platformData.creditBalance || 0,
        platformData.lowBalanceThreshold || 100,
        platformData.isActive !== false,
        JSON.stringify(platformData.metadata || {})
      ];
      const result = await client.query(query, values);
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        creditBalance: parseFloat(row.credit_balance || 0),
        lowBalanceThreshold: parseFloat(row.low_balance_threshold || 100),
        isActive: row.is_active,
        metadata: row.metadata || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  },

  async deletePlatform(platformId) {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM platforms WHERE id = $1', [platformId]);
      return { success: true };
    } finally {
      client.release();
    }
  },

  // Platform Credit Operations (using CreditManagementService)
  async addPlatformCredit(platformId, amount, description, createdBy) {
    return await creditService.addCredits(platformId, amount, description, 'manual', null, createdBy);
  },

  async deductPlatformCredit(platformId, amount, description, createdBy, reference) {
    const referenceType = reference ? 'sale' : 'manual';
    return await creditService.deductCredits(platformId, amount, description, referenceType, reference, createdBy);
  },

  async getPlatformCreditMovements(platformId, filters = {}) {
    return await creditService.getCreditMovements(platformId, filters);
  },

  async getPlatformsWithLowBalance() {
    return await creditService.getPlatformsWithLowBalance();
  },

  // Additional credit service methods
  async getPlatformBalance(platformId) {
    return await creditService.getBalance(platformId);
  },

  async adjustPlatformBalance(platformId, adjustmentAmount, reason, createdBy) {
    return await creditService.adjustBalance(platformId, adjustmentAmount, reason, createdBy);
  }
};

exports.handler = async (event, context) => {
  // Check for initialization errors first
  if (initError) {
    console.error('Database connection error:', initError);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Database connection failed',
        message: initError.message,
        details: 'Please check your database connection string and network connectivity.'
      })
    };
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { httpMethod, path, body, queryStringParameters } = event;
    const pathParts = path.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1]; // specific action

    // Extract query parameters
    const queryParams = queryStringParameters || {};

    let data = {};
    if (body) {
      try {
        data = JSON.parse(body);
      } catch (parseError) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }
    }

    // Get user from authentication (for operations that need it)
    const user = getUserFromEvent(event);

    let result;

    switch (action) {
      // Users
      case 'users':
        if (httpMethod === 'GET') {
          result = await dbOperations.getUsers();
        } else if (httpMethod === 'POST') {
          result = await dbOperations.createUser(data);
        }
        break;

      case 'user':
        if (httpMethod === 'PUT') {
          result = await dbOperations.updateUser(data.id, data);
        } else if (httpMethod === 'DELETE') {
          result = await dbOperations.deleteUser(data.id);
        }
        break;

      // Subscribers
      case 'subscribers':
        if (httpMethod === 'GET') {
          result = await dbOperations.getSubscribers();
        } else if (httpMethod === 'POST') {
          result = await dbOperations.createSubscriber(data);
        }
        break;

      case 'subscriber':
        if (httpMethod === 'PUT') {
          result = await dbOperations.updateSubscriber(data.id, data);
        } else if (httpMethod === 'DELETE') {
          result = await dbOperations.deleteSubscriber(data.id);
        }
        break;

      // Digital Products (Enhanced for Task 10 - Platform Integration)
      case 'digital-products':
        if (httpMethod === 'GET') {
          // Apply rate limiting for product data access
          const rateLimitResult = rateLimit(150, 60000)(event);
          if (!rateLimitResult.allowed) {
            return {
              statusCode: rateLimitResult.statusCode,
              headers: { ...corsHeaders, ...rateLimitResult.headers },
              body: JSON.stringify({ error: rateLimitResult.error })
            };
          }

          // Check authentication for reading products
          const authResult = requireAuth('products-read')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Support filtering by platform, category, and active status
          const filters = {
            platformId: queryParams.platformId,
            category: queryParams.category,
            isActive: queryParams.isActive !== undefined ? queryParams.isActive === 'true' : undefined
          };

          // Get products with platform information
          let products = await dbOperations.getDigitalProducts();

          // Apply filters
          if (filters.platformId) {
            products = products.filter(p => p.platformId === filters.platformId);
          }
          if (filters.category) {
            products = products.filter(p => p.category === filters.category);
          }
          if (filters.isActive !== undefined) {
            products = products.filter(p => p.isActive === filters.isActive);
          }

          result = products;
        } else if (httpMethod === 'POST') {
          // Check authentication for product creation
          const authResult = requireAuth('products-create')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Validate product data with platform support (Task 10)
          const validation = validateData(productSchemas.create, data);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          // Additional platform-specific validation
          if (validation.data.platformId) {
            // Verify platform exists and is active
            const platformResult = await dbOperations.getPlatform(validation.data.platformId);
            if (platformResult.statusCode === 404) {
              return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                  error: 'Invalid platform',
                  details: `Platform with ID ${validation.data.platformId} does not exist`
                })
              };
            }

            if (!platformResult.data.isActive) {
              return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                  error: 'Inactive platform',
                  details: `Platform ${validation.data.platformId} is not active`
                })
              };
            }
          }

          result = await dbOperations.createDigitalProduct(validation.data);
        }
        break;

      case 'digital-product':
        if (httpMethod === 'GET') {
          // GET /api/digital-product/:id - Get individual product details (Task 10)
          const productId = pathParts[pathParts.length - 1];
          if (!productId) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Product ID is required' })
            };
          }

          // Check authentication for reading products
          const authResult = requireAuth('products-read')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Get product with platform information
          const products = await dbOperations.getDigitalProducts();
          const product = products.find(p => p.id === productId);

          if (!product) {
            return {
              statusCode: 404,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Product not found' })
            };
          }

          result = product;
        } else if (httpMethod === 'PUT') {
          // Check authentication for product updates
          const authResult = requireAuth('products-update')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Validate product update data with platform support (Task 10)
          const validation = validateData(productSchemas.update, data);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          // Additional platform-specific validation for updates
          if (validation.data.platformId) {
            const platformResult = await dbOperations.getPlatform(validation.data.platformId);
            if (platformResult.statusCode === 404) {
              return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                  error: 'Invalid platform',
                  details: `Platform with ID ${validation.data.platformId} does not exist`
                })
              };
            }

            if (!platformResult.data.isActive) {
              return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                  error: 'Inactive platform',
                  details: `Platform ${validation.data.platformId} is not active`
                })
              };
            }
          }

          result = await dbOperations.updateDigitalProduct(validation.data.id, validation.data);
        } else if (httpMethod === 'DELETE') {
          // Check authentication for product deletion
          const authResult = requireAuth('products-delete')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          if (!data.id) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Product ID is required for deletion' })
            };
          }

          result = await dbOperations.deleteDigitalProduct(data.id);
        }
        break;

      // Note: Stock Purchases endpoints removed as part of platform migration
      // These endpoints now return 404 - use platform credit management instead

      // Stock Sales (Enhanced for Task 12 - Platform Integration)
      case 'stock-sales':
        if (httpMethod === 'GET') {
          // Apply rate limiting for sales data access
          const rateLimitResult = rateLimit(200, 60000)(event);
          if (!rateLimitResult.allowed) {
            return {
              statusCode: rateLimitResult.statusCode,
              headers: { ...corsHeaders, ...rateLimitResult.headers },
              body: JSON.stringify({ error: rateLimitResult.error })
            };
          }

          result = await dbOperations.getStockSales();
        } else if (httpMethod === 'POST') {
          // Check authentication for sales creation
          const authResult = requireAuth('sales-create')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Validate sales data with platform support (Task 12)
          const validation = validateData(salesSchemas.create, data);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          // Additional platform-specific validation
          if (validation.data.platformId) {
            // Verify platform exists and is active
            const platformResult = await dbOperations.getPlatform(validation.data.platformId);
            if (platformResult.statusCode === 404) {
              return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                  error: 'Invalid platform',
                  details: `Platform with ID ${validation.data.platformId} does not exist`
                })
              };
            }

            // Check if platform has sufficient credits
            const requiredCredits = validation.data.platformBuyingPrice * validation.data.quantity;
            if (platformResult.data.creditBalance < requiredCredits) {
              return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                  error: 'Insufficient platform credits',
                  details: `Required: ${requiredCredits} DZD, Available: ${platformResult.data.creditBalance} DZD`
                })
              };
            }
          }

          result = await dbOperations.createStockSale(validation.data);
        }
        break;

      case 'stock-sale':
        if (httpMethod === 'GET') {
          // GET /api/stock-sale/:id - Get individual sale details (Task 12)
          const saleId = pathParts[pathParts.length - 1];
          if (!saleId) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Sale ID is required' })
            };
          }

          // Check authentication for reading sales
          const authResult = requireAuth('sales-read')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Get sale with platform information
          const sales = await dbOperations.getStockSales();
          const sale = sales.find(s => s.id === saleId);

          if (!sale) {
            return {
              statusCode: 404,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Sale not found' })
            };
          }

          result = sale;
        } else if (httpMethod === 'PUT') {
          // Check authentication for sales updates
          const authResult = requireAuth('sales-update')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Validate sales update data with platform support (Task 12)
          const validation = validateData(salesSchemas.update, data);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          // Additional platform-specific validation for updates
          if (validation.data.platformId) {
            const platformResult = await dbOperations.getPlatform(validation.data.platformId);
            if (platformResult.statusCode === 404) {
              return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                  error: 'Invalid platform',
                  details: `Platform with ID ${validation.data.platformId} does not exist`
                })
              };
            }
          }

          result = await dbOperations.updateStockSale(validation.data.id, validation.data);
        } else if (httpMethod === 'DELETE') {
          // Check authentication for sales deletion
          const authResult = requireAuth('sales-delete')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          if (!data.id) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Sale ID is required for deletion' })
            };
          }

          result = await dbOperations.deleteStockSale(data.id);
        }
        break;

      // Sales Analytics and Platform Integration Endpoints (Task 12)
      case 'sales-analytics':
        if (httpMethod === 'GET') {
          // Check authentication for analytics access
          const authResult = requireAuth('sales-analytics')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Get sales with platform analytics
          const sales = await dbOperations.getStockSales();

          // Calculate analytics
          const analytics = {
            totalSales: sales.length,
            totalRevenue: sales.reduce((sum, sale) => sum + sale.totalPrice, 0),
            totalProfit: sales.reduce((sum, sale) => sum + sale.profit, 0),
            platformSales: sales.filter(sale => sale.platformId).length,
            traditionalSales: sales.filter(sale => !sale.platformId).length,
            recurringSales: sales.filter(sale => sale.paymentType === 'recurring').length,
            platformBreakdown: {},
            paymentMethodBreakdown: {},
            profitMargins: {
              average: 0,
              platform: 0,
              traditional: 0
            }
          };

          // Platform breakdown
          sales.forEach(sale => {
            if (sale.platformId) {
              const platformName = sale.platformName || sale.platformId;
              if (!analytics.platformBreakdown[platformName]) {
                analytics.platformBreakdown[platformName] = {
                  sales: 0,
                  revenue: 0,
                  profit: 0,
                  creditUsed: 0
                };
              }
              analytics.platformBreakdown[platformName].sales++;
              analytics.platformBreakdown[platformName].revenue += sale.totalPrice;
              analytics.platformBreakdown[platformName].profit += sale.profit;
              analytics.platformBreakdown[platformName].creditUsed += sale.platformBuyingPrice * sale.quantity;
            }
          });

          // Payment method breakdown
          sales.forEach(sale => {
            if (!analytics.paymentMethodBreakdown[sale.paymentMethod]) {
              analytics.paymentMethodBreakdown[sale.paymentMethod] = {
                sales: 0,
                revenue: 0
              };
            }
            analytics.paymentMethodBreakdown[sale.paymentMethod].sales++;
            analytics.paymentMethodBreakdown[sale.paymentMethod].revenue += sale.totalPrice;
          });

          // Calculate profit margins
          if (analytics.totalRevenue > 0) {
            analytics.profitMargins.average = (analytics.totalProfit / analytics.totalRevenue * 100).toFixed(2);
          }

          const platformSales = sales.filter(sale => sale.platformId);
          if (platformSales.length > 0) {
            const platformRevenue = platformSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
            const platformProfit = platformSales.reduce((sum, sale) => sum + sale.profit, 0);
            analytics.profitMargins.platform = (platformProfit / platformRevenue * 100).toFixed(2);
          }

          const traditionalSales = sales.filter(sale => !sale.platformId);
          if (traditionalSales.length > 0) {
            const traditionalRevenue = traditionalSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
            const traditionalProfit = traditionalSales.reduce((sum, sale) => sum + sale.profit, 0);
            analytics.profitMargins.traditional = (traditionalProfit / traditionalRevenue * 100).toFixed(2);
          }

          result = analytics;
        }
        break;

      case 'sales-platform-summary':
        if (httpMethod === 'GET') {
          // Check authentication for platform summary access
          const authResult = requireAuth('sales-read')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Get platform-specific sales summary
          const platformId = queryParams.platformId;
          if (!platformId) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Platform ID is required as query parameter' })
            };
          }

          const sales = await dbOperations.getStockSales();
          const platformSales = sales.filter(sale => sale.platformId === platformId);

          const summary = {
            platformId,
            totalSales: platformSales.length,
            totalRevenue: platformSales.reduce((sum, sale) => sum + sale.totalPrice, 0),
            totalProfit: platformSales.reduce((sum, sale) => sum + sale.profit, 0),
            totalCreditsUsed: platformSales.reduce((sum, sale) => sum + (sale.platformBuyingPrice * sale.quantity), 0),
            recurringSales: platformSales.filter(sale => sale.paymentType === 'recurring').length,
            averageOrderValue: platformSales.length > 0 ?
              (platformSales.reduce((sum, sale) => sum + sale.totalPrice, 0) / platformSales.length).toFixed(2) : 0,
            profitMargin: platformSales.length > 0 ?
              ((platformSales.reduce((sum, sale) => sum + sale.profit, 0) /
                platformSales.reduce((sum, sale) => sum + sale.totalPrice, 0)) * 100).toFixed(2) : 0,
            recentSales: platformSales
              .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
              .slice(0, 10)
          };

          result = summary;
        }
        break;

      // Stock Movements
      case 'stock-movements':
        if (httpMethod === 'GET') {
          result = await dbOperations.getStockMovements();
        } else if (httpMethod === 'POST') {
          result = await dbOperations.createStockMovement(data);
        }
        break;

      // Platforms
      case 'platforms':
        if (httpMethod === 'GET') {
          // Apply rate limiting
          const rateLimitResult = rateLimit(100, 60000)(event);
          if (!rateLimitResult.allowed) {
            return {
              statusCode: rateLimitResult.statusCode,
              headers: { ...corsHeaders, ...rateLimitResult.headers },
              body: JSON.stringify({ error: rateLimitResult.error })
            };
          }

          result = await dbOperations.getPlatforms(queryParams);
        } else if (httpMethod === 'POST') {
          // Check authentication for create operations
          const authResult = requireAuth('platforms-create')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          result = await dbOperations.createPlatform(data, user);
        }
        break;

      case 'platform':
        // Handle GET /platforms/:id (individual platform details)
        if (httpMethod === 'GET') {
          const platformId = pathParts[pathParts.length - 2]; // Get platform ID from path
          if (!platformId) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Platform ID is required' })
            };
          }
          result = await dbOperations.getPlatform(platformId);
        } else if (httpMethod === 'PUT') {
          // Check authentication for update operations
          const authResult = requireAuth('platforms-update')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          result = await dbOperations.updatePlatform(data.id, data, user);
        } else if (httpMethod === 'DELETE') {
          // Check authentication for delete operations
          const authResult = requireAuth('platforms-delete')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          result = await dbOperations.deletePlatform(data.id, user);
        }
        break;

      case 'platform-credit-add':
        if (httpMethod === 'POST') {
          // Check authentication for credit operations
          const authResult = requireAuth('platform-credits-add')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Validate credit add data
          const validation = validateData(platformSchemas.creditAdd, data);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          result = await dbOperations.addPlatformCredit(
            validation.data.platformId,
            validation.data.amount,
            validation.data.description,
            validation.data.createdBy || user?.id
          );
        }
        break;

      case 'platform-credit-deduct':
        if (httpMethod === 'POST') {
          // Check authentication for credit operations
          const authResult = requireAuth('platform-credits-deduct')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Validate credit deduct data
          const validation = validateData(platformSchemas.creditDeduct, data);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          result = await dbOperations.deductPlatformCredit(
            validation.data.platformId,
            validation.data.amount,
            validation.data.description,
            validation.data.createdBy || user?.id,
            validation.data.reference
          );
        }
        break;

      case 'platform-credit-movements':
        if (httpMethod === 'GET') {
          // Check authentication for reading credit movements
          const authResult = requireAuth('platform-movements-read')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          const platformId = pathParts[pathParts.length - 2]; // Get platform ID from path
          if (!platformId) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Platform ID is required' })
            };
          }

          // Validate query parameters for credit movements
          const validation = validateQueryParams(querySchemas.creditMovements, queryParams);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          result = await dbOperations.getPlatformCreditMovements(platformId, validation.data);
        }
        break;

      case 'platforms-low-balance':
        if (httpMethod === 'GET') {
          // Check authentication for reading platform data
          const authResult = requireAuth('platforms-read')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          result = await dbOperations.getPlatformsWithLowBalance();
        }
        break;

      case 'platform-balance':
        if (httpMethod === 'GET') {
          // Check authentication for reading balance
          const authResult = requireAuth('platform-balance-read')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          const platformId = pathParts[pathParts.length - 2]; // Get platform ID from path
          if (!platformId) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Platform ID is required' })
            };
          }

          result = await dbOperations.getPlatformBalance(platformId);
        }
        break;

      case 'platform-balance-adjust':
        if (httpMethod === 'POST') {
          // Check authentication for balance adjustments (admin only)
          const authResult = requireAuth('platform-balance-adjust')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Validate balance adjustment data
          const validation = validateData(platformSchemas.balanceAdjust, data);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          result = await dbOperations.adjustPlatformBalance(
            validation.data.platformId,
            validation.data.adjustmentAmount,
            validation.data.reason,
            validation.data.createdBy || user?.id
          );
        }
        break;

      // RESTful Credit Management Endpoints (Task 8)
      // POST /api/platforms/:id/credits - Add credits
      case 'credits':
        if (httpMethod === 'POST') {
          // Check authentication for credit operations
          const authResult = requireAuth('platform-credits-add')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Extract platform ID from path: /api/platforms/:id/credits
          const platformId = pathParts[pathParts.length - 2]; // Get platform ID from path
          if (!platformId) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Platform ID is required in URL path' })
            };
          }

          // Validate credit add data (amount and description required)
          if (!data.amount || data.amount <= 0) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Amount is required and must be positive' })
            };
          }

          if (!data.description || data.description.trim().length === 0) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Description is required' })
            };
          }

          result = await dbOperations.addPlatformCredit(
            platformId,
            data.amount,
            data.description,
            data.createdBy || user?.id
          );
        }
        break;

      // POST /api/platforms/:id/credits/deduct - Deduct credits
      case 'deduct':
        if (httpMethod === 'POST') {
          // Check authentication for credit operations
          const authResult = requireAuth('platform-credits-deduct')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Extract platform ID from path: /api/platforms/:id/credits/deduct
          const platformId = pathParts[pathParts.length - 3]; // Get platform ID from path
          if (!platformId) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Platform ID is required in URL path' })
            };
          }

          // Validate credit deduct data
          if (!data.amount || data.amount <= 0) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Amount is required and must be positive' })
            };
          }

          if (!data.description || data.description.trim().length === 0) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Description is required' })
            };
          }

          result = await dbOperations.deductPlatformCredit(
            platformId,
            data.amount,
            data.description,
            data.createdBy || user?.id,
            data.reference || null
          );
        }
        break;

      // GET /api/platforms/:id/credits/balance - Get current balance
      case 'balance':
        if (httpMethod === 'GET') {
          // Check authentication for reading balance
          const authResult = requireAuth('platform-balance-read')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Extract platform ID from path: /api/platforms/:id/credits/balance
          const platformId = pathParts[pathParts.length - 3]; // Get platform ID from path
          if (!platformId) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Platform ID is required in URL path' })
            };
          }

          result = await dbOperations.getPlatformBalance(platformId);
        }
        break;

      // GET /api/platforms/:id/credits/movements - Get credit movement history
      case 'movements':
        if (httpMethod === 'GET') {
          // Check authentication for reading credit movements
          const authResult = requireAuth('platform-movements-read')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Extract platform ID from path: /api/platforms/:id/credits/movements
          const platformId = pathParts[pathParts.length - 3]; // Get platform ID from path
          if (!platformId) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Platform ID is required in URL path' })
            };
          }

          // Validate query parameters for credit movements
          const validation = validateQueryParams(querySchemas.creditMovements, queryParams);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          result = await dbOperations.getPlatformCreditMovements(platformId, validation.data);
        }
        break;

      // Platform-specific product operations (Task 9)
      // GET /api/platforms/:id/products - Get products for a specific platform
      case 'products':
        if (httpMethod === 'GET') {
          // Check authentication for reading products
          const authResult = requireAuth('products-read')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Extract platform ID from path: /api/platforms/:id/products
          const platformId = pathParts[pathParts.length - 2]; // Get platform ID from path
          if (!platformId) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Platform ID is required in URL path' })
            };
          }

          result = await dbOperations.getProductsByPlatform(platformId);
        }
        break;

      // POST /api/product-pricing-calculate - Calculate product pricing (Enhanced for Task 10)
      case 'product-pricing-calculate':
        if (httpMethod === 'POST') {
          // Check authentication for pricing calculations
          const authResult = requireAuth('products-read')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Validate pricing calculation data with enhanced validation (Task 10)
          const validation = validateData(productSchemas.pricingCalculation, data);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          result = await dbOperations.calculateProductPricing(validation.data.platformBuyingPrice, validation.data.profitMargin);
        }
        break;

      // PUT /api/product-platform-association - Update product platform association (Enhanced for Task 10)
      case 'product-platform-association':
        if (httpMethod === 'PUT') {
          // Check authentication for product updates
          const authResult = requireAuth('products-update')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Validate product platform association data with enhanced validation (Task 10)
          const validation = validateData(productSchemas.platformAssociation, data);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          // Additional platform validation if platformId is provided
          if (validation.data.platformId) {
            const platformResult = await dbOperations.getPlatform(validation.data.platformId);
            if (platformResult.statusCode === 404) {
              return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                  error: 'Invalid platform',
                  details: `Platform with ID ${validation.data.platformId} does not exist`
                })
              };
            }

            if (!platformResult.data.isActive) {
              return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                  error: 'Inactive platform',
                  details: `Platform ${validation.data.platformId} is not active`
                })
              };
            }
          }

          result = await dbOperations.updateProductPlatformAssociation(validation.data.productId, validation.data.platformId);
        }
        break;

      // Product Analytics and Insights Endpoints (Task 10)
      case 'product-analytics':
        if (httpMethod === 'GET') {
          // Check authentication for analytics access
          const authResult = requireAuth('products-analytics')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Get products with platform analytics
          const products = await dbOperations.getDigitalProducts();

          // Calculate analytics
          const analytics = {
            totalProducts: products.length,
            activeProducts: products.filter(p => p.isActive).length,
            inactiveProducts: products.filter(p => !p.isActive).length,
            platformProducts: products.filter(p => p.platformId).length,
            traditionalProducts: products.filter(p => !p.platformId).length,
            lowStockProducts: products.filter(p => p.currentStock <= p.minStockAlert).length,
            categoryBreakdown: {},
            platformBreakdown: {},
            stockAnalysis: {
              totalStock: products.reduce((sum, p) => sum + p.currentStock, 0),
              averageStock: products.length > 0 ? (products.reduce((sum, p) => sum + p.currentStock, 0) / products.length).toFixed(2) : 0,
              lowStockCount: products.filter(p => p.currentStock <= p.minStockAlert).length,
              outOfStockCount: products.filter(p => p.currentStock === 0).length
            },
            pricingAnalysis: {
              averageSellPrice: products.length > 0 ? (products.reduce((sum, p) => sum + p.suggestedSellPrice, 0) / products.length).toFixed(2) : 0,
              averagePlatformPrice: 0,
              averageMargin: 0
            }
          };

          // Category breakdown
          products.forEach(product => {
            if (!analytics.categoryBreakdown[product.category]) {
              analytics.categoryBreakdown[product.category] = {
                count: 0,
                active: 0,
                totalStock: 0,
                averagePrice: 0
              };
            }
            analytics.categoryBreakdown[product.category].count++;
            if (product.isActive) analytics.categoryBreakdown[product.category].active++;
            analytics.categoryBreakdown[product.category].totalStock += product.currentStock;
          });

          // Calculate average prices for categories
          Object.keys(analytics.categoryBreakdown).forEach(category => {
            const categoryProducts = products.filter(p => p.category === category);
            analytics.categoryBreakdown[category].averagePrice = categoryProducts.length > 0 ?
              (categoryProducts.reduce((sum, p) => sum + p.suggestedSellPrice, 0) / categoryProducts.length).toFixed(2) : 0;
          });

          // Platform breakdown
          products.forEach(product => {
            if (product.platformId) {
              const platformName = product.platformName || product.platformId;
              if (!analytics.platformBreakdown[platformName]) {
                analytics.platformBreakdown[platformName] = {
                  count: 0,
                  active: 0,
                  totalStock: 0,
                  averageBuyingPrice: 0,
                  averageMargin: 0
                };
              }
              analytics.platformBreakdown[platformName].count++;
              if (product.isActive) analytics.platformBreakdown[platformName].active++;
              analytics.platformBreakdown[platformName].totalStock += product.currentStock;
            }
          });

          // Calculate platform averages
          Object.keys(analytics.platformBreakdown).forEach(platformName => {
            const platformProducts = products.filter(p => (p.platformName || p.platformId) === platformName);
            if (platformProducts.length > 0) {
              analytics.platformBreakdown[platformName].averageBuyingPrice =
                (platformProducts.reduce((sum, p) => sum + (p.platformBuyingPrice || 0), 0) / platformProducts.length).toFixed(2);
              analytics.platformBreakdown[platformName].averageMargin =
                (platformProducts.reduce((sum, p) => sum + (p.profitMargin || 0), 0) / platformProducts.length).toFixed(2);
            }
          });

          // Platform pricing analysis
          const platformProducts = products.filter(p => p.platformId && p.platformBuyingPrice > 0);
          if (platformProducts.length > 0) {
            analytics.pricingAnalysis.averagePlatformPrice =
              (platformProducts.reduce((sum, p) => sum + p.platformBuyingPrice, 0) / platformProducts.length).toFixed(2);
            analytics.pricingAnalysis.averageMargin =
              (platformProducts.reduce((sum, p) => sum + (p.profitMargin || 0), 0) / platformProducts.length).toFixed(2);
          }

          result = analytics;
        }
        break;

      case 'product-platform-summary':
        if (httpMethod === 'GET') {
          // Check authentication for platform summary access
          const authResult = requireAuth('products-read')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Get platform-specific product summary
          const platformId = queryParams.platformId;
          if (!platformId) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Platform ID is required as query parameter' })
            };
          }

          const products = await dbOperations.getDigitalProducts();
          const platformProducts = products.filter(p => p.platformId === platformId);

          const summary = {
            platformId,
            totalProducts: platformProducts.length,
            activeProducts: platformProducts.filter(p => p.isActive).length,
            inactiveProducts: platformProducts.filter(p => !p.isActive).length,
            totalStock: platformProducts.reduce((sum, p) => sum + p.currentStock, 0),
            lowStockProducts: platformProducts.filter(p => p.currentStock <= p.minStockAlert).length,
            averageBuyingPrice: platformProducts.length > 0 ?
              (platformProducts.reduce((sum, p) => sum + (p.platformBuyingPrice || 0), 0) / platformProducts.length).toFixed(2) : 0,
            averageMargin: platformProducts.length > 0 ?
              (platformProducts.reduce((sum, p) => sum + (p.profitMargin || 0), 0) / platformProducts.length).toFixed(2) : 0,
            averageSellPrice: platformProducts.length > 0 ?
              (platformProducts.reduce((sum, p) => sum + p.suggestedSellPrice, 0) / platformProducts.length).toFixed(2) : 0,
            categoryBreakdown: {},
            recentProducts: platformProducts
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
              .slice(0, 10)
          };

          // Category breakdown for platform
          platformProducts.forEach(product => {
            if (!summary.categoryBreakdown[product.category]) {
              summary.categoryBreakdown[product.category] = {
                count: 0,
                stock: 0
              };
            }
            summary.categoryBreakdown[product.category].count++;
            summary.categoryBreakdown[product.category].stock += product.currentStock;
          });

          result = summary;
        }
        break;

      // Enhanced Financial Reporting Endpoints (Task 14)
      case 'financial-reports':
        if (httpMethod === 'GET') {
          // Check authentication for financial reports access
          const authResult = requireAuth('financial-reports')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Apply rate limiting for financial data access
          const rateLimitResult = rateLimit(50, 60000)(event);
          if (!rateLimitResult.allowed) {
            return {
              statusCode: rateLimitResult.statusCode,
              headers: { ...corsHeaders, ...rateLimitResult.headers },
              body: JSON.stringify({ error: rateLimitResult.error })
            };
          }

          // Validate query parameters with enhanced validation (Task 14)
          const validation = validateQueryParams(financialReportingSchemas.reportQuery, queryParams);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          const validatedParams = validation.data;
          const { type, format, noCache, page, limit, sortBy, sortOrder } = validatedParams;

          // Clear cache if requested
          if (noCache) {
            financialReportingService.clearCache();
          }

          // Build date range
          const dateRange = validatedParams.startDate && validatedParams.endDate ? {
            startDate: validatedParams.startDate,
            endDate: validatedParams.endDate
          } : null;

          let reportData;
          let csvFormatter;

          switch (type) {
            case 'platform-profitability':
              reportData = await financialReportingService.getPlatformProfitability(validatedParams.platformId, dateRange);
              csvFormatter = formatPlatformProfitabilityCSV;
              break;
            case 'credit-utilization':
              reportData = await financialReportingService.getCreditUtilization(validatedParams.platformId, dateRange);
              csvFormatter = formatCreditUtilizationCSV;
              break;
            case 'sales-profit':
              const filters = {
                platformId: validatedParams.platformId,
                productId: validatedParams.productId,
                category: validatedParams.category,
                paymentType: validatedParams.paymentType,
                groupBy: validatedParams.groupBy,
                dateRange
              };
              reportData = await financialReportingService.getSalesProfitReport(filters);
              csvFormatter = formatSalesProfitCSV;
              break;
            case 'low-credit-platforms':
              reportData = await financialReportingService.getLowCreditPlatforms(validatedParams.threshold);
              csvFormatter = formatLowCreditPlatformsCSV;
              break;
            case 'dashboard':
              reportData = await financialReportingService.getFinancialDashboard(dateRange);
              // Dashboard doesn't support CSV format
              if (format === 'csv') {
                return {
                  statusCode: 400,
                  headers: corsHeaders,
                  body: JSON.stringify({
                    error: 'CSV format not supported for dashboard reports',
                    details: 'Dashboard reports are only available in JSON format'
                  })
                };
              }
              break;
            default:
              return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                  error: 'Invalid report type',
                  details: 'Valid types: platform-profitability, credit-utilization, sales-profit, low-credit-platforms, dashboard'
                })
              };
          }

          // Handle CSV format
          if (format === 'csv' && csvFormatter) {
            const csvData = csvFormatter(reportData);
            const formatHeaders = getFormatHeaders('csv', type);

            return {
              statusCode: 200,
              headers: { ...corsHeaders, ...formatHeaders.headers },
              body: csvData
            };
          }

          // Handle JSON format with pagination and sorting
          if (type !== 'dashboard') {
            const dataKey = type === 'platform-profitability' || type === 'credit-utilization' ? 'platforms' :
                           type === 'sales-profit' ? 'groups' : 'platforms';

            let dataArray = reportData[dataKey] || [];

            // Apply sorting
            if (sortBy) {
              dataArray = sortData(dataArray, sortBy, sortOrder);
            }

            // Apply pagination
            const paginatedResult = paginateData(dataArray, page, limit);

            result = {
              ...reportData,
              [dataKey]: paginatedResult.data,
              pagination: paginatedResult.pagination,
              query: validatedParams
            };
          } else {
            result = {
              ...reportData,
              query: validatedParams
            };
          }
        }
        break;

      case 'financial-platform-profitability':
        if (httpMethod === 'GET') {
          // Check authentication for financial reports access
          const authResult = requireAuth('financial-reports')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Enhanced validation for platform profitability (Task 14)
          const validation = validateQueryParams(financialReportingSchemas.platformProfitabilityQuery, queryParams);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          const validatedParams = validation.data;
          const { platformId, format, noCache, page, limit, sortBy, sortOrder } = validatedParams;

          // Clear cache if requested
          if (noCache) {
            financialReportingService.clearCache('platformProfitability');
          }

          const dateRange = validatedParams.startDate && validatedParams.endDate ? {
            startDate: validatedParams.startDate,
            endDate: validatedParams.endDate
          } : null;

          const reportData = await financialReportingService.getPlatformProfitability(platformId, dateRange);

          // Handle CSV format
          if (format === 'csv') {
            const csvData = formatPlatformProfitabilityCSV(reportData);
            const formatHeaders = getFormatHeaders('csv', 'platform-profitability');

            return {
              statusCode: 200,
              headers: { ...corsHeaders, ...formatHeaders.headers },
              body: csvData
            };
          }

          // Handle JSON format with pagination and sorting
          let platforms = reportData.platforms || [];

          // Apply sorting
          platforms = sortData(platforms, sortBy, sortOrder);

          // Apply pagination
          const paginatedResult = paginateData(platforms, page, limit);

          result = {
            ...reportData,
            platforms: paginatedResult.data,
            pagination: paginatedResult.pagination,
            query: validatedParams
          };
        }
        break;

      case 'financial-credit-utilization':
        if (httpMethod === 'GET') {
          // Check authentication for financial reports access
          const authResult = requireAuth('financial-reports')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Enhanced validation for credit utilization (Task 14)
          const validation = validateQueryParams(financialReportingSchemas.creditUtilizationQuery, queryParams);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          const validatedParams = validation.data;
          const { platformId, format, noCache, page, limit, sortBy, sortOrder } = validatedParams;

          // Clear cache if requested
          if (noCache) {
            financialReportingService.clearCache('creditUtilization');
          }

          const dateRange = validatedParams.startDate && validatedParams.endDate ? {
            startDate: validatedParams.startDate,
            endDate: validatedParams.endDate
          } : null;

          const reportData = await financialReportingService.getCreditUtilization(platformId, dateRange);

          // Handle CSV format
          if (format === 'csv') {
            const csvData = formatCreditUtilizationCSV(reportData);
            const formatHeaders = getFormatHeaders('csv', 'credit-utilization');

            return {
              statusCode: 200,
              headers: { ...corsHeaders, ...formatHeaders.headers },
              body: csvData
            };
          }

          // Handle JSON format with pagination and sorting
          let platforms = reportData.platforms || [];

          // Apply sorting
          platforms = sortData(platforms, sortBy, sortOrder);

          // Apply pagination
          const paginatedResult = paginateData(platforms, page, limit);

          result = {
            ...reportData,
            platforms: paginatedResult.data,
            pagination: paginatedResult.pagination,
            query: validatedParams
          };
        }
        break;

      case 'financial-sales-profit':
        if (httpMethod === 'GET') {
          // Check authentication for financial reports access
          const authResult = requireAuth('financial-reports')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Enhanced validation for sales profit (Task 14)
          const validation = validateQueryParams(financialReportingSchemas.salesProfitQuery, queryParams);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          const validatedParams = validation.data;
          const { format, noCache, page, limit, sortBy, sortOrder } = validatedParams;

          // Clear cache if requested
          if (noCache) {
            financialReportingService.clearCache('salesProfitReport');
          }

          const dateRange = validatedParams.startDate && validatedParams.endDate ? {
            startDate: validatedParams.startDate,
            endDate: validatedParams.endDate
          } : null;

          const filters = {
            platformId: validatedParams.platformId,
            productId: validatedParams.productId,
            category: validatedParams.category,
            paymentType: validatedParams.paymentType,
            groupBy: validatedParams.groupBy,
            dateRange
          };

          const reportData = await financialReportingService.getSalesProfitReport(filters);

          // Handle CSV format
          if (format === 'csv') {
            const csvData = formatSalesProfitCSV(reportData);
            const formatHeaders = getFormatHeaders('csv', 'sales-profit');

            return {
              statusCode: 200,
              headers: { ...corsHeaders, ...formatHeaders.headers },
              body: csvData
            };
          }

          // Handle JSON format with pagination and sorting
          let groups = reportData.groups || [];

          // Apply sorting
          groups = sortData(groups, sortBy, sortOrder);

          // Apply pagination
          const paginatedResult = paginateData(groups, page, limit);

          result = {
            ...reportData,
            groups: paginatedResult.data,
            pagination: paginatedResult.pagination,
            query: validatedParams
          };
        }
        break;

      case 'financial-low-credit-platforms':
        if (httpMethod === 'GET') {
          // Check authentication for financial reports access
          const authResult = requireAuth('financial-reports')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Enhanced validation for low credit platforms (Task 14)
          const validation = validateQueryParams(financialReportingSchemas.lowCreditPlatformsQuery, queryParams);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          const validatedParams = validation.data;
          const { threshold, format, noCache, page, limit, sortBy, sortOrder } = validatedParams;

          // Clear cache if requested
          if (noCache) {
            financialReportingService.clearCache('lowCreditPlatforms');
          }

          const reportData = await financialReportingService.getLowCreditPlatforms(threshold);

          // Handle CSV format
          if (format === 'csv') {
            const csvData = formatLowCreditPlatformsCSV(reportData);
            const formatHeaders = getFormatHeaders('csv', 'low-credit-platforms');

            return {
              statusCode: 200,
              headers: { ...corsHeaders, ...formatHeaders.headers },
              body: csvData
            };
          }

          // Handle JSON format with pagination and sorting
          let platforms = reportData.platforms || [];

          // Apply sorting
          platforms = sortData(platforms, sortBy, sortOrder);

          // Apply pagination
          const paginatedResult = paginateData(platforms, page, limit);

          result = {
            ...reportData,
            platforms: paginatedResult.data,
            pagination: paginatedResult.pagination,
            query: validatedParams
          };
        }
        break;

      case 'financial-dashboard':
        if (httpMethod === 'GET') {
          // Check authentication for financial dashboard access
          const authResult = requireAuth('financial-dashboard')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Apply rate limiting for dashboard access
          const rateLimitResult = rateLimit(30, 60000)(event);
          if (!rateLimitResult.allowed) {
            return {
              statusCode: rateLimitResult.statusCode,
              headers: { ...corsHeaders, ...rateLimitResult.headers },
              body: JSON.stringify({ error: rateLimitResult.error })
            };
          }

          const dateRange = queryParams.startDate && queryParams.endDate ? {
            startDate: queryParams.startDate,
            endDate: queryParams.endDate
          } : null;

          result = await financialReportingService.getFinancialDashboard(dateRange);
        }
        break;

      // New Enhanced Financial Reporting Endpoints (Task 14)
      case 'reports':
        if (httpMethod === 'GET') {
          // Check authentication for financial reports access
          const authResult = requireAuth('financial-reports')(event);
          if (authResult.statusCode) {
            return {
              statusCode: authResult.statusCode,
              headers: { ...corsHeaders, ...authResult.headers },
              body: JSON.stringify({ error: authResult.error, details: authResult.details })
            };
          }

          // Apply rate limiting for financial data access
          const rateLimitResult = rateLimit(50, 60000)(event);
          if (!rateLimitResult.allowed) {
            return {
              statusCode: rateLimitResult.statusCode,
              headers: { ...corsHeaders, ...rateLimitResult.headers },
              body: JSON.stringify({ error: rateLimitResult.error })
            };
          }

          // Get the sub-path for the specific report type
          const pathParts = event.path.split('/');
          const reportType = pathParts[pathParts.length - 1];

          let validationSchema;
          let serviceMethod;
          let csvFormatter;

          switch (reportType) {
            case 'platform-profitability':
              validationSchema = financialReportingSchemas.platformProfitabilityQuery;
              serviceMethod = 'getPlatformProfitability';
              csvFormatter = formatPlatformProfitabilityCSV;
              break;
            case 'credit-utilization':
              validationSchema = financialReportingSchemas.creditUtilizationQuery;
              serviceMethod = 'getCreditUtilization';
              csvFormatter = formatCreditUtilizationCSV;
              break;
            case 'sales-profit':
              validationSchema = financialReportingSchemas.salesProfitQuery;
              serviceMethod = 'getSalesProfitReport';
              csvFormatter = formatSalesProfitCSV;
              break;
            case 'low-credit-platforms':
              validationSchema = financialReportingSchemas.lowCreditPlatformsQuery;
              serviceMethod = 'getLowCreditPlatforms';
              csvFormatter = formatLowCreditPlatformsCSV;
              break;
            default:
              return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({
                  error: 'Report type not found',
                  details: 'Available reports: platform-profitability, credit-utilization, sales-profit, low-credit-platforms'
                })
              };
          }

          // Validate query parameters
          const validation = validateQueryParams(validationSchema, queryParams);
          if (!validation.isValid) {
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify(formatValidationError(validation))
            };
          }

          const validatedParams = validation.data;
          const { format, noCache, page, limit, sortBy, sortOrder } = validatedParams;

          // Clear cache if requested
          if (noCache) {
            financialReportingService.clearCache();
          }

          // Prepare method arguments based on report type
          let reportData;
          if (reportType === 'platform-profitability' || reportType === 'credit-utilization') {
            const dateRange = validatedParams.startDate && validatedParams.endDate ? {
              startDate: validatedParams.startDate,
              endDate: validatedParams.endDate
            } : null;
            reportData = await financialReportingService[serviceMethod](validatedParams.platformId, dateRange);
          } else if (reportType === 'sales-profit') {
            const dateRange = validatedParams.startDate && validatedParams.endDate ? {
              startDate: validatedParams.startDate,
              endDate: validatedParams.endDate
            } : null;
            const filters = {
              platformId: validatedParams.platformId,
              productId: validatedParams.productId,
              category: validatedParams.category,
              paymentType: validatedParams.paymentType,
              groupBy: validatedParams.groupBy,
              dateRange
            };
            reportData = await financialReportingService[serviceMethod](filters);
          } else if (reportType === 'low-credit-platforms') {
            reportData = await financialReportingService[serviceMethod](validatedParams.threshold);
          }

          // Handle CSV format
          if (format === 'csv') {
            const csvData = csvFormatter(reportData);
            const formatHeaders = getFormatHeaders('csv', reportType);

            return {
              statusCode: 200,
              headers: { ...corsHeaders, ...formatHeaders.headers },
              body: csvData
            };
          }

          // Handle JSON format with pagination and sorting
          const dataKey = reportType === 'platform-profitability' || reportType === 'credit-utilization' || reportType === 'low-credit-platforms' ? 'platforms' : 'groups';
          let dataArray = reportData[dataKey] || [];

          // Apply sorting
          if (sortBy) {
            dataArray = sortData(dataArray, sortBy, sortOrder);
          }

          // Apply pagination
          const paginatedResult = paginateData(dataArray, page, limit);

          result = {
            ...reportData,
            [dataKey]: paginatedResult.data,
            pagination: paginatedResult.pagination,
            query: validatedParams
          };
        }
        break;

      // Settings
      case 'settings':
        if (httpMethod === 'GET') {
          result = await dbOperations.getSettings();
        } else if (httpMethod === 'PUT') {
          result = await dbOperations.updateSettings(data);
        }
        break;

      // Global Search endpoint
      case 'search':
        if (httpMethod === 'GET') {
          const {
            q: query,
            types,
            platform_id: platformId,
            start_date: startDate,
            end_date: endDate,
            status,
            category,
            payment_status: paymentStatus,
            min_amount: minAmount,
            max_amount: maxAmount,
            sort_by: sortBy = 'relevance',
            sort_order: sortOrder = 'desc',
            limit = 20,
            offset = 0
          } = queryParams;

          if (!query || query.trim().length === 0) {
            result = {
              results: [],
              totalCount: 0,
              searchTime: 0,
              suggestions: [],
              facets: {
                entityTypes: {},
                platforms: {},
                categories: {},
                statuses: {}
              }
            };
            break;
          }

          const startTime = Date.now();
          const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
          const entityTypes = types ? types.split(',') : ['platform', 'product', 'sale', 'credit_movement'];

          let allResults = [];
          let facets = {
            entityTypes: {},
            platforms: {},
            categories: {},
            statuses: {}
          };

          // Helper function to calculate relevance score
          const calculateRelevanceScore = (searchTerms, textFields) => {
            let score = 0;
            const combinedText = textFields.join(' ').toLowerCase();

            searchTerms.forEach(term => {
              if (combinedText.includes(term)) {
                score += 10;
                // Boost score for exact matches in important fields
                if (textFields[0] && textFields[0].toLowerCase().includes(term)) {
                  score += 15; // Title/name match
                }
              }
            });

            return score;
          };

          // Helper function to get entity amount for sorting
          const getEntityAmount = (result) => {
            switch (result.type) {
              case 'sale': return result.metadata.totalPrice || 0;
              case 'credit_movement': return Math.abs(result.metadata.amount || 0);
              case 'platform': return result.metadata.creditBalance || 0;
              case 'product': return result.metadata.suggestedSellPrice || 0;
              default: return 0;
            }
          };

          // Search Platforms
          if (entityTypes.includes('platform')) {
            try {
              const platforms = await dbOperations.getPlatforms();
              platforms.forEach(platform => {
                const searchableFields = [
                  platform.name,
                  platform.description,
                  platform.contactName,
                  platform.contactEmail
                ].filter(Boolean);

                const relevanceScore = calculateRelevanceScore(searchTerms, searchableFields);
                if (relevanceScore > 0) {
                  // Apply filters
                  if (platformId && platform.id !== platformId) return;
                  if (status && ((status === 'active') !== platform.isActive)) return;

                  allResults.push({
                    id: platform.id,
                    type: 'platform',
                    title: platform.name,
                    subtitle: platform.description || 'Platform',
                    description: `Balance: ${platform.creditBalance} DZD • Contact: ${platform.contactName || 'N/A'}`,
                    metadata: {
                      creditBalance: platform.creditBalance,
                      lowBalanceThreshold: platform.lowBalanceThreshold,
                      contactName: platform.contactName,
                      contactEmail: platform.contactEmail,
                      isActive: platform.isActive
                    },
                    url: `/platforms/${platform.id}`,
                    status: platform.isActive ? 'active' : 'inactive',
                    createdAt: platform.createdAt,
                    updatedAt: platform.updatedAt,
                    relevanceScore
                  });

                  facets.entityTypes.platform = (facets.entityTypes.platform || 0) + 1;
                  facets.statuses[platform.isActive ? 'active' : 'inactive'] =
                    (facets.statuses[platform.isActive ? 'active' : 'inactive'] || 0) + 1;
                }
              });
            } catch (error) {
              console.error('Error searching platforms:', error);
            }
          }

          // Search Products
          if (entityTypes.includes('product')) {
            try {
              const products = await dbOperations.getDigitalProducts();
              products.forEach(product => {
                const searchableFields = [
                  product.name,
                  product.description,
                  product.category
                ].filter(Boolean);

                const relevanceScore = calculateRelevanceScore(searchTerms, searchableFields);
                if (relevanceScore > 0) {
                  // Apply filters
                  if (platformId && product.platformId !== platformId) return;
                  if (category && product.category !== category) return;
                  if (status && ((status === 'active') !== product.isActive)) return;
                  if (minAmount && product.suggestedSellPrice < parseFloat(minAmount)) return;
                  if (maxAmount && product.suggestedSellPrice > parseFloat(maxAmount)) return;

                  allResults.push({
                    id: product.id,
                    type: 'product',
                    title: product.name,
                    subtitle: `${product.category} • ${product.durationType}`,
                    description: `Stock: ${product.currentStock} • Price: ${product.suggestedSellPrice} DZD • Margin: ${product.profitMargin}%`,
                    metadata: {
                      category: product.category,
                      durationType: product.durationType,
                      currentStock: product.currentStock,
                      suggestedSellPrice: product.suggestedSellPrice,
                      profitMargin: product.profitMargin,
                      platformId: product.platformId,
                      isActive: product.isActive
                    },
                    url: `/inventory/products/${product.id}`,
                    status: product.isActive ? 'active' : 'inactive',
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                    relevanceScore
                  });

                  facets.entityTypes.product = (facets.entityTypes.product || 0) + 1;
                  facets.categories[product.category] = (facets.categories[product.category] || 0) + 1;
                  facets.statuses[product.isActive ? 'active' : 'inactive'] =
                    (facets.statuses[product.isActive ? 'active' : 'inactive'] || 0) + 1;
                  if (product.platformId) {
                    facets.platforms[product.platformId] = (facets.platforms[product.platformId] || 0) + 1;
                  }
                }
              });
            } catch (error) {
              console.error('Error searching products:', error);
            }
          }

          // Sort results
          allResults.sort((a, b) => {
            switch (sortBy) {
              case 'date':
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
              case 'amount':
                const amountA = getEntityAmount(a);
                const amountB = getEntityAmount(b);
                return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
              case 'name':
                const nameA = a.title.toLowerCase();
                const nameB = b.title.toLowerCase();
                return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
              default: // relevance
                return sortOrder === 'asc' ? a.relevanceScore - b.relevanceScore : b.relevanceScore - a.relevanceScore;
            }
          });

          // Apply pagination
          const totalCount = allResults.length;
          const paginatedResults = allResults.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

          // Generate suggestions (simplified)
          const suggestions = Array.from(new Set(
            allResults.slice(0, 10).map(result => {
              if (result.type === 'platform') return result.title;
              if (result.type === 'product') return result.title;
              return null;
            }).filter(Boolean)
          )).slice(0, 5);

          const searchTime = Date.now() - startTime;

          result = {
            results: paginatedResults,
            totalCount,
            searchTime,
            suggestions,
            facets
          };
        }
        break;

      case 'debug-schema':
        if (httpMethod === 'GET') {
          try {
            const client = await pool.connect();
            try {
              // Check stock_sales table schema
              const stockSalesSchema = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'stock_sales'
                ORDER BY ordinal_position
              `);

              // Check if table exists
              const tableExists = await client.query(`
                SELECT EXISTS (
                  SELECT FROM information_schema.tables
                  WHERE table_name = 'stock_sales'
                )
              `);

              return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                  tableExists: tableExists.rows[0].exists,
                  schema: stockSalesSchema.rows,
                  timestamp: new Date().toISOString()
                })
              };
            } finally {
              client.release();
            }
          } catch (error) {
            return {
              statusCode: 500,
              headers: corsHeaders,
              body: JSON.stringify({ error: error.message, stack: error.stack })
            };
          }
        }
        break;

      default:
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Endpoint not found: ${action}` })
        };
    }

    // Handle different response formats
    if (result && result.statusCode) {
      // Handle error responses from validation or operations
      return {
        statusCode: result.statusCode,
        headers: corsHeaders,
        body: JSON.stringify({
          error: result.error,
          details: result.details
        })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('API Error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error'
      })
    };
  }
};