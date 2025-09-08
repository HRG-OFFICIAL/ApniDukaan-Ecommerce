# ShopSphere User Management Service

A comprehensive microservice for user authentication, authorization, and profile management in the ShopSphere e-commerce platform.

## 🚀 Features

### Authentication & Security
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **Multi-Factor Authentication (MFA)** - TOTP and SMS-based 2FA
- **Social Authentication** - OAuth integration with Google, Facebook, GitHub, Twitter
- **Password Security** - Bcrypt hashing with configurable salt rounds
- **Session Management** - Redis-backed session storage
- **Rate Limiting** - Multiple rate limiting tiers for different endpoints

### User Management
- **User Registration & Login** - Complete authentication flow
- **Email Verification** - Secure email verification system
- **Password Reset** - Secure password recovery flow
- **Profile Management** - Comprehensive user profiles with avatar support
- **Address Book** - Multiple shipping and billing addresses
- **User Preferences** - Customizable user settings and preferences

### Admin Features
- **Role-Based Access Control (RBAC)** - Flexible permission system
- **User Administration** - Search, filter, and manage users
- **Bulk Operations** - Batch user operations
- **Audit Logging** - Comprehensive activity tracking
- **Analytics & Reporting** - User metrics and insights
- **System Administration** - Cache management and health monitoring

## 🏗️ Architecture

### Tech Stack
- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Cache:** Redis
- **Authentication:** JWT + Sessions
- **File Upload:** Multer + Sharp (image processing)
- **Storage:** AWS S3, Cloudinary, or Local filesystem
- **Email:** Nodemailer with multiple providers
- **SMS:** Twilio integration

### Project Structure
```
src/
├── config/          # Configuration files
├── models/          # MongoDB models
├── services/        # Business logic services
├── routes/          # API routes
├── middleware/      # Custom middleware
├── types/           # TypeScript type definitions
├── scripts/         # Database seeders and utilities
└── app.ts           # Main application entry
```

## 🔧 Installation

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- Redis 7+
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/shopsphere/user-management-service
   cd user-management-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start dependencies (Docker)**
   ```bash
   docker-compose up -d mongodb redis
   ```

5. **Run database seeder**
   ```bash
   npm run seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

The service will be available at `http://localhost:3001`

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `POST /api/users/refresh-token` - Refresh JWT token
- `POST /api/users/verify-email` - Verify email address
- `POST /api/users/forgot-password` - Request password reset
- `POST /api/users/reset-password` - Reset password

### Profile Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/profile/avatar` - Upload avatar
- `POST /api/users/addresses` - Add address
- `PUT /api/users/addresses/:id` - Update address
- `DELETE /api/users/addresses/:id` - Delete address

### Multi-Factor Authentication
- `POST /api/users/mfa/setup` - Setup MFA
- `POST /api/users/mfa/verify` - Verify MFA setup
- `POST /api/users/mfa/disable` - Disable MFA

### Social Authentication
- `GET /api/users/auth/:provider/url` - Get OAuth URL
- `POST /api/users/auth/:provider` - Complete OAuth login
- `GET /api/users/social-accounts` - List linked accounts
- `POST /api/users/social-accounts/:provider/link` - Link social account
- `DELETE /api/users/social-accounts/:provider` - Unlink social account

### Admin Endpoints
- `GET /api/admin/users` - Search users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user (admin)
- `POST /api/admin/users/:id/suspend` - Suspend user
- `POST /api/admin/users/bulk-action` - Bulk operations
- `GET /api/admin/analytics/users` - User analytics
- `GET /api/admin/audit/logs` - Audit logs

## 🔒 Security Features

### Password Security
- Bcrypt hashing with configurable rounds
- Password strength requirements
- Password history tracking
- Account lockout after failed attempts

### Rate Limiting
- Authentication endpoints: 5 requests/15min
- General endpoints: 100 requests/15min
- Password reset: 3 requests/1hour
- Admin endpoints: 200 requests/15min

### Data Protection
- Input validation and sanitization
- SQL injection protection
- XSS prevention
- CSRF protection
- Secure headers (Helmet.js)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- `GET /health` - Basic health check
- `GET /metrics` - Application metrics

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking
- Security event logging
- Audit trail logging

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t shopsphere/user-management .

# Run with Docker Compose
docker-compose up -d
```

### Environment Variables
Key environment variables for production:

```env
NODE_ENV=production
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
JWT_SECRET=your-super-secure-secret
SESSION_SECRET=your-session-secret
EMAIL_SERVICE_API_KEY=your-email-service-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Default Admin Account

After running the seeder, a default admin account is created:

- **Email:** admin@shopsphere.com
- **Username:** superadmin  
- **Password:** SuperAdmin123!

**⚠️ IMPORTANT:** Change this password immediately after first deployment!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@shopsphere.com or create an issue in the repository.

---

Made with ❤️ by the ShopSphere Team
