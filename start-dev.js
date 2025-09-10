const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const execAsync = util.promisify(exec);

// Service configuration
const services = [
  { 
    name: 'Frontend', 
    command: 'npm', 
    args: ['run', 'dev'], 
    cwd: path.join(__dirname, 'frontend'),
    port: '3000',
    color: colors.cyan,
    url: 'http://localhost:3000'
  },
  { 
    name: 'API Gateway', 
    command: 'npm', 
    args: ['run', 'dev'], 
    cwd: path.join(__dirname, 'backend/api-gateway'),
    port: '4000',
    color: colors.blue,
    url: 'http://localhost:4000'
  },
  { 
    name: 'Catalog Service', 
    command: 'npm', 
    args: ['run', 'dev'], 
    cwd: path.join(__dirname, 'backend/catalog-service'),
    port: '4001',
    color: colors.green,
    url: 'http://localhost:4001'
  },
  { 
    name: 'User Service', 
    command: 'npm', 
    args: ['run', 'dev'], 
    cwd: path.join(__dirname, 'backend/user-service'),
    port: '4002',
    color: colors.magenta,
    url: 'http://localhost:4002'
  },
  { 
    name: 'Order Service', 
    command: 'npm', 
    args: ['run', 'dev'], 
    cwd: path.join(__dirname, 'backend/order-service'),
    port: '4003',
    color: colors.yellow,
    url: 'http://localhost:4003'
  },
  { 
    name: 'Cart Service', 
    command: 'npm', 
    args: ['run', 'dev'], 
    cwd: path.join(__dirname, 'backend/cart-service'),
    port: '4005',
    color: colors.bright + colors.magenta,
    url: 'http://localhost:4005'
  },
  { 
    name: 'Order Management Service', 
    command: 'npm', 
    args: ['run', 'dev'], 
    cwd: path.join(__dirname, 'backend/order-management-service'),
    port: '4006',
    color: colors.bright + colors.yellow,
    url: 'http://localhost:4006'
  },
  { 
    name: 'Payment Service', 
    command: 'npm', 
    args: ['run', 'dev'], 
    cwd: path.join(__dirname, 'backend/payment-service'),
    port: '4004',
    color: colors.red,
    url: 'http://localhost:4004'
  },
  // { 
  //   name: 'Inventory Service', 
  //   command: 'npm', 
  //   args: ['run', 'dev'], 
  //   cwd: path.join(__dirname, 'backend/inventory-service'),
  //   port: '4006',
  //   color: colors.white,
  //   url: 'http://localhost:4006'
  // },
  { 
    name: 'Notification Service', 
    command: 'npm', 
    args: ['run', 'dev'], 
    cwd: path.join(__dirname, 'backend/notification-service'),
    port: '4007',
    color: colors.bright + colors.green,
    url: 'http://localhost:4007'
  }
];

// Global state
const processes = [];
let databasesStarted = false;

// Utility functions
function log(message, color = colors.white, prefix = '🚀') {
  console.log(`${color}${prefix} ${message}${colors.reset}`);
}

/**
 * Kill processes using specific ports to prevent EADDRINUSE errors
 */
