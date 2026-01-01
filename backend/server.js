require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const multer = require('multer');
const { logger } = require('./src/config/logger');
const { apiLimiter } = require('./src/middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true
});

// Make io available to routes
app.set('io', io);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3000"
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-HTTP-Method-Override'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
};

// Apply middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/', apiLimiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/audio/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.originalname.endsWith('.mp3') || file.originalname.endsWith('.wav')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// In-memory data storage (replace with database in production)
let users = [
  {
    id: 1,
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@ivrSystem.com',
    password: 'admin123',
    phone: '+91-9876543210',
    role: 'admin',
    status: 'active',
    permissions: [
      'create_campaign', 'edit_campaign', 'delete_campaign', 'view_campaigns', 
      'manage_users', 'view_analytics', 'manage_audio', 'manage_contacts', 
      'view_call_logs', 'manage_settings', 'manage_devices'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Manager User',
    firstName: 'Manager',
    lastName: 'User',
    email: 'manager@ivrSystem.com',
    password: 'manager123',
    phone: '+91-9876543211',
    role: 'manager',
    status: 'active',
    permissions: [
      'create_campaign', 'edit_campaign', 'view_campaigns', 'view_analytics',
      'manage_audio', 'manage_contacts', 'view_call_logs'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let campaigns = [
  {
    id: 1,
    name: 'Welcome Campaign',
    description: 'Welcome new customers',
    status: 'draft',
    type: 'bulk',
    createdBy: 1,
    audioFileId: null,
    contactListId: null,
    ivrFlow: {
      welcomeMessage: 'Welcome to our service',
      options: [
        { digit: '1', description: 'For sales', action: 'play_audio' },
        { digit: '2', description: 'For support', action: 'play_audio' },
        { digit: '9', description: 'To repeat', action: 'play_audio' }
      ]
    },
    schedule: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let contacts = [
  {
    id: 1,
    campaignId: 1,
    name: 'John Doe',
    phone: '+91-9876543210',
    email: 'john@example.com',
    status: 'active',
    leadStatus: 'new',
    priority: 2,
    callAttempts: 0,
    lastCallDate: null,
    nextCallTime: null,
    lastResponse: null,
    customFields: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let callLogs = [];
let audioFiles = [
  {
    id: 1,
    name: 'Welcome Message',
    filename: 'test-welcome.txt',
    originalName: 'welcome-message.mp3',
    mimeType: 'audio/mpeg',
    size: 1024000,
    url: '/uploads/audio/test-welcome.txt',
    category: 'welcome',
    description: 'Welcome message for IVR system',
    tags: ['welcome', 'greeting'],
    file: {
      size: 1024000,
      duration: 30
    },
    processing: {
      status: 'ready'
    },
    usage: {
      campaignCount: 3,
      totalPlays: 45,
      lastUsed: new Date().toISOString()
    },
    uploadedBy: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Survey Introduction',
    filename: 'survey-intro.txt',
    originalName: 'survey-intro.mp3',
    mimeType: 'audio/mpeg',
    size: 856000,
    url: '/uploads/audio/survey-intro.txt',
    category: 'survey',
    description: 'Introduction message for surveys',
    tags: ['survey', 'intro'],
    file: {
      size: 856000,
      duration: 25
    },
    processing: {
      status: 'ready'
    },
    usage: {
      campaignCount: 1,
      totalPlays: 12,
      lastUsed: new Date().toISOString()
    },
    uploadedBy: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
let androidDevices = [];

// Utility functions
const generateToken = (userId) => {
  return `token_${userId}_${Date.now()}`;
};

const findUser = (email, password = null) => {
  return users.find(u => u.email === email && (!password || u.password === password));
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      code: 'TOKEN_REQUIRED'
    });
  }

  // Simple token validation (in production, use JWT)
  const userId = token.split('_')[1];
  const user = users.find(u => u.id == userId);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  req.user = user;
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    message: 'IVR System is running'
  });
});

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  const user = findUser(email, password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  if (user.status !== 'active') {
    return res.status(401).json({
      success: false,
      message: 'Account is not active'
    });
  }

  const accessToken = generateToken(user.id);
  const refreshToken = generateToken(user.id);

  const userResponse = { ...user };
  delete userResponse.password;

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  if (findUser(email)) {
    return res.status(409).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  const newUser = {
    id: users.length + 1,
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    email,
    password,
    phone: null,
    role: 'operator',
    status: 'active',
    permissions: [
      'view_campaigns', 'create_campaign', 'edit_campaign', 
      'manage_contacts', 'view_call_logs', 'manage_audio', 'view_analytics'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  users.push(newUser);

  const accessToken = generateToken(newUser.id);
  const refreshToken = generateToken(newUser.id);

  const userResponse = { ...newUser };
  delete userResponse.password;

  logger.info(`User registered: ${newUser.email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const userResponse = { ...req.user };
  delete userResponse.password;

  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: userResponse,
      permissions: req.user.permissions
    }
  });
});

// Update profile
app.put('/api/auth/profile', authenticateToken, (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      success: false,
      message: 'First name, last name, and email are required'
    });
  }

  // Check if email is taken by another user
  const existingUser = users.find(u => u.email === email && u.id !== req.user.id);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email is already taken by another user'
    });
  }

  // Update user
  const userIndex = users.findIndex(u => u.id === req.user.id);
  users[userIndex] = {
    ...users[userIndex],
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    email,
    phone,
    updatedAt: new Date().toISOString()
  };

  const userResponse = { ...users[userIndex] };
  delete userResponse.password;

  logger.info(`User profile updated: ${email}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: userResponse
    }
  });
});

// Change password
app.put('/api/auth/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters long'
    });
  }

  if (req.user.password !== currentPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  const userIndex = users.findIndex(u => u.id === req.user.id);
  users[userIndex].password = newPassword;
  users[userIndex].updatedAt = new Date().toISOString();

  logger.info(`User password changed: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Refresh token
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  // Simple refresh token validation
  const userId = refreshToken.split('_')[1];
  const user = users.find(u => u.id == userId);

  if (!user || user.status !== 'active') {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }

  const newAccessToken = generateToken(user.id);
  const newRefreshToken = generateToken(user.id);

  const userResponse = { ...user };
  delete userResponse.password;

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      user: userResponse,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    }
  });
});

// ==================== CAMPAIGN ROUTES ====================

// Get campaigns
app.get('/api/campaigns', authenticateToken, (req, res) => {
  const userCampaigns = campaigns.filter(c => c.createdBy === req.user.id);
  
  res.json({
    success: true,
    message: 'Campaigns retrieved successfully',
    data: userCampaigns,
    pagination: {
      page: 1,
      limit: 50,
      total: userCampaigns.length,
      pages: 1
    }
  });
});

// Create campaign
app.post('/api/campaigns', authenticateToken, (req, res) => {
  const { name, description, type = 'bulk' } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Campaign name is required'
    });
  }

  const newCampaign = {
    id: campaigns.length + 1,
    name,
    description: description || '',
    status: 'draft',
    type,
    createdBy: req.user.id,
    audioFileId: null,
    contactListId: null,
    ivrFlow: {
      welcomeMessage: 'Welcome to our service',
      options: [
        { digit: '1', description: 'For sales', action: 'play_audio' },
        { digit: '2', description: 'For support', action: 'play_audio' },
        { digit: '9', description: 'To repeat', action: 'play_audio' }
      ]
    },
    schedule: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  campaigns.push(newCampaign);

  logger.info(`Campaign created: ${name} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Campaign created successfully',
    data: newCampaign
  });
});

