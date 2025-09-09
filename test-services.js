#!/usr/bin/env node

const http = require('http');

console.log('🧪 Testing ShopSphere Services...\n');

const services = [
  { name: 'API Gateway', url: 'http://localhost:4000/health' },
  { name: 'Catalog Service', url: 'http://localhost:4001/health' },
  { name: 'User Service', url: 'http://localhost:4002/health' },
  { name: 'Order Service', url: 'http://localhost:4003/health' },
  { name: 'Payment Service', url: 'http://localhost:4004/health' }
];

async function testService(service) {
  return new Promise((resolve) => {
    const req = http.get(service.url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            name: service.name,
            status: 'healthy',
            response: response
          });
        } catch (e) {
          resolve({
            name: service.name,
            status: 'unhealthy',
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        name: service.name,
        status: 'unhealthy',
        error: err.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name: service.name,
        status: 'unhealthy',
        error: 'Timeout'
      });
    });
  });
}

async function runTests() {
  console.log('Testing all services...\n');
  
  const results = await Promise.all(services.map(testService));
  
  let healthyCount = 0;
  let unhealthyCount = 0;
  
  results.forEach(result => {
    if (result.status === 'healthy') {
      console.log(`✅ ${result.name}: HEALTHY`);
      healthyCount++;
    } else {
      console.log(`❌ ${result.name}: UNHEALTHY - ${result.error}`);
      unhealthyCount++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Healthy: ${healthyCount}`);
  console.log(`   Unhealthy: ${unhealthyCount}`);
  
  if (unhealthyCount === 0) {
    console.log('\n🎉 All services are running correctly!');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔗 API Gateway: http://localhost:4000');
  } else {
    console.log('\n⚠️  Some services are not running. Please check the logs.');
  }
}

runTests().catch(console.error);