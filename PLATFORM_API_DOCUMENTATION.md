# 🚀 Platform Management API Documentation

## Overview

The Platform Management API provides comprehensive endpoints for managing supplier platforms, credit operations, and platform-related data in the digital subscription management system.

## 🆕 Task 8: RESTful Credit Management Endpoints

**✅ COMPLETED: New RESTful API endpoints for improved developer experience:**

- `POST /api/platforms/:id/credits` - Add credits to a platform
- `POST /api/platforms/:id/credits/deduct` - Deduct credits from a platform
- `GET /api/platforms/:id/credits/balance` - Get current platform balance
- `GET /api/platforms/:id/credits/movements` - Get credit movement history

**Key Features:**
- ✅ RESTful URL patterns with platform ID in path
- ✅ Proper request validation and error handling
- ✅ Atomic operations with transaction support
- ✅ Comprehensive error handling for insufficient funds
- ✅ Filtering and pagination for movement history
- ✅ Authentication and authorization checks
- ✅ Complete audit trail for all operations

## 🔐 Authentication

### API Key Authentication
```http
X-API-Key: your-api-key-here
```

### Bearer Token Authentication
```http
Authorization: Bearer your-token-here
```

### Development Mode
For development, set `ALLOW_UNAUTHENTICATED=true` to bypass authentication.

## 📊 API Endpoints

### 1. Platform Management

#### GET /api/platforms
Get all platforms with pagination and filtering.

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `search` (string) - Search in name and description
- `sortBy` (string) - Sort field: name, created_at, credit_balance, updated_at
- `sortOrder` (string) - Sort order: asc, desc
- `isActive` (boolean) - Filter by active status

**Response:**
```json
{
  "data": [
    {
      "id": "platform-123",
      "name": "Netflix Supplier",
      "description": "Primary Netflix account supplier",
      "contactName": "John Doe",
      "contactEmail": "john@supplier.com",
      "contactPhone": "+1234567890",
      "creditBalance": 1250.50,
      "lowBalanceThreshold": 100.00,
      "isActive": true,
      "metadata": {},
      "createdAt": "2025-06-19T10:00:00Z",
      "updatedAt": "2025-06-19T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "filters": {
      "search": null,
      "isActive": null,
      "sortBy": "created_at",
      "sortOrder": "desc"
    }
  }
}
```

#### GET /api/platforms/:id/platform
Get individual platform details.

**Response:**
```json
{
  "data": {
    "id": "platform-123",
    "name": "Netflix Supplier",
    "creditBalance": 1250.50,
    "lowBalanceThreshold": 100.00,
    "isActive": true,
    // ... other platform fields
  }
}
```

#### POST /api/platforms
Create a new platform.

**Request Body:**
```json
{
  "name": "New Platform",
  "description": "Platform description",
  "contactName": "Contact Name",
  "contactEmail": "contact@example.com",
  "contactPhone": "+1234567890",
  "creditBalance": 500.00,
  "lowBalanceThreshold": 100.00,
  "isActive": true,
  "metadata": {}
}
```

**Validation Rules:**
- `name`: Required, 1-255 characters
- `description`: Optional, max 1000 characters
- `contactEmail`: Optional, valid email format
- `creditBalance`: Optional, non-negative number (default: 0)
- `lowBalanceThreshold`: Optional, non-negative number (default: 100)

#### PUT /api/platform
Update an existing platform.

**Request Body:**
```json
{
  "id": "platform-123",
  "name": "Updated Platform Name",
  "description": "Updated description",
  // ... other fields to update
}
```

#### DELETE /api/platform
Delete a platform (Admin only).

**Request Body:**
```json
{
  "id": "platform-123"
}
```

### 2. Credit Management

#### RESTful Credit Management API (Task 8)

The new RESTful credit management endpoints provide a cleaner, more intuitive API design:

#### POST /api/platforms/:id/credits
Add credits to a platform.

**URL Parameters:**
- `id`: Platform ID (required)

**Request Body:**
```json
{
  "amount": 250.50,
  "description": "Credit top-up",
  "createdBy": "user-id"
}
```

**Validation Rules:**
- `amount`: Required, positive number
- `description`: Required, non-empty string
- `createdBy`: Optional, defaults to authenticated user

**Response:**
```json
{
  "success": true,
  "platformId": "platform-123",
  "platformName": "Example Platform",
  "movementId": "movement-456",
  "previousBalance": 100.00,
  "newBalance": 350.50,
  "amountAdded": 250.50,
  "referenceType": "manual",
  "timestamp": "2025-06-19T10:30:00Z"
}
```

#### POST /api/platforms/:id/credits/deduct
Deduct credits from a platform.

**URL Parameters:**
- `id`: Platform ID (required)

**Request Body:**
```json
{
  "amount": 75.25,
  "description": "Purchase deduction",
  "createdBy": "user-id",
  "reference": "sale-456"
}
```

**Validation Rules:**
- `amount`: Required, positive number
- `description`: Required, non-empty string
- `createdBy`: Optional, defaults to authenticated user
- `reference`: Optional, reference to related transaction

**Response:**
```json
{
  "success": true,
  "platformId": "platform-123",
  "platformName": "Example Platform",
  "movementId": "movement-789",
  "previousBalance": 350.50,
  "newBalance": 275.25,
  "amountDeducted": 75.25,
  "referenceType": "sale",
  "referenceId": "sale-456",
  "timestamp": "2025-06-19T10:35:00Z"
}
```

