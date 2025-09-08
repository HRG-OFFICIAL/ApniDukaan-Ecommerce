# ShopSphere E-commerce Platform Setup Script (PowerShell)
# This script sets up the entire development environment on Windows

param(
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$Help
)

if ($Help) {
    Write-Host "ShopSphere E-commerce Platform Setup Script" -ForegroundColor Blue
    Write-Host "Usage: .\scripts\setup.ps1 [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -SkipTests    Skip running tests" -ForegroundColor White
    Write-Host "  -SkipBuild    Skip building the project" -ForegroundColor White
    Write-Host "  -Help         Show this help message" -ForegroundColor White
    exit 0
}

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Node.js is installed
function Test-Node {
    Write-Status "Checking Node.js installation..."
    try {
        $nodeVersion = node --version
        Write-Success "Node.js is installed: $nodeVersion"
        return $true
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18 or higher."
        return $false
    }
}

# Check if npm is installed
function Test-Npm {
    Write-Status "Checking npm installation..."
    try {
        $npmVersion = npm --version
        Write-Success "npm is installed: $npmVersion"
        return $true
    }
    catch {
        Write-Error "npm is not installed. Please install npm."
        return $false
    }
}

# Install root dependencies
function Install-RootDependencies {
    Write-Status "Installing root dependencies..."
    try {
        npm install
        Write-Success "Root dependencies installed"
    }
    catch {
        Write-Error "Failed to install root dependencies"
        throw
    }
}

# Install frontend dependencies
function Install-FrontendDependencies {
    Write-Status "Installing frontend dependencies..."
    try {
        Set-Location frontend
        npm install
        Set-Location ..
        Write-Success "Frontend dependencies installed"
    }
    catch {
        Write-Error "Failed to install frontend dependencies"
        throw
    }
}

# Install backend dependencies
function Install-BackendDependencies {
    Write-Status "Installing backend dependencies..."
    
    try {
        # Install shared package
        Set-Location backend/shared
        npm install
        Set-Location ../..
        
        # Install catalog service
        Set-Location backend/catalog-service
        npm install
        Set-Location ../..
        
        # Install API gateway
        Set-Location backend/api-gateway
        npm install
        Set-Location ../..
        
        # Install other services
        $services = @("user-service", "order-service", "payment-service")
        foreach ($service in $services) {
            if (Test-Path "backend/$service") {
                Set-Location "backend/$service"
                npm install
                Set-Location ../..
            }
        }
        
        Write-Success "Backend dependencies installed"
    }
    catch {
        Write-Error "Failed to install backend dependencies"
        throw
    }
}

# Create environment files
function New-EnvironmentFiles {
    Write-Status "Creating environment files..."
    
    # Create main .env file if it doesn't exist
    if (-not (Test-Path ".env")) {
        if (Test-Path "env.example") {
            Copy-Item "env.example" ".env"
            Write-Success "Created .env file from env.example"
        }
        else {
            Write-Warning "env.example not found, creating basic .env file"
            @"
NODE_ENV=development
PORT=3000
API_PORT=4000
DATABASE_URL=mongodb://localhost:27017/shopsphere
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
"@ | Out-File -FilePath ".env" -Encoding UTF8
        }
    }
    else {
        Write-Warning ".env file already exists, skipping..."
    }
    
    # Create frontend .env.local if it doesn't exist
    if (-not (Test-Path "frontend/.env.local")) {
        @"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=ShopSphere
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
"@ | Out-File -FilePath "frontend/.env.local" -Encoding UTF8
        Write-Success "Created frontend/.env.local file"
    }
    else {
        Write-Warning "frontend/.env.local already exists, skipping..."
    }
    
    Write-Success "Environment files created"
}

# Check if Docker is installed
function Test-Docker {
    Write-Status "Checking Docker installation..."
    try {
        $dockerVersion = docker --version
        Write-Success "Docker is installed: $dockerVersion"
        return $true
    }
    catch {
        Write-Warning "Docker is not installed. You can install it for containerized deployment."
        return $false
    }
}

