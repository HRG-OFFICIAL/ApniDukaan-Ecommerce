#!/bin/bash

# ShopSphere E-commerce Platform Setup Script
# This script sets up the entire development environment

set -e

echo "🚀 Setting up ShopSphere E-commerce Platform..."

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

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Install root dependencies
install_root_deps() {
    print_status "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    
    # Install shared package
    cd backend/shared
    npm install
    cd ../..
    
    # Install catalog service
    cd backend/catalog-service
    npm install
    cd ../..
    
    # Install API gateway
    cd backend/api-gateway
    npm install
    cd ../..
    
    # Install other services
    for service in user-service order-service payment-service; do
        if [ -d "backend/$service" ]; then
            cd "backend/$service"
            npm install
            cd ../..
        fi
    done
    
    print_success "Backend dependencies installed"
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Create main .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        cp env.example .env
        print_success "Created .env file from env.example"
    else
        print_warning ".env file already exists, skipping..."
    fi
    
    # Create frontend .env.local if it doesn't exist
    if [ ! -f "frontend/.env.local" ]; then
        cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=ShopSphere
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
EOF
        print_success "Created frontend/.env.local file"
    else
        print_warning "frontend/.env.local already exists, skipping..."
    fi
    
    print_success "Environment files created"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker is installed: $DOCKER_VERSION"
        return 0
    else
        print_warning "Docker is not installed. You can install it for containerized deployment."
        return 1
    fi
}

# Check if Docker Compose is installed
check_docker_compose() {
    print_status "Checking Docker Compose installation..."
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose is installed: $COMPOSE_VERSION"
        return 0
    else
        print_warning "Docker Compose is not installed. You can install it for containerized deployment."
        return 1
    fi
}

# Build the project
build_project() {
    print_status "Building the project..."
    
    # Build frontend
    cd frontend
    npm run build
    cd ..
    
    # Build backend services
    cd backend/catalog-service
    npm run build
    cd ../..
    
    cd backend/api-gateway
    npm run build
    cd ../..
    
    print_success "Project built successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Run frontend tests
    cd frontend
    if npm run test -- --passWithNoTests; then
        print_success "Frontend tests passed"
    else
        print_warning "Frontend tests failed or no tests found"
    fi
    cd ..
    
    # Run backend tests
    cd backend/catalog-service
    if npm run test -- --passWithNoTests; then
        print_success "Catalog service tests passed"
    else
        print_warning "Catalog service tests failed or no tests found"
    fi
    cd ../..
    
    print_success "Tests completed"
}

# Create startup script
create_startup_script() {
    print_status "Creating startup script..."
    
    cat > start-dev.sh << 'EOF'
#!/bin/bash

# ShopSphere Development Startup Script

echo "🚀 Starting ShopSphere E-commerce Platform..."

# Start MongoDB (if installed locally)
if command -v mongod &> /dev/null; then
    echo "Starting MongoDB..."
    mongod --fork --logpath /tmp/mongodb.log
fi

# Start Redis (if installed locally)
if command -v redis-server &> /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes
fi

# Start all services
echo "Starting all services..."
npm run dev

EOF
    
    chmod +x start-dev.sh
    print_success "Startup script created: start-dev.sh"
}

# Main setup function
main() {
    echo "=========================================="
    echo "  ShopSphere E-commerce Platform Setup"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_node
    check_npm
    
    # Install dependencies
    install_root_deps
    install_frontend_deps
    install_backend_deps
    
    # Create environment files
    create_env_files
    
    # Check Docker (optional)
    check_docker
    check_docker_compose
    
    # Build project
    build_project
    
    # Run tests
    run_tests
    
    # Create startup script
    create_startup_script
    
    echo ""
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Update environment variables in .env and frontend/.env.local"
    echo "2. Start MongoDB and Redis (if using local instances)"
    echo "3. Run './start-dev.sh' to start the development server"
    echo "4. Open http://localhost:3000 in your browser"
    echo ""
    echo "For more information, check the documentation in the config/ directory"
    echo ""
}

# Run main function
main "$@"
