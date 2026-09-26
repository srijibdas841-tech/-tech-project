@echo off
title SIH 2026 - Land Record Digitization and Validation System (#TECH)
echo ===============================================================================
echo   SIH 2026 - Intelligent Land Record Digitization ^& Validation System
echo   Problem Statement ID: SIH26018 ^| Team: #TECH
echo ===============================================================================
echo.
echo Checking Python environment...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not found in your PATH!
    echo Please install Python 3.10+ or add it to PATH.
    pause
    exit /b 1
)

echo Starting application...
echo Web Interface:       http://127.0.0.1:8000
echo API Documentation:   http://127.0.0.1:8000/docs
echo Officer Login:       officer@landrecords.gov.in / officer123
echo Options:             --restart (free port and restart) ^| --stop (stop server)
echo.
python run.py %*
if errorlevel 1 (
    echo.
    echo Application stopped with an error code.
    echo If port 8000 is blocked, try: run.bat --restart or run.bat --port 8001
    pause
)

