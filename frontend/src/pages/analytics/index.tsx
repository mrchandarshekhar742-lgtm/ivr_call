import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import AudioInteractionTracker from '@/components/AudioInteractionTracker';
import AndroidDeviceManager from '@/components/AndroidDeviceManager';
import { apiClient } from '@/utils/api';

interface AnalyticsOverview {
  campaigns: {
    total: number;
    running: number;
    completed: number;
  };
  calls: {
    total: number;
    successful: number;
    failed: number;
  };
  contacts: {
    total: number;
    called: number;
    remaining: number;
  };
}

interface CampaignAnalytics {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  successRate: number;
  contactCount: number;
}

interface CallStats {
  statusDistribution: Array<{
    status: string;
    count: number;
    avgDuration: number;
    totalCost: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    callCount: number;
    avgDuration: number;
  }>;
}

interface DTMFStats {
  digitDistribution: Array<{
    digit: string;
    count: number;
    campaignName: string;
    avgResponseTime: number;
  }>;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [overview, setOverview] = useState<AnalyticsOverview>({
    campaigns: { total: 0, running: 0, completed: 0 },
    calls: { total: 0, successful: 0, failed: 0 },
    contacts: { total: 0, called: 0, remaining: 0 }
  });
  
  const [campaigns, setCampaigns] = useState<CampaignAnalytics[]>([]);
  const [callStats, setCallStats] = useState<CallStats>({ statusDistribution: [], hourlyDistribution: [] });
  const [dtmfStats, setDTMFStats] = useState<DTMFStats>({ digitDistribution: [] });

  const fetchAnalytics = async () => {
    try {
      setError(null);
      
      const [overviewRes, campaignRes, callRes, dtmfRes] = await Promise.all([
        apiClient.get('/api/analytics/overview'),
        apiClient.get('/api/analytics/campaigns'),
        apiClient.get('/api/analytics/calls'),
        apiClient.get('/api/analytics/dtmf')
      ]);

      setOverview(overviewRes.data || overview);
      setCampaigns(campaignRes.data?.campaigns || []);
      setCallStats(callRes.data?.callStats || callStats);
      setDTMFStats(dtmfRes.data?.dtmfStats || dtmfStats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [dateRange]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  if (loading) {
    return (
      <Layout title="Analytics">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Analytics">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Error Loading Analytics</h3>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  // Calculate success rate from call stats
  const totalCalls = overview.calls.total;
  const successRate = totalCalls > 0 ? (overview.calls.successful / totalCalls) * 100 : 0;
  
  // Calculate total cost from call stats
  const totalCost = callStats.statusDistribution.reduce((sum, stat) => sum + stat.totalCost, 0);
  
  // Calculate average duration from call stats
  const avgDuration = callStats.statusDistribution.length > 0 
    ? callStats.statusDistribution.reduce((sum, stat) => sum + stat.avgDuration, 0) / callStats.statusDistribution.length 
    : 0;

  return (
    <Layout title="Analytics">
      <div className="space-y-6">
        {/* Date Range Filter */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-600">Track your campaign performance and call metrics</p>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <ChartBarIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Calls</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(totalCalls)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatPercentage(successRate)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Duration</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {Math.round(avgDuration)}s
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">$</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Cost</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(totalCost)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacts</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No campaign data available
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(campaign.totalCalls)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(campaign.successRate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(campaign.contactCount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DTMF Analysis */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">DTMF Response Analysis</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {dtmfStats.digitDistribution.length === 0 ? (
                <div className="text-center text-gray-500">
                  No DTMF data available
                </div>
              ) : (
                dtmfStats.digitDistribution.map((item, index) => {
                  const totalResponses = dtmfStats.digitDistribution.reduce((sum, d) => sum + d.count, 0);
                  const percentage = totalResponses > 0 ? (item.count / totalResponses) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-900">
                            Digit {item.digit} - {item.campaignName}
                          </span>
                          <span className="text-gray-500">
                            {formatNumber(item.count)} ({formatPercentage(percentage)})
                          </span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Audio Interaction Tracking */}
        <AudioInteractionTracker />

        {/* Android Device Management */}
        {process.env.NEXT_PUBLIC_TELEPHONY_PROVIDER === 'android_device' && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Android Devices</h2>
            <AndroidDeviceManager />
          </div>
        )}
      </div>
    </Layout>
  );
}