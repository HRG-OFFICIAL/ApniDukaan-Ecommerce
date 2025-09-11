'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield, Eye, EyeOff } from 'lucide-react';
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

interface UserFormProps {
  user?: User | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function UserForm({ user, onSave, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'USER',
    isActive: true,
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'USER',
        isActive: user.isActive !== false,
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      role: formData.role,
      isActive: formData.isActive,
      ...(formData.password && { password: formData.password })
    };

    onSave(submitData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {user ? 'Edit User' : 'Create New User'}
            </h3>
            <Button variant="ghost" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">User</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password Fields (only for new users or when changing password) */}
          {!user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          )}

          {/* Account Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Account Status
            </label>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="active"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={() => handleInputChange('isActive', true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Active
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="inactive"
                  name="isActive"
                  checked={!formData.isActive}
                  onChange={() => handleInputChange('isActive', false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="inactive" className="ml-2 text-sm text-gray-700">
                  Inactive
                </label>
              </div>
            </div>
          </div>

          {/* Role Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Role Permissions</h4>
            <div className="text-sm text-blue-800">
              {formData.role === 'ADMIN' && (
                <p>Admin users have full system access including user management, product management, order management, and analytics.</p>
              )}
              {formData.role === 'MODERATOR' && (
                <p>Moderator users can manage products and orders, but cannot manage other users or access analytics.</p>
              )}
              {formData.role === 'USER' && (
                <p>Regular users can view products, place orders, and manage their own profile.</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {user ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
