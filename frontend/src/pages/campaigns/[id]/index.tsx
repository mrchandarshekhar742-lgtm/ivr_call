import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  UsersIcon,
  ClockIcon,
  ChartBarIcon,
  PlusIcon,
  SpeakerWaveIcon,
  SignalIcon,
  CheckCircleIcon,
  XCircleIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import { Campaign } from '@/types';
import { formatNumber, formatDuration } from '@/utils/format';
import io from 'socket.io-client';

// Add interface for call progress
interface CallProgress {
  id: any;
  phone: any;
  status: string;
  startTime: string;
}

// Add interface for real-time stats
interface RealTimeStats {
  activeCalls: number;
  completedCalls: number;
  dtmfResponses: { [key: string]: number };
  currentCallProgress: CallProgress[];
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [realTimeStats, setRealTimeStats] = useState({
    activeCalls: 0,
    completedCalls: 0,
    dtmfResponses: { '1': 0, '2': 0, '3': 0, '9': 0 },
    currentCallProgress: []
  });
  const [socket, setSocket] = useState<any>(null);

  // Initialize socket connection for real-time updates
  useEffect(() => {
    if (id) {
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
      
      newSocket.on('connect', () => {
        console.log('Connected to server for real-time updates');
        newSocket.emit('join_campaign', id);
      });

      newSocket.on('call_initiated', (data: any) => {
        if (data.campaignId == id) {
          setRealTimeStats(prev => ({
            ...prev,
            activeCalls: prev.activeCalls + 1,
            currentCallProgress: [...prev.currentCallProgress, {
              id: data.callId,
              phone: data.phone,
              status: 'calling',
              startTime: new Date().toISOString()
            }]
          }));
          toast.success(`Call initiated to ${data.phone}`);
        }
      });

      newSocket.on('call_completed', (data: any) => {
        if (data.campaignId == id) {
          setRealTimeStats(prev => ({
            ...prev,
            activeCalls: Math.max(0, prev.activeCalls - 1),
            completedCalls: prev.completedCalls + 1,
            dtmfResponses: {
              ...prev.dtmfResponses,
              [data.dtmfResponse]: (prev.dtmfResponses[data.dtmfResponse] || 0) + 1
            },
            currentCallProgress: prev.currentCallProgress.filter(call => call.id !== data.callId)
          }));
          
          if (data.dtmfResponse) {
            const responseText = {
              '1': 'Interested (Sales)',
              '2': 'Not Interested', 
              '3': 'Call Back Later',
              '9': 'Remove from List'
            }[data.dtmfResponse] || 'Unknown Response';
            
            toast.success(`Call completed: ${data.phone} - ${responseText}`);
          } else {
            toast.info(`Call completed: ${data.phone} - No response`);
          }
        }
      });

      newSocket.on('campaign_started', (data: any) => {
        if (data.campaignId == id) {
          toast.success('Campaign started successfully!');
          queryClient.invalidateQueries({ queryKey: ['campaign', id] });
        }
      });

      newSocket.on('campaign_stopped', (data: any) => {
        if (data.campaignId == id) {
          toast.info('Campaign stopped');
          queryClient.invalidateQueries({ queryKey: ['campaign', id] });
        }
      });

      newSocket.on('campaign_completed', (data: any) => {
        if (data.campaignId == id) {
          toast.success('Campaign completed successfully!');
          queryClient.invalidateQueries({ queryKey: ['campaign', id] });
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [id, queryClient]);

  // Fetch campaign data
  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => apiClient.get<Campaign>(`/api/campaigns/${id}`),
    enabled: !!id,
    refetchInterval: 30000, // Refresh every 30 seconds for live stats
  });

  // Fetch campaign contacts
  const { data: campaignContacts } = useQuery({
    queryKey: ['campaign-contacts', id],
    queryFn: () => apiClient.get(`/api/campaigns/${id}/contacts`),
    enabled: !!id,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch all contacts for assignment
  const { data: allContacts } = useQuery({
    queryKey: ['all-contacts'],
    queryFn: () => apiClient.get('/api/contacts'),
    enabled: showContactModal,
  });

  // Fetch audio file details
  const { data: audioFile } = useQuery({
    queryKey: ['audio-file', campaign?.data?.audioFileId],
    queryFn: () => apiClient.get(`/api/audio/${campaign?.data?.audioFileId}`),
    enabled: !!campaign?.data?.audioFileId,
  });

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [realTimeStats, setRealTimeStats] = useState({
    activeCalls: 0,
    completedCalls: 0,
    dtmfResponses: { '1': 0, '2': 0, '3': 0, '9': 0 },
    currentCallProgress: []
  });
  const [socket, setSocket] = useState<any>(null);

  // Initialize socket connection for real-time updates
  useEffect(() => {
    if (id) {
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
      
      newSocket.on('connect', () => {
        console.log('Connected to server for real-time updates');
        newSocket.emit('join_campaign', id);
      });

      newSocket.on('call_initiated', (data: any) => {
        if (data.campaignId == id) {
          setRealTimeStats(prev => ({
            ...prev,
            activeCalls: prev.activeCalls + 1,
            currentCallProgress: [...prev.currentCallProgress, {
              id: data.callId,
              phone: data.phone,
              status: 'calling',
              startTime: new Date().toISOString()
            }]
          }));
          toast.success(`Call initiated to ${data.phone}`);
        }
      });

      newSocket.on('call_completed', (data: any) => {
        if (data.campaignId == id) {
          setRealTimeStats(prev => ({
            ...prev,
            activeCalls: Math.max(0, prev.activeCalls - 1),
            completedCalls: prev.completedCalls + 1,
            dtmfResponses: {
              ...prev.dtmfResponses,
              [data.dtmfResponse]: (prev.dtmfResponses[data.dtmfResponse] || 0) + 1
            },
            currentCallProgress: prev.currentCallProgress.filter(call => call.id !== data.callId)
          }));
          
          if (data.dtmfResponse) {
            const responseText = {
              '1': 'Interested (Sales)',
              '2': 'Not Interested', 
              '3': 'Call Back Later',
              '9': 'Remove from List'
            }[data.dtmfResponse] || 'Unknown Response';
            
            toast.success(`Call completed: ${data.phone} - ${responseText}`);
          } else {
            toast.info(`Call completed: ${data.phone} - No response`);
          }
        }
      });

      newSocket.on('campaign_started', (data: any) => {
        if (data.campaignId == id) {
          toast.success('Campaign started successfully!');
          queryClient.invalidateQueries({ queryKey: ['campaign', id] });
        }
      });

      newSocket.on('campaign_stopped', (data: any) => {
        if (data.campaignId == id) {
          toast.info('Campaign stopped');
          queryClient.invalidateQueries({ queryKey: ['campaign', id] });
        }
      });

      newSocket.on('campaign_completed', (data: any) => {
        if (data.campaignId == id) {
          toast.success('Campaign completed successfully!');
          queryClient.invalidateQueries({ queryKey: ['campaign', id] });
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [id, queryClient]);

  // Fetch campaign data
  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => apiClient.get<Campaign>(`/api/campaigns/${id}`),
    enabled: !!id,
    refetchInterval: 30000, // Refresh every 30 seconds for live stats
  });

  // Fetch campaign contacts
  const { data: campaignContacts } = useQuery({
    queryKey: ['campaign-contacts', id],
    queryFn: () => apiClient.get(`/api/campaigns/${id}/contacts`),
    enabled: !!id,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch all contacts for assignment
  const { data: allContacts } = useQuery({
    queryKey: ['all-contacts'],
    queryFn: () => apiClient.get('/api/contacts'),
    enabled: showContactModal,
  });

  // Fetch audio file details
  const { data: audioFile } = useQuery({
    queryKey: ['audio-file', campaign?.data?.audioFileId],
    queryFn: () => apiClient.get(`/api/audio/${campaign?.data?.audioFileId}`),
    enabled: !!campaign?.data?.audioFileId,
  });

  // Campaign actions mutations
  const startMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/campaigns/${id}/start`),
    onSuccess: () => {
      toast.success('Campaign started successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start campaign');
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/campaigns/${id}/pause`),
    onSuccess: () => {
      toast.success('Campaign paused successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to pause campaign');
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/campaigns/${id}/stop`),
    onSuccess: () => {
      toast.success('Campaign stopped successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to stop campaign');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/campaigns/${id}`),
    onSuccess: () => {
      toast.success('Campaign deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      router.push('/campaigns');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete campaign');
    },
  });

  // Contact assignment mutation
  const assignContactsMutation = useMutation({
    mutationFn: (contactIds: number[]) => 
      apiClient.post(`/api/campaigns/${id}/assign-contacts`, { contactIds }),
    onSuccess: () => {
      toast.success('Contacts assigned successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts', id] });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      setShowContactModal(false);
      setSelectedContacts([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign contacts');
    },
  });

  const handleContactSelection = (contactId: number) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleAssignContacts = () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }
    assignContactsMutation.mutate(selectedContacts);
  };

  if (isLoading) {
    return (
      <Layout title="Campaign Details">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Layout>
    );
  }

  if (error || !campaign?.data) {
    return (
      <Layout title="Campaign Details">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-error-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Campaign not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The campaign you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/campaigns')}
              className="btn-primary"
            >
              Back to Campaigns
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const campaignData = campaign.data;
  const stats = campaignData?.stats || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-success-100 text-success-800';
      case 'paused': return 'bg-warning-100 text-warning-800';
      case 'completed': return 'bg-primary-100 text-primary-800';
      case 'cancelled': return 'bg-error-100 text-error-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canStart = ['draft', 'paused', 'completed'].includes(campaignData?.status || 'draft');
  const canPause = (campaignData?.status || 'draft') === 'running';
  const canStop = ['running', 'paused'].includes(campaignData?.status || 'draft');
  const canEdit = ['draft', 'paused', 'completed'].includes(campaignData?.status || 'draft');
  const canDelete = ['draft', 'completed', 'cancelled'].includes(campaignData?.status || 'draft');

  return (
    <Layout title={`Campaign: ${campaignData?.name || 'Loading...'}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/campaigns')}
              className="btn-secondary"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{campaignData?.name || 'Loading...'}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaignData?.status || 'draft')}`}>
                  {campaignData?.status ? campaignData.status.charAt(0).toUpperCase() + campaignData.status.slice(1) : 'Draft'}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-500">
                  Created {new Date(campaignData?.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {canEdit && (
              <button
                onClick={() => router.push(`/campaigns/${id}/edit`)}
                className="btn-secondary"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
            
            {canStart && (
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="btn-success"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Start
              </button>
            )}
            
            {canPause && (
              <button
                onClick={() => pauseMutation.mutate()}
                disabled={pauseMutation.isPending}
                className="btn-warning"
              >
                <PauseIcon className="w-4 h-4 mr-2" />
                Pause
              </button>
            )}
            
            {canStop && (
              <button
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
                className="btn-error"
              >
                <StopIcon className="w-4 h-4 mr-2" />
                Stop
              </button>
            )}
            
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn-error"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PhoneIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Calls</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats.totalCalls || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats.completedCalls || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Duration</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatDuration(stats.averageCallDuration || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Success Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.successRate || 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions for Seamless Workflow */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Campaign Workflow</h3>
            <p className="text-sm text-gray-600">Complete setup and start your campaign</p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Step 1: Audio File */}
              <div className={`p-4 rounded-lg border-2 ${
                audioFile?.data ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <SpeakerWaveIcon className={`h-6 w-6 ${
                    audioFile?.data ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  {audioFile?.data && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                </div>
                <h4 className="font-medium text-gray-900">1. Audio File</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {audioFile?.data ? 'Audio selected' : 'Select audio file'}
                </p>
                {!audioFile?.data && canEdit && (
                  <button
                    onClick={() => router.push(`/campaigns/${id}/edit`)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-500"
                  >
                    Select Audio →
                  </button>
                )}
              </div>

              {/* Step 2: Contacts */}
              <div className={`p-4 rounded-lg border-2 ${
                campaignContacts?.data?.length > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <UsersIcon className={`h-6 w-6 ${
                    campaignContacts?.data?.length > 0 ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  {campaignContacts?.data?.length > 0 && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                </div>
                <h4 className="font-medium text-gray-900">2. Contacts</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {campaignContacts?.data?.length > 0 
                    ? `${campaignContacts.data.length} contacts assigned` 
                    : 'Add contacts'}
                </p>
                {campaignContacts?.data?.length === 0 && canEdit && (
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-500"
                  >
                    Add Contacts →
                  </button>
                )}
              </div>

              {/* Step 3: Android Device */}
              <div className={`p-4 rounded-lg border-2 ${
                'border-blue-200 bg-blue-50' // Assume device is connected for demo
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600" />
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900">3. Android Device</h4>
                <p className="text-sm text-gray-600 mt-1">Device connected</p>
                <a
                  href="/android-devices"
                  className="mt-2 text-xs text-blue-600 hover:text-blue-500 block"
                >
                  Manage Devices →
                </a>
              </div>

              {/* Step 4: Start Campaign */}
              <div className={`p-4 rounded-lg border-2 ${
                campaignData?.status === 'running' ? 'border-green-200 bg-green-50' : 
                canStart && audioFile?.data && campaignContacts?.data?.length > 0 ? 'border-blue-200 bg-blue-50' : 
                'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <PlayIcon className={`h-6 w-6 ${
                    campaignData?.status === 'running' ? 'text-green-600' : 
                    canStart && audioFile?.data && campaignContacts?.data?.length > 0 ? 'text-blue-600' : 
                    'text-gray-400'
                  }`} />
                  {campaignData?.status === 'running' && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                </div>
                <h4 className="font-medium text-gray-900">4. Start Calling</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {campaignData?.status === 'running' ? 'Campaign running' : 'Ready to start'}
                </p>
                {canStart && audioFile?.data && campaignContacts?.data?.length > 0 && (
                  <button
                    onClick={() => startMutation.mutate()}
                    disabled={startMutation.isPending}
                    className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {startMutation.isPending ? 'Starting...' : 'Start Now →'}
                  </button>
                )}
              </div>
            </div>

            {/* Workflow Status */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Workflow Status</h4>
                  <p className="text-sm text-gray-600">
                    {!audioFile?.data ? 'Select an audio file to continue' :
                     campaignContacts?.data?.length === 0 ? 'Add contacts to start calling' :
                     campaignData?.status === 'running' ? 'Campaign is running - calls are being made automatically' :
                     'Ready to start! Click "Start Now" to begin calling contacts.'}
                  </p>
                </div>
                {campaignData?.status === 'running' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-600">Live</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Call Progress */}
        {(campaignData?.status === 'running' || realTimeStats.activeCalls > 0) && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <SignalIcon className="h-5 w-5 mr-2 text-green-500" />
                  Live Call Progress
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    {realTimeStats.activeCalls} Active Calls
                  </span>
                  <span className="text-gray-500">
                    {realTimeStats.completedCalls} Completed
                  </span>
                </div>
              </div>
            </div>
            <div className="card-body">
              {realTimeStats.currentCallProgress.length > 0 ? (
                <div className="space-y-3">
                  {realTimeStats.currentCallProgress.map((call: any) => (
                    <div key={call.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <div>
                          <p className="font-medium text-gray-900">{call.phone}</p>
                          <p className="text-sm text-gray-500">
                            Started {new Date(call.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-blue-600 font-medium">
                        Calling...
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No active calls at the moment
                </div>
              )}
            </div>
          </div>
        )}

        {/* DTMF Response Analytics */}
        {(Object.values(realTimeStats.dtmfResponses).some(v => v > 0) || (stats.dtmfResponses && Object.keys(stats.dtmfResponses).length > 0)) && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">DTMF Response Analytics</h3>
              <p className="text-sm text-gray-600">Real-time customer responses during calls</p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {(realTimeStats.dtmfResponses['1'] || 0) + (stats.dtmfResponses?.['1'] || 0)}
                  </div>
                  <div className="text-sm text-green-600 font-medium">Press 1</div>
                  <div className="text-xs text-green-500">Interested (Sales)</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-center mb-2">
                    <XCircleIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-700">
                    {(realTimeStats.dtmfResponses['2'] || 0) + (stats.dtmfResponses?.['2'] || 0)}
                  </div>
                  <div className="text-sm text-red-600 font-medium">Press 2</div>
                  <div className="text-xs text-red-500">Not Interested</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center mb-2">
                    <ClockIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {(realTimeStats.dtmfResponses['3'] || 0) + (stats.dtmfResponses?.['3'] || 0)}
                  </div>
                  <div className="text-sm text-yellow-600 font-medium">Press 3</div>
                  <div className="text-xs text-yellow-500">Call Back Later</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-center mb-2">
                    <TrashIcon className="h-8 w-8 text-gray-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-700">
                    {(realTimeStats.dtmfResponses['9'] || 0) + (stats.dtmfResponses?.['9'] || 0)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Press 9</div>
                  <div className="text-xs text-gray-500">Remove from List</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Response Instructions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                  <div>• Press 1: Customer is interested, forward to sales team</div>
                  <div>• Press 2: Customer not interested, mark as contacted</div>
                  <div>• Press 3: Customer wants callback, schedule follow-up</div>
                  <div>• Press 9: Remove customer from all future campaigns</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">Campaign Information</h3>
            </div>
            <div className="card-body">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {campaignData?.description || 'No description provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {campaignData?.config?.type || 'bulk'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {campaignData?.config?.priority || 5}/10
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Max Concurrent Calls</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {campaignData?.config?.maxConcurrentCalls || 10}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Audio File */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">Audio File</h3>
            </div>
            <div className="card-body">
              {audioFile?.data ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <SpeakerWaveIcon className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {audioFile.data.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {audioFile.data.category} • {Math.round(audioFile.data.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <audio 
                    controls 
                    className="w-full"
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${audioFile.data.url}`}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : (
                <div className="text-center py-4">
                  <SpeakerWaveIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">No audio file selected</p>
                  {canEdit && (
                    <button
                      onClick={() => router.push(`/campaigns/${id}/edit`)}
                      className="text-blue-600 hover:text-blue-500 text-sm mt-1"
                    >
                      Select audio file
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contacts */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Contacts</h3>
                {canEdit && (
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="btn-primary btn-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {campaignContacts?.data?.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    {campaignContacts.data.length} contacts assigned
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {campaignContacts.data.slice(0, 5).map((contact: any) => (
                      <div key={contact.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          <p className="text-gray-500">{contact.phone}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          contact.leadStatus === 'new' ? 'bg-blue-100 text-blue-800' :
                          contact.leadStatus === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                          contact.leadStatus === 'interested' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contact.leadStatus || 'new'}
                        </span>
                      </div>
                    ))}
                    {campaignContacts.data.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{campaignContacts.data.length - 5} more contacts
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <UsersIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">No contacts assigned</p>
                  {canEdit && (
                    <button
                      onClick={() => setShowContactModal(true)}
                      className="text-blue-600 hover:text-blue-500 text-sm mt-1"
                    >
                      Add contacts
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Campaign Progress</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Completed Calls</span>
                  <span>{stats.completedCalls || 0} / {stats.totalCalls || 0}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-success-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${stats.totalCalls > 0 ? ((stats.completedCalls || 0) / stats.totalCalls) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Success Rate</span>
                  <span>{stats.successRate || 0}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${stats.successRate || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* DTMF Response Breakdown */}
            {stats.dtmfResponses && Object.keys(stats.dtmfResponses).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">DTMF Responses</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.dtmfResponses).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{value as number}</div>
                      <div className="text-xs text-gray-500">
                        Press {key} {key === '1' ? '(Interested)' : key === '2' ? '(Not Interested)' : key === '9' ? '(Remove)' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Assignment Modal */}
        {showContactModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Contacts to Campaign</h3>
                
                {allContacts?.data?.length > 0 ? (
                  <div>
                    <div className="mb-4 text-sm text-gray-600">
                      Select contacts to assign to this campaign. Selected: {selectedContacts.length}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedContacts(allContacts.data.map((c: any) => c.id));
                                  } else {
                                    setSelectedContacts([]);
                                  }
                                }}
                                checked={selectedContacts.length === allContacts.data.length}
                                className="rounded border-gray-300"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Contact
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Phone
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {allContacts.data.map((contact: any) => (
                            <tr key={contact.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedContacts.includes(contact.id)}
                                  onChange={() => handleContactSelection(contact.id)}
                                  className="rounded border-gray-300"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {contact.name}
                                  </div>
                                  {contact.email && (
                                    <div className="text-sm text-gray-500">{contact.email}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {contact.phone}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  contact.status === 'active' ? 'bg-green-100 text-green-800' :
                                  contact.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {contact.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create some contacts first to assign to campaigns.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setShowContactModal(false);
                          router.push('/contacts');
                        }}
                        className="btn-primary"
                      >
                        Add Contacts
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowContactModal(false);
                      setSelectedContacts([]);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  {allContacts?.data?.length > 0 && (
                    <button
                      onClick={handleAssignContacts}
                      disabled={assignContactsMutation.isPending || selectedContacts.length === 0}
                      className="btn-primary"
                    >
                      {assignContactsMutation.isPending ? 'Assigning...' : `Assign ${selectedContacts.length} Contacts`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-error-400" />
                <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Campaign</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Are you sure you want to delete "{campaignData?.name || 'this campaign'}"? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      deleteMutation.mutate();
                      setShowDeleteModal(false);
                    }}
                    disabled={deleteMutation.isPending}
                    className="btn-error"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}