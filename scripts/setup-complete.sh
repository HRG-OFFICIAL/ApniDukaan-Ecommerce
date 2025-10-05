#!/bin/bash

# ApniDukaan Complete Setup Script
echo "🚀 Setting up ApniDukaan E-commerce Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Prerequisites check passed!"

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating environment file..."
    cp env.local.example .env
    print_warning "Please update .env file with your actual API keys and secrets"
else
    print_status "Environment file already exists"
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Install workspace dependencies
print_status "Installing workspace dependencies..."
npm run setup

# Build all services
print_status "Building all services..."
npm run build

# Start services with Docker Compose
print_status "Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."

# Function to check service health
check_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port/health > /dev/null 2>&1; then
            print_success "$service_name is healthy"
            return 0
        fi
        print_status "Waiting for $service_name... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start"
    return 1
}

# Check each service
services=(
    "API Gateway:4000"
    "Catalog Service:4001"
    "User Service:4002"
    "Order Service:4003"
    "Payment Service:4004"
    "Cart Service:4005"
    "Search Service:4006"
    "Notification Service:4007"
    "Order Management Service:4008"
)

all_healthy=true
for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if ! check_service "$name" "$port"; then
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    print_success "All services are healthy!"
    
    echo ""
    echo "🎉 ApniDukaan is now running!"
    echo ""
    echo "📱 Frontend: http://localhost:3000"
    echo "🔗 API Gateway: http://localhost:4000"
    echo "📊 API Status: http://localhost:4000/api/status"
    echo "🏥 Health Check: http://localhost:4000/health"
    echo ""
    echo "🔧 Services:"
    echo "   - Catalog Service: http://localhost:4001"
    echo "   - User Service: http://localhost:4002"
    echo "   - Order Service: http://localhost:4003"
    echo "   - Payment Service: http://localhost:4004"
    echo "   - Cart Service: http://localhost:4005"
    echo "   - Search Service: http://localhost:4006"
    echo "   - Notification Service: http://localhost:4007"
    echo "   - Order Management Service: http://localhost:4008"
    echo ""
    echo "🗄️ Database:"
    echo "   - MongoDB: mongodb://localhost:27017"
    echo "   - Redis: redis://localhost:6379"
    echo "   - MinIO: http://localhost:9000 (admin: minioadmin / minioadmin123)"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Update .env file with your API keys"
    echo "   2. Visit http://localhost:3000 to see the frontend"
    echo "   3. Check http://localhost:4000/health for service status"
    echo "   4. Run 'docker-compose logs -f' to see service logs"
    echo ""
    echo "🛑 To stop all services: docker-compose down"
    echo "🔄 To restart: docker-compose restart"
    echo "📊 To see logs: docker-compose logs -f [service-name]"
    
else
    print_error "Some services failed to start. Check the logs with: docker-compose logs"
    exit 1
fi