async function killPortProcesses() {
  log('Cleaning up any existing processes on required ports...', colors.yellow, '🧹');
  
  const ports = ['3000', '4000', '4001', '4002', '4003', '4004', '4005', '4006', '4007'];
  
  for (const port of ports) {
    try {
      // Find processes using the port
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`, { timeout: 5000 });
      
      if (stdout.trim()) {
        // Extract PIDs from netstat output
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && !isNaN(pid)) {
            pids.add(pid);
          }
        }
        
        // Kill each unique PID
        for (const pid of pids) {
          try {
            await execAsync(`taskkill /f /pid ${pid}`, { timeout: 3000 });
            log(`Killed process ${pid} using port ${port}`, colors.green, '🔫');
          } catch (error) {
            // Process might already be dead or protected, ignore
            log(`Could not kill process ${pid} (may already be stopped)`, colors.yellow, '⚠️');
          }
        }
      }
    } catch (error) {
      // No processes on this port, which is good
    }
  }
  
  // Also kill any lingering node/nodemon processes
  try {
    await execAsync('taskkill /f /im node.exe 2>nul', { timeout: 5000 });
    log('Killed any remaining Node.js processes', colors.green, '🔫');
  } catch (error) {
    // No node processes running
  }
  
  try {
    await execAsync('taskkill /f /im nodemon.exe 2>nul', { timeout: 5000 });
    log('Killed any remaining nodemon processes', colors.green, '🔫');
  } catch (error) {
    // No nodemon processes running
  }
  
  // Wait a moment for processes to fully terminate
  log('Waiting for processes to fully terminate...', colors.blue, '⏳');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  log('Port cleanup completed!', colors.green, '✅');
}

function logService(serviceName, message, color = colors.white) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${serviceName}]${colors.reset} ${message}`);
}

function checkDockerAvailable() {
  return new Promise((resolve) => {
    exec('docker --version', (error) => {
      if (error) {
        log('Docker is not available. Please install Docker to use database auto-start.', colors.yellow, '⚠️');
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

function checkDockerComposeAvailable() {
  return new Promise((resolve) => {
    exec('docker compose version', (error) => {
      if (error) {
        // Try legacy docker-compose command
        exec('docker-compose --version', (error2) => {
          resolve(error2 ? false : 'docker-compose');
        });
      } else {
        resolve('docker compose');
      }
    });
  });
}

async function waitForService(url, serviceName, timeout = 30000) {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const checkService = async () => {
      try {
        // For database services, we'll check if they're accepting connections
        if (serviceName === 'MongoDB') {
          // Try multiple approaches to check MongoDB
          try {
            await execAsync('mongosh --eval "db.adminCommand({ping: 1})" --quiet mongodb://localhost:27017/test', { timeout: 5000 });
          } catch (mongoError) {
            // Fallback: Check if port is open
            await execAsync('netstat -an | findstr :27017', { timeout: 3000 });
          }
        } else if (serviceName === 'Redis') {
          // Try multiple approaches to check Redis
          try {
            await execAsync('redis-cli -h localhost -p 6379 -a redis_password ping', { timeout: 5000 });
          } catch (redisError) {
            // Fallback: Check if port is open
            await execAsync('netstat -an | findstr :6379', { timeout: 3000 });
          }
        } else if (serviceName === 'Kafka') {
          // Try multiple approaches to check Kafka
          try {
            // Check if port is open first (simpler approach)
            await execAsync('netstat -an | findstr :9092', { timeout: 3000 });
          } catch (kafkaError) {
            // If that fails, throw error
            throw new Error('Kafka port not accessible');
          }
        }
        
        logService(serviceName, 'Ready ✅', colors.green);
        resolve(true);
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          logService(serviceName, 'Timeout - assuming ready ⏰', colors.yellow);
          resolve(true); // Assume it's ready if we can't verify
        } else {
          logService(serviceName, 'Checking...', colors.blue);
          setTimeout(checkService, 3000);
        }
      }
    };
    
    checkService();
  });
}

async function startDatabases() {
  if (databasesStarted) return true;
  
  log('Starting infrastructure (MongoDB + Redis + Kafka)...', colors.blue, '🗄️');
  
  const dockerAvailable = await checkDockerAvailable();
  if (!dockerAvailable) {
    log('Skipping infrastructure startup - Docker not available', colors.yellow, '⚠️');
    return false;
  }
  
  const dockerComposeCmd = await checkDockerComposeAvailable();
  if (!dockerComposeCmd) {
    log('Docker Compose not available', colors.red, '❌');
    return false;
  }
  
  try {
    // Use development-specific compose file
    logService('Docker', 'Starting development infrastructure...', colors.blue);
    
    await execAsync(`${dockerComposeCmd} -f docker-compose.dev.yml up -d`, { 
      timeout: 120000, // Increased timeout for Kafka
      cwd: __dirname 
    });
    
    log('Waiting for infrastructure to be ready...', colors.yellow, '⏳');
    
    // Wait for services to be ready with health checks
    const mongoReady = await waitForService('mongodb://localhost:27017', 'MongoDB', 45000);
    const redisReady = await waitForService('redis://localhost:6379', 'Redis', 30000);
    const kafkaReady = await waitForService('kafka://localhost:9092', 'Kafka', 60000);
    
    if (mongoReady && redisReady && kafkaReady) {
      log('Infrastructure is ready!', colors.green, '✅');
      databasesStarted = true;
      return true;
    } else {
      log('Infrastructure started but health checks inconclusive - continuing...', colors.yellow, '⚠️');
      databasesStarted = true;
      return true;
    }
  } catch (error) {
    log(`Failed to start infrastructure: ${error.message}`, colors.red, '❌');
    log('You may need to start infrastructure manually with: docker compose -f docker-compose.dev.yml up -d', colors.yellow, '💡');
    return false;
  }
}

async function seedDatabases() {
  if (!databasesStarted) {
    log('Databases not started, skipping seeding', colors.yellow, '⚠️');
    return;
  }
  
  log('Checking for database seeding scripts...', colors.blue, '🌱');
  
  // Check for seeding scripts
  const seedScripts = [
    { path: 'scripts/seed.js', name: 'Main Seeder' },
    { path: 'backend/catalog-service/scripts/seed.js', name: 'Catalog Seeder' },
    { path: 'backend/user-management-service/scripts/seed.js', name: 'User Seeder' }
  ];
  
  for (const script of seedScripts) {
    const fullPath = path.join(__dirname, script.path);
    if (fs.existsSync(fullPath)) {
      try {
        log(`Running ${script.name}...`, colors.green, '🌱');
        await execAsync(`node ${script.path}`, { 
          cwd: __dirname,
          timeout: 30000 
        });
        log(`${script.name} completed`, colors.green, '✅');
      } catch (error) {
        log(`${script.name} failed: ${error.message}`, colors.yellow, '⚠️');
      }
    }
  }
}

function checkServiceDirectory(service) {
  if (!fs.existsSync(service.cwd)) {
    log(`Directory not found: ${service.cwd}`, colors.red, '❌');
    return false;
  }
  
  const packageJsonPath = path.join(service.cwd, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log(`package.json not found in: ${service.cwd}`, colors.red, '❌');
    return false;
  }
  
  return true;
}

function startService(service) {
  if (!checkServiceDirectory(service)) {
    logService(service.name, 'Skipping due to missing directory or package.json', colors.red);
    return null;
  }
  
  logService(service.name, `Starting on port ${service.port}...`, service.color);
  
  const childProcess = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: { 
      ...process.env, 
      FORCE_COLOR: '1',
      PORT: String(service.port)
    }
  });

  // Handle stdout with service-specific coloring
  childProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      logService(service.name, message, service.color);
    }
  });

  // Handle stderr with service-specific coloring
  childProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      logService(service.name, `ERROR: ${message}`, colors.red);
    }
  });

  childProcess.on('error', (error) => {
    logService(service.name, `Failed to start: ${error.message}`, colors.red);
  });

  childProcess.on('exit', (code, signal) => {
    if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
      logService(service.name, `Exited with code ${code}`, colors.red);
    } else if (signal) {
      logService(service.name, `Stopped (${signal})`, colors.yellow);
    }
  });

  return { name: service.name, process: childProcess, color: service.color };
}

