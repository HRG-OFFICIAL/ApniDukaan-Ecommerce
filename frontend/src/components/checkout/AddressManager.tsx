'use client'

import React, { useState } from 'react'
import { MapPin, Plus, Edit, Trash2, Check, Home, Building, User } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { FadeIn, SlideIn } from '../ui/Animations'
import { motion, AnimatePresence } from 'framer-motion'

export interface Address {
  id: string
  type: 'home' | 'work' | 'other'
  name: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

interface AddressManagerProps {
  addresses: Address[]
  selectedAddressId?: string
  onSelectAddress: (addressId: string) => void
  onAddAddress: (address: Omit<Address, 'id'>) => void
  onEditAddress: (addressId: string, address: Omit<Address, 'id'>) => void
  onDeleteAddress: (addressId: string) => void
  className?: string
}

const ADDRESS_TYPES = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'work', label: 'Work', icon: Building },
  { value: 'other', label: 'Other', icon: MapPin }
] as const

export function AddressManager({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
  className = ''
}: AddressManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState<{
    type: 'home' | 'work' | 'other'
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    isDefault: boolean
  }>({
    type: 'home',
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    isDefault: false
  })

  const resetForm = () => {
    setFormData({
      type: 'home',
      name: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      isDefault: false
    })
  }

  const handleAddAddress = () => {
    if (validateForm()) {
      onAddAddress(formData)
      setShowAddForm(false)
      resetForm()
    }
  }

  const handleEditAddress = () => {
    if (editingAddress && validateForm()) {
      onEditAddress(editingAddress.id, formData)
      setEditingAddress(null)
      resetForm()
    }
  }

  const startEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      type: address.type,
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault
    })
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingAddress(null)
    setShowAddForm(false)
    resetForm()
  }

  const validateForm = () => {
    return formData.name && formData.street && formData.city && formData.state && formData.zipCode
  }

  const getTypeIcon = (type: Address['type']) => {
    const typeConfig = ADDRESS_TYPES.find(t => t.value === type)
    return typeConfig?.icon || MapPin
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <MapPin className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Delivery Address
          </h3>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setShowAddForm(true)
            setEditingAddress(null)
            resetForm()
          }}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Address
        </Button>
      </div>

      {/* Existing Addresses */}
      {addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map((address) => {
            const TypeIcon = getTypeIcon(address.type)
            const isSelected = selectedAddressId === address.id

            return (
              <motion.div
                key={address.id}
                whileHover={{ scale: 1.01 }}
                className={`p-4 border rounded-lg cursor-pointer transition-all relative ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => {
                  console.log('Address clicked:', address.id, 'Current selected:', selectedAddressId);
                  // Toggle selection - if already selected, deselect; otherwise select
                  if (isSelected) {
                    onSelectAddress(''); // Deselect by passing empty string
                  } else {
                    onSelectAddress(address.id);
                  }
                }}
              >
                
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Elegant radio button design */}
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <TypeIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {address.name}
                        </span>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {address.type}
                        </Badge>
                        {address.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                        {isSelected && (
                          <Badge className="text-xs bg-blue-500 text-white">
                            SELECTED
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p>{address.street}</p>
                        <p>{address.city}, {address.state} {address.zipCode}</p>
                        <p>{address.country}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEdit(address)
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Are you sure you want to delete this address?')) {
                          onDeleteAddress(address.id)
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Address Form */}
      <AnimatePresence>
        {(showAddForm || editingAddress) && (
          <SlideIn direction="down">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h4>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      {ADDRESS_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <textarea
                    value={formData.street}
                    onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-gray-900 bg-white"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-gray-900 bg-white"
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-gray-900 bg-white"
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700 text-gray-700">
                    Set as default address
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 border-gray-200">
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingAddress ? handleEditAddress : handleAddAddress}
                    disabled={!validateForm()}
                  >
                    {editingAddress ? 'Update Address' : 'Add Address'}
                  </Button>
                </div>
              </div>
            </div>
          </SlideIn>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {addresses.length === 0 && !showAddForm && (
        <FadeIn>
          <div className="text-center py-8 border-2 border-dashed border-gray-300 border-gray-300 rounded-lg">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 text-gray-900 mb-2">
              No addresses found
            </h3>
            <p className="text-gray-500 text-gray-500 mb-4">
              Add your first delivery address to continue
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