// Get single campaign
app.get('/api/campaigns/:id', authenticateToken, (req, res) => {
  const campaign = campaigns.find(c => c.id == req.params.id && c.createdBy === req.user.id);
  
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  res.json({
    success: true,
    message: 'Campaign retrieved successfully',
    data: campaign
  });
});

// Update campaign
app.put('/api/campaigns/:id', authenticateToken, (req, res) => {
  const campaignIndex = campaigns.findIndex(c => c.id == req.params.id && c.createdBy === req.user.id);
  
  if (campaignIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  campaigns[campaignIndex] = {
    ...campaigns[campaignIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  logger.info(`Campaign updated: ${campaigns[campaignIndex].name}`);

  res.json({
    success: true,
    message: 'Campaign updated successfully',
    data: campaigns[campaignIndex]
  });
});

// Start campaign
app.post('/api/campaigns/:id/start', authenticateToken, (req, res) => {
  const campaignIndex = campaigns.findIndex(c => c.id == req.params.id && c.createdBy === req.user.id);
  
  if (campaignIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  if (campaigns[campaignIndex].status === 'running') {
    return res.status(400).json({
      success: false,
      message: 'Campaign is already running'
    });
  }

  // Check if campaign has contacts
  const campaignContacts = contacts.filter(c => c.campaignId == req.params.id);
  if (campaignContacts.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Campaign has no contacts assigned. Please add contacts first.'
    });
  }

  // Check if campaign has audio file
  if (!campaigns[campaignIndex].audioFileId) {
    return res.status(400).json({
      success: false,
      message: 'Campaign has no audio file selected. Please select an audio file first.'
    });
  }

  campaigns[campaignIndex].status = 'running';
  campaigns[campaignIndex].startedAt = new Date().toISOString();
  campaigns[campaignIndex].updatedAt = new Date().toISOString();

  // Initialize campaign stats
  campaigns[campaignIndex].stats = {
    ...campaigns[campaignIndex].stats,
    totalCalls: campaignContacts.length,
    startTime: new Date().toISOString()
  };

  // Start campaign processing
  startCampaignProcessing(campaigns[campaignIndex].id);

  // Emit campaign started event
  io.emit('campaign_started', {
    campaignId: campaigns[campaignIndex].id,
    status: 'running',
    totalContacts: campaignContacts.length
  });

  logger.info(`Campaign started: ${campaigns[campaignIndex].name} with ${campaignContacts.length} contacts`);

  res.json({
    success: true,
    message: 'Campaign started successfully',
    data: campaigns[campaignIndex]
  });
});

// Campaign processing function
const activeCampaignProcessors = new Map();

function startCampaignProcessing(campaignId) {
  // Stop existing processor if running
  if (activeCampaignProcessors.has(campaignId)) {
    clearInterval(activeCampaignProcessors.get(campaignId));
  }

  // Start new processor
  const processor = setInterval(async () => {
    await processCampaignCalls(campaignId);
  }, 5000); // Process every 5 seconds

  activeCampaignProcessors.set(campaignId, processor);
  logger.info(`Campaign processor started for campaign ${campaignId}`);
}

function stopCampaignProcessing(campaignId) {
  if (activeCampaignProcessors.has(campaignId)) {
    clearInterval(activeCampaignProcessors.get(campaignId));
    activeCampaignProcessors.delete(campaignId);
    logger.info(`Campaign processor stopped for campaign ${campaignId}`);
  }
}

async function processCampaignCalls(campaignId) {
  try {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign || campaign.status !== 'running') {
      stopCampaignProcessing(campaignId);
      return;
    }

    // Get contacts ready for calling
    const readyContacts = contacts.filter(c => 
      c.campaignId === campaignId && 
      c.status === 'active' &&
      (c.callAttempts || 0) < (campaign.config?.retryAttempts || 3) &&
      (!c.nextCallTime || new Date(c.nextCallTime) <= new Date())
    );

    if (readyContacts.length === 0) {
      // Check if campaign is complete
      const allContacts = contacts.filter(c => c.campaignId === campaignId);
      const completedContacts = allContacts.filter(c => 
        (c.callAttempts || 0) >= (campaign.config?.retryAttempts || 3) ||
        c.leadStatus === 'completed' ||
        c.leadStatus === 'remove_from_list'
      );

      if (completedContacts.length === allContacts.length) {
        // Campaign completed
        const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
        campaigns[campaignIndex].status = 'completed';
        campaigns[campaignIndex].completedAt = new Date().toISOString();
        
        stopCampaignProcessing(campaignId);
        
        io.emit('campaign_completed', {
          campaignId: campaignId,
          status: 'completed'
        });
        
        logger.info(`Campaign ${campaignId} completed`);
      }
      return;
    }

    // Check available Android devices
    const availableDevices = androidDevices.filter(d => d.status === 'available' && d.isConnected);
    if (availableDevices.length === 0) {
      logger.info(`No available Android devices for campaign ${campaignId}`);
      return;
    }

    // Process calls up to concurrent limit
    const maxConcurrent = campaign.config?.maxConcurrentCalls || 10;
    const currentCalls = callLogs.filter(c => 
      c.campaignId === campaignId && 
      c.call.status === 'in-progress'
    ).length;

    const callsToMake = Math.min(
      readyContacts.length,
      availableDevices.length,
      maxConcurrent - currentCalls
    );

    for (let i = 0; i < callsToMake; i++) {
      const contact = readyContacts[i];
      const device = availableDevices[i];
      
      await makeCallToContact(campaign, contact, device);
    }

  } catch (error) {
    logger.error(`Error processing campaign ${campaignId}:`, error);
  }
}

async function makeCallToContact(campaign, contact, device) {
  try {
    // Create call log
    const callId = `call_${campaign.id}_${contact.id}_${Date.now()}`;
    const newCallLog = {
      id: callLogs.length + 1,
      campaignId: campaign.id,
      contactId: contact.id,
      callSid: callId,
      sessionId: `session_${campaign.id}_${contact.id}`,
      call: {
        fromNumber: device.phoneNumber || '+91-SYSTEM',
        toNumber: contact.phone,
        direction: 'outbound',
        status: 'initiated',
        startTime: new Date().toISOString(),
        endTime: null,
        duration: 0
      },
      flow: {
        audioPlayed: [],
        dtmfReceived: [],
        completedSteps: ['call_initiated']
      },
      provider: {
        name: 'android-device',
        callSid: callId,
        deviceId: device.id
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    callLogs.push(newCallLog);

    // Update contact
    const contactIndex = contacts.findIndex(c => c.id === contact.id);
    contacts[contactIndex].callAttempts = (contacts[contactIndex].callAttempts || 0) + 1;
    contacts[contactIndex].lastCallDate = new Date().toISOString();
    contacts[contactIndex].leadStatus = 'calling';
    contacts[contactIndex].updatedAt = new Date().toISOString();

    // Update device status
    const deviceIndex = androidDevices.findIndex(d => d.id === device.id);
    if (deviceIndex >= 0) {
      androidDevices[deviceIndex].status = 'busy';
      androidDevices[deviceIndex].currentCall = {
        campaignId: campaign.id,
        contactPhone: contact.phone,
        contactName: contact.name,
        startTime: new Date().toISOString(),
        callId: callId
      };
    }

    // Send call command to Android device
    io.to('android_devices').emit('make_call', {
      callId: callId,
      campaignId: campaign.id,
      contactId: contact.id,
      phoneNumber: contact.phone,
      contactName: contact.name,
      audioUrl: campaign.ivrFlow?.audioFile || '',
      deviceId: device.id
    });

    // Emit call initiated event
    io.emit('call_initiated', {
      campaignId: campaign.id,
      contactId: contact.id,
      callId: callId,
      phone: contact.phone,
      deviceId: device.id
    });

    logger.info(`Call initiated: ${contact.phone} via device ${device.id}`);

    // Set timeout for call completion (in case device doesn't respond)
    setTimeout(() => {
      handleCallTimeout(callId, campaign.id, contact.id, device.id);
    }, (campaign.config?.callTimeout || 300) * 1000);

  } catch (error) {
    logger.error(`Error making call to ${contact.phone}:`, error);
  }
}

function handleCallTimeout(callId, campaignId, contactId, deviceId) {
  // Check if call is still in progress
  const callLogIndex = callLogs.findIndex(c => c.callSid === callId);
  if (callLogIndex >= 0 && callLogs[callLogIndex].call.status === 'initiated') {
    // Mark call as failed due to timeout
    callLogs[callLogIndex].call.status = 'failed';
    callLogs[callLogIndex].call.endTime = new Date().toISOString();
    callLogs[callLogIndex].flow.completedSteps.push('call_timeout');

    // Update contact for retry
    const contactIndex = contacts.findIndex(c => c.id === contactId);
    if (contactIndex >= 0) {
      contacts[contactIndex].leadStatus = 'failed';
      contacts[contactIndex].nextCallTime = new Date(Date.now() + 60000).toISOString(); // Retry in 1 minute
    }

    // Free up device
    const deviceIndex = androidDevices.findIndex(d => d.id === deviceId);
    if (deviceIndex >= 0) {
      androidDevices[deviceIndex].status = 'available';
      androidDevices[deviceIndex].currentCall = null;
    }

    logger.info(`Call timeout: ${callId}`);
  }
}

// Stop campaign
app.post('/api/campaigns/:id/stop', authenticateToken, (req, res) => {
  const campaignIndex = campaigns.findIndex(c => c.id == req.params.id && c.createdBy === req.user.id);
  
  if (campaignIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  campaigns[campaignIndex].status = 'paused';
  campaigns[campaignIndex].pausedAt = new Date().toISOString();
  campaigns[campaignIndex].updatedAt = new Date().toISOString();

  // Stop campaign processing
  stopCampaignProcessing(campaigns[campaignIndex].id);

  // Emit campaign stopped event
  io.emit('campaign_stopped', {
    campaignId: campaigns[campaignIndex].id,
    status: 'paused'
  });

  logger.info(`Campaign stopped: ${campaigns[campaignIndex].name}`);

  res.json({
    success: true,
    message: 'Campaign stopped successfully',
    data: campaigns[campaignIndex]
  });
});

// Assign contacts to campaign
app.post('/api/campaigns/:id/assign-contacts', authenticateToken, (req, res) => {
  const campaignId = parseInt(req.params.id);
  const { contactIds } = req.body;

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Contact IDs array is required'
    });
  }

  // Find campaign
  const campaignIndex = campaigns.findIndex(c => c.id === campaignId && c.createdBy === req.user.id);
  if (campaignIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Update contacts with campaign ID
  let assignedCount = 0;
  contactIds.forEach(contactId => {
    const contactIndex = contacts.findIndex(c => c.id === contactId);
    if (contactIndex >= 0) {
      contacts[contactIndex].campaignId = campaignId;
      contacts[contactIndex].updatedAt = new Date().toISOString();
      assignedCount++;
    }
  });

  // Update campaign stats
  campaigns[campaignIndex].contactsConfig.totalCount = contacts.filter(c => c.campaignId === campaignId).length;
  campaigns[campaignIndex].updatedAt = new Date().toISOString();

  logger.info(`${assignedCount} contacts assigned to campaign ${campaignId}`);

  res.json({
    success: true,
    message: `${assignedCount} contacts assigned successfully`,
    data: {
      assignedCount,
      totalContacts: campaigns[campaignIndex].contactsConfig.totalCount
    }
  });
});

// Get campaign contacts
app.get('/api/campaigns/:id/contacts', authenticateToken, (req, res) => {
  const campaignId = parseInt(req.params.id);

  // Find campaign
  const campaign = campaigns.find(c => c.id === campaignId && c.createdBy === req.user.id);
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Get campaign contacts
  const campaignContacts = contacts.filter(c => c.campaignId === campaignId);

  res.json({
    success: true,
    message: 'Campaign contacts retrieved successfully',
    data: campaignContacts
  });
});

// Delete campaign
app.delete('/api/campaigns/:id', authenticateToken, (req, res) => {
  const campaignIndex = campaigns.findIndex(c => c.id == req.params.id && c.createdBy === req.user.id);
  
  if (campaignIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  const deletedCampaign = campaigns.splice(campaignIndex, 1)[0];

  logger.info(`Campaign deleted: ${deletedCampaign.name}`);

  res.json({
    success: true,
    message: 'Campaign deleted successfully'
  });
});

// ==================== CONTACT ROUTES ====================

// Get contacts
app.get('/api/contacts', authenticateToken, (req, res) => {
  const { search, status } = req.query;
  let filteredContacts = contacts;

  if (search) {
    filteredContacts = filteredContacts.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    );
  }

  if (status) {
    filteredContacts = filteredContacts.filter(c => c.status === status);
  }

  res.json({
    success: true,
    message: 'Contacts retrieved successfully',
    data: filteredContacts,
    pagination: {
      page: 1,
      limit: 50,
      total: filteredContacts.length,
      pages: 1
    }
  });
});

// Add individual contact
app.post('/api/contacts', authenticateToken, (req, res) => {
  const { name, phone, email, campaignId } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Contact name is required'
    });
  }

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  // Clean and format phone number
  const cleaned = phone.replace(/[^\d+]/g, '');
  const formatted = cleaned.startsWith('+91') ? cleaned : 
                   cleaned.startsWith('91') ? `+${cleaned}` : 
                   `+91${cleaned}`;

  // Check if contact already exists
  const existingContact = contacts.find(c => c.phone === formatted);
  if (existingContact) {
    return res.status(409).json({
      success: false,
      message: 'Contact with this phone number already exists'
    });
  }

  // Create new contact
  const newContact = {
    id: contacts.length + 1,
    campaignId: campaignId || null,
    name: name || `Contact ${formatted.slice(-4)}`,
    phone: formatted,
    email: email || null,
    status: 'active',
    leadStatus: 'new',
    priority: 2,
    callAttempts: 0,
    lastCallDate: null,
    nextCallTime: null,
    lastResponse: null,
    customFields: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  contacts.push(newContact);

  logger.info(`Contact added: ${formatted} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Contact added successfully',
    data: newContact
  });
});

// Update contact
app.put('/api/contacts/:id', authenticateToken, (req, res) => {
  const contactIndex = contacts.findIndex(c => c.id == req.params.id);
  
  if (contactIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  const { name, phone, email, status } = req.body;
  
  // If phone is being updated, format it
  let formattedPhone = contacts[contactIndex].phone;
  if (phone && phone !== contacts[contactIndex].phone) {
    const cleaned = phone.replace(/[^\d+]/g, '');
    formattedPhone = cleaned.startsWith('+91') ? cleaned : 
                    cleaned.startsWith('91') ? `+${cleaned}` : 
                    `+91${cleaned}`;
    
    // Check if new phone number already exists
    const existingContact = contacts.find(c => c.phone === formattedPhone && c.id != req.params.id);
    if (existingContact) {
      return res.status(409).json({
        success: false,
        message: 'Contact with this phone number already exists'
      });
    }
  }

  // Update contact
  contacts[contactIndex] = {
    ...contacts[contactIndex],
    name: name || contacts[contactIndex].name,
    phone: formattedPhone,
    email: email !== undefined ? email : contacts[contactIndex].email,
    status: status || contacts[contactIndex].status,
    updatedAt: new Date().toISOString()
  };

  logger.info(`Contact updated: ${formattedPhone}`);

  res.json({
    success: true,
    message: 'Contact updated successfully',
    data: contacts[contactIndex]
  });
});

// Bulk add contacts
app.post('/api/contacts/bulk', authenticateToken, (req, res) => {
  const { numbers, campaignId } = req.body;

  if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Phone numbers array is required'
    });
  }

  if (numbers.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 1000 numbers allowed at once'
    });
  }

  const results = {
    added: 0,
    skipped: 0,
    errors: []
  };

  // Process each number
  numbers.forEach((number, index) => {
    if (!number || typeof number !== 'string') {
      results.errors.push({
        index,
        number,
        error: 'Invalid phone number format'
      });
      return;
    }

    // Clean phone number
    const cleaned = number.replace(/[^\d+]/g, '');
    if (cleaned.length < 10) {
      results.errors.push({
        index,
        number,
        error: 'Phone number too short'
      });
      return;
    }

    // Format phone number
    const formatted = cleaned.startsWith('+91') ? cleaned : 
                     cleaned.startsWith('91') ? `+${cleaned}` : 
                     `+91${cleaned}`;

    // Check if already exists
    const exists = contacts.find(c => c.phone === formatted);
    if (exists) {
      results.skipped++;
      return;
    }

    // Add new contact
    const newContact = {
      id: contacts.length + 1,
      campaignId: campaignId || null,
      name: `Contact ${formatted.slice(-4)}`,
      phone: formatted,
      email: null,
      status: 'active',
      leadStatus: 'new',
      priority: 2,
      callAttempts: 0,
      lastCallDate: null,
      nextCallTime: null,
      lastResponse: null,
      customFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    contacts.push(newContact);
    results.added++;
  });

  logger.info(`Bulk contacts added: ${results.added} added, ${results.skipped} skipped`);

  res.json({
    success: true,
    message: `Successfully processed ${numbers.length} numbers. Added: ${results.added}, Skipped: ${results.skipped}`,
    data: results
  });
});

// Delete contact
app.delete('/api/contacts/:id', authenticateToken, (req, res) => {
  const contactIndex = contacts.findIndex(c => c.id == req.params.id);
  
  if (contactIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  const deletedContact = contacts.splice(contactIndex, 1)[0];

  logger.info(`Contact deleted: ${deletedContact.phone}`);

  res.json({
    success: true,
    message: 'Contact deleted successfully'
  });
});

// ==================== AUDIO ROUTES ====================

// Get audio files
app.get('/api/audio', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Audio files retrieved successfully',
    data: audioFiles
  });
});

// Get single audio file
app.get('/api/audio/:id', authenticateToken, (req, res) => {
  const audioFile = audioFiles.find(a => a.id == req.params.id);
  
  if (!audioFile) {
    return res.status(404).json({
      success: false,
      message: 'Audio file not found'
    });
  }

  res.json({
    success: true,
    message: 'Audio file retrieved successfully',
    data: audioFile
  });
});

// Upload audio file
app.post('/api/audio/upload', authenticateToken, upload.single('audioFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Audio file is required'
    });
  }

  const newAudioFile = {
    id: audioFiles.length + 1,
    name: req.body.name || req.file.originalname,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/audio/${req.file.filename}`,
    category: req.body.category || 'general',
    description: req.body.description || '',
    tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
    file: {
      size: req.file.size,
      duration: null // Will be calculated later
    },
    processing: {
      status: 'ready'
    },
    usage: {
      campaignCount: 0,
      totalPlays: 0,
      lastUsed: null
    },
    uploadedBy: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  audioFiles.push(newAudioFile);

  logger.info(`Audio file uploaded: ${newAudioFile.name}`);

  res.status(201).json({
    success: true,
    message: 'Audio file uploaded successfully',
    data: newAudioFile
  });
});

// ==================== ANALYTICS ROUTES ====================

// Get analytics overview
app.get('/api/analytics/overview', authenticateToken, (req, res) => {
  const userCampaigns = campaigns.filter(c => c.createdBy === req.user.id);
  const userCallLogs = callLogs.filter(c => {
    const campaign = campaigns.find(camp => camp.id === c.campaignId);
    return campaign && campaign.createdBy === req.user.id;
  });

  const overview = {
    totalCampaigns: userCampaigns.length,
    activeCampaigns: userCampaigns.filter(c => c.status === 'running').length,
    completedCampaigns: userCampaigns.filter(c => c.status === 'completed').length,
    totalCalls: userCallLogs.length,
    successfulCalls: userCallLogs.filter(c => c.call.status === 'completed').length,
    failedCalls: userCallLogs.filter(c => c.call.status === 'failed').length,
    averageCallDuration: userCallLogs.length > 0 ? 
      userCallLogs.reduce((sum, call) => sum + (call.call.duration || 0), 0) / userCallLogs.length : 0,
    successRate: userCallLogs.length > 0 ? 
      (userCallLogs.filter(c => c.call.status === 'completed').length / userCallLogs.length * 100).toFixed(2) : 0
  };

  res.json({
    success: true,
    message: 'Analytics overview retrieved successfully',
    data: overview
  });
});

// Get campaign analytics
app.get('/api/analytics/campaigns', authenticateToken, (req, res) => {
  const userCampaigns = campaigns.filter(c => c.createdBy === req.user.id);
  
  const campaignAnalytics = userCampaigns.map(campaign => {
    const campaignCalls = callLogs.filter(c => c.campaignId === campaign.id);
    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      totalCalls: campaignCalls.length,
      successfulCalls: campaignCalls.filter(c => c.call.status === 'completed').length,
      failedCalls: campaignCalls.filter(c => c.call.status === 'failed').length,
      successRate: campaignCalls.length > 0 ? 
        (campaignCalls.filter(c => c.call.status === 'completed').length / campaignCalls.length * 100).toFixed(2) : 0,
      createdAt: campaign.createdAt,
      lastActivity: campaignCalls.length > 0 ? 
        Math.max(...campaignCalls.map(c => new Date(c.timestamp).getTime())) : null
    };
  });

  res.json({
    success: true,
    message: 'Campaign analytics retrieved successfully',
    data: campaignAnalytics
  });
});

