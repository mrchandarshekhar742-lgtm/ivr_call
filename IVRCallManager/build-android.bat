@echo off
echo =====================================
echo  Building IVR Call Manager Android App
echo =====================================

echo Setting up Java environment...
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.17.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Java version:
java -version
if %errorlevel% neq 0 (
    echo ERROR: Java 17 not found. Installing...
    winget install Microsoft.OpenJDK.17
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Java 17
        pause
        exit /b
    )
)

echo.
echo Building debug APK...
cd android
call gradlew.bat assembleDebug --no-daemon

if %errorlevel% neq 0 (
    echo ERROR: Build failed.
    cd ..
    pause
    exit /b
)

cd ..

echo.
echo =====================================
echo  BUILD SUCCESSFUL!
echo =====================================
echo.
echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause