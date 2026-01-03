import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  MusicalNoteIcon,
  PlayIcon,
  PauseIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CloudArrowUpIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import { AudioFile } from '@/types';
import { formatFileSize, formatDate } from '@/utils/format';
import { toast } from 'react-hot-toast';

interface AudioCardProps {
  audio: AudioFile;
  onPlay: (id: string | number) => void;
  onPause: (id: string | number) => void;
  onDownload: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  isPlaying: boolean;
}

function AudioCard({ audio, onPlay, onPause, onDownload, onDelete, isPlaying }: AudioCardProps) {
  // Safety checks for audio object and its properties
  if (!audio) return null;
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'welcome': return 'bg-green-100 text-green-800';
      case 'menu': return 'bg-blue-100 text-blue-800';
      case 'goodbye': return 'bg-purple-100 text-purple-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Safe property access with defaults
  const category = audio.category || 'unknown';
  const processingStatus = audio.processing?.status || 'unknown';
  const fileSize = audio.file?.size || audio.size || 0;
  const fileDuration = audio.file?.duration || null;
  const tags = audio.tags || [];
  const usage = audio.usage || { campaignCount: 0, totalPlays: 0, lastUsed: null };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <MusicalNoteIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">{audio.name}</h3>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                {category}
              </span>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(processingStatus)}`}>
                {processingStatus}
              </span>
            </div>
            {audio.description && (
              <p className="mt-1 text-sm text-gray-500">{audio.description}</p>
            )}
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span>{formatFileSize(fileSize)}</span>
              <span className="mx-2">•</span>
              <span>{fileDuration ? `${Math.round(fileDuration)}s` : 'Unknown duration'}</span>
              <span className="mx-2">•</span>
              <span>Uploaded {formatDate(audio.createdAt)}</span>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {processingStatus === 'ready' && (
              <>
                <button
                  onClick={() => isPlaying ? onPause(audio.id) : onPlay(audio.id)}
                  className="p-2 text-gray-400 hover:text-primary-500"
                >
                  {isPlaying ? (
                    <PauseIcon className="h-5 w-5" />
                  ) : (
                    <PlayIcon className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => onDownload(audio.id)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
              </>
            )}
            <button
              onClick={() => onDelete(audio.id)}
              className="p-2 text-gray-400 hover:text-red-500"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {usage.campaignCount}
            </div>
            <div className="text-xs text-gray-500">Campaigns</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {usage.totalPlays}
            </div>
            <div className="text-xs text-gray-500">Total Plays</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {usage.lastUsed ? formatDate(usage.lastUsed) : 'Never'}
            </div>
            <div className="text-xs text-gray-500">Last Used</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AudioPage() {
  const [filter, setFilter] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'welcome' as 'welcome' | 'menu' | 'goodbye' | 'error' | 'hold' | 'transfer' | 'custom',
    isPublic: false
  });
  const queryClient = useQueryClient();

  // Fetch audio files from API
  const { data: audioData, isLoading, error } = useQuery({
    queryKey: ['audio', filter],
    queryFn: () => apiClient.get('/api/audio'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const audioFiles = audioData?.data || [];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiClient.post('/api/audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      toast.success('Audio file uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['audio'] });
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadForm({
        name: '',
        description: '',
        category: 'welcome',
        isPublic: false
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload audio file');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/audio/${id}`),
    onSuccess: () => {
      toast.success('Audio file deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['audio'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete audio file');
    },
  });

  const handlePlay = (id: string | number) => {
    setPlayingId(String(id));
    console.log('Playing audio:', id);
    // TODO: Implement audio playback
  };

  const handlePause = (id: string | number) => {
    setPlayingId(null);
    console.log('Pausing audio:', id);
    // TODO: Implement audio pause
  };

  const handleDownload = (id: string | number) => {
    console.log('Downloading audio:', id);
    // TODO: Implement audio download
    const audio = audioFiles.find((a: AudioFile) => String(a.id) === String(id));
    if (audio && audio.url) {
      window.open(audio.url, '_blank');
    }
  };

  const handleUpload = () => {
    if (!uploadFile) {
      toast.error('Please select an audio file');
      return;
    }

    if (!uploadForm.name.trim()) {
      toast.error('Please enter a name for the audio file');
      return;
    }

    const formData = new FormData();
    formData.append('audioFile', uploadFile);
    formData.append('name', uploadForm.name);
    formData.append('description', uploadForm.description);
    formData.append('category', uploadForm.category);
    formData.append('isPublic', uploadForm.isPublic.toString());

    uploadMutation.mutate(formData);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/x-m4a'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid audio file (WAV, MP3, or M4A)');
        return;
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }

      setUploadFile(file);
      // Auto-fill name from filename
      if (!uploadForm.name) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setUploadForm(prev => ({ ...prev, name: nameWithoutExt }));
      }
    }
  };

  const handleDelete = (id: string | number) => {
    if (confirm('Are you sure you want to delete this audio file?')) {
      deleteMutation.mutate(String(id));
    }
  };

  const filteredAudioFiles = audioFiles.filter((audio: AudioFile) => {
    if (filter === 'all') return true;
    return audio.category === filter;
  });

  const categoryCounts = audioFiles.reduce((acc: Record<string, number>, audio: AudioFile) => {
    acc[audio.category] = (acc[audio.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <Layout title="Audio Files">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_: undefined, i: number) => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Audio Files">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audio Files</h1>
            <p className="text-gray-600">Manage your audio files for campaigns</p>
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn-primary"
          >
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Upload Audio
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-4">
          {[
            { key: 'all', label: 'All', count: audioFiles.length },
            { key: 'welcome', label: 'Welcome', count: categoryCounts.welcome || 0 },
            { key: 'menu', label: 'Menu', count: categoryCounts.menu || 0 },
            { key: 'goodbye', label: 'Goodbye', count: categoryCounts.goodbye || 0 },
            { key: 'error', label: 'Error', count: categoryCounts.error || 0 },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === key
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Audio Files List */}
        <div className="space-y-4">
          {filteredAudioFiles.length === 0 ? (
            <div className="text-center py-12">
              <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No audio files</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading your first audio file.
              </p>
              <div className="mt-6">
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="btn-primary"
                >
                  <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                  Upload Audio
                </button>
              </div>
            </div>
          ) : (
            filteredAudioFiles.map((audio: AudioFile) => (
              <AudioCard
                key={audio.id}
                audio={audio}
                onPlay={handlePlay}
                onPause={handlePause}
                onDownload={handleDownload}
                onDelete={handleDelete}
                isPlaying={playingId === String(audio.id)}
              />
            ))
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Upload Audio File</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audio File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="audio-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {uploadFile ? uploadFile.name : 'Choose audio file'}
                        </span>
                        <input
                          id="audio-upload"
                          name="audio-upload"
                          type="file"
                          accept=".wav,.mp3,.m4a,audio/*"
                          className="sr-only"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-500">
                        WAV, MP3, M4A up to 50MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter audio file name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter description (optional)"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value as 'welcome' | 'menu' | 'goodbye' | 'error' | 'hold' | 'transfer' | 'custom' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="welcome">Welcome</option>
                    <option value="menu">Menu</option>
                    <option value="goodbye">Goodbye</option>
                    <option value="error">Error</option>
                    <option value="hold">Hold</option>
                    <option value="transfer">Transfer</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Public checkbox */}
                <div className="flex items-center">
                  <input
                    id="is-public"
                    type="checkbox"
                    checked={uploadForm.isPublic}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is-public" className="ml-2 block text-sm text-gray-900">
                    Make this audio file public
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || !uploadFile || !uploadForm.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}