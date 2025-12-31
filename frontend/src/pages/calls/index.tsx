import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import { formatDuration, formatDateTime } from '@/utils/format';

interface CallLogData {
  id: string; // Changed from _id to id
  campaignId: string;
  contactId: string;
  call: {
    toNumber: string;
    status: 'completed' | 'failed' | 'busy' | 'no-answer' | 'in-progress';
    duration: number;
    startTime: string;
    cost: number;
  };
  flow?: {
    dtmfReceived?: Array<{
      digit: string;
    }>;
  };
  createdAt: string;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  busy: 'bg-yellow-100 text-yellow-800',
  'no-answer': 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800',
};

const statusIcons: Record<string, React.ComponentType<any>> = {
  completed: CheckCircleIcon,
  failed: XCircleIcon,
  busy: ClockIcon,
  'no-answer': PhoneIcon,
  'in-progress': PhoneIcon,
};

export default function CallLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch call logs from API
  const { data: callLogsData, isLoading, error } = useQuery({
    queryKey: ['call-logs', page, statusFilter, searchTerm],
    queryFn: () => apiClient.get('/api/calls', {
      params: {
        page,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      }
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const callLogs: CallLogData[] = callLogsData?.data?.callLogs || [];

  const filteredLogs = callLogs.filter((log: CallLogData) => {
    const matchesSearch = searchTerm === '' || 
      log.contactId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.call?.toNumber?.includes(searchTerm) ||
      log.campaignId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.call?.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Layout title="Call Logs">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Call Logs">
      <div className="space-y-6">
        {/* Filters */}
        <div className="card">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by contact name, phone, or campaign..."
                    className="form-input pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="sm:w-48">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="busy">Busy</option>
                  <option value="no-answer">No Answer</option>
                  <option value="in-progress">In Progress</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Call Logs Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              Call Logs ({filteredLogs.length})
            </h3>
          </div>
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Contact</th>
                    <th className="table-header-cell">Campaign</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Duration</th>
                    <th className="table-header-cell">Start Time</th>
                    <th className="table-header-cell">Cost</th>
                    <th className="table-header-cell">DTMF</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredLogs.map((log: CallLogData) => {
                    const status = log.call?.status || 'unknown';
                    const StatusIcon = statusIcons[status] || PhoneIcon;
                    return (
                      <tr key={log.id} className="table-row">
                        <td className="table-cell">
                          <div>
                            <div className="font-medium text-gray-900">
                              {log.contactId || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.call?.toNumber || 'Unknown'}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">
                            {log.campaignId || 'Unknown'}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`status-badge ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                            <StatusIcon className="w-4 h-4 mr-1" />
                            {status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">
                            {log.call?.duration > 0 ? formatDuration(log.call.duration) : '-'}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">
                            {formatDateTime(log.call?.startTime || log.createdAt)}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">
                            ${(log.call?.cost || 0).toFixed(3)}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">
                            {log.flow?.dtmfReceived?.[0]?.digit || '-'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No call logs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Call logs will appear here once campaigns start making calls.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}