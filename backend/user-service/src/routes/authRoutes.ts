import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';
import { jwtService, logger } from '@shopsphere/shared';
import { authService } from '../services/authService';

const router = express.Router();

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findByGoogleId(profile.id);
    
    if (user) {
      // Update last login
      await user.updateLastLogin();
      return done(null, user);
    }

    // Check if user exists with same email
    user = await User.findByEmail(profile.emails?.[0]?.value || '');
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.isEmailVerified = true; // Google emails are pre-verified
      if (profile.photos?.[0]?.value && !user.avatar) {
        user.avatar = profile.photos[0].value;
      }
      await user.save();
      await user.updateLastLogin();
      return done(null, user);
    }

    // Create new user
    const newUser = new User({
      googleId: profile.id,
      email: profile.emails?.[0]?.value || '',
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      avatar: profile.photos?.[0]?.value || null,
      isEmailVerified: true // Google emails are pre-verified
    });

    await newUser.save();
    await newUser.updateLastLogin();

    logger.info('New user created via Google OAuth', {
      userId: newUser._id,
      email: newUser.email,
      action: 'google_oauth_register'
    });

    return done(null, newUser);
  } catch (error) {
    logger.error('Google OAuth authentication failed', {
      error: error.message,
      profileId: profile.id,
      action: 'google_oauth'
    });
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      // Generate JWT tokens
      const tokens = jwtService.generateTokenPair(user);

      // Set secure cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      };

      res.cookie('accessToken', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

      logger.info('Google OAuth login successful', {
        userId: user._id,
        email: user.email,
        action: 'google_oauth_success'
      });

      // Redirect to frontend with success
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth=success`);
    } catch (error) {
      logger.error('Google OAuth callback failed', {
        error: error.message,
        action: 'google_oauth_callback'
      });
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// Token validation endpoint (for other services)
router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const payload = jwtService.verifyAccessToken(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(401).json({ 
      valid: false, 
      error: 'Invalid token' 
    });
  }
});

export default router;
