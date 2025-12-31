import { useState, useEffect } from 'react';
import { apiClient } from '@/utils/api';
import {
  PhoneIcon,
  SpeakerWaveIcon,
  HashtagIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface AudioInteraction {
  id: string;
  callId: string;
  campaignName: string;
  contactPhone: string;
  audioFile: string;
  dtmfInputs: Array<{
    digit: string;
    timestamp: string;
    responseTime: number;
  }>;
  duration: number;
  status: 'completed' | 'abandoned' | 'failed';
  timestamp: string;
}

interface InteractionStats {
  totalInteractions: number;
  completedInteractions: number;
  averageResponseTime: number;
  mostUsedDigit: string;
  completionRate: number;
}

export default function AudioInteractionTracker() {
  const [interactions, setInteractions] = useState<AudioInteraction[]>([]);
  const [stats, setStats] = useState<InteractionStats>({
    totalInteractions: 0,
    completedInteractions: 0,
    averageResponseTime: 0,
    mostUsedDigit: '1',
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInteractions = async () => {
    try {
      setError(null);
      
      // Fetch recent audio interactions
      const response = await apiClient.get('/api/analytics/audio-interactions');
      
      if (response.data) {
        setInteractions(response.data.interactions || []);
        setStats(response.data.stats || stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audio interactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
    
    const interval = setInterval(fetchInteractions, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatResponseTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'abandoned': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Audio Interaction Tracking</h3>
        </div>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Audio Interaction Tracking</h3>
        </div>
        <div className="p-4 text-center">
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={fetchInteractions}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Audio Interaction Tracking</h3>
        <p className="text-sm text-gray-500">Real-time tracking of user interactions with IVR audio</p>
      </div>
      
      <div className="p-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <PhoneIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Interactions</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalInteractions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-900">{stats.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-yellow-900">{formatResponseTime(stats.averageResponseTime)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <HashtagIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Most Used Digit</p>
                <p className="text-2xl font-bold text-purple-900">{stats.mostUsedDigit}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Interactions */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Recent Interactions</h4>
          
          {interactions.length === 0 ? (
            <div className="text-center py-8">
              <SpeakerWaveIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interactions yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Audio interactions will appear here when users interact with your IVR system.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audio File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DTMF Inputs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {interactions.map((interaction) => (
                    <tr key={interaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {interaction.contactPhone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {interaction.campaignName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <SpeakerWaveIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {interaction.audioFile}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-1">
                          {interaction.dtmfInputs.map((input, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              title={`Response time: ${formatResponseTime(input.responseTime)}`}
                            >
                              {input.digit}
                            </span>
                          ))}
                          {interaction.dtmfInputs.length === 0 && (
                            <span className="text-gray-400 text-xs">No input</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(interaction.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interaction.status)}`}>
                          {interaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(interaction.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Real-time Indicator */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
            <span>Real-time tracking active</span>
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}