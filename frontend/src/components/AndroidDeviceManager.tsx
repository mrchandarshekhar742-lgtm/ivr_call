import { useState, useEffect } from 'react';
import { apiClient } from '@/utils/api';
import {
  DevicePhoneMobileIcon,
  SignalIcon,
  PhoneIcon,
  Battery0Icon,
  WifiIcon,
  PlayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';
import { AndroidDevice, DeviceStats } from '@/types';

interface QueuedCall {
  campaignId: string;
  contactPhone: string;
  contactName: string;
  queuedAt: string;
}

export default function AndroidDeviceManager() {
  const [devices, setDevices] = useState<AndroidDevice[]>([]);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [queuedCalls, setQueuedCalls] = useState<QueuedCall[]>([]);
  const [testCallPhone, setTestCallPhone] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);

  // Fetch data function
  const fetchData = async () => {
    try {
      setError(null);
      
      const [devicesRes, statsRes, queueRes] = await Promise.all([
        apiClient.get('/api/android-devices'),
        apiClient.get('/api/android-devices/stats'),
        apiClient.get('/api/android-devices/queue')
      ]);

      setDevices(devicesRes.data || []);
      setStats(statsRes.data || null);
      setQueuedCalls(queueRes.data?.queue || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds instead of 3
    return () => clearInterval(interval);
  }, []);

  const handleTestCall = async () => {
    if (!selectedDevice || !testCallPhone) return;
    
    try {
      await apiClient.post(`/api/android-devices/${selectedDevice}/test-call`, { 
        phoneNumber: testCallPhone 
      });
      
      setTestCallPhone('');
      setSelectedDevice('');
      
      // Refresh data after test call
      setTimeout(fetchData, 1000);
    } catch (err: any) {
      setError(err.message || 'Test call failed');
    }
  };

  const handleDisconnectDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to disconnect this device?')) return;
    
    try {
      await apiClient.delete(`/api/android-devices/${deviceId}`);
      
      // Refresh data after disconnect
      setTimeout(fetchData, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect device');
    }
  };

  const handleClearQueue = async () => {
    if (!confirm('Are you sure you want to clear all queued calls?')) return;
    
    try {
      await apiClient.post('/api/android-devices/queue/clear');
      
      // Refresh data after clearing queue
      setTimeout(fetchData, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to clear queue');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'busy': return <PhoneIcon className="h-4 w-4 text-yellow-500" />;
      case 'offline': return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default: return <DevicePhoneMobileIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSignalColor = (strength: number) => {
    if (strength > 70) return 'text-green-500';
    if (strength > 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getServerUrl = () => {
    return window.location.origin;
  };

  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.NEXT_PUBLIC_ANDROID_WEBSOCKET_PORT || '8080';
    return `${protocol}//${host}:${port}`;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Devices</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button 
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalDevices}</div>
              <div className="text-sm text-gray-500">Total Devices</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.availableDevices}</div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.busyDevices}</div>
              <div className="text-sm text-gray-500">Busy</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.offlineDevices}</div>
              <div className="text-sm text-gray-500">Offline</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.queuedCalls || queuedCalls.length}</div>
              <div className="text-sm text-gray-500">Queued</div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow">
        <div className="px-4 py-3 border-b border-blue-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-blue-900">Android App Connection</h3>
          <button
            onClick={() => setShowSetupInstructions(!showSetupInstructions)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showSetupInstructions ? 'Hide' : 'Show'} Setup Instructions
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Server URL (for Android app)
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-md bg-white text-sm"
                  value={getServerUrl()}
                  readOnly
                />
                <button
                  onClick={() => navigator.clipboard.writeText(getServerUrl())}
                  className="ml-2 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                WebSocket URL
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-md bg-white text-sm"
                  value={getWebSocketUrl()}
                  readOnly
                />
                <button
                  onClick={() => navigator.clipboard.writeText(getWebSocketUrl())}
                  className="ml-2 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {showSetupInstructions && (
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                <QrCodeIcon className="h-5 w-5 mr-2" />
                Android App Setup Instructions:
              </h4>
              <ol className="text-sm text-blue-700 list-decimal list-inside space-y-2">
                <li>Install the IVR Call Manager Android app on your device</li>
                <li>Grant all required permissions (Phone, Audio, Storage, etc.)</li>
                <li>Open the app and configure the server URL: <code className="bg-blue-100 px-1 rounded">{getServerUrl()}</code></li>
                <li>Enter a unique device name and your phone number</li>
                <li>Tap "Connect to Server" to establish connection</li>
                <li>Ensure your device stays connected to WiFi or mobile data</li>
                <li>Keep the app running in the background for automatic call handling</li>
              </ol>
              <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Make sure your Android device and this server are on the same network or the server is accessible from the internet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Call Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Test Call</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Device
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
              >
                <option value="">Choose a device...</option>
                {devices
                  .filter(device => device.status === 'available')
                  .map(device => (
                    <option key={device.id} value={device.id}>
                      {device.name} ({device.phoneNumber})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91-9876543210"
                value={testCallPhone}
                onChange={(e) => setTestCallPhone(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                onClick={handleTestCall}
                disabled={!selectedDevice || !testCallPhone}
              >
                <PlayIcon className="h-4 w-4" />
                Test Call
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Call Queue */}
      {queuedCalls.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-yellow-500" />
              Call Queue ({queuedCalls.length})
            </h3>
            <button
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 flex items-center gap-1"
              onClick={handleClearQueue}
            >
              <TrashIcon className="h-4 w-4" />
              Clear Queue
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queued At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {queuedCalls.map((call, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{call.contactName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{call.contactPhone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{call.campaignId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(call.queuedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Device List */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Connected Devices</h2>
        <div className="text-sm text-gray-500">
          {devices.filter(d => d.status === 'available').length} available, 
          {devices.filter(d => d.status === 'busy').length} busy, 
          {devices.filter(d => d.status === 'offline').length} offline
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <div key={device.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-4">
              {/* Device Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <DevicePhoneMobileIcon className="h-6 w-6 text-gray-400 mr-2" />
                  <div>
                    <h3 className="font-medium text-gray-900">{device.name}</h3>
                    <p className="text-sm text-gray-500">{device.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(device.status)}
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDisconnectDevice(device.id)}
                    title="Disconnect device"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(device.status)}`}>
                  {device.status}
                </span>
              </div>

              {/* Connection Status */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Connection:</span>
                <div className="flex items-center">
                  <WifiIcon className={`h-4 w-4 mr-1 ${device.isConnected ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-sm">{device.isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>

              {/* Battery & Signal */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center">
                  <Battery0Icon className={`h-4 w-4 mr-1 ${getBatteryColor(device.batteryLevel)}`} />
                  <span className="text-sm">{device.batteryLevel}%</span>
                </div>
                <div className="flex items-center">
                  <SignalIcon className={`h-4 w-4 mr-1 ${getSignalColor(device.signalStrength)}`} />
                  <span className="text-sm">{device.signalStrength}%</span>
                </div>
              </div>

              {/* Network Type */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Network:</span>
                <span className="text-sm font-medium">{device.networkType.toUpperCase()}</span>
              </div>

              {/* Current Call */}
              {device.currentCall && (
                <div className="bg-yellow-50 p-2 rounded text-sm mb-3 border border-yellow-200">
                  <div className="font-medium text-yellow-800 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    Active Call
                  </div>
                  <div className="text-yellow-600">To: {device.currentCall.contactPhone}</div>
                  <div className="text-yellow-600">
                    Contact: {device.currentCall.contactName || 'Unknown'}
                  </div>
                  <div className="text-yellow-600">
                    Duration: {formatDuration(Math.round((new Date().getTime() - new Date(device.currentCall.startTime).getTime()) / 1000))}
                  </div>
                </div>
              )}

              {/* Device Stats */}
              <div className="border-t pt-3">
                <div className="text-xs text-gray-500 mb-2">Call Statistics</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="font-medium">{device.stats.totalCalls}</div>
                    <div className="text-gray-500 text-xs">Total</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">{device.stats.successfulCalls}</div>
                    <div className="text-gray-500 text-xs">Success</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">
                    Success Rate: {device.stats.totalCalls > 0 
                      ? Math.round((device.stats.successfulCalls / device.stats.totalCalls) * 100)
                      : 0}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Total Duration: {formatDuration(device.stats.totalDuration)}
                  </div>
                </div>
              </div>

              {/* Last Seen */}
              <div className="text-xs text-gray-400 mt-2 border-t pt-2">
                Last seen: {new Date(device.lastSeen).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Devices Message */}
      {devices.length === 0 && (
        <div className="text-center py-12">
          <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Android devices connected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Install and run the IVR Call Manager Android app on your devices to get started.
          </p>
          <div className="mt-6 max-w-md mx-auto">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-left">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Quick Setup:</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
                    Download and install the Android app
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">2</span>
                    Grant all required permissions
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">3</span>
                    Configure server URL: <code className="bg-blue-100 px-1 rounded text-xs">{getServerUrl()}</code>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">4</span>
                    Connect and start receiving calls
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}