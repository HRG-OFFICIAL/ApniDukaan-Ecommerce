import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, timestampPlugin } from '@shopsphere/shared';

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordHash(password: string): Promise<string>;
}

const userSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required if not OAuth user
    },
    minlength: 8
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
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  avatar: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  tokenVersion: {
    type: Number,
    default: 0 // Used for refresh token invalidation
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  }
});

// Add timestamp plugin
userSchema.plugin(timestampPlugin);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ tokenVersion: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function(this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual to check if account is locked
userSchema.virtual('isLocked').get(function(this: IUserDocument) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(this: IUserDocument) {
  // Only hash password if it's modified
  if (!this.isModified('password') || !this.password) return;

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw new Error('Error hashing password');
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(
  this: IUserDocument,
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Instance method to generate password hash (for external use)
userSchema.methods.generatePasswordHash = async function(
  this: IUserDocument,
  password: string
): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Error generating password hash');
  }
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function(this: IUserDocument) {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  // If we're at max attempts and not locked, lock account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) }; // 2 hours
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function(this: IUserDocument) {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to update last login
userSchema.methods.updateLastLogin = function(this: IUserDocument) {
  return this.updateOne({
    $set: { lastLogin: new Date() }
  });
};

// Method to increment token version (invalidates all refresh tokens)
userSchema.methods.incrementTokenVersion = function(this: IUserDocument) {
  return this.updateOne({
    $inc: { tokenVersion: 1 }
  });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by Google ID
userSchema.statics.findByGoogleId = function(googleId: string) {
  return this.findOne({ googleId });
};

// Transform output to remove sensitive fields
userSchema.methods.toJSON = function(this: IUserDocument) {
  const user = this.toObject();
  
  // Remove sensitive fields
  delete user.password;
  delete user.tokenVersion;
  delete user.loginAttempts;
  delete user.lockUntil;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.__v;
  
  return user;
};

// Create and export the model
export const User = mongoose.model<IUserDocument>('User', userSchema);

// Export the schema for testing
export { userSchema };
