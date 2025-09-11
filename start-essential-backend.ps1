# Start Essential Backend Services (Catalog + API Gateway)

Write-Host "🚀 Starting Essential ApniDukaan Backend Services..." -ForegroundColor Green

# Start in background using Start-Job
Write-Host "Starting Catalog Service..." -ForegroundColor Yellow
$catalogJob = Start-Job -ScriptBlock {
    Set-Location "C:\dev\apnidukaan-ecommerce\backend\catalog-service"
    npm run dev
}

Start-Sleep -Seconds 3

Write-Host "Starting API Gateway..." -ForegroundColor Yellow  
$gatewayJob = Start-Job -ScriptBlock {
    Set-Location "C:\dev\apnidukaan-ecommerce\backend\api-gateway"
    npm run dev
}

Write-Host "`n✅ Backend services are starting..." -ForegroundColor Green
Write-Host "⏳ Waiting 10 seconds for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n🌐 API Gateway: http://localhost:4000" -ForegroundColor Cyan
Write-Host "🛍️  Catalog Service: http://localhost:4001" -ForegroundColor Cyan
Write-Host "📊 Health Check: http://localhost:4000/health" -ForegroundColor Cyan
Write-Host "🎯 GraphQL Endpoint: http://localhost:4000/graphql" -ForegroundColor Cyan

Write-Host "`n🧪 Testing API connection..." -ForegroundColor Yellow
node test-api-connection.js

Write-Host "`nTo stop services, run: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Red
