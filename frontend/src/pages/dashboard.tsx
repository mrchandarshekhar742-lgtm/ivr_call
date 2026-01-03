import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PhoneIcon,
  CheckCircleIcon,
  ChartBarIcon,
  MegaphoneIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon,
  SignalIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import { DashboardStats } from '@/types';
import { formatNumber, formatPercentage } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import io from 'socket.io-client';

interface RecentCall {
  id: any;
  phone: any;
  campaignName: string;
  status: string;
  time: string;
}

interface RunningCampaign {
  id: any;
  name: string;
  status: string;
  totalContacts?: any;
  startTime?: string;
  progress?: number;
}

interface DashboardRealTimeStats {
  activeCalls: number;
  completedToday: number;
  successRate: number;
  runningCampaigns: RunningCampaign[];
  recentCalls: RecentCall[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

function StatCard({ title, value, change, changeType, icon: Icon, color }: StatCardProps) {
  const changeColor = {
    positive: 'text-success-600',
    negative: 'text-error-600',
    neutral: 'text-gray-600',
  }[changeType || 'neutral'];

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${changeColor}`}>
                    {change}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecentActivity {
  id: string;
  type: 'campaign_started' | 'campaign_completed' | 'call_failed' | 'audio_uploaded' | 'device_connected' | 'device_disconnected';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

function ActivityFeed({ activities }: { activities: RecentActivity[] }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-success-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-warning-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-error-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-primary-500" />;
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="card-body p-0">
        <div className="flow-root">
          <ul className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <li key={activity.id} className="px-6 py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function AndroidDeviceStatus() {
  const { data: deviceData, isLoading } = useQuery({
    queryKey: ['android-devices-status'],
    queryFn: () => apiClient.get('/api/android-devices/stats'),
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: 1,
  });

  const stats = deviceData?.data || {
    totalDevices: 0,
    availableDevices: 0,
    busyDevices: 0,
    offlineDevices: 0,
    queuedCalls: 0,
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DevicePhoneMobileIcon className="w-5 h-5 mr-2" />
            Android Devices
          </h3>
        </div>
        <div className="card-body">
          <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DevicePhoneMobileIcon className="w-5 h-5 mr-2" />
            Android Devices
          </h3>
          <a
            href="/android-devices"
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            View all →
          </a>
        </div>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalDevices}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.availableDevices}</div>
            <div className="text-sm text-gray-500">Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.busyDevices}</div>
            <div className="text-sm text-gray-500">Busy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.offlineDevices}</div>
            <div className="text-sm text-gray-500">Offline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.queuedCalls}</div>
            <div className="text-sm text-gray-500">Queued</div>
          </div>
        </div>
        
        {stats.totalDevices === 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <DevicePhoneMobileIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-blue-800">No Android devices connected</h4>
                <p className="mt-1 text-sm text-blue-700">
                  Install the IVR Call Manager Android app to start making calls.
                </p>
                <a
                  href="/android-devices"
                  className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Setup instructions →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [realTimeStats, setRealTimeStats] = useState<DashboardRealTimeStats>({
    activeCalls: 0,
    completedToday: 0,
    successRate: 0,
    runningCampaigns: [] as RunningCampaign[],
    recentCalls: [] as RecentCall[]
  });
  const [socket, setSocket] = useState<any>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Initialize socket connection for real-time updates
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Dashboard connected for real-time updates');
    });

    newSocket.on('call_initiated', (data: any) => {
      setRealTimeStats(prev => ({
        ...prev,
        activeCalls: prev.activeCalls + 1,
        recentCalls: [{
          id: data.callId,
          phone: data.phone,
          campaignName: `Campaign ${data.campaignId}`,
          status: 'calling',
          time: new Date().toLocaleTimeString()
        }, ...prev.recentCalls.slice(0, 4)]
      }));
    });

    newSocket.on('call_completed', (data: any) => {
      setRealTimeStats(prev => ({
        ...prev,
        activeCalls: Math.max(0, prev.activeCalls - 1),
        completedToday: prev.completedToday + 1,
        recentCalls: prev.recentCalls.map(call => 
          call.id === data.callId 
            ? { ...call, status: 'completed', dtmfResponse: data.dtmfResponse }
            : call
        )
      }));
    });

    newSocket.on('campaign_started', (data: any) => {
      setRealTimeStats(prev => ({
        ...prev,
        runningCampaigns: [...prev.runningCampaigns.filter((c: any) => c.id !== data.campaignId), {
          id: data.campaignId,
          name: `Campaign ${data.campaignId}`,
          status: 'running',
          totalContacts: data.totalContacts || 0,
          startTime: new Date().toLocaleTimeString()
        }]
      }));
    });

    newSocket.on('campaign_stopped', (data: any) => {
      setRealTimeStats(prev => ({
        ...prev,
        runningCampaigns: prev.runningCampaigns.filter((c: any) => c.id !== data.campaignId)
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch dashboard data - only when authenticated
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get<DashboardStats>('/api/dashboard'),
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: isAuthenticated, // Only run query when authenticated
    retry: 1, // Only retry once
  });

  // Mock real-time updates (in production, this would come from WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        ...prev,
        successRate: Math.min(100, Math.max(0, prev.successRate + (Math.random() - 0.5) * 2)),
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Mock recent activities
  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'device_connected',
      title: 'Android Device Connected',
      description: 'Device "Samsung Galaxy S21" connected successfully',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      status: 'success',
    },
    {
      id: '2',
      type: 'campaign_started',
      title: 'Campaign Started',
      description: 'Appointment Reminders campaign has been started',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: 'success',
    },
    {
      id: '3',
      type: 'audio_uploaded',
      title: 'Audio File Uploaded',
      description: 'New welcome message uploaded successfully',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: 'info',
    },
    {
      id: '4',
      type: 'call_failed',
      title: 'Call Failed',
      description: 'High failure rate detected in Survey campaign',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'warning',
    },
    {
      id: '5',
      type: 'campaign_completed',
      title: 'Campaign Completed',
      description: 'Payment Reminders campaign finished successfully',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'success',
    },
  ];

  if (authLoading || isLoading) {
    return (
      <Layout title="Dashboard">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-body">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    console.log('Dashboard error details:', error);
    return (
      <Layout title="Dashboard">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-error-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error?.message || 'Unable to load dashboard data. Please try again.'}
          </p>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const stats = dashboardData?.data || {
    activeCalls: 0,
    completedToday: 0,
    successRate: 85,
    totalCampaigns: 0,
    campaigns: { total: 0, running: 0, draft: 0, paused: 0, completed: 0, cancelled: 0 },
    contacts: { total: 0, called: 0, remaining: 0 },
    calls: { totalDuration: 0, completed: 0, failed: 0 },
    callStatusData: [],
    campaignMetrics: [],
    recentActivity: []
  };

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Calls"
            value={formatNumber(stats.activeCalls || realTimeStats.activeCalls)}
            change="+12%"
            changeType="positive"
            icon={PhoneIcon}
            color="bg-primary-500"
          />
          <StatCard
            title="Completed Today"
            value={formatNumber(stats.completedToday || realTimeStats.completedToday)}
            change="+8%"
            changeType="positive"
            icon={CheckCircleIcon}
            color="bg-success-500"
          />
          <StatCard
            title="Success Rate"
            value={formatPercentage(stats.successRate || realTimeStats.successRate)}
            change="-2%"
            changeType="negative"
            icon={ChartBarIcon}
            color="bg-warning-500"
          />
          <StatCard
            title="Total Campaigns"
            value={formatNumber(stats.totalCampaigns || stats.campaigns?.total || 0)}
            change="+3"
            changeType="positive"
            icon={MegaphoneIcon}
            color="bg-purple-500"
          />
        </div>

        {/* Real-time Campaign Status */}
        {realTimeStats.runningCampaigns.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <PlayIcon className="h-5 w-5 mr-2 text-green-500" />
                  Active Campaigns
                </h3>
                <span className="text-sm text-gray-500">
                  {realTimeStats.runningCampaigns.length} running
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {realTimeStats.runningCampaigns.map((campaign: any) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium text-gray-900">{campaign.name}</p>
                        <p className="text-sm text-gray-500">
                          Started at {campaign.startTime} • {campaign.totalContacts} contacts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Running
                      </span>
                      <a
                        href={`/campaigns/${campaign.id}`}
                        className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Call Activity */}
        {realTimeStats.recentCalls.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <PhoneIcon className="h-5 w-5 mr-2 text-blue-500" />
                Recent Call Activity
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {realTimeStats.recentCalls.map((call: any) => (
                  <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        call.status === 'calling' ? 'bg-blue-500 animate-pulse' : 
                        call.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{call.phone}</p>
                        <p className="text-sm text-gray-500">{call.campaignName} • {call.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        call.status === 'calling' ? 'bg-blue-100 text-blue-800' :
                        call.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {call.status === 'calling' ? 'Calling...' : 
                         call.status === 'completed' ? 'Completed' : 'Failed'}
                      </span>
                      {call.dtmfResponse && (
                        <p className="text-xs text-gray-500 mt-1">
                          Response: {call.dtmfResponse === '1' ? 'Interested' :
                                   call.dtmfResponse === '2' ? 'Not Interested' :
                                   call.dtmfResponse === '3' ? 'Callback' :
                                   call.dtmfResponse === '9' ? 'Remove' : 'Unknown'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Android Device Status */}
        <AndroidDeviceStatus />

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Call Status Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Call Status Distribution</h3>
            </div>
            <div className="card-body">
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">Chart will be implemented with Recharts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <ActivityFeed activities={stats.recentActivity?.length > 0 ? stats.recentActivity : recentActivities} />
        </div>

        {/* Campaign Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Performance charts will be implemented</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/campaigns/new" className="btn-primary p-4 text-left block hover:no-underline">
            <MegaphoneIcon className="h-6 w-6 mb-2" />
            <div className="text-sm font-medium">Create Campaign</div>
            <div className="text-xs opacity-75">Start a new calling campaign</div>
          </a>
          
          <a href="/calls" className="btn-secondary p-4 text-left block hover:no-underline">
            <PhoneIcon className="h-6 w-6 mb-2" />
            <div className="text-sm font-medium">View Call Logs</div>
            <div className="text-xs opacity-75">Check recent call activity</div>
          </a>
          
          <a href="/analytics" className="btn-secondary p-4 text-left block hover:no-underline">
            <ChartBarIcon className="h-6 w-6 mb-2" />
            <div className="text-sm font-medium">Analytics</div>
            <div className="text-xs opacity-75">View detailed reports</div>
          </a>
          
          <a href="/android-devices" className="btn-secondary p-4 text-left block hover:no-underline">
            <DevicePhoneMobileIcon className="h-6 w-6 mb-2" />
            <div className="text-sm font-medium">Android Devices</div>
            <div className="text-xs opacity-75">Manage connected devices</div>
          </a>
        </div>
      </div>
    </Layout>
  );
}

// Note: Utility functions moved to @/utils/format