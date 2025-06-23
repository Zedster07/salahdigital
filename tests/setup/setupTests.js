import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from '../mocks/server';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'error'
  });
  
  // Suppress console errors and warnings during tests unless they're test-related
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || 
       args[0].includes('Error:') ||
       args[0].includes('Failed to'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterEach(() => {
  // Reset MSW handlers
  server.resetHandlers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear fetch mock
  if (fetch.mockClear) {
    fetch.mockClear();
  }
});

afterAll(() => {
  // Stop MSW server
  server.close();
  
  // Restore console methods
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
global.testUtils = {
  // Wait for async operations
  waitFor: (callback, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          const result = callback();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Timeout waiting for condition'));
          } else {
            setTimeout(check, 100);
          }
        } catch (error) {
          if (Date.now() - startTime > timeout) {
            reject(error);
          } else {
            setTimeout(check, 100);
          }
        }
      };
      check();
    });
  },
  
  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'admin',
    status: 'verified',
    createdAt: '2025-01-01T00:00:00Z',
    emailVerified: true,
    loginAttempts: 0,
    twoFactorEnabled: false,
    ...overrides
  }),
  
  // Create mock platform
  createMockPlatform: (overrides = {}) => ({
    id: 'platform-123',
    name: 'Test Platform',
    description: 'Test platform description',
    contactName: 'John Doe',
    contactEmail: 'john@platform.com',
    contactPhone: '+1-555-0123',
    creditBalance: 1000,
    lowBalanceThreshold: 100,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides
  }),
  
  // Create mock product
  createMockProduct: (overrides = {}) => ({
    id: 'product-123',
    name: 'Test Product',
    category: 'iptv',
    durationType: '1month',
    description: 'Test product description',
    currentStock: 50,
    minStockAlert: 10,
    averagePurchasePrice: 10,
    suggestedSellPrice: 20,
    platformId: 'platform-123',
    platformBuyingPrice: 15,
    profitMargin: 25,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides
  }),
  
  // Create mock sale
  createMockSale: (overrides = {}) => ({
    id: 'sale-123',
    productId: 'product-123',
    productName: 'Test Product',
    customerName: 'Jane Smith',
    customerPhone: '+1-555-0456',
    quantity: 1,
    unitPrice: 20,
    totalPrice: 20,
    saleDate: '2025-01-01T00:00:00Z',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    profit: 5,
    platformId: 'platform-123',
    platformBuyingPrice: 15,
    paymentType: 'one-time',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides
  }),
  
  // Create mock credit movement
  createMockCreditMovement: (overrides = {}) => ({
    id: 'movement-123',
    platformId: 'platform-123',
    type: 'credit_added',
    amount: 500,
    previousBalance: 500,
    newBalance: 1000,
    reference: 'TEST-REF-123',
    description: 'Test credit addition',
    createdBy: 'user-123',
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides
  }),
  
  // Mock API responses
  mockApiResponse: (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers({
      'content-type': 'application/json'
    })
  }),
  
  // Mock error response
  mockApiError: (message = 'API Error', status = 500) => ({
    ok: false,
    status,
    statusText: 'Error',
    json: jest.fn().mockResolvedValue({ error: message }),
    text: jest.fn().mockResolvedValue(JSON.stringify({ error: message })),
    headers: new Headers({
      'content-type': 'application/json'
    })
  })
};

// Custom matchers
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },
  
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
  
  toHaveValidCurrency(received, currency = 'DZD') {
    const pass = typeof received === 'number' && received >= 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ${currency} amount`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ${currency} amount`,
        pass: false,
      };
    }
  }
});
