import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { logger } from '../../shared/src/utils/logger';
import { UserModel } from '../models/User';
import { UserRole } from '../../shared/src/types/user';
import { generateTokens } from '../../shared/src/utils/jwt';

export interface GoogleAuthConfig {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope: string[];
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  verified: boolean;
}

export class GoogleAuthService {
  private config: GoogleAuthConfig;

  constructor() {
    this.config = {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
      scope: ['profile', 'email']
    };

    this.validateConfig();
    this.initializePassport();
  }

  /**
   * Validate Google OAuth configuration
   */
  private validateConfig(): void {
    if (!this.config.clientID || !this.config.clientSecret) {
      const error = 'Google OAuth configuration is missing. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.';
      logger.error(error);
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error(error);
      } else {
        logger.warn('Google OAuth will not be available in development without proper configuration.');
      }
    }
  }

  /**
   * Initialize Passport with Google strategy
   */
  private initializePassport(): void {
    if (!this.config.clientID || !this.config.clientSecret) {
      logger.info('Skipping Google OAuth strategy initialization due to missing configuration.');
      return;
    }

    passport.use(new GoogleStrategy({
      clientID: this.config.clientID,
      clientSecret: this.config.clientSecret,
      callbackURL: this.config.callbackURL,
      scope: this.config.scope
    }, this.handleGoogleAuth.bind(this)));

    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      done(null, user._id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await UserModel.findById(id).select('-password');
        done(null, user);
      } catch (error) {
        logger.error('Error deserializing user:', error);
        done(error, null);
      }
    });
  }

  /**
   * Handle Google OAuth authentication
   */
  private async handleGoogleAuth(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): Promise<void> {
    try {
      const googleProfile = this.extractProfileData(profile);
      const user = await this.findOrCreateUser(googleProfile, accessToken, refreshToken);
      
      logger.info('Google authentication successful', { 
        userId: user._id, 
        email: user.email 
      });
      
      return done(null, user);
    } catch (error) {
      logger.error('Google authentication error:', error);
      return done(error, null);
    }
  }

  /**
   * Extract relevant data from Google profile
   */
  private extractProfileData(profile: Profile): GoogleProfile {
    const email = profile.emails?.[0]?.value || '';
    const name = profile.displayName || '';
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');

    return {
      googleId: profile.id,
      email,
      firstName: firstName || 'User',
      lastName: lastName || '',
      avatar: profile.photos?.[0]?.value,
      verified: profile.emails?.[0]?.verified || false
    };
  }

  /**
   * Find existing user or create new one
   */
  private async findOrCreateUser(
    googleProfile: GoogleProfile,
    accessToken: string,
    refreshToken: string
  ) {
    // First, try to find user by Google ID
    let user = await UserModel.findOne({ 
      'oauth.google.id': googleProfile.googleId 
    });

    if (user) {
      // Update existing user's Google tokens
      user.oauth.google.accessToken = accessToken;
      user.oauth.google.refreshToken = refreshToken;
      user.oauth.google.lastLogin = new Date();
      
      // Update avatar if changed
      if (googleProfile.avatar && user.avatar !== googleProfile.avatar) {
        user.avatar = googleProfile.avatar;
      }

      await user.save();
      return user;
    }

    // Try to find user by email (link existing account)
    user = await UserModel.findOne({ 
      email: googleProfile.email.toLowerCase() 
    });

    if (user) {
      // Link Google account to existing user
      user.oauth.google = {
        id: googleProfile.googleId,
        accessToken,
        refreshToken,
        lastLogin: new Date()
      };

      // Verify email if Google account is verified
      if (googleProfile.verified && !user.emailVerified) {
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
      }

      // Update avatar if not set
      if (!user.avatar && googleProfile.avatar) {
        user.avatar = googleProfile.avatar;
      }

      await user.save();
      return user;
    }

    // Create new user
    user = new UserModel({
      email: googleProfile.email.toLowerCase(),
      firstName: googleProfile.firstName,
      lastName: googleProfile.lastName,
      avatar: googleProfile.avatar,
      role: UserRole.USER,
      emailVerified: googleProfile.verified,
      emailVerifiedAt: googleProfile.verified ? new Date() : undefined,
      oauth: {
        google: {
          id: googleProfile.googleId,
          accessToken,
          refreshToken,
          lastLogin: new Date()
        }
      },
      preferences: {
        currency: 'USD',
        language: 'en',
        notifications: {
          email: true,
          push: false,
          sms: false
        },
        privacy: {
          showProfile: false,
          showActivity: false
        }
      },
      metadata: {
        registrationSource: 'google_oauth',
        userAgent: '',
        ipAddress: ''
      }
    });

    await user.save();
    
    logger.info('New user created via Google OAuth', { 
      userId: user._id, 
      email: user.email 
    });

    return user;
  }

  /**
   * Generate JWT tokens for authenticated user
   */
  async generateUserTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    return generateTokens(user);
  }

  /**
   * Handle Google OAuth callback
   */
  async handleCallback(user: any, req: any, res: any, next: any): Promise<void> {
    try {
      if (!user) {
        throw new Error('Authentication failed');
      }

      // Generate JWT tokens
      const tokens = await this.generateUserTokens(user);

      // Set secure HTTP-only cookies
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' as const : 'lax' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      };

      res.cookie('accessToken', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/callback?success=true`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/callback?error=authentication_failed`;
      
      res.redirect(redirectUrl);
    }
  }

  /**
   * Revoke Google OAuth tokens
   */
  async revokeGoogleAccess(user: any): Promise<void> {
    try {
      if (!user.oauth?.google?.accessToken) {
        return;
      }

      // Revoke Google access token
      const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${user.oauth.google.accessToken}`;
      
      const response = await fetch(revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        logger.warn('Failed to revoke Google access token', { 
          status: response.status,
          statusText: response.statusText
        });
      }

      // Clear OAuth data from user
      user.oauth.google = undefined;
      await user.save();

      logger.info('Google OAuth access revoked for user', { userId: user._id });
    } catch (error) {
      logger.error('Error revoking Google OAuth access:', error);
      throw error;
    }
  }

  /**
   * Check if Google OAuth is configured
   */
  isConfigured(): boolean {
    return !!(this.config.clientID && this.config.clientSecret);
  }

  /**
   * Get authentication URL for Google OAuth
   */
  getAuthUrl(): string {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth is not configured');
    }

    const params = new URLSearchParams({
      client_id: this.config.clientID,
      redirect_uri: this.config.callbackURL,
      scope: this.config.scope.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Refresh Google access token
   */
  async refreshGoogleToken(user: any): Promise<string | null> {
    try {
      if (!user.oauth?.google?.refreshToken) {
        return null;
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.clientID,
          client_secret: this.config.clientSecret,
          refresh_token: user.oauth.google.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        logger.warn('Failed to refresh Google access token', {
          status: response.status,
          statusText: response.statusText
        });
        return null;
      }

      const data = await response.json();
      
      // Update user's access token
      user.oauth.google.accessToken = data.access_token;
      
      // Update refresh token if provided
      if (data.refresh_token) {
        user.oauth.google.refreshToken = data.refresh_token;
      }

      await user.save();
      
      return data.access_token;
    } catch (error) {
      logger.error('Error refreshing Google access token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService();

// Export passport instance for use in routes
export { passport };

// Utility functions
export const initializeGoogleAuth = (app: any): void => {
  if (googleAuthService.isConfigured()) {
    app.use(passport.initialize());
    app.use(passport.session());
    logger.info('Google OAuth authentication initialized');
  } else {
    logger.warn('Google OAuth authentication not initialized - missing configuration');
  }
};

export const isGoogleAuthAvailable = (): boolean => {
  return googleAuthService.isConfigured();
};
