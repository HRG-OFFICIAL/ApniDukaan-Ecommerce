import { Schema, model, Model } from 'mongoose';
import { ISession, SessionStatus } from '../types/user.types';

// ==================== SESSION SCHEMA ====================

const SessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accessToken: {
    type: String,
    required: true,
    index: true
  },
  refreshToken: {
    type: String,
    index: true,
    sparse: true
  },
  deviceInfo: {
    type: {
      type: String,
      required: true,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    browser: {
      type: String,
      required: true,
      maxlength: 50,
      default: 'unknown'
    },
    os: {
      type: String,
      required: true,
      maxlength: 50,
      default: 'unknown'
    },
    userAgent: {
      type: String,
      required: true,
      maxlength: 500
    }
  },
  ipAddress: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        // Basic IPv4/IPv6 validation
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
        return ipv4Regex.test(v) || ipv6Regex.test(v);
      },
      message: 'Invalid IP address format'
    }
  },
  location: {
    country: {
      type: String,
      maxlength: 100
    },
    region: {
      type: String,
      maxlength: 100
    },
    city: {
      type: String,
      maxlength: 100
    }
  },
  status: {
    type: String,
    enum: Object.values(SessionStatus),
    default: SessionStatus.ACTIVE,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  issuedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  revokedAt: Date,
  revokedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdBy: String,
  updatedBy: String,
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete (ret as any)._id;
      delete (ret as any).__v;
      delete (ret as any).accessToken; // Don't expose tokens in JSON
      delete ret.refreshToken;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// ==================== INDEXES ====================

// Compound indexes for efficient queries
SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ userId: 1, lastAccessedAt: -1 });
SessionSchema.index({ sessionId: 1, status: 1 });
SessionSchema.index({ status: 1, expiresAt: 1 });
SessionSchema.index({ ipAddress: 1, createdAt: -1 });
SessionSchema.index({ 'deviceInfo.type': 1, createdAt: -1 });
SessionSchema.index({ createdAt: -1 });

// TTL index for automatic cleanup of expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ==================== VIRTUAL PROPERTIES ====================

SessionSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

SessionSchema.virtual('isActive').get(function() {
  return this.status === SessionStatus.ACTIVE && !this.isExpired;
});

SessionSchema.virtual('durationMinutes').get(function() {
  return Math.floor((this.lastAccessedAt.getTime() - this.issuedAt.getTime()) / (1000 * 60));
});

SessionSchema.virtual('timeUntilExpiry').get(function() {
  if (this.isExpired) return 0;
  return Math.floor((this.expiresAt.getTime() - Date.now()) / (1000 * 60)); // minutes
});

// ==================== INSTANCE METHODS ====================

SessionSchema.methods.isValid = function(): boolean {
  return this.status === SessionStatus.ACTIVE && 
         this.expiresAt > new Date() && 
         !this.revokedAt;
};

SessionSchema.methods.revoke = function(revokedBy?: string): Promise<ISession> {
  return this.updateOne({
    $set: {
      status: SessionStatus.REVOKED,
      revokedAt: new Date(),
      revokedBy: revokedBy || null,
      updatedBy: revokedBy || null,
      version: this.version + 1
    }
  });
};

SessionSchema.methods.expire = function(): Promise<ISession> {
  return this.updateOne({
    $set: {
      status: SessionStatus.EXPIRED,
      expiresAt: new Date(),
      version: this.version + 1
    }
  });
};

SessionSchema.methods.extend = function(additionalMinutes: number = 30): Promise<ISession> {
  const newExpiryDate = new Date(this.expiresAt.getTime() + (additionalMinutes * 60 * 1000));
  
  return this.updateOne({
    $set: {
      expiresAt: newExpiryDate,
      lastAccessedAt: new Date(),
      version: this.version + 1
    }
  });
};

SessionSchema.methods.updateLastAccessed = function(): Promise<ISession> {
  return this.updateOne({
    $set: {
      lastAccessedAt: new Date()
    }
  });
};

SessionSchema.methods.updateLocation = function(location: { country?: string; region?: string; city?: string }): Promise<ISession> {
  return this.updateOne({
    $set: {
      location: {
        ...this.location,
        ...location
      },
      version: this.version + 1
    }
  });
};

// ==================== STATIC METHODS ====================

SessionSchema.statics.findBySessionId = function(sessionId: string) {
  return this.findOne({ sessionId, status: SessionStatus.ACTIVE });
};

SessionSchema.statics.findByAccessToken = function(accessToken: string) {
  return this.findOne({ accessToken, status: SessionStatus.ACTIVE });
};

SessionSchema.statics.findByRefreshToken = function(refreshToken: string) {
  return this.findOne({ refreshToken, status: SessionStatus.ACTIVE });
};

SessionSchema.statics.findActiveByUserId = function(userId: string) {
  return this.find({ 
    userId, 
    status: SessionStatus.ACTIVE,
    expiresAt: { $gt: new Date() }
  }).sort({ lastAccessedAt: -1 });
};

