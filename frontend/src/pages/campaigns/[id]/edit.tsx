import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import { Campaign, EditCampaignFormData } from '@/types';

const schema = yup.object({
  name: yup.string().required('Campaign name is required'),
  description: yup.string().required('Description is required'),
  type: yup.string().oneOf(['bulk', 'scheduled', 'triggered']).required('Campaign type is required'),
  priority: yup.number().min(1).max(10).required('Priority is required'),
  maxConcurrentCalls: yup.number().min(1).max(100).required('Max concurrent calls is required'),
  retryAttempts: yup.number().min(0).max(10).required('Retry attempts is required'),
  retryInterval: yup.number().min(30).max(3600).required('Retry interval is required'),
  callTimeout: yup.number().min(30).max(1800).required('Call timeout is required'),
});

export default function EditCampaignPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EditCampaignFormData>({
    resolver: yupResolver(schema),
  });

  // Fetch campaign data
  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => apiClient.get<Campaign>(`/api/campaigns/${id}`),
    enabled: !!id,
  });

  // Update campaign mutation
  const updateMutation = useMutation({
    mutationFn: (data: EditCampaignFormData) => 
      apiClient.put(`/api/campaigns/${id}`, data),
    onSuccess: () => {
      toast.success('Campaign updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      router.push('/campaigns');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update campaign');
    },
  });

  // Populate form when campaign data loads
  useEffect(() => {
    if (campaign?.data?.campaign) {
      const campaignData = campaign.data.campaign;
      reset({
        name: campaignData.name,
        description: campaignData.description || '',
        type: campaignData.config?.type || 'bulk',
        priority: campaignData.config?.priority || 5,
        maxConcurrentCalls: campaignData.config?.maxConcurrentCalls || 10,
        retryAttempts: campaignData.config?.retryAttempts || 3,
        retryInterval: campaignData.config?.retryInterval || 300,
        callTimeout: campaignData.config?.callTimeout || 300,
      });
    }
  }, [campaign, reset]);

  const onSubmit = (data: EditCampaignFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Layout title="Edit Campaign">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Edit Campaign">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-error-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Campaign not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The campaign you're looking for doesn't exist or you don't have permission to edit it.
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

  return (
    <Layout title="Edit Campaign">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="btn-secondary"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
              <p className="text-gray-600">Update your campaign settings</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Basic Information</h2>
            </div>
            <div className="card-body space-y-4">
              {/* Campaign Name */}
              <div>
                <label className="form-label">Campaign Name</label>
                <input
                  type="text"
                  {...register('name')}
                  className={`form-input ${errors.name ? 'border-error-300' : ''}`}
                  placeholder="Enter campaign name"
                />
                {errors.name && (
                  <p className="form-error">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="form-label">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="form-input"
                  placeholder="Enter campaign description (optional)"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium">Campaign Settings</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campaign Type */}
                <div>
                  <label className="form-label">Campaign Type</label>
                  <select
                    {...register('type')}
                    className={`form-input ${errors.type ? 'border-error-300' : ''}`}
                  >
                    <option value="bulk">Bulk Campaign</option>
                    <option value="scheduled">Scheduled Campaign</option>
                    <option value="triggered">Triggered Campaign</option>
                  </select>
                  {errors.type && (
                    <p className="form-error">{errors.type.message}</p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="form-label">Priority (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    {...register('priority')}
                    className={`form-input ${errors.priority ? 'border-error-300' : ''}`}
                  />
                  {errors.priority && (
                    <p className="form-error">{errors.priority.message}</p>
                  )}
                </div>

                {/* Max Concurrent Calls */}
                <div>
                  <label className="form-label">Max Concurrent Calls</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    {...register('maxConcurrentCalls')}
                    className={`form-input ${errors.maxConcurrentCalls ? 'border-error-300' : ''}`}
                  />
                  {errors.maxConcurrentCalls && (
                    <p className="form-error">{errors.maxConcurrentCalls.message}</p>
                  )}
                </div>

                {/* Retry Attempts */}
                <div>
                  <label className="form-label">Retry Attempts</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    {...register('retryAttempts')}
                    className={`form-input ${errors.retryAttempts ? 'border-error-300' : ''}`}
                  />
                  {errors.retryAttempts && (
                    <p className="form-error">{errors.retryAttempts.message}</p>
                  )}
                </div>

                {/* Retry Interval */}
                <div>
                  <label className="form-label">Retry Interval (seconds)</label>
                  <input
                    type="number"
                    min="30"
                    max="3600"
                    {...register('retryInterval')}
                    className={`form-input ${errors.retryInterval ? 'border-error-300' : ''}`}
                  />
                  {errors.retryInterval && (
                    <p className="form-error">{errors.retryInterval.message}</p>
                  )}
                </div>

                {/* Call Timeout */}
                <div>
                  <label className="form-label">Call Timeout (seconds)</label>
                  <input
                    type="number"
                    min="30"
                    max="1800"
                    {...register('callTimeout')}
                    className={`form-input ${errors.callTimeout ? 'border-error-300' : ''}`}
                  />
                  {errors.callTimeout && (
                    <p className="form-error">{errors.callTimeout.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/campaigns')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Campaign'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}