# IVR Call Manager - Android App

A React Native Android application that acts as a device controller for the IVR Call Management System.

## Features

- **Real-time Server Communication**: WebSocket connection with the backend server
- **Automatic Call Handling**: Receives and processes call requests from the server
- **Audio Management**: Records and manages audio during calls
- **DTMF Detection**: Detects and processes DTMF tones
- **Device Registration**: Automatically registers with the server
- **Network Monitoring**: Monitors network connectivity status
- **Permission Management**: Handles Android permissions for calling and audio

## Prerequisites

- Node.js 18 or higher
- Java 17 (automatically installed if missing)
- Android SDK
- Android device with USB debugging enabled

## Quick Start

### 1. Build the App
```bash
build-android.bat
```

### 2. Install on Device
```bash
install-on-device.bat
```

### 3. Build and Install (Combined)
```bash
build-and-install.bat
```

## Development

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
```bash
npm start
# In another terminal:
npm run android
```

### Build Debug APK
```bash
cd android
gradlew.bat assembleDebug
```

## Configuration

The app automatically connects to the server at `http://192.168.1.100:3000`. You can modify this in the `App.tsx` file.

### Server URL Configuration
1. Open the app on your device
2. The server URL is displayed in the Connection Status section
3. To change it, modify the `serverUrl` in `App.tsx`

## Permissions

The app requires the following Android permissions:
- `CALL_PHONE` - Make phone calls
- `READ_PHONE_STATE` - Read phone state
- `RECORD_AUDIO` - Record audio during calls
- `MODIFY_AUDIO_SETTINGS` - Modify audio settings
- `WAKE_LOCK` - Keep device awake during calls
- `SYSTEM_ALERT_WINDOW` - Show overlay windows
- `FOREGROUND_SERVICE` - Run background services
- `ACCESS_NETWORK_STATE` - Check network connectivity

## Usage

1. **Launch the app** on your Android device
2. **Grant permissions** when prompted
3. **Connect to server** by tapping the "Connect to Server" button
4. **Monitor status** - The app will show connection status and device info
5. **Handle calls** - When the server sends a call request, you'll get a notification

## Troubleshooting

### Build Issues
- Make sure Java 17 is installed
- Ensure Android SDK is properly configured
- Check that ANDROID_HOME environment variable is set

### Connection Issues
- Verify the server is running
- Check that the device and server are on the same network
- Ensure firewall isn't blocking the connection

### Permission Issues
- Grant all requested permissions in Android settings
- Enable "Display over other apps" permission if needed

## File Structure

```
IVRCallManager/
├── android/                 # Android native code
├── App.tsx                  # Main React Native component
├── package.json            # Dependencies and scripts
├── build-android.bat       # Build script
├── install-on-device.bat   # Installation script
├── build-and-install.bat   # Combined build and install
└── README.md               # This file
```

## Integration with Backend

This app works with the IVR Call Management System backend. Make sure the backend server is running and accessible from your Android device's network.

The app communicates with these backend endpoints:
- WebSocket connection for real-time communication
- `/health` endpoint for connection testing
- Device registration and call handling events

## Version

- **App Version**: 1.0.0
- **React Native**: 0.74.5
- **Target Android**: API 34
- **Minimum Android**: API 21 (Android 5.0)