// Simple test server to test the API function
const http = require('http');
const url = require('url');
const { handler } = require('./netlify/functions/api.js');

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Collect request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      // Create Netlify event object
      const event = {
        httpMethod: req.method,
        path: path,
        headers: req.headers,
        body: body || null,
        queryStringParameters: parsedUrl.query
      };
      
      console.log(`${req.method} ${path}`);
      
      // Call the handler
      const response = await handler(event, {});
      
      // Send response
      res.writeHead(response.statusCode, response.headers);
      res.end(response.body);
      
    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('API endpoints available:');
  console.log('  GET  /users');
  console.log('  POST /users');
  console.log('  GET  /subscribers');
  console.log('  POST /subscribers');
  console.log('  GET  /digital-products');
  console.log('  GET  /stock-purchases');
  console.log('  GET  /stock-sales');
  console.log('  GET  /settings');
});
