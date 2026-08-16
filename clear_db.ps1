Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " Aaroham - Clearing All Database Records" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot/server"
node db/clear_data.js
