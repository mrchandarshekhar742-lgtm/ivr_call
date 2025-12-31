# IVR System - Complete Business Communication Platform

A comprehensive web-based automated calling platform with IVR capabilities, featuring Android device integration for cost-effective business communications.

## 🎯 System Overview

This IVR system provides a complete solution for automated calling campaigns with:
- **Web Dashboard** - Campaign management, analytics, contact management
- **Android Integration** - Use your own devices with SIM cards for calling
- **Real-time Monitoring** - Live call progress and device status tracking
- **Cost-Effective** - No monthly telephony charges when using Android devices

## ✅ Current System Status

**FULLY OPERATIONAL** - All components tested and working:
- ✅ Backend Server (Node.js/Express)
- ✅ Frontend Dashboard (Next.js/React)
- ✅ Android App Integration (React Native)
- ✅ Authentication System
- ✅ Campaign Management
- ✅ Contact Management (Individual + Bulk)
- ✅ Real-time Analytics
- ✅ WebSocket Communication

## 🚀 Quick Start

### 1. Start the System
```bash
# Start both backend and frontend
node start-system.js

# Or start individually:
# Backend: cd backend && node server.js
# Frontend: cd frontend && npm run dev
```

### 2. Access the Dashboard
- **URL**: http://localhost:3000
- **Admin Login**: admin@ivrSystem.com / admin123
- **Manager Login**: manager@ivrSystem.com / manager123

### 3. Key Features Available
- **Dashboard**: Real-time statistics and monitoring
- **Campaigns**: Create and manage calling campaigns
- **Contacts**: Add individual contacts or bulk import
- **Analytics**: Performance metrics and reporting
- **Android Devices**: Connect and monitor calling devices

## 📱 Android Device Integration

### Setup Process
1. **Install Android App**: Use the IVRCallManager app
2. **Configure Connection**: Set WebSocket URL to your server
3. **Grant Permissions**: Phone, microphone, and storage access
4. **Connect Device**: Device will appear in dashboard
5. **Start Calling**: Assign campaigns to connected devices

### Device Features
- **Real-time Status**: Battery, signal strength, network type
- **Call Distribution**: Automatic call routing across devices
- **DTMF Detection**: Capture user responses during calls
- **Queue Management**: Handle multiple campaigns efficiently

## 🏗️ Project Structure

```
ivr-system/
├── backend/              # Node.js API server
│   ├── src/             # Source code
│   ├── server.js        # Main server file
│   └── package.json     # Backend dependencies
├── frontend/            # Next.js dashboard
│   ├── src/             # React components and pages
│   └── package.json     # Frontend dependencies
├── IVRCallManager/      # React Native Android app
│   ├── App.tsx          # Main app component
│   └── package.json     # App dependencies
├── start-system.js      # System startup script
├── package.json         # Root package management
├── README.md           # This file
└── USER-GUIDE.md       # Detailed usage guide
```

## 🔧 System Requirements

### Prerequisites
- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Android devices** with SIM cards (for calling)
- **Network connectivity** between devices and server

### No Database Required
- System uses **in-memory storage** for development
- All data persists during server runtime
- Production can be upgraded to MySQL/PostgreSQL

## 📊 Features Overview

### Campaign Management
- **Create Campaigns**: Bulk calling with custom IVR flows
- **Sequential Calling**: Automatic one-by-one calling
- **Response Handling**: DTMF key press categorization
- **Real-time Monitoring**: Live campaign progress tracking

### Contact Management
- **Individual Add**: Single contact with name, phone, email
- **Bulk Import**: Up to 1000 contacts at once
- **Smart Formatting**: Automatic +91 phone number formatting
- **Duplicate Prevention**: Avoid duplicate entries
- **Search & Filter**: Find contacts easily

### Analytics & Reporting
- **Dashboard Metrics**: Active calls, completion rates, success rates
- **Device Statistics**: Connected devices, battery levels, signal strength
- **Campaign Performance**: Call completion and response analytics
- **Real-time Updates**: Live data refresh every 30 seconds

### Android Device Management
- **Device Registration**: Automatic device discovery
- **Status Monitoring**: Real-time device health tracking
- **Call Distribution**: Smart routing across available devices
- **Queue Management**: Handle high-volume calling efficiently

