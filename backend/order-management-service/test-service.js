const http = require('http');

// Test if the service is running
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✅ Service is running! Status: ${res.statusCode}`);
  console.log('Response headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.log(`❌ Service is not running: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Service request timed out');
  req.destroy();
  process.exit(1);
});

req.end();
