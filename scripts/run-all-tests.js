#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running All Tests for ApniDukaan E-commerce Platform\n');

const services = [
  { name: 'Frontend', path: 'frontend', command: 'npm test' },
  { name: 'API Gateway', path: 'backend/api-gateway', command: 'npm test' },
  { name: 'Catalog Service', path: 'backend/catalog-service', command: 'npm test' },
  { name: 'User Service', path: 'backend/user-service', command: 'npm test' },
  { name: 'Order Service', path: 'backend/order-service', command: 'npm test' },
  { name: 'Payment Service', path: 'backend/payment-service', command: 'npm test' },
  { name: 'Cart Service', path: 'backend/cart-service', command: 'npm test' },
  { name: 'Notification Service', path: 'backend/notification-service', command: 'npm test' },
  { name: 'Search Service', path: 'backend/search-service', command: 'npm test' }
];

const results = [];

for (const service of services) {
  console.log(`\n📦 Testing ${service.name}...`);
  console.log('─'.repeat(50));
  
  try {
    const servicePath = path.join(process.cwd(), service.path);
    const output = execSync(service.command, { 
      cwd: servicePath, 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    console.log(`✅ ${service.name} - Tests passed`);
    results.push({ service: service.name, status: 'PASSED', output });
  } catch (error) {
    console.log(`❌ ${service.name} - Tests failed`);
    console.log(error.stdout || error.message);
    results.push({ service: service.name, status: 'FAILED', error: error.message });
  }
}

console.log('\n📊 Test Results Summary');
console.log('═'.repeat(50));

let passedCount = 0;
let failedCount = 0;

results.forEach(result => {
  const status = result.status === 'PASSED' ? '✅' : '❌';
  console.log(`${status} ${result.service}: ${result.status}`);
  
  if (result.status === 'PASSED') {
    passedCount++;
  } else {
    failedCount++;
  }
});

console.log('\n📈 Overall Results');
console.log('─'.repeat(30));
console.log(`✅ Passed: ${passedCount}`);
console.log(`❌ Failed: ${failedCount}`);
console.log(`📊 Total: ${results.length}`);

if (failedCount === 0) {
  console.log('\n🎉 All tests passed! The platform is ready for production.');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failedCount} service(s) have failing tests. Please fix them before deployment.`);
  process.exit(1);
}
