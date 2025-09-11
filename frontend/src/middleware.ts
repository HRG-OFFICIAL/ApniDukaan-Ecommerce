import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Define protected routes and their required roles/permissions
const PROTECTED_ROUTES = {
  // Admin routes
  '/admin': ['admin'],
  '/admin/dashboard': ['admin'],
  '/admin/users': ['admin'],
  '/admin/products': ['admin', 'moderator'],
  '/admin/orders': ['admin', 'moderator'],
  '/admin/analytics': ['admin'],
  '/admin/settings': ['admin'],
  
  // User routes
  '/profile': ['user', 'admin', 'moderator'],
  '/account': ['user', 'admin', 'moderator'],
  '/orders': ['user', 'admin', 'moderator'],
  '/cart': ['user', 'admin', 'moderator'],
  '/checkout': ['user', 'admin', 'moderator'],
  '/wishlist': ['user', 'admin', 'moderator'],
} as const

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/products',
  '/categories',
  '/search',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/unauthorized',
  '/not-found'
]

// API routes that should be proxied to backend
const API_ROUTES = [
  '/api'
]

interface JWTPayload {
  sub: string
  email: string
  role: string
  exp: number
  iat: number
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Handle API routes - proxy to backend
  if (API_ROUTES.some(route => pathname.startsWith(route))) {
    return handleApiProxy(request)
  }
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }
  
  // Apply security headers to all responses
  const response = NextResponse.next()
  addSecurityHeaders(response)
  
  // Check if route requires authentication
  const isProtectedRoute = Object.keys(PROTECTED_ROUTES).some(route => 
    pathname.startsWith(route)
  )
  
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route)
  )
  
  if (!isProtectedRoute && isPublicRoute) {
    return response
  }
  
  // Get token from cookie or header
  const token = getTokenFromRequest(request)
  
  if (!token) {
    if (isProtectedRoute) {
      return redirectToLogin(request)
    }
    return response
  }
  
  try {
    // Verify JWT token
    const payload = await verifyToken(token)
    
    if (!payload) {
      if (isProtectedRoute) {
        return redirectToLogin(request)
      }
      return response
    }
    
    // Check role-based access for protected routes
    if (isProtectedRoute) {
      const requiredRoles = getRequiredRoles(pathname)
      
      if (requiredRoles.length > 0 && !requiredRoles.includes(payload.role)) {
        // Check if admin can access lower-level routes
        if (payload.role === 'admin' && 
            (requiredRoles.includes('user') || requiredRoles.includes('moderator'))) {
          // Allow access
        } else if (payload.role === 'moderator' && requiredRoles.includes('user')) {
          // Allow access
        } else {
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
      }
    }
    
    // Add user info to headers for downstream consumption
    response.headers.set('X-User-ID', payload.sub)
    response.headers.set('X-User-Role', payload.role)
    response.headers.set('X-User-Email', payload.email)
    
    return response
    
  } catch (error) {
    console.error('Token verification failed:', error)
    
    if (isProtectedRoute) {
      return redirectToLogin(request)
    }
    
    return response
  }
}

function handleApiProxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl
  
  // Handle catalog service routes - delegate to Next.js rewrites
  if (pathname.startsWith('/api/catalog/')) {
    return NextResponse.next()
  }
  
  // Handle other API routes (API Gateway)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  const backendUrl = `${apiUrl}${pathname.replace('/api', '')}${search}`
  
  // Create headers for the proxied request
  const headers = new Headers(request.headers)
  headers.set('X-Forwarded-For', request.ip || '')
  headers.set('X-Forwarded-Host', request.headers.get('host') || '')
  headers.set('X-Forwarded-Proto', request.nextUrl.protocol.slice(0, -1))
  
  return NextResponse.rewrite(new URL(backendUrl))
}

function addSecurityHeaders(response: NextResponse) {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' http://localhost:4000 https://api.apnidukaan.com https://www.google-analytics.com; " +
    "frame-src 'self' https://accounts.google.com; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  )
  
  // Other security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // Remove server information
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')
}

function getTokenFromRequest(request: NextRequest): string | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Try to get token from cookie
  const tokenCookie = request.cookies.get('authToken')
  if (tokenCookie) {
    return tokenCookie.value
  }
  
  // Try to get from custom header (for API calls)
  const tokenHeader = request.headers.get('X-Auth-Token')
  if (tokenHeader) {
    return tokenHeader
  }
  
  return null
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key'
    )
    
    const { payload } = await jwtVerify(token, secret)
    
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
      exp: payload.exp as number,
      iat: payload.iat as number
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

function getRequiredRoles(pathname: string): string[] {
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return [...roles] // Create a mutable copy of the readonly array
    }
  }
  return []
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/auth/login', request.url)
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
  
  const response = NextResponse.redirect(loginUrl)
  
  // Clear any invalid tokens
  response.cookies.delete('authToken')
  response.cookies.delete('refreshToken')
  
  return response
}

// Configure which paths this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
