import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import User from '../models/User';
import Session from '../models/Session';
import {
  ISocialAuthService,
  ISocialAuthRequest,
  ILoginResponse,
  AuthProvider,
  UserStatus,
  AccountAction,
  SessionStatus,
  MfaMethod
} from '../types/user.types';

import { logger } from '../utils/logger';

export class SocialAuthService implements ISocialAuthService {
  private googleClient: OAuth2Client | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize Google OAuth2 client
    if (process.env.GOOGLE_CLIENT_ID) {
      this.googleClient = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
    }
  }

  // ==================== GOOGLE AUTHENTICATION ====================

  async authenticateWithGoogle(data: ISocialAuthRequest): Promise<ILoginResponse> {
    try {
      if (!this.googleClient) {
        return {
          success: false,
          message: 'Google authentication not configured'
        };
      }

      let googleUserInfo;

      if (data.idToken) {
        // Verify ID token
        const ticket = await this.googleClient.verifyIdToken({
          idToken: data.idToken,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        if (!payload) {
          return {
            success: false,
            message: 'Invalid Google token'
          };
        }

        googleUserInfo = {
          id: payload.sub,
          email: payload.email!,
          name: payload.name!,
          firstName: payload.given_name!,
          lastName: payload.family_name!,
          picture: payload.picture,
          emailVerified: payload.email_verified
        };
      } else if (data.accessToken) {
        // Use access token to get user info
        const response = await axios.get(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${data.accessToken}`
        );
        
        googleUserInfo = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          firstName: response.data.given_name,
          lastName: response.data.family_name,
          picture: response.data.picture,
          emailVerified: response.data.verified_email
        };
      } else {
        return {
          success: false,
          message: 'Google token required'
        };
      }

      return await this.handleSocialLogin(AuthProvider.GOOGLE, googleUserInfo);

    } catch (error: any) {
      logger.error('Google authentication failed:', error);
      return {
        success: false,
        message: 'Google authentication failed'
      };
    }
  }

  // ==================== FACEBOOK AUTHENTICATION ====================

  async authenticateWithFacebook(data: ISocialAuthRequest): Promise<ILoginResponse> {
    try {
      if (!data.accessToken) {
        return {
          success: false,
          message: 'Facebook access token required'
        };
      }

      // Verify token with Facebook
      const tokenResponse = await axios.get(
        `https://graph.facebook.com/me?access_token=${data.accessToken}&fields=id,email,name,first_name,last_name,picture`
      );

      const facebookUserInfo = {
        id: tokenResponse.data.id,
        email: tokenResponse.data.email,
        name: tokenResponse.data.name,
        firstName: tokenResponse.data.first_name,
        lastName: tokenResponse.data.last_name,
        picture: tokenResponse.data.picture?.data?.url,
        emailVerified: true // Facebook emails are typically verified
      };

      return await this.handleSocialLogin(AuthProvider.FACEBOOK, facebookUserInfo);

    } catch (error: any) {
      logger.error('Facebook authentication failed:', error);
      return {
        success: false,
        message: 'Facebook authentication failed'
      };
    }
  }

  // ==================== TWITTER AUTHENTICATION ====================

  async authenticateWithTwitter(data: ISocialAuthRequest): Promise<ILoginResponse> {
    try {
      // Twitter OAuth 2.0 implementation
      // This is a simplified version - in production, you'd use proper OAuth 2.0 flow
      return {
        success: false,
        message: 'Twitter authentication not implemented in this demo'
      };
    } catch (error: any) {
      logger.error('Twitter authentication failed:', error);
      return {
        success: false,
        message: 'Twitter authentication failed'
      };
    }
  }

  // ==================== GITHUB AUTHENTICATION ====================

  async authenticateWithGitHub(data: ISocialAuthRequest): Promise<ILoginResponse> {
    try {
      if (!data.accessToken) {
        return {
          success: false,
          message: 'GitHub access token required'
        };
      }

      // Get user info from GitHub
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${data.accessToken}`,
          'User-Agent': 'ShopSphere'
        }
      });

      // Get user email (might be private)
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `token ${data.accessToken}`,
          'User-Agent': 'ShopSphere'
        }
      });

      const primaryEmail = emailResponse.data.find((email: any) => email.primary);

      const githubUserInfo = {
        id: userResponse.data.id.toString(),
        email: primaryEmail?.email || userResponse.data.email,
        name: userResponse.data.name || userResponse.data.login,
        firstName: userResponse.data.name ? userResponse.data.name.split(' ')[0] : userResponse.data.login,
        lastName: userResponse.data.name ? userResponse.data.name.split(' ').slice(1).join(' ') : '',
        picture: userResponse.data.avatar_url,
        emailVerified: primaryEmail?.verified || false
      };

      return await this.handleSocialLogin(AuthProvider.GITHUB, githubUserInfo);

    } catch (error: any) {
      logger.error('GitHub authentication failed:', error);
      return {
        success: false,
        message: 'GitHub authentication failed'
      };
    }
  }

  // ==================== SOCIAL ACCOUNT LINKING ====================

  async linkSocialAccount(userId: string, provider: AuthProvider, data: any): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if this social account is already linked to another user
      const existingUser = await User.findBySocialProvider(provider, data.providerId);
      if (existingUser && existingUser._id.toString() !== userId) {
        return {
          success: false,
          error: 'This social account is already linked to another user'
        };
      }

      // Add or update social account
      const socialAccount = {
        provider,
        providerId: data.providerId,
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        connectedAt: new Date(),
        lastUsed: new Date(),
        isVerified: data.emailVerified || false
      };

      user.addSocialAccount(socialAccount);

      // Log social account linking
      user.addActivity({
        action: AccountAction.PROFILE_UPDATE,
        timestamp: new Date(),
        success: true,
        metadata: {
          action: 'link_social_account',
          provider: provider
        }
      });

      await user.save();

      logger.info('Social account linked successfully', { userId, provider });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to link social account:', error);
      return {
        success: false,
        error: 'Failed to link social account'
      };
    }
  }

  async unlinkSocialAccount(userId: string, provider: AuthProvider): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const socialAccount = user.getSocialAccount(provider);
      if (!socialAccount) {
        return {
          success: false,
          error: 'Social account not found'
        };
      }

      // Check if this is the only auth method
      const hasLocalAuth = user.authProviders.some(ap => ap.provider === AuthProvider.LOCAL);
      const socialAccountCount = user.authProviders.filter(ap => ap.provider !== AuthProvider.LOCAL).length;

      if (!hasLocalAuth && socialAccountCount === 1) {
        return {
          success: false,
          error: 'Cannot unlink the last authentication method. Please set a password first.'
        };
      }

      // Remove social account
      user.removeSocialAccount(provider);

      // Log social account unlinking
      user.addActivity({
        action: AccountAction.PROFILE_UPDATE,
        timestamp: new Date(),
        success: true,
        metadata: {
          action: 'unlink_social_account',
          provider: provider
        }
      });

      await user.save();

      logger.info('Social account unlinked successfully', { userId, provider });

      return {
        success: true
      };

    } catch (error: any) {
      logger.error('Failed to unlink social account:', error);
      return {
        success: false,
        error: 'Failed to unlink social account'
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  private async handleSocialLogin(provider: AuthProvider, userInfo: any): Promise<ILoginResponse> {
    try {
      // First, try to find user by social provider
      let user = await User.findBySocialProvider(provider, userInfo.id);

      if (!user && userInfo.email) {
        // Try to find user by email
        user = await User.findByEmail(userInfo.email);
        
        if (user) {
          // Link this social account to existing user
          const socialAccount = {
            provider,
            providerId: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            avatar: userInfo.picture,
            connectedAt: new Date(),
            lastUsed: new Date(),
            isVerified: userInfo.emailVerified || false
          };

          user.addSocialAccount(socialAccount);
        }
      }

      if (!user) {
        // Create new user
        user = await this.createUserFromSocialAuth(provider, userInfo);
      }

      // Update social account info
      const socialAccount = user.getSocialAccount(provider);
      if (socialAccount) {
        socialAccount.lastUsed = new Date();
        socialAccount.name = userInfo.name;
        socialAccount.avatar = userInfo.picture;
      }

      // Create session
      const sessionId = uuidv4();
      const accessToken = user.generateAccessToken(sessionId);
      const refreshToken = user.generateRefreshToken();
      
      const session = new Session({
        userId: user._id,
        sessionId,
        accessToken,
        refreshToken,
        deviceInfo: {
          type: 'desktop',
          browser: 'unknown',
          os: 'unknown',
          userAgent: 'social-auth'
        },
        ipAddress: '127.0.0.1', // This should come from request
        status: SessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        lastAccessedAt: new Date(),
        issuedAt: new Date()
      });

      await session.save();

      // Update user login info
      user.lastActive = new Date();
      user.isOnline = true;

      // Log social login
      user.addActivity({
        action: AccountAction.LOGIN,
        timestamp: new Date(),
        success: true,
        metadata: {
          provider: provider,
          socialLogin: true
        }
      });

      await user.save();

      logger.info('Social login successful', { userId: user._id, provider });

      return {
        success: true,
        message: 'Social login successful',
        user: {
          id: user._id.toString(),
          email: user.email,
          profile: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            displayName: user.profile.displayName,
            avatar: user.profile.avatar
          },
          roles: user.roles,
          status: user.status,
          isEmailVerified: user.security.isEmailVerified
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
          tokenType: 'Bearer'
        },
        sessionId
      };

    } catch (error: any) {
      logger.error('Social login handling failed:', error);
      return {
        success: false,
        message: 'Social login failed'
      };
    }
  }

  private async createUserFromSocialAuth(provider: AuthProvider, userInfo: any): Promise<any> {
    const user = new User({
      email: userInfo.email,
      username: `${provider}_${userInfo.id}`, // Unique username
      profile: {
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        displayName: userInfo.name,
        avatar: userInfo.picture ? {
          url: userInfo.picture,
          provider: 'social'
        } : undefined,
        addresses: [],
        preferences: {
          language: 'en',
          timezone: 'UTC',
          currency: 'USD',
          theme: 'light',
          notifications: [
            {
              channel: 'email',
              enabled: true,
              categories: {
                orderUpdates: true,
                promotions: false,
                security: true,
                newsletter: false,
                accountActivity: true
              }
            }
          ],
          privacy: {
            profileVisibility: 'public',
            emailVisibility: 'private',
            phoneVisibility: 'private',
            addressVisibility: 'private',
            allowDataCollection: true,
            allowMarketing: false,
            allowThirdPartySharing: false
          },
          twoFactorAuth: {
            method: MfaMethod.NONE,
            isEnabled: false
          },
          newsletter: false,
          marketing: false
        }
      },
      security: {
        passwordHash: '', // Social login users don't have passwords initially
        isEmailVerified: userInfo.emailVerified || false,
        emailVerifiedAt: userInfo.emailVerified ? new Date() : undefined,
        mfaSettings: {
          method: MfaMethod.NONE,
          isEnabled: false
        },
        loginAttempts: 0
      },
      roles: ['customer'],
      status: userInfo.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
      authProviders: [{
        provider,
        providerId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
        connectedAt: new Date(),
        lastUsed: new Date(),
        isVerified: userInfo.emailVerified || false
      }],
      activityLog: [],
      lastActive: new Date(),
      isOnline: false,
      loyaltyPoints: 0,
      tags: ['new_user', 'social_signup'],
      metadata: {
        registrationSource: provider
      }
    });

    // Generate referral code
    user.generateReferralCode();

    await user.save();

    logger.info('User created from social auth', { userId: user._id, provider, email: userInfo.email });

    return user;
  }

  // ==================== PROVIDER UTILITIES ====================

  getAuthUrl(provider: AuthProvider, state?: string): string {
    switch (provider) {
      case AuthProvider.GOOGLE:
        if (!this.googleClient) return '';
        return this.googleClient.generateAuthUrl({
          access_type: 'offline',
          scope: ['email', 'profile'],
          state: state || uuidv4()
        });

      case AuthProvider.FACEBOOK:
        const fbClientId = process.env.FACEBOOK_CLIENT_ID;
        const fbRedirectUri = process.env.FACEBOOK_REDIRECT_URI;
        const fbState = state || uuidv4();
        return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbClientId}&redirect_uri=${fbRedirectUri}&state=${fbState}&scope=email`;

      case AuthProvider.GITHUB:
        const ghClientId = process.env.GITHUB_CLIENT_ID;
        const ghRedirectUri = process.env.GITHUB_REDIRECT_URI;
        const ghState = state || uuidv4();
        return `https://github.com/login/oauth/authorize?client_id=${ghClientId}&redirect_uri=${ghRedirectUri}&scope=user:email&state=${ghState}`;

      default:
        return '';
    }
  }

  async getSocialAccountInfo(userId: string): Promise<{ success: boolean; accounts?: any[]; error?: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const accounts = user.authProviders
        .filter(account => account.provider !== AuthProvider.LOCAL)
        .map(account => ({
          provider: account.provider,
          email: account.email,
          name: account.name,
          avatar: account.avatar,
          connectedAt: account.connectedAt,
          lastUsed: account.lastUsed,
          isVerified: account.isVerified
        }));

      return {
        success: true,
        accounts
      };

    } catch (error: any) {
      logger.error('Failed to get social accounts:', error);
      return {
        success: false,
        error: 'Failed to retrieve social accounts'
      };
    }
  }
}

export default SocialAuthService;
