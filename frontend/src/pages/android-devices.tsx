import { useState } from 'react';
import Layout from '@/components/Layout';
import AndroidDeviceManager from '@/components/AndroidDeviceManager';
import { 
  DevicePhoneMobileIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function AndroidDevicesPage() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <Layout title="Android Devices">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <DevicePhoneMobileIcon className="h-8 w-8 mr-3 text-blue-600" />
              Android Device Manager
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and monitor Android devices for IVR call handling
            </p>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            <InformationCircleIcon className="h-4 w-4 mr-2" />
            {showHelp ? 'Hide Help' : 'Show Help'}
          </button>
        </div>

        {/* Help Section */}
        {showHelp && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">
                How to Set Up Android Devices
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium text-blue-800 mb-3 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                    Installation Steps
                  </h3>
                  <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                    <li>Download the IVR Call Manager Android app</li>
                    <li>Install the APK on your Android device</li>
                    <li>Grant all required permissions when prompted</li>
                    <li>Open the app and configure settings</li>
                    <li>Connect to this server and start handling calls</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-blue-800 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
                    Requirements
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                    <li>Android 5.0 (API 21) or higher</li>
                    <li>Phone and SMS permissions</li>
                    <li>Audio recording permissions</li>
                    <li>Network access (WiFi or mobile data)</li>
                    <li>Device should stay connected and awake</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                <h3 className="text-md font-medium text-blue-800 mb-2">
                  App Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="text-blue-700">Server URL:</strong>
                    <code className="ml-2 px-2 py-1 bg-blue-100 rounded text-blue-800">
                      {typeof window !== 'undefined' ? window.location.origin : 'http://your-server.com'}
                    </code>
                  </div>
                  <div>
                    <strong className="text-blue-700">WebSocket Port:</strong>
                    <code className="ml-2 px-2 py-1 bg-blue-100 rounded text-blue-800">
                      8080
                    </code>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Important Notes:</h4>
                    <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                      <li>Keep the Android app running in the background</li>
                      <li>Ensure stable internet connection</li>
                      <li>Device should have sufficient battery or be plugged in</li>
                      <li>Test call functionality before using in production</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Android Device Manager Component */}
        <AndroidDeviceManager />

        {/* Additional Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Troubleshooting Common Issues
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">
                Device Not Connecting
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Check internet connection on device</li>
                <li>Verify server URL is correct</li>
                <li>Ensure WebSocket port (8080) is not blocked</li>
                <li>Restart the Android app</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">
                Calls Not Working
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Grant phone and audio permissions</li>
                <li>Check if device has active SIM card</li>
                <li>Verify phone number format</li>
                <li>Test with a simple call first</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">
                Audio Issues
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Check microphone permissions</li>
                <li>Ensure audio files are accessible</li>
                <li>Test audio playback manually</li>
                <li>Check device volume settings</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">
                Performance Issues
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Close unnecessary apps</li>
                <li>Ensure sufficient battery</li>
                <li>Use stable WiFi connection</li>
                <li>Keep device awake during calls</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}