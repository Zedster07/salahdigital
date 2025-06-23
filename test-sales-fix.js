// Test script to verify the stock sales fix
async function testSalesFix() {
  console.log('🧪 Testing Stock Sales Fix...\n');
  
  const baseURL = 'https://salahdigital.netlify.app/.netlify/functions/api';
  
  // Create a test sale payload (similar to what the frontend sends)
  const testSalePayload = {
    id: 'test-sale-' + Date.now(),
    productId: 'prod-123',
    productName: 'Test Product',
    subscriberId: null,
    customerName: 'Test Customer',
    customerPhone: '0555123456',
    quantity: 1,
    unitPrice: 100,
    totalPrice: 100,
    saleDate: new Date().toISOString(),
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    profit: 50,
    platformId: null,
    platformBuyingPrice: 0,
    paymentType: 'one-time',
    notes: 'Test sale for debugging PostgreSQL parameter type issue',
    createdAt: new Date().toISOString()
  };

  try {
    console.log('📤 Sending test sale payload...');
    console.log('Payload:', JSON.stringify(testSalePayload, null, 2));
    
    const response = await fetch(`${baseURL}/stock-sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testSalePayload)
    });

    console.log(`📥 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Success! Sale created:', result);
    
    // Test getting the sale back
    console.log('\n🔍 Verifying sale was saved...');
    const getResponse = await fetch(`${baseURL}/stock-sales`);
    
    if (getResponse.ok) {
      const sales = await getResponse.json();
      const createdSale = sales.find(sale => sale.id === testSalePayload.id);
      
      if (createdSale) {
        console.log('✅ Sale verified in database:', createdSale.id);
      } else {
        console.log('❌ Sale not found in database');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSalesFix().then(() => {
  console.log('\n🎉 Test completed!');
}).catch(console.error); 