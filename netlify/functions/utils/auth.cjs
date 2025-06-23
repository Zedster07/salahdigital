// Authentication and authorization utilities for API endpoints

// Simple authentication check (can be enhanced with JWT, API keys, etc.)
function authenticateRequest(event) {
  // For now, we'll implement a simple API key authentication
  // In production, this should be replaced with proper JWT or session-based auth
  
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
  
  // Check for API key in header
  if (apiKey) {
    // In production, validate against stored API keys
    const validApiKeys = [
      process.env.API_KEY,
      process.env.ADMIN_API_KEY,
      'dev-api-key-12345' // Development key
    ].filter(Boolean);
    
    if (validApiKeys.includes(apiKey)) {
      return {
        isAuthenticated: true,
        user: {
          id: 'api-user',
          role: apiKey === process.env.ADMIN_API_KEY ? 'admin' : 'user',
          source: 'api-key'
        }
      };
    }
  }
  
  // Check for Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // In production, validate JWT token here
    // For now, accept any non-empty token as valid
    if (token && token.length > 0) {
      return {
        isAuthenticated: true,
        user: {
          id: 'token-user',
          role: 'user',
          source: 'bearer-token'
        }
      };
    }
  }
  
  // For development, allow unauthenticated access
  if (process.env.NODE_ENV === 'development' || process.env.ALLOW_UNAUTHENTICATED === 'true') {
    return {
      isAuthenticated: true,
      user: {
        id: 'dev-user',
        role: 'admin',
        source: 'development'
      }
    };
  }
  
  return {
    isAuthenticated: false,
    user: null,
    error: 'Authentication required'
  };
}

// Authorization check for specific operations
function authorizeOperation(user, operation, resource = null) {
  if (!user) {
    return {
      isAuthorized: false,
      error: 'User not authenticated'
    };
  }
  
  // Define permission matrix
  const permissions = {
    admin: {
      // Platform permissions
      platforms: ['read', 'create', 'update', 'delete'],
      'platform-credits': ['read', 'add', 'deduct', 'adjust'],
      'platform-movements': ['read'],
      'platform-balance': ['read', 'adjust'],
      // Product permissions
      products: ['read', 'create', 'update', 'delete', 'analytics'],
      // Sales permissions
      sales: ['read', 'create', 'update', 'delete', 'analytics'],
      // Financial permissions
      financial: ['reports', 'dashboard'],
      // User permissions
      users: ['read', 'create', 'update', 'delete'],
      // Subscriber permissions
      subscribers: ['read', 'create', 'update', 'delete']
    },
    user: {
      // Platform permissions
      platforms: ['read', 'create', 'update'],
      'platform-credits': ['read', 'add'],
      'platform-movements': ['read'],
      'platform-balance': ['read'],
      // Product permissions
      products: ['read', 'create', 'update'],
      // Sales permissions
      sales: ['read', 'create', 'update'],
      // Financial permissions
      financial: ['reports'],
      // User permissions
      users: ['read'],
      // Subscriber permissions
      subscribers: ['read', 'create', 'update']
    },
    viewer: {
      // Platform permissions
      platforms: ['read'],
      'platform-credits': ['read'],
      'platform-movements': ['read'],
      'platform-balance': ['read'],
      // Product permissions
      products: ['read'],
      // Sales permissions
      sales: ['read'],
      // Financial permissions
      financial: ['reports'],
      // User permissions
      users: ['read'],
      // Subscriber permissions
      subscribers: ['read']
    }
  };
  
  const userRole = user.role || 'viewer';
  const userPermissions = permissions[userRole] || permissions.viewer;
  
  // Extract resource type and operation from the operation string
  let resourceType, operationType;
  
  if (operation.includes('-')) {
    [resourceType, operationType] = operation.split('-', 2);
  } else {
    resourceType = operation;
    operationType = 'read'; // Default operation
  }
  
  // Check if user has permission for this resource and operation
  const allowedOperations = userPermissions[resourceType] || [];
  
  if (allowedOperations.includes(operationType)) {
    return {
      isAuthorized: true,
      user
    };
  }
  
  return {
    isAuthorized: false,
    error: `Insufficient permissions for ${operation}`,
    requiredRole: getMinimumRoleForOperation(operation),
    userRole
  };
}

