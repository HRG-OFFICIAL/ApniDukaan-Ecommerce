'use client';

import { Edit, Trash2, X, User, Mail, Phone, Shield, Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  phone?: string;
  avatar?: string;
}

interface UserDetailsProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function UserDetails({ user, onEdit, onDelete, onClose }: UserDetailsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'ADMIN': { bg: 'bg-red-100', text: 'text-red-800', label: 'Admin' },
      'MODERATOR': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Moderator' },
      'USER': { bg: 'bg-green-100', text: 'text-green-800', label: 'User' },
      'GUEST': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Guest' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig['USER'];

    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Information */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Basic Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-4 mb-4">
                    {user.avatar ? (
                      <img
                        className="h-16 w-16 rounded-full object-cover"
                        src={user.avatar}
                        alt={user.name}
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xl font-medium text-gray-600">
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h5 className="text-lg font-semibold text-gray-900">{user.name}</h5>
                      <p className="text-sm text-gray-500">User ID: {user.id.slice(-8)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500">Email Address</p>
                      </div>
                    </div>

                    {user.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                          <p className="text-xs text-gray-500">Phone Number</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.role}</p>
                        <p className="text-xs text-gray-500">Role</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Role */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Status & Role</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Account Status</span>
                    {getStatusBadge(user.isActive)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">User Role</span>
                    {getRoleBadge(user.role)}
                  </div>
                </div>
              </div>

              {/* Account Activity */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Account Activity</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Member Since</p>
                      <p className="text-xs text-gray-500">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Login</p>
                      <p className="text-xs text-gray-500">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-6">
              {/* Permissions */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Permissions</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {user.role === 'ADMIN' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Full system access</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">User management</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Product management</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Order management</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Analytics access</span>
                        </div>
                      </>
                    )}
                    {user.role === 'MODERATOR' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Product management</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Order management</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Content management</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          <span className="text-sm text-gray-500">User management</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          <span className="text-sm text-gray-500">Analytics access</span>
                        </div>
                      </>
                    )}
                    {user.role === 'USER' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">View products</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Place orders</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Manage profile</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          <span className="text-sm text-gray-500">Admin access</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          <span className="text-sm text-gray-500">Analytics access</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Statistics */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Account Statistics</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-900">0</p>
                      <p className="text-xs text-gray-500">Total Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-900">$0</p>
                      <p className="text-xs text-gray-500">Total Spent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-900">0</p>
                      <p className="text-xs text-gray-500">Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-900">0</p>
                      <p className="text-xs text-gray-500">Wishlist Items</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Security</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Email Verified</span>
                    <span className="text-sm font-medium text-green-600">Yes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Two-Factor Auth</span>
                    <span className="text-sm font-medium text-gray-500">Not Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Password Last Changed</span>
                    <span className="text-sm font-medium text-gray-500">30 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