// Get call analytics
app.get('/api/analytics/calls', authenticateToken, (req, res) => {
  const userCallLogs = callLogs.filter(c => {
    const campaign = campaigns.find(camp => camp.id === c.campaignId);
    return campaign && campaign.createdBy === req.user.id;
  });

  const callAnalytics = {
    totalCalls: userCallLogs.length,
    callsByStatus: {
      completed: userCallLogs.filter(c => c.call.status === 'completed').length,
      failed: userCallLogs.filter(c => c.call.status === 'failed').length,
      busy: userCallLogs.filter(c => c.call.status === 'busy').length,
      no_answer: userCallLogs.filter(c => c.call.status === 'no-answer').length
    },
    callsByHour: Array.from({length: 24}, (_, hour) => {
      const hourCalls = userCallLogs.filter(call => {
        const callHour = new Date(call.timestamp).getHours();
        return callHour === hour;
      });
      return {
        hour,
        calls: hourCalls.length,
        successful: hourCalls.filter(c => c.call.status === 'completed').length
      };
    }),
    averageDuration: userCallLogs.length > 0 ? 
      userCallLogs.reduce((sum, call) => sum + (call.call.duration || 0), 0) / userCallLogs.length : 0,
    recentCalls: userCallLogs.slice(-10).reverse()
  };

  res.json({
    success: true,
    message: 'Call analytics retrieved successfully',
    data: callAnalytics
  });
});

