const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ShopSphere E-commerce Application...\n');

// Start services
const services = [
  { name: 'Frontend', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, 'frontend') },
  { name: 'API Gateway', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, 'backend/api-gateway') },
  { name: 'Catalog Service', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, 'backend/catalog-service') }
];

const processes = [];

services.forEach(service => {
  console.log(`Starting ${service.name}...`);
  
  const process = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: 'inherit',
    shell: true
  });

  process.on('error', (error) => {
    console.error(`Failed to start ${service.name}:`, error.message);
  });

  process.on('exit', (code) => {
    if (code !== 0) {
      console.error(`${service.name} exited with code ${code}`);
    }
  });

  processes.push({ name: service.name, process });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...');
  processes.forEach(({ name, process }) => {
    console.log(`Stopping ${name}...`);
    process.kill('SIGINT');
  });
  
  setTimeout(() => {
    console.log('✅ All services stopped');
    process.exit(0);
  }, 2000);
});

console.log('\n✅ All services started!');
console.log('📱 Frontend: http://localhost:3000');
console.log('🌐 API Gateway: http://localhost:4000');
console.log('🛍️  Catalog Service: http://localhost:4001');
console.log('\nPress Ctrl+C to stop all services');
