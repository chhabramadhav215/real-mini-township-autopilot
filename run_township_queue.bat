@echo off
setlocal enabledelayedexpansion

:: ==============================================================================
:: REAL MINI TOWNSHIP AUTOPILOT - LOCAL QUEUE RUNNER & AUTO-CLEANUP
:: Automatically cleans up already-uploaded episodes, checks the 1.8 GB / 2.0 GB
:: storage cap, and pre-generates upcoming episodes using Google Flow / Veo.
:: ==============================================================================

cd /d "%~dp0"

if not exist "logs" mkdir "logs"
set LOG_FILE=logs\queue_run.log

echo ============================================================================== >> %LOG_FILE%
echo [!DATE! !TIME!] Starting Real Mini Township Autopilot Queue Runner... >> %LOG_FILE%
echo ============================================================================== >> %LOG_FILE%

echo ==============================================================================
echo REAL MINI TOWNSHIP AUTOPILOT - LOCAL QUEUE & AUTO-CLEANUP RUNNER
echo Workspace: %CD%
echo Log File:  %LOG_FILE%
echo ==============================================================================

:: Step 1: Sync latest state from origin/main
echo [1/3] Syncing latest queue and town memory state from GitHub...
git pull --rebase origin main >> %LOG_FILE% 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [1/3] Git state synchronized with origin/main.
) else (
    echo [1/3] Notice: Git sync completed with status %ERRORLEVEL%. Continuing...
)

:: Step 2: Run Local Batch Builder (Cleanup + 1.8 GB Capped Queue Generation)
echo [2/3] Running storage cleanup and batch queue generation (Max 2.0 GB)...
call npm.cmd run local:queue >> %LOG_FILE% 2>&1
set RUN_STATUS=%ERRORLEVEL%

:: Step 3: Completion Report
echo [3/3] Session complete with exit code %RUN_STATUS%.
echo [!DATE! !TIME!] Queue run finished with exit code %RUN_STATUS%. >> %LOG_FILE%
echo ============================================================================== >> %LOG_FILE%

if "%1"=="--no-pause" goto end
if not "%1"=="" goto end

:: If launched interactively by double-clicking, pause so output is visible
timeout /t 10
:end
exit /b %RUN_STATUS%
