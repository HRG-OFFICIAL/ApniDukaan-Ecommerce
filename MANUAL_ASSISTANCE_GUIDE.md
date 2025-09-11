# 🛠️ ApniDukaan Development - Manual Assistance Guide

This guide provides step-by-step instructions for manually resolving common issues and providing assistance when the automated startup script needs help.

## 📋 **Quick Checklist**

Before running `node start-dev.js`, ensure:

- [ ] Docker Desktop is running
- [ ] Environment variables are set (`.env` file exists)
- [ ] All service dependencies are installed
- [ ] No other services are using the required ports

---

## 🐳 **Docker Desktop Management**

### **Starting Docker Desktop**

#### **Windows:**
1. **Option 1 - Start Menu:**
   - Press `Windows Key` → Type "Docker Desktop" → Click to start
   - Wait for the Docker Desktop icon in system tray to show "Docker Desktop is running"

2. **Option 2 - Command Line:**
   ```powershell
   # Start Docker Desktop service
   net start com.docker.service
   
   # Or start the application directly
   & "C:\Program Files\Docker\Docker\Docker Desktop.exe"
   ```

3. **Option 3 - Task Manager:**
   - Open Task Manager (`Ctrl+Shift+Esc`)
   - Go to Services tab → Find "com.docker.service" → Right-click → Start

#### **Verification:**
```bash
# Check if Docker is running
docker version

# Check if Docker Compose is available
docker compose version

# Expected output should show version info without errors
```

### **Docker Desktop Troubleshooting**

#### **Common Issues:**

1. **"Docker Desktop is not running"**
   ```bash
   # Solution 1: Restart Docker Desktop
   # Close Docker Desktop completely, then restart it
   
   # Solution 2: Restart Docker service (Windows)
   net stop com.docker.service
   net start com.docker.service
   ```

2. **"WSL 2 backend not found"** (Windows)
   ```bash
   # Install/Update WSL 2
   wsl --update
   wsl --set-default-version 2
   
   # Then restart Docker Desktop
   ```

3. **Port conflicts (27017, 6379)**
   ```bash
   # Check what's using the ports
   netstat -ano | findstr :27017
   netstat -ano | findstr :6379
   
   # Stop existing services if needed
   # Or modify docker-compose.dev.yml to use different ports
   ```

---

## 🔧 **Manual Database Startup**

If the automated database startup fails, start them manually:

### **Option 1: Using Docker Compose (Recommended)**
```bash
# Start only databases
docker compose -f docker-compose.dev.yml up -d mongodb redis

# Check if containers are running
docker ps

# View logs if there are issues
docker compose -f docker-compose.dev.yml logs mongodb
docker compose -f docker-compose.dev.yml logs redis
```

### **Option 2: Individual Docker Commands**
```bash
# Start MongoDB
docker run -d --name mongodb-dev \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -e MONGO_INITDB_DATABASE=ApniDukaan \
  mongo:7.0

# Start Redis
docker run -d --name redis-dev \
  -p 6379:6379 \
  redis:7.2-alpine redis-server --appendonly yes --requirepass redis_password
```

### **Database Health Check**
```bash
# Test MongoDB connection
mongosh "mongodb://admin:password@localhost:27017/?authSource=admin"

# Test Redis connection (if you have redis-cli installed)
redis-cli -h localhost -p 6379 -a redis_password ping

# Alternative: Using Docker exec
docker exec -it mongodb-dev mongosh --eval "db.adminCommand({ping: 1})"
docker exec -it redis-dev redis-cli ping
```

---

## 🚀 **Manual Service Startup**

If specific services fail to start automatically, you can start them individually:

### **Method 1: Using NPM (Recommended)**
```bash
# Open separate terminal windows/tabs for each service

# Frontend (Terminal 1)
cd frontend
npm run dev

# API Gateway (Terminal 2)
cd backend/api-gateway
npm run dev

# Catalog Service (Terminal 3)
cd backend/catalog-service
npm run dev

# User Service (Terminal 4)
cd backend/user-service
npm run dev

# And so on for other services...
```

### **Method 2: Using PM2 (Advanced)**
```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem.config.js in project root:
# (This allows managing all services from one place)

# Start all services with PM2
pm2 start ecosystem.config.js

# Monitor services
pm2 monit

# View logs
pm2 logs

# Stop all services
pm2 stop all
```

### **Service Ports Reference:**
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **Catalog Service**: http://localhost:4001
- **User Service**: http://localhost:4002
- **Order Service**: http://localhost:4003
- **Payment Service**: http://localhost:4004
- **Cart Service**: http://localhost:4005
- **Order Management Service**: http://localhost:4006
- **Notification Service**: http://localhost:4007

---

## 🔍 **Dependency Issues Resolution**

### **Node Modules Issues**
```bash
# Clean install for all services
npm run clean-install  # If script exists, or manually:

# Clean frontend dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install

# Clean backend dependencies (repeat for each service)
cd ../backend/api-gateway
rm -rf node_modules package-lock.json
npm install

# And so on for each service...
```

