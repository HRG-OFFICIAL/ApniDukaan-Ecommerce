# Start Backend Services for ApniDukaan

Write-Host "🚀 Starting ApniDukaan Backend Services..." -ForegroundColor Green

# Function to start service in new window
function Start-ServiceInNewWindow {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [string]$Command
    )
    
    Write-Host "Starting $ServiceName..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ServicePath'; Write-Host 'Starting $ServiceName on $(Get-Date)' -ForegroundColor Green; $Command"
}

# Start Catalog Service (Port 4001)
Start-ServiceInNewWindow -ServiceName "Catalog Service" -ServicePath "C:\dev\apnidukaan-ecommerce\backend\catalog-service" -Command "npm run dev"

# Wait a moment
Start-Sleep -Seconds 2

# Start API Gateway (Port 4000)
Start-ServiceInNewWindow -ServiceName "API Gateway" -ServicePath "C:\dev\apnidukaan-ecommerce\backend\api-gateway" -Command "npm run dev"

Write-Host "`n✅ Backend services started!" -ForegroundColor Green
Write-Host "🌐 API Gateway: http://localhost:4000" -ForegroundColor Cyan
Write-Host "🛍️  Catalog Service: http://localhost:4001" -ForegroundColor Cyan
Write-Host "📊 Health Check: http://localhost:4000/health" -ForegroundColor Cyan
Write-Host "🎯 GraphQL Endpoint: http://localhost:4000/graphql" -ForegroundColor Cyan
Write-Host "`nPress any key to continue..." -ForegroundColor Yellow
$null = Read-Host
