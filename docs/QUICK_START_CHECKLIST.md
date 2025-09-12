# 🚀 Quick Start Checklist - ApniDukaan Development

## ⚡ **Immediate Actions to Help Your Development Environment**

### **Step 1: Start Docker Desktop (Most Important)**
```bash
# Windows - Choose one method:

# Method 1: GUI (Recommended)
# Press Windows Key → Type "Docker Desktop" → Click to start
# Wait until system tray shows "Docker Desktop is running"

# Method 2: Command Line
net start com.docker.service

# Method 3: Direct executable
& "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### **Step 2: Verify Docker is Running**
```bash
# Run these commands - both should show version info (no errors)
docker version
docker compose version
```

### **Step 3: Start Development Environment**
```bash
# Now run the enhanced startup script
node start-dev.js

# OR with database seeding
node start-dev.js --seed
```

---

## 🔧 **If Docker Desktop Won't Start**

### **Common Solutions:**
```bash
# Solution 1: Restart Docker Service
net stop com.docker.service
net start com.docker.service

# Solution 2: Update WSL 2 (if on Windows)
wsl --update
wsl --set-default-version 2

# Solution 3: Restart computer (often fixes WSL/Hyper-V issues)
```

---

## 🗄️ **If Databases Don't Start Automatically**

### **Manual Database Startup:**
```bash
# Start just the databases
docker compose -f docker-compose.dev.yml up -d mongodb redis

# Check if they're running
docker ps

# You should see containers named something like:
# - apnidukaan-ecommerce-mongodb-1
# - apnidukaan-ecommerce-redis-1
```

---

## 🚦 **If Individual Services Fail**

### **Start Services Manually (Open separate terminals):**

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
# Should start on http://localhost:3000
```

**Terminal 2 - API Gateway:**
```bash
cd backend/api-gateway
npm run dev
# Should start on http://localhost:4000
```

**Terminal 3 - Catalog Service:**
```bash
cd backend/catalog-service
npm run dev
# Should start on http://localhost:4001
```

**And so on for other services...**

---

## 🔍 **Quick Health Check**

### **Test These URLs (should not give errors):**
- ✅ Frontend: http://localhost:3000
- ✅ API Gateway: http://localhost:4000/health
- ✅ Catalog Service: http://localhost:4001/health
- ✅ User Service: http://localhost:4002/health

---

## 🆘 **Emergency Port Cleanup**

### **If you get "Port already in use" errors:**
```bash
# Kill processes on all development ports
npx kill-port 3000 4000 4001 4002 4003 4004 4005 4006 4007

# Or check what's using a specific port
netstat -ano | findstr :3000
# Then kill the PID: taskkill /PID <PID_NUMBER> /F
```

---

## ✅ **Success Indicators**

**You know everything is working when:**
- ✅ Docker Desktop system tray icon shows "running"
- ✅ `docker ps` shows MongoDB and Redis containers
- ✅ No red error messages in terminal logs
- ✅ http://localhost:3000 shows the frontend
- ✅ http://localhost:4000/health returns success

---

## 📋 **Current Fixed Issues**

✅ **Environment Variables**: All required variables added to `.env`  
✅ **Service Ports**: No conflicts (3000, 4000-4007)  
✅ **Database Config**: Dedicated `docker-compose.dev.yml` created  
✅ **Order Management**: Environment variables copied  
✅ **Mongoose Warnings**: Duplicate indexes removed  
✅ **Kafka Warnings**: Suppression flag added  

---

## 🚨 **Most Likely Issue: Docker Desktop Not Running**

**90% of startup problems are resolved by ensuring Docker Desktop is running!**

1. Check system tray for Docker Desktop icon
2. If not running, start it using methods in Step 1 above
3. Wait for it to fully start (can take 30-60 seconds)
4. Try `node start-dev.js` again

---

*For detailed troubleshooting, see `MANUAL_ASSISTANCE_GUIDE.md`*
