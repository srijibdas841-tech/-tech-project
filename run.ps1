# ===============================================================================
#   SIH 2026 - Intelligent Land Record Digitization & Validation System
#   Problem Statement ID: SIH26018 | Team: #TECH
# ===============================================================================

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  SMART INDIA HACKATHON 2026 - WORKING PROTOTYPE" -ForegroundColor Yellow
Write-Host "  Intelligent Land Record Digitization & Validation System" -ForegroundColor White
Write-Host "  Problem Statement ID: SIH26018 | Team: #TECH" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# Verify Python
$pyVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Python was not found in your PATH." -ForegroundColor Red
    Write-Host "Please install Python 3.10+ and make sure it is added to PATH."
    exit 1
}

Write-Host "[INFO] Detected $pyVersion" -ForegroundColor Green
Write-Host "[INFO] Launching unified application..." -ForegroundColor Green
Write-Host "  * Web Portal: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  * Swagger API: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  * Demo Officer: officer@landrecords.gov.in / officer123" -ForegroundColor Gray
Write-Host "  * Tip: Use --restart to reset port, or --stop to shut down" -ForegroundColor DarkCyan
Write-Host ""

python run.py @args

