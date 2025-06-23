import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup() {
  console.log('🚀 Starting global test setup...');
  
  // Ensure test reports directory exists
  const reportsDir = path.join(process.cwd(), 'tests', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Create test data directory
  const testDataDir = path.join(process.cwd(), 'tests', 'data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }

  // Setup test database or mock data if needed
  await setupTestData();

  // Warm up the application
  await warmupApplication();

  console.log('✅ Global test setup completed');
}

async function setupTestData() {
  console.log('📊 Setting up test data...');
  
  // Create mock data files for consistent testing
  const mockData = {
    platforms: [
      {
        id: 'test-platform-1',
        name: 'Test Netflix Supplier',
        description: 'Test Netflix account supplier',
        contactName: 'Test Contact',
        contactEmail: 'test@supplier.com',
        contactPhone: '+1-555-0123',
        creditBalance: 1500,
        lowBalanceThreshold: 500,
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      },
      {
        id: 'test-platform-2',
        name: 'Test Spotify Supplier',
        description: 'Test music streaming supplier',
        contactName: 'Test Music Contact',
        contactEmail: 'music@supplier.com',
        contactPhone: '+1-555-0456',
        creditBalance: 50, // Low balance for testing
        lowBalanceThreshold: 200,
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      }
    ],
    products: [
      {
        id: 'test-product-1',
        name: 'Test Netflix Premium 1 Month',
        category: 'iptv',
        durationType: '1month',
        description: 'Test Netflix Premium subscription',
        currentStock: 45,
        minStockAlert: 10,
        averagePurchasePrice: 12,
        suggestedSellPrice: 25,
        platformId: 'test-platform-1',
        platformBuyingPrice: 15,
        profitMargin: 40,
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      }
    ],
    sales: [
      {
        id: 'test-sale-1',
        productId: 'test-product-1',
        productName: 'Test Netflix Premium 1 Month',
        customerName: 'Test Customer',
        customerPhone: '+1-555-0789',
        quantity: 1,
        unitPrice: 25,
        totalPrice: 25,
        saleDate: '2025-01-15T10:30:00Z',
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        profit: 10,
        platformId: 'test-platform-1',
        platformBuyingPrice: 15,
        paymentType: 'one-time',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T10:30:00Z'
      }
    ]
  };

  const testDataPath = path.join(process.cwd(), 'tests', 'data', 'mockData.json');
  fs.writeFileSync(testDataPath, JSON.stringify(mockData, null, 2));
  
  console.log('✅ Test data setup completed');
}

async function warmupApplication() {
  console.log('🔥 Warming up application...');
  
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Navigate to the application to ensure it's ready
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Wait for the app to be fully loaded
    await page.waitForSelector('body', { timeout: 30000 });
    
    // Check if the app is responsive
    const title = await page.title();
    console.log(`📱 Application loaded: ${title}`);
    
    await browser.close();
    console.log('✅ Application warmup completed');
  } catch (error) {
    console.warn('⚠️ Application warmup failed:', error.message);
    // Don't fail the setup if warmup fails
  }
}

export default globalSetup;
