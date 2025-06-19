// Playwright test for API endpoints
import { chromium } from 'playwright';

async function testAPI() {
  console.log('🎭 Starting Playwright API tests...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Base URL - change this to your actual Netlify URL or local dev server
  const baseURL = 'http://localhost:8888/.netlify/functions/api';
  // For production: const baseURL = 'https://your-site.netlify.app/.netlify/functions/api';
  
  try {
    console.log('Testing API endpoints...\n');
    
    // Test 1: GET /users
    console.log('1. Testing GET /users...');
    try {
      const response = await page.request.get(`${baseURL}/users`);
      console.log(`   Status: ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`   ✅ Success! Found ${Array.isArray(data) ? data.length : 0} users`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Connection error: ${error.message}`);
    }
    
    // Test 2: GET /subscribers
    console.log('\n2. Testing GET /subscribers...');
    try {
      const response = await page.request.get(`${baseURL}/subscribers`);
      console.log(`   Status: ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`   ✅ Success! Found ${Array.isArray(data) ? data.length : 0} subscribers`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Connection error: ${error.message}`);
    }
    
    // Test 3: GET /digital-products
    console.log('\n3. Testing GET /digital-products...');
    try {
      const response = await page.request.get(`${baseURL}/digital-products`);
      console.log(`   Status: ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`   ✅ Success! Found ${Array.isArray(data) ? data.length : 0} digital products`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Connection error: ${error.message}`);
    }
    
    // Test 4: POST /subscribers (create new subscriber)
    console.log('\n4. Testing POST /subscribers...');
    try {
      const testSubscriber = {
        name: 'Test User ' + Date.now(),
        phone: '+1234567890',
        email: 'test@example.com',
        wilaya: 'Test Wilaya',
        notes: 'Created by Playwright test'
      };
      
      const response = await page.request.post(`${baseURL}/subscribers`, {
        data: testSubscriber,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Status: ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`   ✅ Success! Created subscriber with ID: ${data.id}`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Connection error: ${error.message}`);
    }
    
    // Test 5: GET /settings
    console.log('\n5. Testing GET /settings...');
    try {
      const response = await page.request.get(`${baseURL}/settings`);
      console.log(`   Status: ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`   ✅ Success! Settings retrieved`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Connection error: ${error.message}`);
    }
    
  } finally {
    await browser.close();
  }
  
  console.log('\n🎭 Playwright API testing completed!');
  console.log('\n📝 Notes:');
  console.log('- Make sure your Netlify dev server is running: npx netlify dev');
  console.log('- Or update the baseURL to your deployed Netlify site');
  console.log('- Ensure your database is accessible and tables exist');
}

// Run the test
testAPI().catch(console.error);
