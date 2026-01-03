import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import { toast } from 'react-hot-toast';
import { PlayIcon, PauseIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { CampaignFormData } from '@/types';

const schema = yup.object({
  name: yup
    .string()
    .min(3, 'Campaign name must be at least 3 characters')
    .required('Campaign name is required'),
  description: yup
    .string()
    .min(10, 'Description must be at least 10 characters')
    .required('Description is required'),
  type: yup
    .string()
    .oneOf(['bulk', 'scheduled', 'triggered'], 'Please select a valid campaign type')
    .required('Campaign type is required'),
  audioFileId: yup
    .number()
    .required('Please select an audio file for the campaign'),
  priority: yup
    .number()
    .min(1, 'Priority must be between 1-10')
    .max(10, 'Priority must be between 1-10')
    .required('Priority is required'),
  maxConcurrentCalls: yup
    .number()
    .min(1, 'Must allow at least 1 concurrent call')
    .max(100, 'Maximum 100 concurrent calls allowed')
    .required('Max concurrent calls is required'),
  retryAttempts: yup
    .number()
    .min(0, 'Retry attempts cannot be negative')
    .max(10, 'Maximum 10 retry attempts allowed')
    .required('Retry attempts is required'),
  retryInterval: yup
    .number()
    .min(30, 'Retry interval must be at least 30 seconds')
    .max(3600, 'Retry interval cannot exceed 1 hour')
    .required('Retry interval is required'),
  callTimeout: yup
    .number()
    .min(30, 'Call timeout must be at least 30 seconds')
    .max(1800, 'Call timeout cannot exceed 30 minutes')
    .required('Call timeout is required'),
});

export default function NewCampaignPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<any>(null);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const router = useRouter();

  // Fetch audio files
  const { data: audioData, isLoading: audioLoading } = useQuery({
    queryKey: ['audio-files'],
    queryFn: () => apiClient.get('/api/audio'),
  });

  const audioFiles = audioData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      type: 'bulk',
      priority: 5,
      maxConcurrentCalls: 10,
      retryAttempts: 3,
      retryInterval: 60,
      callTimeout: 300,
    },
  });

  const watchedAudioFileId = watch('audioFileId');

  useEffect(() => {
    if (watchedAudioFileId) {
      const audio = audioFiles.find((a: any) => a.id === watchedAudioFileId);
      setSelectedAudio(audio);
    }
  }, [watchedAudioFileId, audioFiles]);

  const playAudio = (audioFile: any) => {
    if (playingAudio === audioFile.id) {
      setPlayingAudio(null);
      return;
    }
    
    setPlayingAudio(audioFile.id);
    const audio = new Audio(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${audioFile.url}`);
    audio.play();
    audio.onended = () => setPlayingAudio(null);
  };

  const onSubmit = async (data: CampaignFormData) => {
    try {
      setIsLoading(true);

      const campaignData = {
        ...data,
        audioFileId: data.audioFileId,
        config: {
          type: data.type,
          priority: data.priority,
          maxConcurrentCalls: data.maxConcurrentCalls,
          retryAttempts: data.retryAttempts,
          retryInterval: data.retryInterval,
          callTimeout: data.callTimeout,
          timezone: 'UTC'
        },
        schedule: {
          allowedHours: {
            start: '09:00',
            end: '18:00'
          },
          allowedDays: [1, 2, 3, 4, 5], // Monday to Friday
          frequency: 'once'
        },
        ivrFlow: {
          welcomeMessage: selectedAudio?.name || 'Welcome to our service',
          audioFile: selectedAudio?.url || '',
          options: [
            { digit: '1', description: 'Interested - Sales', action: 'mark_interested', audioFile: selectedAudio?.url },
            { digit: '2', description: 'Not Interested', action: 'mark_not_interested', audioFile: selectedAudio?.url },
            { digit: '3', description: 'Call Back Later', action: 'schedule_callback', audioFile: selectedAudio?.url },
            { digit: '9', description: 'Remove from List', action: 'remove_from_list', audioFile: selectedAudio?.url }
          ],
          timeout: {
            duration: 10,
            action: 'repeat',
            maxRepeats: 3
          },
          invalidInput: {
            action: 'repeat',
            maxAttempts: 3
          }
        },
        contactsConfig: {
          totalCount: 0,
          filters: [],
          customFields: []
        },
        stats: {
          totalCalls: 0,
          completedCalls: 0,
          failedCalls: 0,
          answeredCalls: 0,
          busyCalls: 0,
          noAnswerCalls: 0,
          dtmfResponses: {
            '1': 0, // Interested
            '2': 0, // Not Interested  
            '3': 0, // Call Back
            '9': 0  // Remove
          },
          averageCallDuration: 0,
          totalCost: 0,
          successRate: 0
        },
        status: 'draft'
      };

      const response = await apiClient.post('/api/campaigns', campaignData);

      if (response.success) {
        toast.success('Campaign created successfully! Now add contacts and start calling.');
        router.push(`/campaigns/${response.data.id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Create New Campaign">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="mt-2 text-gray-600">
            Set up a new IVR campaign to reach your contacts
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="form-label">
                    Campaign Name *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className={`form-input ${errors.name ? 'border-error-300' : ''}`}
                    placeholder="Enter campaign name"
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="type" className="form-label">
                    Campaign Type *
                  </label>
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
              </div>

              <div>
                <label htmlFor="description" className="form-label">
                  Description *
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className={`form-input ${errors.description ? 'border-error-300' : ''}`}
                  placeholder="Describe the purpose and goals of this campaign"
                />
                {errors.description && (
                  <p className="form-error">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Audio Selection */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Audio File Selection</h2>
              <p className="text-sm text-gray-600">Choose the audio file that will be played during calls</p>
            </div>
            <div className="card-body space-y-6">
              {audioLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="loading-spinner w-8 h-8"></div>
                  <span className="ml-2 text-gray-600">Loading audio files...</span>
                </div>
              ) : audioFiles.length === 0 ? (
                <div className="text-center py-8">
                  <SpeakerWaveIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No audio files found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload audio files first to use in campaigns.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => router.push('/audio')}
                      className="btn-primary"
                    >
                      Upload Audio Files
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="form-label">Select Audio File *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    {audioFiles.map((audio: any) => (
                      <div
                        key={audio.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          watchedAudioFileId === audio.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setValue('audioFileId', audio.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {audio.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {audio.category} • {Math.round(audio.size / 1024)} KB
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {audio.originalName}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playAudio(audio);
                            }}
                            className="ml-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {playingAudio === audio.id ? (
                              <PauseIcon className="h-5 w-5" />
                            ) : (
                              <PlayIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        <input
                          type="radio"
                          {...register('audioFileId', { valueAsNumber: true })}
                          value={audio.id}
                          className="sr-only"
                        />
                      </div>
                    ))}
                  </div>
                  {errors.audioFileId && (
                    <p className="form-error mt-2">{errors.audioFileId.message}</p>
                  )}
                  
                  {selectedAudio && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-sm font-medium text-green-900">Selected Audio File</h4>
                      <p className="text-sm text-green-700 mt-1">
                        <strong>{selectedAudio.name}</strong> - {selectedAudio.category}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        This audio will be played when contacts answer the call
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Campaign Settings */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Campaign Settings</h2>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="priority" className="form-label">
                    Priority (1-10) *
                  </label>
                  <input
                    {...register('priority', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="10"
                    className={`form-input ${errors.priority ? 'border-error-300' : ''}`}
                  />
                  {errors.priority && (
                    <p className="form-error">{errors.priority.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Higher numbers = higher priority</p>
                </div>

                <div>
                  <label htmlFor="maxConcurrentCalls" className="form-label">
                    Max Concurrent Calls *
                  </label>
                  <input
                    {...register('maxConcurrentCalls', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="100"
                    className={`form-input ${errors.maxConcurrentCalls ? 'border-error-300' : ''}`}
                  />
                  {errors.maxConcurrentCalls && (
                    <p className="form-error">{errors.maxConcurrentCalls.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="retryAttempts" className="form-label">
                    Retry Attempts *
                  </label>
                  <input
                    {...register('retryAttempts', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="10"
                    className={`form-input ${errors.retryAttempts ? 'border-error-300' : ''}`}
                  />
                  {errors.retryAttempts && (
                    <p className="form-error">{errors.retryAttempts.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="retryInterval" className="form-label">
                    Retry Interval (seconds) *
                  </label>
                  <input
                    {...register('retryInterval', { valueAsNumber: true })}
                    type="number"
                    min="30"
                    max="3600"
                    className={`form-input ${errors.retryInterval ? 'border-error-300' : ''}`}
                  />
                  {errors.retryInterval && (
                    <p className="form-error">{errors.retryInterval.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="callTimeout" className="form-label">
                    Call Timeout (seconds) *
                  </label>
                  <input
                    {...register('callTimeout', { valueAsNumber: true })}
                    type="number"
                    min="30"
                    max="1800"
                    className={`form-input ${errors.callTimeout ? 'border-error-300' : ''}`}
                  />
                  {errors.callTimeout && (
                    <p className="form-error">{errors.callTimeout.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Campaign'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}