// Get DTMF analytics
app.get('/api/analytics/dtmf', authenticateToken, (req, res) => {
  const userCallLogs = callLogs.filter(c => {
    const campaign = campaigns.find(camp => camp.id === c.campaignId);
    return campaign && campaign.createdBy === req.user.id;
  });

  const dtmfResponses = userCallLogs.filter(call => call.dtmfResponse).map(call => call.dtmfResponse);
  
  const dtmfAnalytics = {
    totalResponses: dtmfResponses.length,
    responseDistribution: {
      '1': dtmfResponses.filter(r => r.key === '1').length,
      '2': dtmfResponses.filter(r => r.key === '2').length,
      '3': dtmfResponses.filter(r => r.key === '3').length,
      '4': dtmfResponses.filter(r => r.key === '4').length,
      '5': dtmfResponses.filter(r => r.key === '5').length,
      '6': dtmfResponses.filter(r => r.key === '6').length,
      '7': dtmfResponses.filter(r => r.key === '7').length,
      '8': dtmfResponses.filter(r => r.key === '8').length,
      '9': dtmfResponses.filter(r => r.key === '9').length,
      '0': dtmfResponses.filter(r => r.key === '0').length,
      '*': dtmfResponses.filter(r => r.key === '*').length,
      '#': dtmfResponses.filter(r => r.key === '#').length
    },
    averageResponseTime: dtmfResponses.length > 0 ? 
      dtmfResponses.reduce((sum, r) => sum + (r.responseTime || 0), 0) / dtmfResponses.length : 0,
    mostCommonResponse: dtmfResponses.length > 0 ? 
      Object.entries(dtmfResponses.reduce((acc, r) => {
        acc[r.key] = (acc[r.key] || 0) + 1;
        return acc;
      }, {})).sort(([,a], [,b]) => b - a)[0]?.[0] : null,
    recentResponses: dtmfResponses.slice(-10).reverse()
  };

  res.json({
    success: true,
    message: 'DTMF analytics retrieved successfully',
    data: dtmfAnalytics
  });
});