SessionSchema.statics.findByUserAndDevice = function(userId: string, deviceType: string, browser: string) {
  return this.find({
    userId,
    'deviceInfo.type': deviceType,
    'deviceInfo.browser': browser,
    status: SessionStatus.ACTIVE,
    expiresAt: { $gt: new Date() }
  }).sort({ lastAccessedAt: -1 });
};

SessionSchema.statics.revokeAllByUserId = function(userId: string, revokedBy?: string) {
  return this.updateMany(
    { 
      userId, 
      status: SessionStatus.ACTIVE 
    },
    {
      $set: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
        revokedBy: revokedBy || null,
        updatedBy: revokedBy || null
      },
      $inc: { version: 1 }
    }
  );
};

SessionSchema.statics.revokeAllExceptCurrent = function(userId: string, currentSessionId: string, revokedBy?: string) {
  return this.updateMany(
    { 
      userId, 
      sessionId: { $ne: currentSessionId },
      status: SessionStatus.ACTIVE 
    },
    {
      $set: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
        revokedBy: revokedBy || null,
        updatedBy: revokedBy || null
      },
      $inc: { version: 1 }
    }
  );
};

SessionSchema.statics.cleanupExpiredSessions = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { status: { $in: [SessionStatus.EXPIRED, SessionStatus.REVOKED] } }
    ]
  });
};

SessionSchema.statics.getActiveSessionsCount = function(userId?: string) {
  const query: any = { 
    status: SessionStatus.ACTIVE,
    expiresAt: { $gt: new Date() }
  };
  
  if (userId) {
    query.userId = userId;
  }
  
  return this.countDocuments(query);
};

SessionSchema.statics.getSessionStats = function() {
  return this.aggregate([
    {
      $match: {
        status: SessionStatus.ACTIVE,
        expiresAt: { $gt: new Date() }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        deviceTypes: {
          $push: '$deviceInfo.type'
        },
        avgSessionDuration: {
          $avg: {
            $divide: [
              { $subtract: ['$lastAccessedAt', '$issuedAt'] },
              1000 * 60 // Convert to minutes
            ]
          }
        }
      }
    },
    {
      $project: {
        totalSessions: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        avgSessionDuration: { $round: ['$avgSessionDuration', 2] },
        deviceBreakdown: {
          $reduce: {
            input: '$deviceTypes',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [{ k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }]
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

SessionSchema.statics.findSuspiciousSessions = function(userId: string) {
  return this.find({
    userId,
    status: SessionStatus.ACTIVE,
    $or: [
      // Multiple sessions from different countries
      { 'location.country': { $exists: true, $ne: null } },
      // Long-running sessions (over 30 days)
      { 
        issuedAt: { 
          $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        }
      },
      // Sessions with unusual device patterns
      {
        $and: [
          { 'deviceInfo.type': 'desktop' },
          { 'deviceInfo.browser': { $in: ['unknown', 'bot', 'crawler'] } }
        ]
      }
    ]
  }).sort({ createdAt: -1 });
};

// ==================== MIDDLEWARE ====================

// Update version on save
SessionSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// Validate session expiry
SessionSchema.pre('save', function(next) {
  if (this.isNew && this.expiresAt <= this.issuedAt) {
    return next(new Error('Session expiry date must be after issued date'));
  }
  next();
});

// Auto-expire sessions that are past their expiry date
SessionSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function(next) {
  // Add filter to exclude expired sessions unless explicitly querying for them
  if (!this.getQuery().status && !this.getQuery().expiresAt) {
    this.where({
      $or: [
        { expiresAt: { $gt: new Date() } },
        { status: { $ne: SessionStatus.ACTIVE } }
      ]
    });
  }
  next();
});

// Cleanup on session revocation/expiration
SessionSchema.post('save', async function(doc) {
  if (doc.status !== SessionStatus.ACTIVE) {
    // Optionally clean up related data like Redis cache entries
    // This would integrate with your caching service
  }
});

// Define the Session model interface with methods
interface ISessionModel extends Model<ISession> {
  findBySessionId(sessionId: string): Promise<ISession | null>;
  findByAccessToken(accessToken: string): Promise<ISession | null>;
  findByRefreshToken(refreshToken: string): Promise<ISession | null>;
  findActiveByUserId(userId: string): Promise<ISession[]>;
  findByUserAndDevice(userId: string, deviceType: string, browser: string): Promise<ISession | null>;
  revokeAllByUserId(userId: string, revokedBy?: string): Promise<void>;
  revokeAllExceptCurrent(userId: string, currentSessionId: string, revokedBy?: string): Promise<void>;
  cleanupExpiredSessions(): Promise<number>;
  getActiveSessionsCount(userId?: string): Promise<number>;
  getSessionStats(): Promise<any>;
  findSuspiciousSessions(userId: string): Promise<ISession[]>;
}

export default model<ISession, ISessionModel>('Session', SessionSchema);
