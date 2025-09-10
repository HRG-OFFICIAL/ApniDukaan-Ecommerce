const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ApniDukaan E-commerce Platform with Kafka...\n');

// Service configurations
const services = [
  {
    name: 'Catalog Service',
    port: 4001,
    path: './backend/catalog-service',
    command: 'npm run dev'
  },
  {
    name: 'User Service', 
    port: 4002,
    path: './backend/user-service',
    command: 'npm run dev'
  },
  {
    name: 'Cart Service',
    port: 4003,
    path: './backend/cart-service',
    command: 'npm run dev'
  },
  {
    name: 'Order Service',
    port: 4004,
    path: './backend/order-service',
    command: 'npm run dev'
  },
  {
    name: 'Payment Service',
    port: 4005,
    path: './backend/payment-service',
    command: 'npm run dev'
  }
];

// Start all services
const processes = [];

services.forEach((service, index) => {
  console.log(`🚀 Starting ${service.name}...`);
  
  const child = spawn('npm', ['run', 'dev'], {
    cwd: service.path,
    stdio: 'pipe',
    shell: true,
    env: {
      ...process.env,
      PORT: service.port,
      NODE_ENV: 'development'
    }
  });

  child.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${service.name}] ${output}`);
    }
  });

  child.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('KafkaJS') && !output.includes('AWS SDK')) {
      console.log(`[${service.name} ERROR] ${output}`);
    }
  });

  child.on('close', (code) => {
    console.log(`[${service.name}] Process exited with code ${code}`);
  });

  processes.push({ name: service.name, process: child, port: service.port });
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all services...');
  processes.forEach(({ name, process: child }) => {
    console.log(`Stopping ${name}...`);
    child.kill('SIGTERM');
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down all services...');
  processes.forEach(({ name, process: child }) => {
    console.log(`Stopping ${name}...`);
    child.kill('SIGTERM');
  });
  process.exit(0);
});

console.log('\n✅ All services started!');
console.log('📊 Service URLs:');
services.forEach(service => {
  console.log(`  ${service.name}: http://localhost:${service.port}`);
});
console.log('\n🛑 Press Ctrl+C to stop all services');
