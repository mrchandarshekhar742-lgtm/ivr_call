import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  UsersIcon,
  PhoneIcon,
  EnvelopeIcon,
  CloudArrowUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { Contact } from '@/types';
import { formatPhoneNumber, formatDate } from '@/utils/format';
import { apiClient } from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const queryClient = useQueryClient();

  // Fetch contacts from API
  const { data: contactsData, isLoading, error } = useQuery({
    queryKey: ['contacts', searchTerm, selectedStatus],
    queryFn: () => apiClient.get('/api/contacts', {
      params: {
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      }
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const contacts = contactsData?.data || [];

  // Add individual contact mutation
  const addContactMutation = useMutation({
    mutationFn: (contactData: { name: string; phone: string; email?: string }) => 
      apiClient.post('/api/contacts', contactData),
    onSuccess: () => {
      toast.success('Contact added successfully!');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowAddContactModal(false);
      setNewContact({ name: '', phone: '', email: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add contact');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/contacts/${id}`),
    onSuccess: () => {
      toast.success('Contact deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete contact');
    },
  });

  // Bulk add mutation
  const bulkAddMutation = useMutation({
    mutationFn: (numbers: string[]) => apiClient.post('/api/contacts/bulk', { numbers }),
    onSuccess: (data) => {
      toast.success(`${data.data.added} contacts added successfully!`);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowBulkAddModal(false);
      setBulkNumbers('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add contacts');
    },
  });

  const handleAddContact = () => {
    if (!newContact.name.trim()) {
      toast.error('Please enter contact name');
      return;
    }
    
    if (!newContact.phone.trim()) {
      toast.error('Please enter phone number');
      return;
    }

    addContactMutation.mutate({
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      email: newContact.email.trim() || undefined
    });
  };

  const handleDelete = (id: string | number) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate(Number(id));
    }
  };

  const handleBulkAdd = () => {
    if (!bulkNumbers.trim()) {
      toast.error('Please enter phone numbers');
      return;
    }

    // Parse numbers from textarea (one per line or comma separated)
    const numbers = bulkNumbers
      .split(/[\n,]/)
      .map(num => num.trim())
      .filter(num => num.length > 0)
      .map(num => {
        // Clean and format phone number
        const cleaned = num.replace(/[^\d+]/g, '');
        return cleaned.startsWith('+') ? cleaned : `+91${cleaned}`;
      });

    if (numbers.length === 0) {
      toast.error('No valid phone numbers found');
      return;
    }

    if (numbers.length > 1000) {
      toast.error('Maximum 1000 numbers allowed at once');
      return;
    }

    bulkAddMutation.mutate(numbers);
  };

  const filteredContacts = contacts.filter((contact: Contact) => {
    const matchesSearch = !searchTerm || 
                         contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Layout title="Contacts">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Contacts">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600">Manage your contact lists and import new contacts</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
              Import CSV
            </button>
            <button
              onClick={() => setShowBulkAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <UsersIcon className="h-4 w-4 mr-2" />
              Bulk Add
            </button>
            <button 
              onClick={() => setShowAddContactModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Contact
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Contacts</p>
                <p className="text-2xl font-semibold text-gray-900">{contacts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PhoneIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {contacts.filter((c: Contact) => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">With Email</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {contacts.filter((c: Contact) => c.email).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FunnelIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Filtered</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredContacts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.map((contact: Contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {contact.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{contact.name || 'Unknown'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPhoneNumber(contact.phone)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contact.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : contact.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button 
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredContacts.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new contact.'}
              </p>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Import Contacts</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload CSV file
                      </span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".csv"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('Uploading file:', file.name);
                          }
                        }}
                      />
                    </label>
                    <p className="mt-2 text-xs text-gray-500">
                      CSV files up to 10MB
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Add Modal */}
        {showBulkAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Add Phone Numbers</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Numbers
                    </label>
                    <textarea
                      value={bulkNumbers}
                      onChange={(e) => setBulkNumbers(e.target.value)}
                      placeholder="Enter phone numbers (one per line or comma separated)&#10;Example:&#10;9876543210&#10;+91-9876543211&#10;9876543212"
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Maximum 1000 numbers. Numbers will be automatically formatted with +91 prefix if not provided.
                    </p>
                  </div>
                  
                  {bulkNumbers && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-blue-700">
                        {bulkNumbers.split(/[\n,]/).filter(n => n.trim()).length} numbers detected
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowBulkAddModal(false);
                      setBulkNumbers('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAdd}
                    disabled={bulkAddMutation.isPending || !bulkNumbers.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {bulkAddMutation.isPending ? 'Adding...' : 'Add Contacts'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Individual Contact Modal */}
        {showAddContactModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Contact</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="Enter contact name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="Enter phone number (e.g., 9876543210)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Number will be automatically formatted with +91 prefix if not provided
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddContactModal(false);
                      setNewContact({ name: '', phone: '', email: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddContact}
                    disabled={addContactMutation.isPending || !newContact.name.trim() || !newContact.phone.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addContactMutation.isPending ? 'Adding...' : 'Add Contact'}
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