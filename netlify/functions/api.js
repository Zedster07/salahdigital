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
    initError = err;
  });

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

  // Digital Products
  async getDigitalProducts() {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM digital_products ORDER BY created_at DESC');
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
      const query = `
        INSERT INTO digital_products (id, name, category, duration_type, description, current_stock, 
                                    min_stock_alert, average_purchase_price, suggested_sell_price, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
        productData.suggestedSellPrice || 0,
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
      const query = `
        UPDATE digital_products 
        SET name = $2, category = $3, duration_type = $4, description = $5, current_stock = $6,
            min_stock_alert = $7, average_purchase_price = $8, suggested_sell_price = $9, 
            is_active = $10, updated_at = CURRENT_TIMESTAMP
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
        productData.suggestedSellPrice || 0,
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

  // Stock Purchases
  async getStockPurchases() {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM stock_purchases ORDER BY purchase_date DESC');
      return result.rows.map(row => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        supplier: row.supplier,
        quantity: row.quantity,
        unitCost: parseFloat(row.unit_cost),
        totalCost: parseFloat(row.total_cost),
        purchaseDate: row.purchase_date,
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        invoiceNumber: row.invoice_number,
        notes: row.notes,
        createdAt: row.created_at
      }));
    } finally {
      client.release();
    }
  },

  async createStockPurchase(purchaseData) {
    const client = await pool.connect();
    try {
      const id = purchaseData.id || generateId();
      const query = `
        INSERT INTO stock_purchases (id, product_id, product_name, supplier, quantity, unit_cost, 
                                   total_cost, purchase_date, payment_method, payment_status, invoice_number, notes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const values = [
        id,
        purchaseData.productId,
        purchaseData.productName,
        purchaseData.supplier,
        purchaseData.quantity,
        purchaseData.unitCost,
        purchaseData.totalCost,
        purchaseData.purchaseDate,
        purchaseData.paymentMethod,
        purchaseData.paymentStatus || 'pending',
        purchaseData.invoiceNumber || null,
        purchaseData.notes || null
      ];
      const result = await client.query(query, values);
      const row = result.rows[0];
      return {
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        supplier: row.supplier,
        quantity: row.quantity,
        unitCost: parseFloat(row.unit_cost),
        totalCost: parseFloat(row.total_cost),
        purchaseDate: row.purchase_date,
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        invoiceNumber: row.invoice_number,
        notes: row.notes,
        createdAt: row.created_at
      };
    } finally {
      client.release();
    }
  },

  async updateStockPurchase(purchaseId, purchaseData) {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE stock_purchases 
        SET product_id = $2, product_name = $3, supplier = $4, quantity = $5, unit_cost = $6,
            total_cost = $7, purchase_date = $8, payment_method = $9, payment_status = $10,
            invoice_number = $11, notes = $12
        WHERE id = $1
        RETURNING *
      `;
      const values = [
        purchaseId,
        purchaseData.productId,
        purchaseData.productName,
        purchaseData.supplier,
        purchaseData.quantity,
        purchaseData.unitCost,
        purchaseData.totalCost,
        purchaseData.purchaseDate,
        purchaseData.paymentMethod,
        purchaseData.paymentStatus,
        purchaseData.invoiceNumber || null,
        purchaseData.notes || null
      ];
      const result = await client.query(query, values);
      const row = result.rows[0];
      return {
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        supplier: row.supplier,
        quantity: row.quantity,
        unitCost: parseFloat(row.unit_cost),
        totalCost: parseFloat(row.total_cost),
        purchaseDate: row.purchase_date,
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        invoiceNumber: row.invoice_number,
        notes: row.notes,
        createdAt: row.created_at
      };
    } finally {
      client.release();
    }
  },

  async deleteStockPurchase(purchaseId) {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM stock_purchases WHERE id = $1', [purchaseId]);
      return { success: true };
    } finally {
      client.release();
    }
  },

  // Stock Sales
  async getStockSales() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT s.*, ph.payment_history 
        FROM stock_sales s
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
      
      const id = saleData.id || generateId();
      const query = `
        INSERT INTO stock_sales (id, product_id, product_name, subscriber_id, customer_name, customer_phone,
                               quantity, unit_price, total_price, sale_date, payment_method, payment_status,
                               paid_amount, remaining_amount, profit, notes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const values = [
        id,
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
        saleData.paymentStatus || 'pending',
        saleData.paidAmount || 0,
        saleData.remainingAmount || saleData.totalPrice,
        saleData.profit || 0,
        saleData.notes || null
      ];
      const result = await client.query(query, values);
      
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
      
      const query = `
        UPDATE stock_sales 
        SET product_id = $2, product_name = $3, subscriber_id = $4, customer_name = $5, customer_phone = $6,
            quantity = $7, unit_price = $8, total_price = $9, sale_date = $10, payment_method = $11,
            payment_status = $12, paid_amount = $13, remaining_amount = $14, profit = $15, notes = $16
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
    const { httpMethod, path, body } = event;
    const pathParts = path.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1]; // specific action
    
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

      // Digital Products
      case 'digital-products':
        if (httpMethod === 'GET') {
          result = await dbOperations.getDigitalProducts();
        } else if (httpMethod === 'POST') {
          result = await dbOperations.createDigitalProduct(data);
        }
        break;

      case 'digital-product':
        if (httpMethod === 'PUT') {
          result = await dbOperations.updateDigitalProduct(data.id, data);
        } else if (httpMethod === 'DELETE') {
          result = await dbOperations.deleteDigitalProduct(data.id);
        }
        break;

      // Stock Purchases
      case 'stock-purchases':
        if (httpMethod === 'GET') {
          result = await dbOperations.getStockPurchases();
        } else if (httpMethod === 'POST') {
          result = await dbOperations.createStockPurchase(data);
        }
        break;

      case 'stock-purchase':
        if (httpMethod === 'PUT') {
          result = await dbOperations.updateStockPurchase(data.id, data);
        } else if (httpMethod === 'DELETE') {
          result = await dbOperations.deleteStockPurchase(data.id);
        }
        break;

      // Stock Sales
      case 'stock-sales':
        if (httpMethod === 'GET') {
          result = await dbOperations.getStockSales();
        } else if (httpMethod === 'POST') {
          result = await dbOperations.createStockSale(data);
        }
        break;

      case 'stock-sale':
        if (httpMethod === 'PUT') {
          result = await dbOperations.updateStockSale(data.id, data);
        } else if (httpMethod === 'DELETE') {
          result = await dbOperations.deleteStockSale(data.id);
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

      // Settings
      case 'settings':
        if (httpMethod === 'GET') {
          result = await dbOperations.getSettings();
        } else if (httpMethod === 'PUT') {
          result = await dbOperations.updateSettings(data);
        }
        break;

      default:
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Endpoint not found: ${action}` })
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