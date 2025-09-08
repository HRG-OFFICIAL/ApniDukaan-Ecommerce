#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ShopSphere E-commerce Platform (Simplified)...\n');

// Set environment variables
process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = 'mongodb+srv://userservice-dev:LvyasBVAfD1e9ZOB@cluster0.0ezsixh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// Services to start
const services = [
  {
    name: 'Frontend',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'frontend'),
    color: '\x1b[36m', // Cyan
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: 'http://localhost:4000',
      NEXT_PUBLIC_APP_NAME: 'ShopSphere'
    }
  },
  {
    name: 'API Gateway',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'backend', 'api-gateway'),
    color: '\x1b[33m', // Yellow
    env: {
      ...process.env,
      PORT: '4000'
    }
  },
  {
    name: 'Catalog Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'backend', 'catalog-service'),
    color: '\x1b[32m', // Green
    env: {
      ...process.env,
      PORT: '4001'
    }
  }
];

const processes = [];

// Start services
services.forEach((service, index) => {
  console.log(`${service.color}[${index + 1}] Starting ${service.name}...\x1b[0m`);
  
  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: 'pipe',
    shell: true,
    env: service.env
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

console.log('\n✅ Services started!');
console.log('📱 Frontend: http://localhost:3000');
console.log('🌐 API Gateway: http://localhost:4000');
console.log('🛍️  Catalog Service: http://localhost:4001');
console.log('\nPress Ctrl+C to stop all services');