// Get dashboard analytics (legacy endpoint)
app.get('/api/analytics/dashboard', authenticateToken, (req, res) => {
  const userCampaigns = campaigns.filter(c => c.createdBy === req.user.id);
  const userContacts = contacts.length;
  const userCallLogs = callLogs.filter(c => {
    const campaign = campaigns.find(camp => camp.id === c.campaignId);
    return campaign && campaign.createdBy === req.user.id;
  });

  const analytics = {
    totalCampaigns: userCampaigns.length,
    activeCampaigns: userCampaigns.filter(c => c.status === 'running').length,
    totalContacts: userContacts,
    totalCalls: userCallLogs.length,
    successfulCalls: userCallLogs.filter(c => c.call.status === 'completed').length,
    failedCalls: userCallLogs.filter(c => c.call.status === 'failed').length,
    recentActivity: [
      {
        id: 1,
        type: 'campaign_created',
        message: 'New campaign created',
        timestamp: new Date().toISOString()
      }
    ]
  };

  res.json({
    success: true,
    message: 'Analytics retrieved successfully',
    data: analytics
  });
});

// Get dashboard data (main dashboard endpoint)
app.get('/api/dashboard', authenticateToken, (req, res) => {
  const userCampaigns = campaigns.filter(c => c.createdBy === req.user.id);
  const userContacts = contacts.length;
  const userCallLogs = callLogs.filter(c => {
    const campaign = campaigns.find(camp => camp.id === c.campaignId);
    return campaign && campaign.createdBy === req.user.id;
  });

  const runningCampaigns = userCampaigns.filter(c => c.status === 'running');
  const completedCalls = userCallLogs.filter(c => c.call.status === 'completed');
  const failedCalls = userCallLogs.filter(c => c.call.status === 'failed');
  
  const successRate = userCallLogs.length > 0 ? 
    Math.round((completedCalls.length / userCallLogs.length) * 100) : 85;

  const dashboardData = {
    activeCalls: runningCampaigns.length,
    completedToday: completedCalls.filter(c => {
      const today = new Date().toDateString();
      return new Date(c.createdAt).toDateString() === today;
    }).length,
    successRate: successRate,
    totalCampaigns: userCampaigns.length,
    campaigns: {
      total: userCampaigns.length,
      running: userCampaigns.filter(c => c.status === 'running').length,
      draft: userCampaigns.filter(c => c.status === 'draft').length,
      paused: userCampaigns.filter(c => c.status === 'paused').length,
      completed: userCampaigns.filter(c => c.status === 'completed').length,
      cancelled: userCampaigns.filter(c => c.status === 'cancelled').length
    },
    contacts: {
      total: userContacts,
      called: contacts.filter(c => c.callAttempts > 0).length,
      remaining: contacts.filter(c => c.callAttempts === 0).length
    },
    calls: {
      totalDuration: userCallLogs.reduce((sum, call) => sum + (call.call.duration || 0), 0),
      completed: completedCalls.length,
      failed: failedCalls.length
    },
    callStatusData: [
      { status: 'completed', count: completedCalls.length },
      { status: 'failed', count: failedCalls.length },
      { status: 'pending', count: contacts.filter(c => c.callAttempts === 0).length }
    ],
    campaignMetrics: userCampaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      totalContacts: contacts.filter(c => c.campaignId === campaign.id).length,
      completedCalls: userCallLogs.filter(c => c.campaignId === campaign.id && c.call.status === 'completed').length
    })),
    recentActivity: [
      {
        id: '1',
        type: 'device_connected',
        title: 'System Ready',
        description: 'IVR System is operational and ready for campaigns',
        timestamp: new Date().toISOString(),
        status: 'success'
      },
      {
        id: '2',
        type: 'campaign_created',
        title: 'Campaigns Available',
        description: `${userCampaigns.length} campaigns configured`,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: 'info'
      },
      {
        id: '3',
        type: 'audio_uploaded',
        title: 'Contacts Ready',
        description: `${userContacts} contacts available for calling`,
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        status: 'info'
      }
    ]
  };

  res.json({
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: dashboardData
  });
});