// Get minimum role required for an operation
function getMinimumRoleForOperation(operation) {
  const roleHierarchy = ['viewer', 'user', 'admin'];

  const operationRoles = {
    // Platform operations
    'platforms-read': 'viewer',
    'platforms-create': 'user',
    'platforms-update': 'user',
    'platforms-delete': 'admin',
    'platform-credits-read': 'viewer',
    'platform-credits-add': 'user',
    'platform-credits-deduct': 'user',
    'platform-credits-adjust': 'admin',
    'platform-movements-read': 'viewer',
    'platform-balance-read': 'viewer',
    'platform-balance-adjust': 'admin',
    // Product operations
    'products-read': 'viewer',
    'products-create': 'user',
    'products-update': 'user',
    'products-delete': 'admin',
    'products-analytics': 'user',
    // Sales operations
    'sales-read': 'viewer',
    'sales-create': 'user',
    'sales-update': 'user',
    'sales-delete': 'admin',
    'sales-analytics': 'user',
    // Financial operations
    'financial-reports': 'viewer',
    'financial-dashboard': 'user',
    // User operations
    'users-read': 'viewer',
    'users-create': 'admin',
    'users-update': 'admin',
    'users-delete': 'admin',
    // Subscriber operations
    'subscribers-read': 'viewer',
    'subscribers-create': 'user',
    'subscribers-update': 'user',
    'subscribers-delete': 'admin'
  };

  return operationRoles[operation] || 'admin';
}

// Middleware function to check authentication and authorization
function requireAuth(operation, resource = null) {
  return (event) => {
    // Check authentication
    const authResult = authenticateRequest(event);
    
    if (!authResult.isAuthenticated) {
      return {
        statusCode: 401,
        error: authResult.error || 'Authentication required',
        headers: {
          'WWW-Authenticate': 'Bearer realm="API", API-Key realm="API"'
        }
      };
    }
    
    // Check authorization
    const authzResult = authorizeOperation(authResult.user, operation, resource);
    
    if (!authzResult.isAuthorized) {
      return {
        statusCode: 403,
        error: authzResult.error || 'Insufficient permissions',
        details: {
          requiredRole: authzResult.requiredRole,
          userRole: authzResult.userRole,
          operation
        }
      };
    }
    
    // Return user info for use in the request
    return {
      user: authResult.user,
      isAuthenticated: true,
      isAuthorized: true
    };
  };
}

// Helper to extract user info from authenticated request
function getUserFromEvent(event) {
  const authResult = authenticateRequest(event);
  return authResult.isAuthenticated ? authResult.user : null;
}

// Rate limiting (simple implementation)
const rateLimitStore = new Map();

function checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean old entries
  for (const [key, requests] of rateLimitStore.entries()) {
    const filteredRequests = requests.filter(time => time > windowStart);
    if (filteredRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, filteredRequests);
    }
  }
  
  // Check current requests
  const requests = rateLimitStore.get(identifier) || [];
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= maxRequests) {
    return {
      allowed: false,
      resetTime: Math.min(...recentRequests) + windowMs,
      remaining: 0
    };
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(identifier, recentRequests);
  
  return {
    allowed: true,
    remaining: maxRequests - recentRequests.length,
    resetTime: now + windowMs
  };
}

// Apply rate limiting
function rateLimit(maxRequests = 100, windowMs = 60000) {
  return (event) => {
    const identifier = event.headers['x-forwarded-for'] || 
                      event.headers['x-real-ip'] || 
                      event.requestContext?.identity?.sourceIp || 
                      'unknown';
    
    const result = checkRateLimit(identifier, maxRequests, windowMs);
    
    if (!result.allowed) {
      return {
        statusCode: 429,
        error: 'Too many requests',
        headers: {
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000),
          'X-RateLimit-Limit': maxRequests,
          'X-RateLimit-Remaining': 0,
          'X-RateLimit-Reset': result.resetTime
        }
      };
    }
    
    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': result.resetTime
      }
    };
  };
}

module.exports = {
  authenticateRequest,
  authorizeOperation,
  requireAuth,
  getUserFromEvent,
  rateLimit,
  getMinimumRoleForOperation
};
