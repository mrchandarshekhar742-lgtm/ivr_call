@echo off
setlocal
echo =====================================
echo  Installing IVR Call Manager on Device
echo =====================================

set "APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk"

if not exist "%APK_PATH%" (
    echo ERROR: APK not found. Please build the app first.
    echo Run: build-android.bat
    pause
    exit /b
)

echo Finding Android SDK...
if not exist "android\local.properties" (
    echo ERROR: android\local.properties not found.
    pause
    exit /b
)

for /f "usebackq delims=" %%i in ("android\local.properties") do (
    set "%%i"
)

if not defined sdk.dir (
    echo ERROR: sdk.dir not found in android\local.properties
    pause
    exit /b
)

rem Replace double backslashes with single ones
set "SDK_PATH=%sdk.dir:\=\%"
set "ADB_EXE_PATH=%SDK_PATH%\platform-tools\adb.exe"

echo SDK found. Using adb from: "%ADB_EXE_PATH%"

if not exist "%ADB_EXE_PATH%" (
    echo ERROR: adb.exe not found at the path above.
    echo Please check your sdk.dir in local.properties.
    pause
    exit /b
)

echo.
echo Checking for connected devices...
"%ADB_EXE_PATH%" devices

echo.
echo Installing APK on device...
"%ADB_EXE_PATH%" install -r "%APK_PATH%"

if %errorlevel% neq 0 (
    echo ERROR: Installation failed.
    echo Make sure:
    echo 1. Device is connected via USB
    echo 2. USB Debugging is enabled
    echo 3. Device is authorized for debugging on your phone's screen.
    pause
    exit /b
)

echo.
echo =====================================
echo  INSTALLATION SUCCESSFUL!
echo =====================================
echo.
echo The app has been installed on your device.
echo You can now launch "IVR Call Manager" from your device.
echo.
pause
