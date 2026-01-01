import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface ConnectionStatus {
  isConnected: boolean;
  serverUrl: string;
  deviceId: string;
  deviceName: string;
  phoneNumber: string;
}

const App = (): React.JSX.Element => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    serverUrl: 'ws://192.168.1.45:8080',
    deviceId: '',
    deviceName: '',
    phoneNumber: '',
  });
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [urlInput, setUrlInput] = useState('');
  const [deviceNameInput, setDeviceNameInput] = useState('');
  const [phoneNumberInput, setPhoneNumberInput] = useState('');

  useEffect(() => {
    initializeApp();
    checkNetworkStatus();
  }, []);

  const initializeApp = async () => {
    try {
      await requestPermissions();
      const savedUrl = await AsyncStorage.getItem('serverUrl');
      const savedDeviceId = await AsyncStorage.getItem('deviceId');
      const savedDeviceName = await AsyncStorage.getItem('deviceName');
      const savedPhoneNumber = await AsyncStorage.getItem('phoneNumber');

      let deviceId = savedDeviceId;
      if (!deviceId) {
        deviceId = generateDeviceId();
        await AsyncStorage.setItem('deviceId', deviceId);
      }

      const url = savedUrl || connectionStatus.serverUrl;
      const deviceName = savedDeviceName || 'Android Device';
      const phoneNumber = savedPhoneNumber || '';
      
      setConnectionStatus({ 
        serverUrl: url, 
        deviceId, 
        deviceName,
        phoneNumber,
        isConnected: false 
      });
      setUrlInput(url);
      setDeviceNameInput(deviceName);
      setPhoneNumberInput(phoneNumber);

    } catch (error) {
      console.error('Initialization error:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        ];
        await PermissionsAndroid.requestMultiple(permissions);
      } catch (error) {
        console.error('Permission error:', error);
      }
    }
  };

  const generateDeviceId = (): string => {
    return 'device_' + Math.random().toString(36).substr(2, 9);
  };

  const checkNetworkStatus = () => {
    return NetInfo.addEventListener(state => {
      setNetworkInfo(state);
    });
  };

  // Function to save the settings
  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('serverUrl', urlInput);
      await AsyncStorage.setItem('deviceName', deviceNameInput);
      await AsyncStorage.setItem('phoneNumber', phoneNumberInput);
      
      setConnectionStatus(prev => ({
        ...prev, 
        serverUrl: urlInput,
        deviceName: deviceNameInput,
        phoneNumber: phoneNumberInput
      }));
      
      Alert.alert('Saved', 'Settings have been updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const connectToServer = async () => {
    if (webSocket) {
      webSocket.close();
    }
    
    try {
      console.log('Attempting to connect to:', connectionStatus.serverUrl);
      const ws = new WebSocket(connectionStatus.serverUrl);
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          Alert.alert('Connection Timeout', 'Failed to connect to server within 10 seconds. Please check your server URL and network connection.');
        }
      }, 10000);
      
      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        clearTimeout(connectionTimeout);
        setConnectionStatus(prev => ({...prev, isConnected: true}));
        
        // Register device with server
        const registerMessage = {
          type: 'device_register',
          deviceId: connectionStatus.deviceId,
          deviceInfo: {
            name: connectionStatus.deviceName,
            phoneNumber: connectionStatus.phoneNumber,
            capabilities: ['voice_call'],
            batteryLevel: 100,
            signalStrength: 100,
            networkType: networkInfo?.type || 'unknown'
          }
        };
        
        console.log('Sending registration message:', registerMessage);
        ws.send(JSON.stringify(registerMessage));
        Alert.alert('Success', 'Connected to server successfully!');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          switch (data.type) {
            case 'registration_success':
              Alert.alert('Registration', 'Device registered successfully!');
              break;
              
            case 'call_command':
              if (data.action === 'make_call') {
                handleCallRequest(data);
              }
              break;
              
            case 'disconnect_command':
              Alert.alert('Disconnected', 'Server disconnected this device');
              ws.close();
              break;
              
            case 'error':
              Alert.alert('Server Error', data.message);
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Message parsing error:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        clearTimeout(connectionTimeout);
        setConnectionStatus(prev => ({...prev, isConnected: false}));
        
        if (event.code !== 1000) { // Not a normal closure
          Alert.alert('Connection Lost', `Connection closed unexpectedly. Code: ${event.code}`);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(connectionTimeout);
        Alert.alert('Connection Failed', `Could not connect to ${connectionStatus.serverUrl}. Please check:\n\n1. Server URL is correct\n2. Server is running\n3. Network connection is stable\n4. Firewall allows connection`);
        setConnectionStatus(prev => ({...prev, isConnected: false}));
      };

      setWebSocket(ws);
      
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Error', 'Failed to create WebSocket connection');
    }
  };

  const handleCallRequest = (callData: any) => {
    Alert.alert(
      'Incoming Call Request',
      `Campaign: ${callData.campaignId}\nCall to: ${callData.phoneNumber}\nContact: ${callData.contactName || 'Unknown'}\n\nThis call will play an audio message and collect DTMF responses.`,
      [
        {
          text: 'Decline', 
          style: 'cancel',
          onPress: () => sendCallStatus(callData.callId, 'failed', 'User declined')
        },
        {
          text: 'Accept & Make Call', 
          onPress: () => {
            Alert.alert('Call Initiated', `Calling ${callData.phoneNumber}...`);
            sendCallStatus(callData.callId, 'initiated');
            
            // Simulate call progress
            setTimeout(() => {
              sendCallStatus(callData.callId, 'answered');
              
              // Show DTMF response options after call is answered
              setTimeout(() => {
                showDTMFResponseDialog(callData);
              }, 3000); // Wait 3 seconds for audio to play
              
            }, 2000);
          }
        },
      ]
    );
  };

  const showDTMFResponseDialog = (callData: any) => {
    Alert.alert(
      'Customer Response',
      `Audio message played to ${callData.phoneNumber}\n\nWhat did the customer press?`,
      [
        {
          text: '1 - Interested (Sales)',
          onPress: () => sendCallStatus(callData.callId, 'completed', null, 35, '1')
        },
        {
          text: '2 - Not Interested',
          onPress: () => sendCallStatus(callData.callId, 'completed', null, 25, '2')
        },
        {
          text: '3 - Call Back Later',
          onPress: () => sendCallStatus(callData.callId, 'completed', null, 20, '3')
        },
        {
          text: '9 - Remove from List',
          onPress: () => sendCallStatus(callData.callId, 'completed', null, 15, '9')
        },
        {
          text: 'No Response',
          style: 'cancel',
          onPress: () => sendCallStatus(callData.callId, 'completed', null, 30, null)
        }
      ]
    );
  };

  const sendCallStatus = (callId: string, status: string, error?: string, duration?: number, dtmfResponse?: string) => {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      const statusMessage = {
        type: 'call_response',
        callId,
        status,
        phoneNumber: connectionStatus.phoneNumber,
        duration: duration || 30,
        error,
        dtmfResponse,
        deviceId: connectionStatus.deviceId,
        timestamp: new Date().toISOString()
      };
      
      webSocket.send(JSON.stringify(statusMessage));
      console.log('Sent call response:', statusMessage);
      
      // Show success message
      if (status === 'completed') {
        const responseText = dtmfResponse ? {
          '1': 'Customer interested - forwarded to sales',
          '2': 'Customer not interested - marked as contacted',
          '3': 'Customer requested callback - scheduled follow-up',
          '9': 'Customer removed from list'
        }[dtmfResponse] || 'No customer response recorded' : 'No customer response recorded';
        
        Alert.alert('Call Completed', responseText);
      }
    }
  };

  const disconnect = () => {
    if (webSocket) {
      webSocket.close();
      setWebSocket(null);
      setConnectionStatus(prev => ({...prev, isConnected: false}));
    }
  };

  const testConnection = async () => {
    try {
      // Convert WebSocket URL to HTTP URL for testing
      const httpUrl = connectionStatus.serverUrl.replace('ws://', 'http://').replace(':8080', ':5000');
      const response = await fetch(`${httpUrl}/health`);
      if (response.ok) {
        Alert.alert('Success', 'Server is reachable');
      } else {
        Alert.alert('Error', `Server responded with status: ${response.status}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Cannot reach server. Check the URL and if the server is running.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>IVR Call Manager</Text>
          <Text style={styles.subtitle}>Android Device Controller</Text>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server Settings</Text>
          <Text style={styles.label}>WebSocket URL:</Text>
          <TextInput
            style={styles.input}
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="ws://your-computer-ip:8080"
          />
          
          <Text style={styles.label}>Device Name:</Text>
          <TextInput
            style={styles.input}
            value={deviceNameInput}
            onChangeText={setDeviceNameInput}
            placeholder="My Android Device"
          />
          
          <Text style={styles.label}>Phone Number:</Text>
          <TextInput
            style={styles.input}
            value={phoneNumberInput}
            onChangeText={setPhoneNumberInput}
            placeholder="+91-9876543210"
            keyboardType="phone-pad"
          />
          
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={saveSettings}>
            <Text style={styles.buttonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator, 
              {backgroundColor: connectionStatus.isConnected ? '#28a745' : '#dc3545'}
            ]} />
            <Text style={styles.statusText}>
              {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          <Text style={styles.infoText}>Server: {connectionStatus.serverUrl}</Text>
          <Text style={styles.infoText}>Device ID: {connectionStatus.deviceId}</Text>
          <Text style={styles.infoText}>Device Name: {connectionStatus.deviceName}</Text>
          <Text style={styles.infoText}>Phone Number: {connectionStatus.phoneNumber}</Text>
          {networkInfo && (
            <Text style={styles.infoText}>
              Network: {networkInfo.type} ({networkInfo.isConnected ? 'Connected' : 'Disconnected'})
            </Text>
          )}
        </View>

        {/* Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controls</Text>
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.primaryButton, 
              connectionStatus.isConnected && styles.disabledButton
            ]} 
            onPress={connectToServer} 
            disabled={connectionStatus.isConnected}
          >
            <Text style={styles.buttonText}>Connect to Server</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.secondaryButton, 
              !connectionStatus.isConnected && styles.disabledButton
            ]} 
            onPress={disconnect} 
            disabled={!connectionStatus.isConnected}
          >
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.testButton]} onPress={testConnection}>
            <Text style={styles.buttonText}>Test Server Connection</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Setup Instructions</Text>
          <Text style={styles.instructionText}>
            1. Make sure your computer and phone are on the same network{'\n'}
            2. Replace "your-computer-ip" with your computer's actual IP address{'\n'}
            3. Use WebSocket URL format: ws://192.168.1.100:8080{'\n'}
            4. Enter your device name and phone number{'\n'}
            5. Save settings and connect to server{'\n'}
            6. Grant all permissions when prompted
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: { 
    padding: 20, 
    alignItems: 'center', 
    backgroundColor: '#007bff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: 'white' 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#e3f2fd', 
    marginTop: 5 
  },
  section: { 
    marginHorizontal: 20, 
    marginVertical: 10, 
    padding: 15, 
    backgroundColor: 'white', 
    borderRadius: 8, 
    elevation: 2 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    color: '#333' 
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
    marginTop: 10
  },
  statusContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  statusIndicator: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    marginRight: 8 
  },
  statusText: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  infoText: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 5, 
    flexShrink: 1 
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  button: { 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 10 
  },
  saveButton: { 
    backgroundColor: '#ffc107' 
  },
  primaryButton: { 
    backgroundColor: '#007bff' 
  },
  secondaryButton: { 
    backgroundColor: '#6c757d' 
  },
  testButton: { 
    backgroundColor: '#28a745' 
  },
  disabledButton: { 
    backgroundColor: '#e9ecef' 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});

export default App;