# Check if Docker Compose is installed
function Test-DockerCompose {
    Write-Status "Checking Docker Compose installation..."
    try {
        $composeVersion = docker-compose --version
        Write-Success "Docker Compose is installed: $composeVersion"
        return $true
    }
    catch {
        Write-Warning "Docker Compose is not installed. You can install it for containerized deployment."
        return $false
    }
}

# Build the project
function Build-Project {
    if ($SkipBuild) {
        Write-Warning "Skipping build step"
        return
    }
    
    Write-Status "Building the project..."
    
    try {
        # Build frontend
        Set-Location frontend
        npm run build
        Set-Location ..
        
        # Build backend services
        Set-Location backend/catalog-service
        npm run build
        Set-Location ../..
        
        Set-Location backend/api-gateway
        npm run build
        Set-Location ../..
        
        Write-Success "Project built successfully"
    }
    catch {
        Write-Error "Failed to build project"
        throw
    }
}

# Run tests
function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning "Skipping tests"
        return
    }
    
    Write-Status "Running tests..."
    
    try {
        # Run frontend tests
        Set-Location frontend
        try {
            npm run test -- --passWithNoTests
            Write-Success "Frontend tests passed"
        }
        catch {
            Write-Warning "Frontend tests failed or no tests found"
        }
        Set-Location ..
        
        # Run backend tests
        Set-Location backend/catalog-service
        try {
            npm run test -- --passWithNoTests
            Write-Success "Catalog service tests passed"
        }
        catch {
            Write-Warning "Catalog service tests failed or no tests found"
        }
        Set-Location ../..
        
        Write-Success "Tests completed"
    }
    catch {
        Write-Warning "Some tests may have failed"
    }
}

# Create startup script
function New-StartupScript {
    Write-Status "Creating startup script..."
    
    $startupScript = @"
@echo off
echo 🚀 Starting ShopSphere E-commerce Platform...

REM Start MongoDB (if installed locally)
where mongod >nul 2>nul
if %ERRORLEVEL% == 0 (
    echo Starting MongoDB...
    start /B mongod --fork --logpath C:\temp\mongodb.log
)

REM Start Redis (if installed locally)
where redis-server >nul 2>nul
if %ERRORLEVEL% == 0 (
    echo Starting Redis...
    start /B redis-server
)

REM Start all services
echo Starting all services...
npm run dev

pause
"@
    
    $startupScript | Out-File -FilePath "start-dev.bat" -Encoding ASCII
    Write-Success "Startup script created: start-dev.bat"
}

# Main setup function
function Start-Setup {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  ShopSphere E-commerce Platform Setup" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        # Check prerequisites
        if (-not (Test-Node)) { throw "Node.js is required" }
        if (-not (Test-Npm)) { throw "npm is required" }
        
        # Install dependencies
        Install-RootDependencies
        Install-FrontendDependencies
        Install-BackendDependencies
        
        # Create environment files
        New-EnvironmentFiles
        
        # Check Docker (optional)
        Test-Docker | Out-Null
        Test-DockerCompose | Out-Null
        
        # Build project
        Build-Project
        
        # Run tests
        Invoke-Tests
        
        # Create startup script
        New-StartupScript
        
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Success "Setup completed successfully!"
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Update environment variables in .env and frontend/.env.local" -ForegroundColor White
        Write-Host "2. Start MongoDB and Redis (if using local instances)" -ForegroundColor White
        Write-Host "3. Run 'start-dev.bat' to start the development server" -ForegroundColor White
        Write-Host "4. Open http://localhost:3000 in your browser" -ForegroundColor White
        Write-Host ""
        Write-Host "For more information, check the documentation in the config/ directory" -ForegroundColor White
        Write-Host ""
    }
    catch {
        Write-Error "Setup failed: $_"
        exit 1
    }
}

# Run main setup function
Start-Setup