// ==================== ANDROID DEVICE ROUTES ====================

// Get Android devices
app.get('/api/android-devices', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Android devices retrieved successfully',
    data: androidDevices
  });
});

// Get Android device stats
app.get('/api/android-devices/stats', authenticateToken, (req, res) => {
  const totalDevices = androidDevices.length;
  const availableDevices = androidDevices.filter(d => d.status === 'available').length;
  const busyDevices = androidDevices.filter(d => d.status === 'busy').length;
  const offlineDevices = androidDevices.filter(d => d.status === 'offline' || !d.isConnected).length;
  
  // Mock queued calls count
  const queuedCalls = campaigns.filter(c => c.status === 'running').reduce((sum, campaign) => {
    return sum + contacts.filter(contact => 
      contact.campaignId === campaign.id && 
      contact.callAttempts === 0
    ).length;
  }, 0);

  const stats = {
    totalDevices,
    availableDevices,
    busyDevices,
    offlineDevices,
    queuedCalls,
    devices: androidDevices.map(device => ({
      id: device.id,
      name: device.name,
      status: device.status,
      batteryLevel: device.batteryLevel,
      signalStrength: device.signalStrength,
      networkType: device.networkType,
      isConnected: device.isConnected,
      lastSeen: device.lastSeen,
      stats: device.stats
    }))
  };

  res.json({
    success: true,
    message: 'Android device stats retrieved successfully',
    data: stats
  });
});

