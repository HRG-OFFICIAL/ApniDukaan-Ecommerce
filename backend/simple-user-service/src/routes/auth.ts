import express from 'express';
import { User } from '../models/User';
import { jwtService } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    // Generate tokens
    const accessToken = jwtService.generateAccessToken(user);
    const refreshToken = jwtService.generateRefreshToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const accessToken = jwtService.generateAccessToken(user);
    const refreshToken = jwtService.generateRefreshToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user: user.toJSON() }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    try {
      const payload = jwtService.verifyRefreshToken(refreshToken);
      const user = await User.findById(payload.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      const newAccessToken = jwtService.generateAccessToken(user);
      const newRefreshToken = jwtService.generateRefreshToken(user);

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

export default router;