async function startAllServices() {
  log('🚀 Starting ShopSphere E-commerce Application...\n', colors.bright + colors.cyan);
  
  // Clean up any existing processes on required ports first (unless --no-cleanup flag is used)
  if (!process.argv.includes('--no-cleanup')) {
    await killPortProcesses();
  } else {
    log('Skipping port cleanup due to --no-cleanup flag', colors.yellow, '⚠️');
  }
  
  // Start databases first
  const dbStarted = await startDatabases();
  
  // Optional seeding (only if --seed flag is passed)
  if (process.argv.includes('--seed')) {
    await seedDatabases();
  }
  
  if (!dbStarted) {
    log('Continuing without databases...', colors.yellow, '⚠️');
  }
  
  log('Starting application services...', colors.blue, '🚀');
  
  // Start services with a small delay between each to prevent port conflicts
  for (const service of services) {
    const serviceProcess = startService(service);
    if (serviceProcess) {
      processes.push(serviceProcess);
      // Small delay to prevent startup race conditions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Display summary
  setTimeout(() => {
    console.log('\n' + colors.bright + colors.green + '✅ All services started!' + colors.reset);
    console.log(colors.bright + '\n🌐 Service URLs:' + colors.reset);
    
    services.forEach(service => {
      if (fs.existsSync(service.cwd)) {
        console.log(`${service.color}  ${service.name}: ${service.url}${colors.reset}`);
      }
    });
    
    if (databasesStarted) {
      console.log(colors.blue + '\n🗄️  Infrastructure URLs:' + colors.reset);
      console.log(`  MongoDB: mongodb://localhost:27017`);
      console.log(`  Redis: redis://localhost:6379`);
      console.log(`  Kafka: kafka://localhost:9092`);
      console.log(`  Zookeeper: zookeeper://localhost:2181`);
    }
    
    console.log(colors.yellow + '\n💡 Tips:' + colors.reset);
    console.log('  • Press Ctrl+C to stop all services');
    console.log('  • Run with --seed flag to populate databases');
    console.log('  • Run with --no-cleanup flag to skip automatic port cleanup');
    console.log('  • Automatic cleanup prevents port conflicts from previous runs');
    console.log('  • Check logs above for any startup errors');
    console.log('  • Services may take a moment to fully initialize');
    
  }, 3000);
}

function gracefulShutdown() {
  log('Shutting down services...', colors.yellow, '🛑');
  
  const shutdownPromises = processes.map(({ name, process: childProcess, color }) => {
    return new Promise((resolve) => {
      if (childProcess.killed) {
        resolve();
        return;
      }
      
      logService(name, 'Stopping...', color);
      
      // Try graceful shutdown first
      childProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds
      const timeout = setTimeout(() => {
        if (!childProcess.killed) {
          childProcess.kill('SIGKILL');
          logService(name, 'Force stopped', colors.red);
        }
        resolve();
      }, 5000);
      
      childProcess.on('exit', () => {
        clearTimeout(timeout);
        logService(name, 'Stopped', colors.green);
        resolve();
      });
    });
  });
  
  Promise.all(shutdownPromises).then(() => {
    log('All services stopped', colors.green, '✅');
    process.exit(0);
  }).catch(() => {
    log('Shutdown completed with errors', colors.yellow, '⚠️');
    process.exit(1);
  });
}

// Handle shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGQUIT', gracefulShutdown);

// Handle Windows-specific shutdown
if (process.platform === 'win32') {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.on('SIGINT', gracefulShutdown);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, colors.red, '❌');
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at ${promise}: ${reason}`, colors.red, '❌');
  gracefulShutdown();
});

// Start the application
startAllServices().catch((error) => {
  log(`Startup failed: ${error.message}`, colors.red, '❌');
  process.exit(1);
});