// Get Android device queue
app.get('/api/android-devices/queue', authenticateToken, (req, res) => {
  // Get queued calls from running campaigns
  const queuedCalls = [];
  
  campaigns.filter(c => c.status === 'running').forEach(campaign => {
    const campaignContacts = contacts.filter(contact => 
      contact.campaignId === campaign.id && 
      contact.callAttempts === 0 &&
      contact.status === 'active'
    );
    
    campaignContacts.forEach(contact => {
      queuedCalls.push({
        id: `queue_${campaign.id}_${contact.id}`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        contactId: contact.id,
        contactName: contact.name,
        phoneNumber: contact.phone,
        priority: campaign.config?.priority || 5,
        estimatedCallTime: new Date(Date.now() + Math.random() * 300000).toISOString(), // Random time within 5 minutes
        status: 'queued'
      });
    });
  });

  // Sort by priority (higher priority first)
  queuedCalls.sort((a, b) => b.priority - a.priority);

  res.json({
    success: true,
    message: 'Android device queue retrieved successfully',
    data: {
      totalQueued: queuedCalls.length,
      queue: queuedCalls.slice(0, 50) // Return first 50 items
    }
  });
});

// Test call to device
app.post('/api/android-devices/:id/test-call', authenticateToken, (req, res) => {
  const { phoneNumber } = req.body;
  const deviceId = req.params.id;

  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  const device = androidDevices.find(d => d.id === deviceId);
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Device not found'
    });
  }

  if (device.status !== 'available') {
    return res.status(400).json({
      success: false,
      message: 'Device is not available for calls'
    });
  }

  // Send test call command to device
  const testCallId = `test_${Date.now()}`;
  io.to('android_devices').emit('make_call', {
    callId: testCallId,
    campaignId: 'test',
    contactId: 'test',
    phoneNumber: phoneNumber,
    contactName: 'Test Call',
    audioUrl: '',
    deviceId: deviceId,
    isTestCall: true
  });

  logger.info(`Test call initiated: ${phoneNumber} via device ${deviceId}`);

  res.json({
    success: true,
    message: 'Test call initiated successfully',
    data: {
      callId: testCallId,
      phoneNumber: phoneNumber,
      deviceId: deviceId
    }
  });
});

// Disconnect device
app.delete('/api/android-devices/:id', authenticateToken, (req, res) => {
  const deviceId = req.params.id;
  const deviceIndex = androidDevices.findIndex(d => d.id === deviceId);

  if (deviceIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Device not found'
    });
  }

  // Remove device from list
  const removedDevice = androidDevices.splice(deviceIndex, 1)[0];

  // Send disconnect command to device
  io.to('android_devices').emit('disconnect_command', {
    deviceId: deviceId,
    reason: 'Disconnected by admin'
  });

  logger.info(`Device disconnected: ${deviceId}`);

  res.json({
    success: true,
    message: 'Device disconnected successfully',
    data: removedDevice
  });
});

// Clear call queue
app.post('/api/android-devices/queue/clear', authenticateToken, (req, res) => {
  // Stop all running campaigns
  campaigns.forEach(campaign => {
    if (campaign.status === 'running') {
      campaign.status = 'paused';
      campaign.pausedAt = new Date().toISOString();
      stopCampaignProcessing(campaign.id);
    }
  });

  // Reset contact call attempts
  contacts.forEach(contact => {
    contact.callAttempts = 0;
    contact.nextCallTime = null;
    contact.leadStatus = 'new';
  });

  logger.info('Call queue cleared by admin');

  res.json({
    success: true,
    message: 'Call queue cleared successfully'
  });
});

// ==================== CALL ROUTES ====================

