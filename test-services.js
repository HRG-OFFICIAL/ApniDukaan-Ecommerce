#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing ShopSphere Services...\n');

// Test individual services
const testService = (serviceName, servicePath, port) => {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Testing ${serviceName}...`);
    
    const child = spawn('npm', ['run', 'dev'], {
      cwd: servicePath,
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        PORT: port.toString(),
        NODE_ENV: 'development'
      }
    });

    let output = '';
    let hasStarted = false;

    child.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('listening') || output.includes('started') || output.includes('Server running')) {
        if (!hasStarted) {
          console.log(`✅ ${serviceName} started successfully on port ${port}`);
          hasStarted = true;
          child.kill('SIGINT');
          resolve(true);
        }
      }
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (!hasStarted) {
        console.log(`❌ ${serviceName} failed to start (exit code: ${code})`);
        console.log(`Output: ${output}`);
        resolve(false);
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!hasStarted) {
        child.kill('SIGINT');
        console.log(`⏰ ${serviceName} timed out`);
        resolve(false);
      }
    }, 10000);
  });
};

async function runTests() {
  const services = [
    {
      name: 'Catalog Service',
      path: path.join(__dirname, 'backend', 'catalog-service'),
      port: 4001
    },
    {
      name: 'User Service',
      path: path.join(__dirname, 'backend', 'user-service'),
      port: 4002
    },
    {
      name: 'Order Service',
      path: path.join(__dirname, 'backend', 'order-service'),
      port: 4003
    },
    {
      name: 'Payment Service',
      path: path.join(__dirname, 'backend', 'payment-service'),
      port: 4004
    },
    {
      name: 'API Gateway',
      path: path.join(__dirname, 'backend', 'api-gateway'),
      port: 4000
    }
  ];

  const results = [];
  
  for (const service of services) {
    const result = await testService(service.name, service.path, service.port);
    results.push({ ...service, success: result });
    console.log(''); // Empty line for readability
  }

  console.log('📊 Test Results:');
  console.log('================');
  
  results.forEach(service => {
    const status = service.success ? '✅' : '❌';
    console.log(`${status} ${service.name} (Port ${service.port})`);
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 ${successCount}/${results.length} services working correctly`);
  
  if (successCount === results.length) {
    console.log('🎉 All services are working! You can now start the full application.');
  } else {
    console.log('⚠️  Some services need attention before running the full application.');
  }
}

runTests().catch(console.error);
