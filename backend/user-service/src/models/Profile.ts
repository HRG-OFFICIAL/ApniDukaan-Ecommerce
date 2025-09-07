import mongoose, { Schema, Document } from 'mongoose';
import { IProfile, IAddress, AddressType, Gender, timestampPlugin } from '@shopsphere/shared';

export interface IProfileDocument extends IProfile, Document {}

const addressSchema = new Schema({
  type: {
    type: String,
    enum: Object.values(AddressType),
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  street: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  street2: {
    type: String,
    trim: true,
    maxlength: 200
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  state: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  zipCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

const profileSchema = new Schema<IProfileDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: Object.values(Gender)
  },
  addresses: [addressSchema],
  preferences: {
    newsletter: {
      type: Boolean,
      default: true
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'USD'
    }
  }
});

// Add timestamp plugin
profileSchema.plugin(timestampPlugin);

// Indexes
profileSchema.index({ userId: 1 });
profileSchema.index({ createdAt: -1 });

// Ensure only one default address per type
profileSchema.pre('save', function(this: IProfileDocument) {
  // Handle default addresses
  const addressTypes = new Map();
  
  this.addresses.forEach((address, index) => {
    if (address.isDefault) {
      if (addressTypes.has(address.type)) {
        // If we already have a default for this type, make the previous one non-default
        const previousDefaultIndex = addressTypes.get(address.type);
        this.addresses[previousDefaultIndex].isDefault = false;
      }
      addressTypes.set(address.type, index);
    }
  });
});

// Instance methods
profileSchema.methods.addAddress = function(this: IProfileDocument, addressData: any) {
  // If this is set as default, unset other defaults of the same type
  if (addressData.isDefault) {
    this.addresses.forEach(address => {
      if (address.type === addressData.type && address.isDefault) {
        address.isDefault = false;
      }
    });
  }
  
  this.addresses.push(addressData);
  return this.save();
};

profileSchema.methods.updateAddress = function(
  this: IProfileDocument, 
  addressId: string, 
  updateData: any
) {
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }

  // If setting as default, unset other defaults of the same type
  if (updateData.isDefault && updateData.type) {
    this.addresses.forEach(addr => {
      if (addr.type === updateData.type && addr._id?.toString() !== addressId && addr.isDefault) {
        addr.isDefault = false;
      }
    });
  }

  Object.assign(address, updateData);
  return this.save();
};

profileSchema.methods.removeAddress = function(this: IProfileDocument, addressId: string) {
  this.addresses.pull(addressId);
  return this.save();
};

profileSchema.methods.setDefaultAddress = function(this: IProfileDocument, addressId: string) {
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }

  // Unset other defaults of the same type
  this.addresses.forEach(addr => {
    if (addr.type === address.type && addr._id?.toString() !== addressId) {
      addr.isDefault = false;
    }
  });

  address.isDefault = true;
  return this.save();
};

// Static methods
profileSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

profileSchema.statics.createForUser = function(userId: string, profileData: any = {}) {
  return this.create({
    userId,
    ...profileData,
    preferences: {
      newsletter: true,
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      theme: 'light',
      language: 'en',
      currency: 'USD',
      ...profileData.preferences
    }
  });
};

export const Profile = mongoose.model<IProfileDocument>('Profile', profileSchema);
export { profileSchema };
