// Test script for the API function
const { handler } = require('./netlify/functions/api.js');

async function testAPI() {
  console.log('Testing API function...');
  
  // Test GET users endpoint
  const getUsersEvent = {
    httpMethod: 'GET',
    path: '/.netlify/functions/api/users',
    headers: {},
    body: null
  };
  
  try {
    console.log('\n1. Testing GET /users...');
    const response = await handler(getUsersEvent, {});
    console.log('Status:', response.statusCode);
    console.log('Headers:', response.headers);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log('Success! Users data:', data.length ? `${data.length} users found` : 'No users found');
    } else {
      console.log('Error response:', response.body);
    }
  } catch (error) {
    console.error('Error testing GET /users:', error.message);
  }
  
  // Test GET subscribers endpoint
  const getSubscribersEvent = {
    httpMethod: 'GET',
    path: '/.netlify/functions/api/subscribers',
    headers: {},
    body: null
  };
  
  try {
    console.log('\n2. Testing GET /subscribers...');
    const response = await handler(getSubscribersEvent, {});
    console.log('Status:', response.statusCode);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log('Success! Subscribers data:', data.length ? `${data.length} subscribers found` : 'No subscribers found');
    } else {
      console.log('Error response:', response.body);
    }
  } catch (error) {
    console.error('Error testing GET /subscribers:', error.message);
  }
  
  // Test POST create subscriber
  const createSubscriberEvent = {
    httpMethod: 'POST',
    path: '/.netlify/functions/api/subscribers',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      phone: '+1234567890',
      email: 'test@example.com',
      wilaya: 'Test Wilaya'
    })
  };
  
  try {
    console.log('\n3. Testing POST /subscribers...');
    const response = await handler(createSubscriberEvent, {});
    console.log('Status:', response.statusCode);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log('Success! Created subscriber:', data.id);
    } else {
      console.log('Error response:', response.body);
    }
  } catch (error) {
    console.error('Error testing POST /subscribers:', error.message);
  }
}

testAPI().then(() => {
  console.log('\nAPI testing completed!');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