#### GET /api/platforms/:id/credits/balance
Get current credit balance for a platform (RESTful endpoint).

**URL Parameters:**
- `id`: Platform ID (required)

**Response:**
```json
{
  "platformId": "platform-123",
  "platformName": "Example Platform",
  "balance": 275.25,
  "lowBalanceThreshold": 100.00,
  "isLowBalance": false,
  "lastUpdated": "2025-06-19T10:35:00Z"
}
```

#### GET /api/platforms/:id/credits/movements
Get credit movement history for a platform (RESTful endpoint).

**URL Parameters:**
- `id`: Platform ID (required)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `startDate`: Filter movements from this date (ISO format)
- `endDate`: Filter movements to this date (ISO format)
- `type`: Filter by movement type (`credit_added`, `credit_deducted`, `sale_deduction`, `adjustment`)

**Response:**
```json
{
  "data": [
    {
      "id": "movement-789",
      "platformId": "platform-123",
      "type": "credit_deducted",
      "amount": 75.25,
      "previousBalance": 350.50,
      "newBalance": 275.25,
      "reference": "sale-456",
      "description": "Purchase deduction",
      "createdBy": "user-id",
      "createdAt": "2025-06-19T10:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### GET /api/platforms/:id/platform-credit-movements
Get credit movement history for a platform (Legacy endpoint).

**Query Parameters:**
- `page` (integer) - Page number
- `limit` (integer) - Items per page
- `type` (string) - Movement type filter
- `startDate` (ISO date) - Start date filter
- `endDate` (ISO date) - End date filter

### 3. Balance Operations

#### GET /api/platforms/:id/platform-balance
Get current balance information for a platform.

**Response:**
```json
{
  "data": {
    "platformId": "platform-123",
    "platformName": "Netflix Supplier",
    "currentBalance": 1250.50,
    "lowBalanceThreshold": 100.00,
    "isLowBalance": false,
    "isActive": true,
    "balanceStatus": "normal"
  }
}
```

#### POST /api/platform-balance-adjust
Adjust platform balance (Admin only).

**Request Body:**
```json
{
  "platformId": "platform-123",
  "adjustmentAmount": 150.75,
  "reason": "Manual adjustment",
  "createdBy": "admin-user"
}
```

#### GET /api/platforms-low-balance
Get all platforms with low balance.

**Response:**
```json
{
  "data": [
    {
      "platformId": "platform-123",
      "platformName": "Netflix Supplier",
      "currentBalance": 50.00,
      "lowBalanceThreshold": 100.00,
      "contactEmail": "contact@supplier.com",
      "deficit": 50.00
    }
  ]
}
```

## 🔒 Authorization Matrix

| Operation | Viewer | User | Admin |
|-----------|--------|------|-------|
| Read platforms | ✅ | ✅ | ✅ |
| Create platforms | ❌ | ✅ | ✅ |
| Update platforms | ❌ | ✅ | ✅ |
| Delete platforms | ❌ | ❌ | ✅ |
| Add credits | ❌ | ✅ | ✅ |
| Deduct credits | ❌ | ✅ | ✅ |
| Adjust balance | ❌ | ❌ | ✅ |
| Read movements | ✅ | ✅ | ✅ |

## 🚦 Rate Limiting

- **Default Limit**: 100 requests per minute
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## ❌ Error Responses

### Validation Error (400)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Platform name is required",
      "value": ""
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "error": "Authentication required"
}
```

### Authorization Error (403)
```json
{
  "error": "Insufficient permissions for platforms-delete",
  "details": {
    "requiredRole": "admin",
    "userRole": "user",
    "operation": "platforms-delete"
  }
}
```

### Not Found Error (404)
```json
{
  "error": "Platform not found"
}
```

### Conflict Error (409)
```json
{
  "error": "Platform name already exists"
}
```

### Rate Limit Error (429)
```json
{
  "error": "Too many requests"
}
```

## 🛠️ Implementation Features

### ✅ Completed Features
- **Request Validation**: Comprehensive Joi-based validation
- **Authentication**: API key and Bearer token support
- **Authorization**: Role-based access control
- **Pagination**: Efficient pagination with metadata
- **Filtering**: Search and filter capabilities
- **Rate Limiting**: Request throttling protection
- **Error Handling**: Standardized error responses
- **Audit Trail**: Complete credit movement tracking
- **Transaction Safety**: Atomic database operations

### 🔧 Technical Details
- **Validation Library**: Joi v17.13.3
- **Database**: PostgreSQL with connection pooling
- **Response Format**: Consistent JSON structure
- **Security**: Input sanitization and SQL injection protection
- **Performance**: Optimized queries with proper indexing

## 📝 Usage Examples

### Create Platform with JavaScript
```javascript
const response = await fetch('/api/platforms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    name: 'New Platform',
    description: 'Platform description',
    contactEmail: 'contact@example.com',
    creditBalance: 500
  })
});

const result = await response.json();
```

### Add Credits with cURL
```bash
curl -X POST /api/platform-credit-add \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "platformId": "platform-123",
    "amount": 250.50,
    "description": "Credit top-up",
    "createdBy": "user-id"
  }'
```

## 🎯 Next Steps

The Platform Management API is now ready for frontend integration and provides a solid foundation for:
- Platform management dashboard
- Credit monitoring interface
- Automated balance alerts
- Financial reporting features