## 🎯 Usage Workflow

### 1. Campaign Creation
1. Go to **Campaigns** → **Create Campaign**
2. Set campaign name, description, and type
3. Configure IVR flow and audio files
4. Save campaign (status: draft)

### 2. Contact Management
1. Go to **Contacts** → **Add Contact** (individual)
2. Or use **Bulk Add** for multiple contacts
3. Enter phone numbers (auto-formatted with +91)
4. Contacts appear immediately in list

### 3. Start Calling
1. Ensure Android devices are connected
2. Go to campaign → **Start Campaign**
3. Monitor progress in real-time
4. View responses and analytics

### 4. Response Handling
- **Press 1**: Interested leads
- **Press 2**: Not interested
- **Press 3**: Callback requested
- **Press 9**: Remove from list
- **No response**: Contacted status

## 💰 Cost Benefits

### Android Devices vs Traditional Telephony

| Aspect | Android Devices | Cloud Telephony |
|--------|----------------|-----------------|
| **Setup Cost** | ₹5,000-15,000 (one-time) | ₹0 |
| **Monthly Cost** | ₹200-500/SIM | ₹500+ per number |
| **Per Call Cost** | Normal mobile rates | ₹0.50-2.00/minute |
| **Annual Savings** | 50-70% cost reduction | - |
| **Control** | Full device control | Limited control |
| **Scalability** | Add more devices | Pay per usage |

## 🔍 Troubleshooting

### Common Issues

**Dashboard Not Loading:**
- Check if backend is running on port 5000
- Check if frontend is running on port 3000
- Verify login credentials

**Android Device Not Connecting:**
- Check WebSocket URL in app settings
- Verify server IP address and port
- Ensure device has internet connectivity
- Check firewall settings

**Contacts Not Adding:**
- Verify required fields (name and phone)
- Check for duplicate phone numbers
- Ensure proper phone number format

**Calls Not Working:**
- Verify Android device is connected and available
- Check SIM card has calling plan
- Ensure phone permissions granted on device
- Test with a single test call first

### Debug Steps
1. **Check Server Health**: http://localhost:5000/health
2. **Verify Login**: Use admin credentials to access dashboard
3. **Test API Endpoints**: Check browser network tab for errors
4. **Monitor Logs**: Check browser console for JavaScript errors

## 📚 Documentation

- **[USER-GUIDE.md](USER-GUIDE.md)** - Complete system usage guide
- **[ANDROID-DEVICE-TELEPHONY.md](ANDROID-DEVICE-TELEPHONY.md)** - Android integration details
- **[TELEPHONY-SETUP-GUIDE.md](TELEPHONY-SETUP-GUIDE.md)** - Setup instructions
- **[CALL-FLOW-EXPLANATION.md](CALL-FLOW-EXPLANATION.md)** - How calling works
- **[AUDIO-INTERACTION-TRACKING.md](AUDIO-INTERACTION-TRACKING.md)** - Audio handling

## 🚀 Production Deployment

### Security Considerations
- Use HTTPS for web dashboard
- Use WSS for WebSocket connections
- Implement proper authentication tokens
- Set up firewall rules for required ports

### Scaling Options
- Add more Android devices for higher capacity
- Implement device load balancing
- Set up monitoring and alerting
- Create backup and failover strategies

### Performance Optimization
- Use Redis for session management
- Implement database for persistent storage
- Set up CDN for static assets
- Configure proper caching strategies

## 🎉 Success Indicators

The system is ready when you see:
- ✅ Backend server running on port 5000
- ✅ Frontend dashboard accessible on port 3000
- ✅ Successful login with provided credentials
- ✅ Dashboard showing system statistics
- ✅ Ability to create campaigns and add contacts
- ✅ Android devices connecting and showing in dashboard

## 📞 Support & Maintenance

### Regular Maintenance
- Monitor device battery levels and connectivity
- Review campaign performance and optimize
- Update contact lists regularly
- Check system logs for any issues

### System Updates
- Keep Node.js and dependencies updated
- Update Android app when new versions available
- Monitor system performance and scale as needed
- Backup important campaign and contact data

---

**Your complete IVR system is ready for business use!** 🚀

Start by accessing the dashboard at http://localhost:3000 with admin@ivrSystem.com / admin123