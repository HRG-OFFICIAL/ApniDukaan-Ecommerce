const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// Service configurations
const services = [
  {
    name: 'Catalog Service',
    port: 4001,
    path: './backend/catalog-service',
    startCommand: 'npm run dev',
    healthEndpoint: '/health',
    testEndpoints: [
      { method: 'GET', path: '/api/products', description: 'Get products' },
      { method: 'GET', path: '/api/categories', description: 'Get categories' },
      { method: 'GET', path: '/api', description: 'Get API info' }
    ]
  },
  {
    name: 'User Service',
    port: 4002,
    path: './backend/user-service',
    startCommand: 'npm run dev',
    healthEndpoint: '/health',
    testEndpoints: [
      { method: 'GET', path: '/api/users', description: 'Get users' },
      { method: 'GET', path: '/api', description: 'Get API info' }
    ]
  },
  {
    name: 'Cart Service',
    port: 4003,
    path: './backend/cart-service',
    startCommand: 'npm run dev',
    healthEndpoint: '/health',
    testEndpoints: [
      { method: 'GET', path: '/api/cart', description: 'Get cart' },
      { method: 'GET', path: '/api', description: 'Get API info' }
    ]
  },
  {
    name: 'Order Service',
    port: 4004,
    path: './backend/order-service',
    startCommand: 'npm run dev',
    healthEndpoint: '/health',
    testEndpoints: [
      { method: 'GET', path: '/api/orders', description: 'Get orders' },
      { method: 'GET', path: '/api', description: 'Get API info' }
    ]
  },
  {
    name: 'Payment Service',
    port: 4005,
    path: './backend/payment-service',
    startCommand: 'npm run dev',
    healthEndpoint: '/health',
    testEndpoints: [
      { method: 'GET', path: '/api/payments', description: 'Get payments' },
      { method: 'GET', path: '/api', description: 'Get API info' }
    ]
  }
];

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds
const HEALTH_CHECK_INTERVAL = 2000; // 2 seconds
const MAX_HEALTH_CHECKS = 15; // 30 seconds total

class ServiceTester {
  constructor() {
    this.runningServices = new Map();
    this.testResults = new Map();
  }

  async startService(service) {
    console.log(`\n🚀 Starting ${service.name}...`);
    
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'dev'], {
        cwd: service.path,
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`[${service.name}] ${data.toString().trim()}`);
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log(`[${service.name} ERROR] ${data.toString().trim()}`);
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Service ${service.name} exited with code ${code}\nError: ${errorOutput}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start ${service.name}: ${error.message}`));
      });

      // Store the child process
      this.runningServices.set(service.name, child);

      // Wait for service to be ready
      this.waitForService(service)
        .then(() => resolve(child))
        .catch(reject);
    });
  }

  async waitForService(service) {
    console.log(`⏳ Waiting for ${service.name} to be ready...`);
    
    for (let i = 0; i < MAX_HEALTH_CHECKS; i++) {
      try {
        const response = await axios.get(`http://localhost:${service.port}${service.healthEndpoint}`, {
          timeout: 5000
        });
        
        if (response.status === 200) {
          console.log(`✅ ${service.name} is ready!`);
          return;
        }
      } catch (error) {
        // Service not ready yet, wait and try again
        await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
      }
    }
    
    throw new Error(`${service.name} failed to start within ${TEST_TIMEOUT}ms`);
  }

  async testService(service) {
    console.log(`\n🧪 Testing ${service.name}...`);
    const results = {
      health: false,
      endpoints: []
    };

    try {
      // Test health endpoint
      const healthResponse = await axios.get(`http://localhost:${service.port}${service.healthEndpoint}`, {
        timeout: 5000
      });
      
      if (healthResponse.status === 200) {
        results.health = true;
        console.log(`✅ Health check passed for ${service.name}`);
      }
    } catch (error) {
      console.log(`❌ Health check failed for ${service.name}: ${error.message}`);
    }

    // Test other endpoints
    for (const endpoint of service.testEndpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `http://localhost:${service.port}${endpoint.path}`,
          timeout: 5000
        });
        
        results.endpoints.push({
          path: endpoint.path,
          method: endpoint.method,
          status: response.status,
          success: true,
          description: endpoint.description
        });
        
        console.log(`✅ ${endpoint.method} ${endpoint.path} - ${response.status}`);
      } catch (error) {
        results.endpoints.push({
          path: endpoint.path,
          method: endpoint.method,
          status: error.response?.status || 'ERROR',
          success: false,
          error: error.message,
          description: endpoint.description
        });
        
        console.log(`❌ ${endpoint.method} ${endpoint.path} - ${error.message}`);
      }
    }

    this.testResults.set(service.name, results);
    return results;
  }

  async stopService(serviceName) {
    const child = this.runningServices.get(serviceName);
    if (child) {
      console.log(`🛑 Stopping ${serviceName}...`);
      child.kill('SIGTERM');
      this.runningServices.delete(serviceName);
    }
  }

  async stopAllServices() {
    console.log('\n🛑 Stopping all services...');
    for (const [serviceName, child] of this.runningServices) {
      console.log(`Stopping ${serviceName}...`);
      child.kill('SIGTERM');
    }
    this.runningServices.clear();
  }

  printResults() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    for (const [serviceName, results] of this.testResults) {
      console.log(`\n${serviceName}:`);
      console.log(`  Health Check: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
      
      console.log('  Endpoints:');
      for (const endpoint of results.endpoints) {
        const status = endpoint.success ? '✅' : '❌';
        console.log(`    ${status} ${endpoint.method} ${endpoint.path} - ${endpoint.status}`);
        if (!endpoint.success && endpoint.error) {
          console.log(`      Error: ${endpoint.error}`);
        }
      }
    }

    // Summary
    const totalServices = this.testResults.size;
    const healthyServices = Array.from(this.testResults.values()).filter(r => r.health).length;
    const totalEndpoints = Array.from(this.testResults.values()).reduce((sum, r) => sum + r.endpoints.length, 0);
    const successfulEndpoints = Array.from(this.testResults.values()).reduce((sum, r) => sum + r.endpoints.filter(e => e.success).length, 0);

    console.log('\n📈 SUMMARY:');
    console.log(`  Services: ${healthyServices}/${totalServices} healthy`);
    console.log(`  Endpoints: ${successfulEndpoints}/${totalEndpoints} successful`);
  }
}

async function runTests() {
  const tester = new ServiceTester();
  
  try {
    console.log('🚀 Starting comprehensive service tests...');
    console.log('This will test all microservices in the ApniDukaan e-commerce platform.\n');

    // Start all services
    for (const service of services) {
      try {
        await tester.startService(service);
      } catch (error) {
        console.log(`❌ Failed to start ${service.name}: ${error.message}`);
        continue;
      }
    }

    // Wait a bit for all services to stabilize
    console.log('\n⏳ Waiting for all services to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test all services
    for (const service of services) {
      await tester.testService(service);
    }

    // Print results
    tester.printResults();

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    // Clean up
    await tester.stopAllServices();
    console.log('\n✅ Test suite completed!');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, stopping all services...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, stopping all services...');
  process.exit(0);
});

// Run the tests
runTests().catch(console.error);