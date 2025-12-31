import { useState } from 'react';
import {
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  UserIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'telephony', name: 'Telephony', icon: PhoneIcon },
    { id: 'general', name: 'General', icon: CogIcon },
  ];

  return (
    <Layout title="Settings">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                </div>
                <div className="card-body space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-input"
                        defaultValue={user?.firstName}
                      />
                    </div>
                    <div>
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-input"
                        defaultValue={user?.lastName}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      defaultValue={user?.email}
                    />
                  </div>
                  <div>
                    <label className="form-label">Role</label>
                    <input
                      type="text"
                      className="form-input"
                      value={user?.role}
                      disabled
                    />
                  </div>
                  <div className="flex justify-end">
                    <button className="btn-primary">Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
                </div>
                <div className="card-body space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <input type="checkbox" className="form-checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Campaign Alerts</h4>
                        <p className="text-sm text-gray-500">Get notified when campaigns start/stop</p>
                      </div>
                      <input type="checkbox" className="form-checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Call Failure Alerts</h4>
                        <p className="text-sm text-gray-500">Alert when call failure rate is high</p>
                      </div>
                      <input type="checkbox" className="form-checkbox" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button className="btn-primary">Save Preferences</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                  </div>
                  <div className="card-body space-y-4">
                    <div>
                      <label className="form-label">Current Password</label>
                      <input type="password" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">New Password</label>
                      <input type="password" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Confirm New Password</label>
                      <input type="password" className="form-input" />
                    </div>
                    <div className="flex justify-end">
                      <button className="btn-primary">Update Password</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'telephony' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Telephony Settings</h3>
                </div>
                <div className="card-body space-y-6">
                  <div>
                    <label className="form-label">Default Caller ID</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="form-label">Call Timeout (seconds)</label>
                    <input
                      type="number"
                      className="form-input"
                      defaultValue={60}
                      min={30}
                      max={300}
                    />
                  </div>
                  <div>
                    <label className="form-label">Max Concurrent Calls</label>
                    <input
                      type="number"
                      className="form-input"
                      defaultValue={10}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button className="btn-primary">Save Settings</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                </div>
                <div className="card-body space-y-6">
                  <div>
                    <label className="form-label">Timezone</label>
                    <select className="form-select">
                      <option>UTC</option>
                      <option>America/New_York</option>
                      <option>America/Los_Angeles</option>
                      <option>Europe/London</option>
                      <option>Asia/Tokyo</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Date Format</label>
                    <select className="form-select">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Currency</label>
                    <select className="form-select">
                      <option>USD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                      <option>INR</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button className="btn-primary">Save Settings</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}