// Get call logs
app.get('/api/calls', authenticateToken, (req, res) => {
  const userCallLogs = callLogs.filter(c => {
    const campaign = campaigns.find(camp => camp.id === c.campaignId);
    return campaign && campaign.createdBy === req.user.id;
  });

  res.json({
    success: true,
    message: 'Call logs retrieved successfully',
    data: userCallLogs,
    pagination: {
      page: 1,
      limit: 50,
      total: userCallLogs.length,
      pages: 1
    }
  });
});
// ==================== SOCKET.IO EVENTS ====================

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join_campaign', (campaignId) => {
    socket.join(`campaign_${campaignId}`);
    logger.info(`Client ${socket.id} joined campaign ${campaignId}`);
  });

  // Handle Android device registration
  socket.on('device_register', (deviceData) => {
    socket.deviceId = deviceData.deviceId;
    socket.join('android_devices');
    
    // Add or update device
    const existingIndex = androidDevices.findIndex(d => d.id === deviceData.deviceId);
    const deviceInfo = {
      id: deviceData.deviceId,
      name: deviceData.name || 'Android Device',
      phoneNumber: deviceData.phoneNumber || 'Unknown',
      status: 'available',
      lastSeen: new Date().toISOString(),
      batteryLevel: deviceData.batteryLevel || 100,
      signalStrength: deviceData.signalStrength || 5,
      networkType: deviceData.networkType || '4G',
      isConnected: true,
      capabilities: ['voice_call', 'sms', 'dtmf'],
      stats: {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalDuration: 0
      }
    };

    if (existingIndex >= 0) {
      androidDevices[existingIndex] = deviceInfo;
    } else {
      androidDevices.push(deviceInfo);
    }

    logger.info(`Android device registered: ${deviceData.deviceId}`);
    
    // Broadcast device status to dashboard
    io.emit('device_status_update', deviceInfo);
  });

  // Handle call responses from Android devices
  socket.on('call_response', (callData) => {
    logger.info(`Call response received: ${JSON.stringify(callData)}`);
    
    // Find the campaign
    const campaign = campaigns.find(c => c.id === callData.campaignId);
    if (!campaign) {
      logger.error(`Campaign not found for call response: ${callData.campaignId}`);
      return;
    }
    
    // Create call log entry
    const newCallLog = {
      id: callLogs.length + 1,
      campaignId: callData.campaignId,
      contactId: callData.contactId,
      callSid: callData.callId || `call_${Date.now()}`,
      sessionId: `session_${callData.campaignId}_${callData.contactId}`,
      call: {
        fromNumber: callData.deviceId || '+91-SYSTEM',
        toNumber: callData.phoneNumber,
        direction: 'outbound',
        status: callData.status || 'completed',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: callData.duration || 30
      },
      flow: {
        audioPlayed: [{ audioUrl: campaign.ivrFlow?.audioFile || 'system_audio', playedAt: new Date().toISOString(), completed: true }],
        dtmfReceived: callData.dtmfResponse ? [{ digit: callData.dtmfResponse, timestamp: new Date().toISOString(), source: 'user' }] : [],
        completedSteps: ['audio_played', callData.dtmfResponse ? 'dtmf_received' : 'no_response']
      },
      provider: {
        name: 'android-device',
        callSid: callData.callId || `call_${Date.now()}`,
        deviceId: callData.deviceId
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    callLogs.push(newCallLog);

    // Update contact status based on response
    const contactIndex = contacts.findIndex(c => c.id === callData.contactId);
    if (contactIndex >= 0) {
      let leadStatus = 'contacted';
      
      if (callData.dtmfResponse) {
        switch (callData.dtmfResponse) {
          case '1':
            leadStatus = 'interested';
            break;
          case '2':
            leadStatus = 'not_interested';
            break;
          case '3':
            leadStatus = 'callback_requested';
            break;
          case '9':
            leadStatus = 'remove_from_list';
            break;
          default:
            leadStatus = 'responded';
        }
      }

      contacts[contactIndex] = {
        ...contacts[contactIndex],
        leadStatus,
        lastResponse: callData.dtmfResponse,
        callAttempts: (contacts[contactIndex].callAttempts || 0) + 1,
        lastCallDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Update campaign statistics
    const campaignIndex = campaigns.findIndex(c => c.id === callData.campaignId);
    if (campaignIndex >= 0) {
      if (!campaigns[campaignIndex].stats) {
        campaigns[campaignIndex].stats = {
          totalCalls: 0,
          completedCalls: 0,
          failedCalls: 0,
          answeredCalls: 0,
          busyCalls: 0,
          noAnswerCalls: 0,
          dtmfResponses: { '1': 0, '2': 0, '3': 0, '9': 0 },
          averageCallDuration: 0,
          totalCost: 0,
          successRate: 0
        };
      }

      campaigns[campaignIndex].stats.totalCalls += 1;
      
      if (callData.status === 'completed') {
        campaigns[campaignIndex].stats.completedCalls += 1;
        campaigns[campaignIndex].stats.answeredCalls += 1;
        
        if (callData.dtmfResponse) {
          campaigns[campaignIndex].stats.dtmfResponses[callData.dtmfResponse] = 
            (campaigns[campaignIndex].stats.dtmfResponses[callData.dtmfResponse] || 0) + 1;
        }
      } else {
        campaigns[campaignIndex].stats.failedCalls += 1;
      }

      // Update success rate
      campaigns[campaignIndex].stats.successRate = Math.round(
        (campaigns[campaignIndex].stats.completedCalls / campaigns[campaignIndex].stats.totalCalls) * 100
      );

      // Update average call duration
      const totalDuration = campaigns[campaignIndex].stats.averageCallDuration * (campaigns[campaignIndex].stats.totalCalls - 1) + (callData.duration || 30);
      campaigns[campaignIndex].stats.averageCallDuration = Math.round(totalDuration / campaigns[campaignIndex].stats.totalCalls);

      campaigns[campaignIndex].updatedAt = new Date().toISOString();
    }

    // Free up the device
    const deviceIndex = androidDevices.findIndex(d => d.id === callData.deviceId);
    if (deviceIndex >= 0) {
      androidDevices[deviceIndex].status = 'available';
      androidDevices[deviceIndex].currentCall = null;
      androidDevices[deviceIndex].lastSeen = new Date().toISOString();
      
      // Update device stats
      if (!androidDevices[deviceIndex].stats) {
        androidDevices[deviceIndex].stats = {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          totalDuration: 0
        };
      }
      
      androidDevices[deviceIndex].stats.totalCalls += 1;
      androidDevices[deviceIndex].stats.totalDuration += (callData.duration || 30);
      
      if (callData.status === 'completed') {
        androidDevices[deviceIndex].stats.successfulCalls += 1;
      } else {
        androidDevices[deviceIndex].stats.failedCalls += 1;
      }
    }

    // Broadcast call completed event
    io.emit('call_completed', {
      campaignId: callData.campaignId,
      contactId: callData.contactId,
      callId: newCallLog.id,
      status: callData.status,
      dtmfResponse: callData.dtmfResponse,
      phone: callData.phoneNumber
    });

    logger.info(`Call completed: ${callData.phoneNumber} - Response: ${callData.dtmfResponse || 'None'}`);
  });

  // Handle device status updates
  socket.on('device_status_update', (deviceStatus) => {
    const deviceIndex = androidDevices.findIndex(d => d.id === deviceStatus.deviceId);
    if (deviceIndex >= 0) {
      androidDevices[deviceIndex] = {
        ...androidDevices[deviceIndex],
        ...deviceStatus,
        lastSeen: new Date().toISOString()
      };
    }
    
    // Broadcast to dashboard
    io.emit('device_status_update', deviceStatus);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    
    // If it was an Android device, update status
    if (socket.deviceId) {
      const deviceIndex = androidDevices.findIndex(d => d.id === socket.deviceId);
      if (deviceIndex >= 0) {
        androidDevices[deviceIndex].status = 'offline';
        androidDevices[deviceIndex].isConnected = false;
        androidDevices[deviceIndex].lastSeen = new Date().toISOString();
      }

      io.emit('device_status_update', {
        deviceId: socket.deviceId,
        status: 'offline',
        isConnected: false
      });
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  logger.error('Unhandled Rejection:', {
    reason: reason,
    promise: promise
  });
});

server.listen(PORT, () => {
  console.log(`🚀 IVR System Server running on port ${PORT}`);
  logger.info(`IVR System Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  
  console.log(`📊 Dashboard: http://localhost:3000`);
  console.log(`🔐 Login: admin@ivrSystem.com / admin123`);
  console.log(`📱 Android WebSocket: ws://localhost:${PORT}`);
});

module.exports = app;