### **TypeScript Compilation Issues**
```bash
# Build all TypeScript services
cd backend/api-gateway && npm run build
cd ../catalog-service && npm run build
cd ../user-service && npm run build
# ... repeat for all services

# Or check for TypeScript errors
cd backend/api-gateway && npx tsc --noEmit
```

### **Port Conflicts Resolution**
```bash
# Check what's using specific ports
netstat -ano | findstr :3000
netstat -ano | findstr :4000

# Kill process using port (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use npx kill-port
npx kill-port 3000 4000 4001 4002 4003 4004 4005 4006 4007
```

---

## 🌐 **Network & Connectivity Issues**

### **Service Communication Issues**
```bash
# Test if services are responding
curl http://localhost:4000/health  # API Gateway
curl http://localhost:4001/health  # Catalog Service
curl http://localhost:4002/health  # User Service

# Check service logs for connection issues
# Look for Redis/MongoDB connection errors
```

### **Database Connection Issues**
```bash
# Check if databases are accessible
telnet localhost 27017  # MongoDB (Ctrl+C to exit)
telnet localhost 6379   # Redis (Ctrl+C to exit)

# Verify environment variables
echo $MONGODB_URI  # Should show: mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0
echo $REDIS_URL    # Should show: redis://localhost:6379
```

---

## 🛠️ **Environment Variables Setup**

### **Manual .env File Creation**
If the `.env` file is missing or corrupted, create it manually:

```bash
# Copy from example
cp .env.example .env

# Or create manually with required variables:
```

```env
NODE_ENV=development
PORT=3000
API_PORT=4000

# Database Configuration
MONGODB_URI=mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=7d

# Service Configuration
KAFKAJS_NO_PARTITIONER_WARNING=1
KAFKA_BROKERS=localhost:9092

# Development-only configurations
STRIPE_SECRET_KEY=sk_test_development_key
GOOGLE_CLIENT_ID=google_development_id
NEXTAUTH_SECRET=nextauth-development-secret-key
```

### **Service-Specific .env Files**
Some services may need their own `.env` files:

```bash
# Copy main .env to services that need it
cp .env backend/order-management-service/.env
cp .env backend/cart-service/.env
# ... as needed
```

---

## 🔧 **Advanced Troubleshooting**

### **Complete Environment Reset**
```bash
# 1. Stop all services
pm2 stop all  # if using PM2
# Or Ctrl+C in all terminal windows

# 2. Stop and remove Docker containers
docker compose -f docker-compose.dev.yml down
docker system prune -f

# 3. Clean all node_modules
find . -name "node_modules" -type d -exec rm -rf {} +
find . -name "package-lock.json" -delete

# 4. Reinstall dependencies
npm install  # in root if workspace
# Or individually in each service directory

# 5. Restart Docker Desktop
# Close Docker Desktop completely, then restart

# 6. Start fresh
node start-dev.js
```

### **Logs and Debugging**
```bash
# Service-specific logs
cd backend/api-gateway && npm run dev  # See direct output

# Docker container logs
docker logs mongodb-dev
docker logs redis-dev

# System resource check
docker stats  # Monitor container resources
htop          # Monitor system resources (Linux/Mac)
tasklist      # Monitor processes (Windows)
```

---

## 📞 **Getting Help**

### **Quick Health Check Script**
Create a `health-check.js` file:

```javascript
const axios = require('axios');

const services = [
  { name: 'Frontend', url: 'http://localhost:3000' },
  { name: 'API Gateway', url: 'http://localhost:4000/health' },
  { name: 'Catalog Service', url: 'http://localhost:4001/health' },
  // ... add all services
];

async function checkServices() {
  for (const service of services) {
    try {
      await axios.get(service.url, { timeout: 5000 });
      console.log(`✅ ${service.name}: OK`);
    } catch (error) {
      console.log(`❌ ${service.name}: ${error.message}`);
    }
  }
}

checkServices();
```

### **Common Error Messages & Solutions**

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | Service not running - check if port is occupied |
| `Cannot find module` | Run `npm install` in the service directory |
| `Permission denied` | Check file permissions, run as administrator if needed |
| `Port already in use` | Kill process using the port or change port |
| `Docker daemon not running` | Start Docker Desktop |
| `MongoDB connection failed` | Check if MongoDB container is running |
| `Redis connection failed` | Check if Redis container is running |

---

## 🎯 **Success Indicators**

You'll know everything is working when:

- [ ] ✅ Docker Desktop shows running containers
- [ ] ✅ All service URLs return responses (not errors)
- [ ] ✅ No continuous error logs in terminals
- [ ] ✅ Frontend loads at http://localhost:3000
- [ ] ✅ API Gateway health check passes at http://localhost:4000/health
- [ ] ✅ Database connections are successful (no Redis/MongoDB errors)

---

## 🔄 **Maintenance Commands**

```bash
# Update dependencies
npm update  # In each service directory

# Clean Docker
docker system prune -a -f
docker volume prune -f

# Restart everything
node start-dev.js

# Quick restart without rebuild
docker compose -f docker-compose.dev.yml restart
```

---

*This guide covers the most common scenarios. For specific issues, check service logs and error messages for more detailed troubleshooting.*
