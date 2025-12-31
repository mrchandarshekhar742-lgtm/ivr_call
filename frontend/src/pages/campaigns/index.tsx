import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  PlusIcon,
  MegaphoneIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { Campaign } from '@/types';
import { formatDate, formatNumber, formatPercentage } from '@/utils/format';
import { apiClient } from '@/utils/api';
import { toast } from 'react-hot-toast';

interface CampaignCardProps {
  campaign: Campaign;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
}

function CampaignCard({ campaign, onStart, onPause, onStop, onDelete }: CampaignCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusActions = (status: string) => {
    switch (status) {
      case 'draft':
      case 'scheduled':
        return (
          <button
            onClick={() => onStart(campaign.id)}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <PlayIcon className="h-4 w-4 mr-1" />
            Start
          </button>
        );
      case 'running':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => onPause(campaign.id)}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
            >
              <PauseIcon className="h-4 w-4 mr-1" />
              Pause
            </button>
            <button
              onClick={() => onStop(campaign.id)}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <StopIcon className="h-4 w-4 mr-1" />
              Stop
            </button>
          </div>
        );
      case 'paused':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => onStart(campaign.id)}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <PlayIcon className="h-4 w-4 mr-1" />
              Resume
            </button>
            <button
              onClick={() => onStop(campaign.id)}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <StopIcon className="h-4 w-4 mr-1" />
              Stop
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <MegaphoneIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status || 'draft')}`}>
                {campaign.status || 'draft'}
              </span>
            </div>
            {campaign.description && (
              <p className="mt-1 text-sm text-gray-500">{campaign.description}</p>
            )}
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span>Created {formatDate(campaign.createdAt)}</span>
              <span className="mx-2">•</span>
              <span>{formatNumber(campaign.contacts?.totalCount || 0)} contacts</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusActions(campaign.status || 'draft')}
            <div className="flex items-center space-x-1">
              <Link
                href={`/campaigns/${campaign.id}`}
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <EyeIcon className="h-4 w-4" />
              </Link>
              <Link
                href={`/campaigns/${campaign.id}/edit`}
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <PencilIcon className="h-4 w-4" />
              </Link>
              <button
                onClick={() => onDelete(campaign.id)}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {formatNumber(campaign.stats?.totalCalls || 0)}
            </div>
            <div className="text-xs text-gray-500">Total Calls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">
              {formatNumber(campaign.stats?.completedCalls || 0)}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600">
              {formatNumber(campaign.stats?.failedCalls || 0)}
            </div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">
              {formatPercentage(campaign.stats?.successRate || 0)}
            </div>
            <div className="text-xs text-gray-500">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [filter, setFilter] = useState<string>('all');

  const { data: campaignsData, isLoading, error } = useQuery({
    queryKey: ['campaigns', filter],
    queryFn: () => apiClient.get('/api/campaigns'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const campaigns = campaignsData?.data || [];
  const queryClient = useQueryClient();

  // Campaign action mutations
  const startMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/campaigns/${id}/start`),
    onSuccess: () => {
      toast.success('Campaign started successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start campaign');
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/campaigns/${id}/pause`),
    onSuccess: () => {
      toast.success('Campaign paused successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to pause campaign');
    },
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/campaigns/${id}/stop`),
    onSuccess: () => {
      toast.success('Campaign stopped successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to stop campaign');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/campaigns/${id}`),
    onSuccess: () => {
      toast.success('Campaign deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete campaign');
    },
  });

  const handleStart = (id: string) => {
    startMutation.mutate(id);
  };

  const handlePause = (id: string) => {
    pauseMutation.mutate(id);
  };

  const handleStop = (id: string) => {
    stopMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'all') return true;
    return (campaign.status || 'draft') === filter;
  });

  const statusCounts = campaigns.reduce((acc, campaign) => {
    const status = campaign.status || 'draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <Layout title="Campaigns">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Campaigns">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600">Manage your IVR campaigns</p>
          </div>
          <Link href="/campaigns/new" className="btn-primary">
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Campaign
          </Link>
        </div>

        {/* Filters */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: 'all', label: 'All', count: campaigns.length },
            { key: 'running', label: 'Running', count: statusCounts.running || 0 },
            { key: 'paused', label: 'Paused', count: statusCounts.paused || 0 },
            { key: 'completed', label: 'Completed', count: statusCounts.completed || 0 },
            { key: 'draft', label: 'Draft', count: statusCounts.draft || 0 },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Campaigns Grid */}
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new campaign.
            </p>
            <div className="mt-6">
              <Link href="/campaigns/new" className="btn-primary">
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onStart={handleStart}
                onPause={handlePause}
                onStop={handleStop}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}