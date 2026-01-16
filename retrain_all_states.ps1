# Retrain Prophet forecast models for ALL states on Render
Add-Type -AssemblyName System.Web

$baseUrl = "https://uidai-hackthon-2026.onrender.com"

$states = @(
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal"
)

Write-Host "========================================"
Write-Host "  Prophet Model Training for All States"
Write-Host "========================================"
Write-Host ""
Write-Host "Total states: $($states.Count)"
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($state in $states) {
    $stateNum = $states.IndexOf($state) + 1
    Write-Host "[$stateNum/$($states.Count)] $state"
    
    try {
        $encodedState = [System.Web.HttpUtility]::UrlEncode($state)
        $url = "$baseUrl/ml/train/forecast?state=$encodedState"
        
        $response = Invoke-RestMethod -Uri $url -Method Post -TimeoutSec 120
        
        if ($response.status -eq "trained") {
            Write-Host "  Success"
            $successCount++
        } else {
            Write-Host "  Failed"
            $failCount++
        }
    } catch {
        Write-Host "  Error"
        $failCount++
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "========================================"
Write-Host "Success: $successCount | Failed: $failCount"
Write-Host "========================================"
