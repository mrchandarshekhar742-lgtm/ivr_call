// Basic types for the IVR system

export interface User {
  id: string | number;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'user' | 'operator';
  permissions: string[];
  status?: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface Campaign {
  id: string | number;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  type: 'bulk' | 'scheduled' | 'triggered';
  audioFileId?: string | number;
  audioFile?: AudioFile;
  contactListId?: string;
  contacts?: Contact[];
  contactCount?: number;
  completedCalls?: number;
  successfulCalls?: number;
  failedCalls?: number;
  ivrFlow?: IVRFlow;
  scheduledAt?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  stats?: CampaignStats;
}

export interface CampaignFormData {
  name: string;
  description: string;
  type: 'bulk' | 'scheduled' | 'triggered';
  audioFileId?: number; // Optional for edit form
  priority: number;
  maxConcurrentCalls: number;
  retryAttempts: number;
  retryInterval: number;
  callTimeout: number;
}

// Separate interface for new campaign form (all fields required)
export interface NewCampaignFormData {
  name: string;
  description: string;
  type: 'bulk' | 'scheduled' | 'triggered';
  audioFileId: number;
  priority: number;
  maxConcurrentCalls: number;
  retryAttempts: number;
  retryInterval: number;
  callTimeout: number;
}

// Separate interface for edit campaign form (audioFileId optional)
export interface EditCampaignFormData {
  name: string;
  description: string;
  type: 'bulk' | 'scheduled' | 'triggered';
  priority: number;
  maxConcurrentCalls: number;
  retryAttempts: number;
  retryInterval: number;
  callTimeout: number;
}

export interface Contact {
  id: string | number;
  name: string;
  phone: string;
  email?: string;
  status: 'active' | 'inactive' | 'pending' | 'called' | 'failed';
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AudioFile {
  id: string | number;
  name: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  category: string;
  description?: string;
  tags: string[];
  file: {
    size: number;
    duration: number | null;
  };
  processing: {
    status: string;
  };
  usage: {
    campaignCount: number;
    totalPlays: number;
    lastUsed: string | null;
  };
  uploadedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CallLog {
  id: string | number;
  campaignId: string | number;
  contactId: string | number;
  deviceId?: string;
  callSid?: string;
  sessionId?: string;
  call: {
    status: 'completed' | 'failed' | 'busy' | 'no-answer';
    duration: number;
    startTime: string;
    endTime?: string;
  };
  dtmfResponse?: {
    key: string;
    timestamp: string;
    responseTime: number;
  };
  flow?: CallFlow;
  provider?: ProviderData;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallData {
  fromNumber: string;
  toNumber: string;
  direction: 'inbound' | 'outbound';
  status: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  cost?: number;
  currency?: string;
}

export interface CallFlow {
  audioPlayed: AudioEvent[];
  dtmfReceived: DTMFEvent[];
  completedSteps: string[];
}

export interface AudioEvent {
  audioUrl: string;
  playedAt: string;
  completed: boolean;
  duration?: number;
}

export interface DTMFEvent {
  digit: string;
  timestamp: string;
  source: string;
  confidence?: number;
}

export interface ProviderData {
  name: string;
  callSid: string;
  accountSid?: string;
  deviceId?: string;
}

export interface IVRFlow {
  welcomeMessage?: string;
  audioFile?: string;
  options: IVROption[];
}

export interface IVROption {
  digit: string;
  description: string;
  action: 'play_audio' | 'transfer' | 'hangup' | 'collect_input';
  audioFile?: string;
  transferNumber?: string;
  nextStep?: string;
}

export interface CampaignStats {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  answeredCalls: number;
  busyCalls: number;
  noAnswerCalls: number;
  queuedCalls?: number;
  dtmfResponses: Record<string, number>;
  averageCallDuration: number;
  totalCost: number;
  successRate: number;
}

export interface AndroidDevice {
  id: string;
  name: string;
  phoneNumber: string;
  status: 'available' | 'busy' | 'offline';
  lastSeen: string;
  currentCall?: {
    campaignId: string;
    contactPhone: string;
    contactName?: string;
    startTime: string;
    callId: string;
  };
  capabilities: string[];
  stats: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalDuration: number;
  };
  batteryLevel: number;
  signalStrength: number;
  networkType: string;
  isConnected: boolean;
}

export interface DeviceStats {
  totalDevices: number;
  availableDevices: number;
  busyDevices: number;
  offlineDevices: number;
  queuedCalls: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
}

export interface DashboardStats {
  activeCalls: number;
  completedToday: number;
  successRate: number;
  totalCampaigns: number;
  totalContacts: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  campaigns: {
    total: number;
    running: number;
    draft: number;
    paused: number;
    completed: number;
    cancelled: number;
  };
  contacts: {
    total: number;
    called: number;
    remaining: number;
  };
  calls: {
    totalDuration: number;
    completed: number;
    failed: number;
  };
  callStatusData: Array<{
    status: string;
    count: number;
  }>;
  campaignMetrics: Array<{
    id: string;
    name: string;
    status: string;
    totalContacts: number;
    completedCalls: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Activity Item Type
export interface ActivityItem {
  id: number | string;
  type: string;
  message: string;
  timestamp: string;
}