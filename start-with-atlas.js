#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ApniDukaan with MongoDB Atlas...\n');
console.log('☁️  Using MongoDB Atlas cloud database\n');

// Services to start
const services = [
  {
    name: 'Frontend',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'frontend'),
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'API Gateway',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'backend', 'api-gateway'),
    color: '\x1b[33m' // Yellow
  },
  {
    name: 'Catalog Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'backend', 'catalog-service'),
    color: '\x1b[32m' // Green
  },
  {
    name: 'User Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'backend', 'user-service'),
    color: '\x1b[35m' // Magenta
  },
  {
    name: 'Order Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'backend', 'order-service'),
    color: '\x1b[34m' // Blue
  },
  {
    name: 'Payment Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'backend', 'payment-service'),
    color: '\x1b[31m' // Red
  }
];

const processes = [];

// Start all services
services.forEach((service, index) => {
  console.log(`${service.color}[${index + 1}] Starting ${service.name}...\x1b[0m`);
  
  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: 'pipe',
    shell: true,
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      MONGODB_URI: 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0'
    }
  });

  // Add service info to output
  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${service.color}[${index + 1}] ${line}\x1b[0m`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${service.color}[${index + 1}] [ERROR] ${line}\x1b[0m`);
      }
    });
  });

  child.on('close', (code) => {
    console.log(`${service.color}[${index + 1}] ${service.name} exited with code ${code}\x1b[0m`);
  });

  processes.push(child);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all services...');
  processes.forEach(child => {
    child.kill('SIGINT');
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down all services...');
  processes.forEach(child => {
    child.kill('SIGTERM');
  });
  process.exit(0);
});

console.log('\n✅ All services started with MongoDB Atlas!');
console.log('📱 Frontend: http://localhost:3000');
console.log('🌐 API Gateway: http://localhost:4000');
console.log('🛍️  Catalog Service: http://localhost:4001');
console.log('👤 User Service: http://localhost:4002');
console.log('📦 Order Service: http://localhost:4003');
console.log('💳 Payment Service: http://localhost:4004');
console.log('☁️  Database: MongoDB Atlas (Cloud)');
console.log('\nPress Ctrl+C to stop all services');
