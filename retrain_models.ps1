# Retrain all Prophet forecast models on Render
Add-Type -AssemblyName System.Web

$baseUrl = "https://uidai-hackthon-2026.onrender.com"

$states = @(
    "Karnataka",
    "Gujarat",
    "Maharashtra",
    "Tamil Nadu",
    "Uttar Pradesh",
    "Delhi",
    "West Bengal",
    "Rajasthan",
    "Andhra Pradesh",
    "Telangana"
)

Write-Host "Starting to retrain Prophet models for key states..." -ForegroundColor Green
Write-Host "This will take several minutes..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($state in $states) {
    Write-Host "Training model for: $state" -ForegroundColor Cyan
    
    try {
        $encodedState = [System.Web.HttpUtility]::UrlEncode($state)
        $url = "$baseUrl/ml/train/forecast?state=$encodedState"
        
        $response = Invoke-RestMethod -Uri $url -Method Post -TimeoutSec 120
        
        if ($response.status -eq "trained") {
            Write-Host "  Success" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  Failed" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
        $failCount++
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Training Complete!" -ForegroundColor Green
Write-Host "Success: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
