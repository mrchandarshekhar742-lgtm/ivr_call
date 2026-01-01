@echo off
echo =====================================
echo  Build and Install IVR Call Manager
echo =====================================

echo Step 1: Building the app...
call build-android.bat
if %errorlevel% neq 0 (
    echo Build failed. Stopping.
    exit /b
)

echo.
echo Step 2: Installing on device...
call install-on-device.bat

echo.
echo =====================================
echo  COMPLETE!
echo =====================================