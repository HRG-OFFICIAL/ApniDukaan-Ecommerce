# Security Testing Guide

This guide covers the comprehensive security testing utilities implemented for the authentication system.

## Quick Start

Run all security tests with a single command:

```bash
npm run test:security
```

Or run directly with tsx:

```bash
npx tsx src/scripts/runSecurityTests.ts
```

## What Gets Tested

### 🔐 Authentication Flow Tests
- **Login Flow**: Tests JWT token handling, user state updates, and session persistence
- **Registration Flow**: Validates new user creation and automatic login
- **OAuth Google Flow**: Tests Google OAuth integration and token exchange
- **Logout Flow**: Ensures proper session cleanup and state clearing
- **Password Reset Flow**: Tests forgot/reset password functionality
- **Email Verification**: Validates email confirmation process

### 🛡️ Role-Based Access Control (RBAC) Tests
- **Permission Validation**: Tests individual permissions (READ_PRODUCTS, MANAGE_USERS, etc.)
- **Role Authorization**: Validates admin vs customer role access
- **Route Protection**: Tests protected routes enforce proper permissions
- **UI Element Hiding**: Ensures unauthorized UI elements are hidden
- **Permission Inheritance**: Tests role-based permission inheritance

### 🔄 Session Management Tests
- **Token Refresh**: Tests automatic JWT token renewal
- **Cross-Tab Sync**: Validates session state synchronization across browser tabs
- **Session Expiry**: Tests proper handling of expired sessions
- **Storage Security**: Validates secure token storage mechanisms
- **Logout Sync**: Tests logout propagation across tabs

### 🔒 Security Measures Tests
- **JWT Validation**: Tests token signature and expiry validation
- **CSRF Protection**: Validates Cross-Site Request Forgery protections
- **Security Headers**: Tests proper security headers implementation
- **Route Guards**: Tests middleware-based route protection
- **Input Sanitization**: Validates user input sanitization
- **Password Security**: Tests password hashing and validation

## Test Output

The security test runner provides:

- ✅ **Colored Test Results**: Pass/fail status with details
- 📊 **Success Rate**: Overall percentage of passing tests
- 🔍 **Security Score**: Comprehensive security rating (0-100)
- 📋 **Implementation Report**: List of implemented vs missing features
- 💡 **Recommendations**: Actionable security improvements

## Example Output

```
============================================================
🔐 SECURITY TEST SUITE
============================================================
Running comprehensive authentication and security tests...

----------------------------------------
Authentication Flow Tests
----------------------------------------
✓ PASS Login Flow Test
    JWT token properly stored and decoded
✓ PASS Registration Flow Test
    User registration and auto-login working
✓ PASS OAuth Google Flow Test
    Google OAuth integration functional
...

----------------------------------------
Security Report  
----------------------------------------
Implementation Status:
  ✓ JWT Authentication
  ✓ Role-Based Access Control
  ✓ Password Hashing
  ✓ Session Management
  ✓ OAuth Integration
  ✓ Security Headers
  ✓ Route Protection

============================================================
📊 TEST SUMMARY
============================================================
Total Tests: 24
Passed: 22
Failed: 2
Success Rate: 92%

Security Score: 88/100

🎉 Excellent! Your authentication system is well secured.
```

## Test Categories

### File Structure
```
src/
├── utils/
│   └── securityTesting.ts      # All security test utilities
├── scripts/
│   └── runSecurityTests.ts     # Test runner with reporting
└── services/
    ├── rbac.ts                 # Role-based access control
    ├── sessionManager.ts       # Session management
    └── oauthService.ts         # OAuth integration
```

### Integration Points
The security tests validate integration with:
- **Zustand Auth Store**: User state and JWT management
- **GraphQL API**: Authentication mutations and queries  
- **Next.js Middleware**: Route protection and security headers
- **Protected Routes**: Role-based route access control
- **OAuth Service**: Google authentication flow

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
- name: Run Security Tests
  run: npm run test:security
```

The script exits with code 0 for success rate ≥70%, or code 1 for critical security issues.

## Customizing Tests

To add new security tests, extend the functions in `src/utils/securityTesting.ts`:

```typescript
// Add to testAuthenticationFlows()
export async function testAuthenticationFlows() {
  return {
    // existing tests...
    
    myCustomTest: await testMyCustomFlow()
  };
}

async function testMyCustomFlow(): Promise<TestResult> {
  // Your test logic here
  return {
    passed: true,
    details: "Custom security test passed"
  };
}
```

## Security Checklist

Use this checklist to validate your security implementation:

- [ ] JWT tokens are properly signed and validated
- [ ] Passwords are hashed with bcrypt
- [ ] Sessions expire and refresh automatically  
- [ ] RBAC controls access to routes and features
- [ ] OAuth flow handles errors gracefully
- [ ] Security headers are implemented
- [ ] Input validation prevents injection attacks
- [ ] HTTPS is enforced in production
- [ ] Sensitive data is not logged
- [ ] Rate limiting is implemented for auth endpoints

## Troubleshooting

**High failure rate?**
- Check that your backend is running
- Verify environment variables are set
- Ensure JWT_SECRET is configured

**OAuth tests failing?**
- Verify Google OAuth credentials
- Check redirect URI configuration
- Ensure GOOGLE_CLIENT_ID is set

**RBAC tests failing?**
- Verify user roles are properly assigned
- Check permission definitions in rbac.ts
- Ensure ProtectedRoute components are implemented

## Next Steps

After running security tests:

1. **Address failing tests** - Fix any security vulnerabilities found
2. **Improve security score** - Implement recommended security measures  
3. **Add custom tests** - Test application-specific security requirements
4. **Monitor regularly** - Run tests in CI/CD and during development
5. **Security audit** - Consider professional security assessment

## Support

For questions about the security testing system:
- Review the test implementations in `src/utils/securityTesting.ts`
- Check the RBAC configuration in `src/services/rbac.ts` 
- Examine session management in `src/services/sessionManager.ts`
- Look at OAuth integration in `src/services/oauthService.ts`
