import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock data
const mockUsers = [
  {
    id: 'user-1',
    username: 'admin',
    email: 'admin@digitalmanager.com',
    role: 'admin',
    status: 'verified',
    createdAt: '2025-01-01T00:00:00Z',
    emailVerified: true,
    loginAttempts: 0,
    twoFactorEnabled: false
  }
];

const mockPlatforms = [
  {
    id: 'platform-1',
    name: 'Netflix Supplier',
    description: 'Primary Netflix account supplier',
    contactName: 'John Smith',
    contactEmail: 'john@supplier.com',
    contactPhone: '+1-555-0123',
    creditBalance: 1500,
    lowBalanceThreshold: 500,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'platform-2',
    name: 'Spotify Supplier',
    description: 'Music streaming platform supplier',
    contactName: 'Jane Doe',
    contactEmail: 'jane@musicplatform.com',
    contactPhone: '+1-555-0456',
    creditBalance: 800,
    lowBalanceThreshold: 200,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
];

const mockProducts = [
  {
    id: 'product-1',
    name: 'Netflix Premium 1 Month',
    category: 'iptv',
    durationType: '1month',
    description: 'Netflix Premium subscription for 1 month',
    currentStock: 45,
    minStockAlert: 10,
    averagePurchasePrice: 12,
    suggestedSellPrice: 25,
    platformId: 'platform-1',
    platformBuyingPrice: 15,
    profitMargin: 40,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'product-2',
    name: 'Spotify Premium 1 Month',
    category: 'digital-account',
    durationType: '1month',
    description: 'Spotify Premium subscription for 1 month',
    currentStock: 30,
    minStockAlert: 5,
    averagePurchasePrice: 8,
    suggestedSellPrice: 15,
    platformId: 'platform-2',
    platformBuyingPrice: 10,
    profitMargin: 33.33,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
];

const mockSales = [
  {
    id: 'sale-1',
    productId: 'product-1',
    productName: 'Netflix Premium 1 Month',
    customerName: 'Alice Johnson',
    customerPhone: '+1-555-0789',
    quantity: 1,
    unitPrice: 25,
    totalPrice: 25,
    saleDate: '2025-01-15T10:30:00Z',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    profit: 10,
    platformId: 'platform-1',
    platformBuyingPrice: 15,
    paymentType: 'one-time',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:30:00Z'
  }
];

const mockCreditMovements = [
  {
    id: 'movement-1',
    platformId: 'platform-1',
    type: 'credit_added',
    amount: 1000,
    previousBalance: 500,
    newBalance: 1500,
    reference: 'BANK-TRANSFER-001',
    description: 'Monthly credit top-up',
    createdBy: 'user-1',
    createdAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'movement-2',
    platformId: 'platform-1',
    type: 'sale_deduction',
    amount: -15,
    previousBalance: 1515,
    newBalance: 1500,
    reference: 'SALE-001',
    description: 'Credit deduction for sale',
    createdBy: 'system',
    createdAt: '2025-01-15T10:30:00Z'
  }
];

// API handlers
const handlers = [
  // Authentication
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: mockUsers[0],
        token: 'mock-jwt-token'
      })
    );
  }),

  // Users
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockUsers));
  }),

  rest.post('/api/users', (req, res, ctx) => {
    const newUser = {
      id: `user-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      emailVerified: false,
      loginAttempts: 0,
      twoFactorEnabled: false
    };
    mockUsers.push(newUser);
    return res(ctx.status(201), ctx.json(newUser));
  }),

  // Platforms
  rest.get('/api/platforms', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockPlatforms));
  }),

  rest.get('/api/platforms/:id', (req, res, ctx) => {
    const { id } = req.params;
    const platform = mockPlatforms.find(p => p.id === id);
    if (!platform) {
      return res(ctx.status(404), ctx.json({ error: 'Platform not found' }));
    }
    return res(ctx.status(200), ctx.json(platform));
  }),

  rest.post('/api/platforms', (req, res, ctx) => {
    const newPlatform = {
      id: `platform-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockPlatforms.push(newPlatform);
    return res(ctx.status(201), ctx.json(newPlatform));
  }),

  rest.put('/api/platforms/:id', (req, res, ctx) => {
    const { id } = req.params;
    const platformIndex = mockPlatforms.findIndex(p => p.id === id);
    if (platformIndex === -1) {
      return res(ctx.status(404), ctx.json({ error: 'Platform not found' }));
    }
    mockPlatforms[platformIndex] = {
      ...mockPlatforms[platformIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    return res(ctx.status(200), ctx.json(mockPlatforms[platformIndex]));
  }),

  rest.delete('/api/platforms/:id', (req, res, ctx) => {
    const { id } = req.params;
    const platformIndex = mockPlatforms.findIndex(p => p.id === id);
    if (platformIndex === -1) {
      return res(ctx.status(404), ctx.json({ error: 'Platform not found' }));
    }
    mockPlatforms.splice(platformIndex, 1);
    return res(ctx.status(204));
  }),

  // Platform Credit Management
  rest.post('/api/platforms/:id/credits', (req, res, ctx) => {
    const { id } = req.params;
    const platform = mockPlatforms.find(p => p.id === id);
    if (!platform) {
      return res(ctx.status(404), ctx.json({ error: 'Platform not found' }));
    }

    const { amount, reference, description } = req.body;
    const previousBalance = platform.creditBalance;
    const newBalance = previousBalance + amount;

    // Update platform balance
    platform.creditBalance = newBalance;
    platform.updatedAt = new Date().toISOString();

    // Create credit movement
    const movement = {
      id: `movement-${Date.now()}`,
      platformId: id,
      type: 'credit_added',
      amount,
      previousBalance,
      newBalance,
      reference,
      description,
      createdBy: 'user-1',
      createdAt: new Date().toISOString()
    };
    mockCreditMovements.push(movement);

    return res(ctx.status(200), ctx.json({ platform, movement }));
  }),

  rest.get('/api/platforms/:id/credits/movements', (req, res, ctx) => {
    const { id } = req.params;
    const movements = mockCreditMovements.filter(m => m.platformId === id);
    return res(ctx.status(200), ctx.json(movements));
  }),

  // Digital Products
  rest.get('/api/digital-products', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockProducts));
  }),

  rest.post('/api/digital-products', (req, res, ctx) => {
    const newProduct = {
      id: `product-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockProducts.push(newProduct);
    return res(ctx.status(201), ctx.json(newProduct));
  }),

  // Stock Sales
  rest.get('/api/stock-sales', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockSales));
  }),

  rest.post('/api/stock-sales', (req, res, ctx) => {
    const saleData = req.body;
    
    // Find product and platform
    const product = mockProducts.find(p => p.id === saleData.productId);
    const platform = mockPlatforms.find(p => p.id === product?.platformId);
    
    if (!product) {
      return res(ctx.status(404), ctx.json({ error: 'Product not found' }));
    }
    
    if (!platform) {
      return res(ctx.status(404), ctx.json({ error: 'Platform not found' }));
    }

    // Check credit balance
    const totalCost = product.platformBuyingPrice * saleData.quantity;
    if (platform.creditBalance < totalCost) {
      return res(ctx.status(400), ctx.json({ error: 'Insufficient platform credits' }));
    }

    // Create sale
    const newSale = {
      id: `sale-${Date.now()}`,
      ...saleData,
      productName: product.name,
      platformId: platform.id,
      platformBuyingPrice: product.platformBuyingPrice,
      profit: (saleData.unitPrice - product.platformBuyingPrice) * saleData.quantity,
      saleDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockSales.push(newSale);

    // Deduct credits
    const previousBalance = platform.creditBalance;
    platform.creditBalance -= totalCost;
    platform.updatedAt = new Date().toISOString();

    // Create credit movement
    const movement = {
      id: `movement-${Date.now()}`,
      platformId: platform.id,
      type: 'sale_deduction',
      amount: -totalCost,
      previousBalance,
      newBalance: platform.creditBalance,
      reference: newSale.id,
      description: `Credit deduction for sale ${newSale.id}`,
      createdBy: 'system',
      createdAt: new Date().toISOString()
    };
    mockCreditMovements.push(movement);

    // Update product stock
    product.currentStock -= saleData.quantity;
    product.updatedAt = new Date().toISOString();

    return res(ctx.status(201), ctx.json(newSale));
  }),

  // Search
  rest.get('/api/search', (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    const types = req.url.searchParams.get('types')?.split(',') || ['platform', 'product', 'sale', 'credit_movement'];
    
    if (!query) {
      return res(ctx.status(200), ctx.json({
        results: [],
        totalCount: 0,
        searchTime: 0,
        suggestions: [],
        facets: {}
      }));
    }

    const results = [];
    const queryLower = query.toLowerCase();

    // Search platforms
    if (types.includes('platform')) {
      mockPlatforms.forEach(platform => {
        if (platform.name.toLowerCase().includes(queryLower) ||
            platform.description?.toLowerCase().includes(queryLower)) {
          results.push({
            id: platform.id,
            type: 'platform',
            title: platform.name,
            subtitle: platform.description || 'Platform',
            description: `Balance: ${platform.creditBalance} DZD • Contact: ${platform.contactName}`,
            metadata: platform,
            url: `/platforms/${platform.id}`,
            status: platform.isActive ? 'active' : 'inactive',
            createdAt: platform.createdAt,
            relevanceScore: 10
          });
        }
      });
    }

    // Search products
    if (types.includes('product')) {
      mockProducts.forEach(product => {
        if (product.name.toLowerCase().includes(queryLower) ||
            product.category.toLowerCase().includes(queryLower)) {
          results.push({
            id: product.id,
            type: 'product',
            title: product.name,
            subtitle: `${product.category} • ${product.durationType}`,
            description: `Stock: ${product.currentStock} • Price: ${product.suggestedSellPrice} DZD`,
            metadata: product,
            url: `/products/${product.id}`,
            status: product.isActive ? 'active' : 'inactive',
            createdAt: product.createdAt,
            relevanceScore: 8
          });
        }
      });
    }

    return res(ctx.status(200), ctx.json({
      results,
      totalCount: results.length,
      searchTime: 15,
      suggestions: ['netflix', 'spotify', 'premium'],
      facets: {
        entityTypes: { platform: 2, product: 2 },
        platforms: {},
        categories: {},
        statuses: { active: 4 }
      }
    }));
  }),

  // Financial Reports
  rest.get('/api/financial-reports/platform-profitability', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({
      platforms: mockPlatforms.map(platform => ({
        platformId: platform.id,
        platformName: platform.name,
        totalRevenue: 1000,
        totalProfit: 400,
        profitMargin: 40,
        salesCount: 10,
        creditUsed: 600
      }))
    }));
  }),

  // Default handler for unmatched requests
  rest.get('*', (req, res, ctx) => {
    console.warn(`Unhandled ${req.method} request to ${req.url.href}`);
    return res(ctx.status(404), ctx.json({ error: 'Not found' }));
  })
];

// Create server
export const server = setupServer(...handlers);

// Export mock data for tests
export { mockUsers, mockPlatforms, mockProducts, mockSales, mockCreditMovements };
