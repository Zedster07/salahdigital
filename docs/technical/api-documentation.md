# 🔌 API Documentation

## Overview

The Digital Manager API provides comprehensive programmatic access to all platform features, enabling integration with external systems, automation of workflows, and custom application development.

## 🚀 Getting Started

### Base URL
```
Production: https://api.digitalmanager.com/v1
Staging: https://staging-api.digitalmanager.com/v1
Development: http://localhost:3001/api
```

### API Versioning
- **Current Version**: v1
- **Version Header**: `API-Version: v1`
- **Backward Compatibility**: Maintained for major versions
- **Deprecation Notice**: 6 months advance notice

## 🔐 Authentication

### API Key Authentication
```http
GET /api/platforms
X-API-Key: your-api-key-here
Content-Type: application/json
```

### Bearer Token Authentication
```http
GET /api/platforms
Authorization: Bearer your-jwt-token-here
Content-Type: application/json
```

### Obtaining API Keys
1. Login to Digital Manager
2. Go to **Settings** → **API Access**
3. Click **Generate New API Key**
4. Copy and securely store the key
5. Configure key permissions and scopes

### Authentication Scopes
- **read**: Read-only access to data
- **write**: Create and update operations
- **delete**: Delete operations
- **admin**: Administrative functions

## 📊 Platform Management API

### Get All Platforms
```http
GET /api/platforms
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (active, inactive)
- `search` (string): Search by platform name
- `sort` (string): Sort field (name, createdAt, creditBalance)
- `order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "platforms": [
      {
        "id": "platform-123",
        "name": "Netflix Supplier",
        "description": "Primary Netflix account supplier",
        "contactName": "John Smith",
        "contactEmail": "john@supplier.com",
        "contactPhone": "+1-555-0123",
        "creditBalance": 1500.00,
        "lowBalanceThreshold": 500.00,
        "isActive": true,
        "metadata": {},
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-20T14:45:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Get Platform by ID
```http
GET /api/platforms/{id}
```

**Path Parameters:**
- `id` (string): Platform ID

**Response:**
```json
{
  "success": true,
  "data": {
    "platform": {
      "id": "platform-123",
      "name": "Netflix Supplier",
      "description": "Primary Netflix account supplier",
      "contactName": "John Smith",
      "contactEmail": "john@supplier.com",
      "contactPhone": "+1-555-0123",
      "creditBalance": 1500.00,
      "lowBalanceThreshold": 500.00,
      "isActive": true,
      "metadata": {},
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-20T14:45:00Z"
    }
  }
}
```

### Create Platform
```http
POST /api/platforms
Content-Type: application/json

{
  "name": "Netflix Supplier",
  "description": "Primary Netflix account supplier",
  "contactName": "John Smith",
  "contactEmail": "john@supplier.com",
  "contactPhone": "+1-555-0123",
  "creditBalance": 1000.00,
  "lowBalanceThreshold": 200.00,
  "isActive": true,
  "metadata": {
    "region": "US",
    "tier": "premium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "platform": {
      "id": "platform-456",
      "name": "Netflix Supplier",
      "description": "Primary Netflix account supplier",
      "contactName": "John Smith",
      "contactEmail": "john@supplier.com",
      "contactPhone": "+1-555-0123",
      "creditBalance": 1000.00,
      "lowBalanceThreshold": 200.00,
      "isActive": true,
      "metadata": {
        "region": "US",
        "tier": "premium"
      },
      "createdAt": "2025-01-20T15:30:00Z",
      "updatedAt": "2025-01-20T15:30:00Z"
    }
  }
}
```

### Update Platform
```http
PUT /api/platforms/{id}
Content-Type: application/json

{
  "name": "Netflix Premium Supplier",
  "contactEmail": "john.smith@supplier.com",
  "lowBalanceThreshold": 300.00
}
```

### Delete Platform
```http
DELETE /api/platforms/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Platform deleted successfully"
}
```

## 💰 Credit Management API

### Add Credits to Platform
```http
POST /api/platforms/{id}/credits
Content-Type: application/json

{
  "amount": 1000.00,
  "reference": "BANK-TRANSFER-12345",
  "notes": "Monthly credit top-up",
  "metadata": {
    "paymentMethod": "bank_transfer",
    "transactionId": "TXN-789"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "movement": {
      "id": "movement-789",
      "platformId": "platform-123",
      "type": "credit_added",
      "amount": 1000.00,
      "balanceBefore": 500.00,
      "balanceAfter": 1500.00,
      "reference": "BANK-TRANSFER-12345",
      "notes": "Monthly credit top-up",
      "metadata": {
        "paymentMethod": "bank_transfer",
        "transactionId": "TXN-789"
      },
      "createdAt": "2025-01-20T16:00:00Z"
    },
    "platform": {
      "id": "platform-123",
      "creditBalance": 1500.00
    }
  }
}
```

### Deduct Credits from Platform
```http
POST /api/platforms/{id}/credits/deduct
Content-Type: application/json

{
  "amount": 150.00,
  "reference": "SALE-456",
  "notes": "Credit deduction for sale",
  "metadata": {
    "saleId": "sale-456",
    "productId": "product-789"
  }
}
```

### Get Platform Credit Balance
```http
GET /api/platforms/{id}/credits/balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "platformId": "platform-123",
    "creditBalance": 1350.00,
    "lowBalanceThreshold": 500.00,
    "utilizationRate": 73.0,
    "status": "healthy",
    "lastMovement": {
      "id": "movement-790",
      "type": "sale_deduction",
      "amount": -150.00,
      "createdAt": "2025-01-20T16:15:00Z"
    }
  }
}
```

### Get Credit Movement History
```http
GET /api/platforms/{id}/credits/movements
```

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `type` (string): Movement type filter
- `startDate` (string): Start date (ISO 8601)
- `endDate` (string): End date (ISO 8601)
- `sort` (string): Sort field (createdAt, amount)
- `order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "movements": [
      {
        "id": "movement-790",
        "platformId": "platform-123",
        "type": "sale_deduction",
        "amount": -150.00,
        "balanceBefore": 1500.00,
        "balanceAfter": 1350.00,
        "reference": "SALE-456",
        "notes": "Credit deduction for sale",
        "metadata": {
          "saleId": "sale-456",
          "productId": "product-789"
        },
        "createdAt": "2025-01-20T16:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "pages": 8
    },
    "summary": {
      "totalCreditsAdded": 5000.00,
      "totalCreditsUsed": 3650.00,
      "netBalance": 1350.00,
      "movementCount": 156
    }
  }
}
```

## 📦 Product Management API

### Get All Products
```http
GET /api/digital-products
```

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `category` (string): Product category filter
- `platformId` (string): Platform filter
- `status` (string): Product status filter
- `search` (string): Search by product name
- `inStock` (boolean): Filter by stock availability

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product-789",
        "name": "Netflix Premium 1 Month",
        "description": "Netflix Premium subscription for 1 month",
        "category": "streaming",
        "platformId": "platform-123",
        "platformName": "Netflix Supplier",
        "buyingPrice": 15.00,
        "sellingPrice": 25.00,
        "profitMargin": 40.0,
        "currentStock": 45,
        "minimumStock": 10,
        "durationType": "monthly",
        "durationValue": 1,
        "isActive": true,
        "metadata": {
          "region": "global",
          "quality": "4K"
        },
        "createdAt": "2025-01-15T12:00:00Z",
        "updatedAt": "2025-01-20T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 89,
      "pages": 5
    }
  }
}
```

### Create Product
```http
POST /api/digital-products
Content-Type: application/json

{
  "name": "Spotify Premium 1 Month",
  "description": "Spotify Premium subscription for 1 month",
  "category": "music",
  "platformId": "platform-456",
  "buyingPrice": 8.00,
  "sellingPrice": 15.00,
  "currentStock": 100,
  "minimumStock": 20,
  "durationType": "monthly",
  "durationValue": 1,
  "isActive": true,
  "metadata": {
    "region": "global",
    "features": ["ad-free", "offline", "high-quality"]
  }
}
```

### Update Product
```http
PUT /api/digital-products/{id}
Content-Type: application/json

{
  "sellingPrice": 18.00,
  "currentStock": 75,
  "minimumStock": 15
}
```

## 💰 Sales Management API

### Get All Sales
```http
GET /api/stock-sales
```

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `startDate` (string): Start date filter
- `endDate` (string): End date filter
- `customerId` (string): Customer filter
- `productId` (string): Product filter
- `platformId` (string): Platform filter
- `paymentStatus` (string): Payment status filter
- `sort` (string): Sort field
- `order` (string): Sort order

### Create Sale
```http
POST /api/stock-sales
Content-Type: application/json

{
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "customerPhone": "+1-555-0456",
  "productId": "product-789",
  "quantity": 2,
  "unitPrice": 25.00,
  "paymentMethod": "cash",
  "paymentStatus": "paid",
  "notes": "Customer requested immediate delivery",
  "metadata": {
    "source": "website",
    "campaign": "summer-promo"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sale": {
      "id": "sale-456",
      "customerName": "Jane Smith",
      "customerEmail": "jane@example.com",
      "customerPhone": "+1-555-0456",
      "productId": "product-789",
      "productName": "Netflix Premium 1 Month",
      "platformId": "platform-123",
      "platformName": "Netflix Supplier",
      "quantity": 2,
      "unitPrice": 25.00,
      "totalPrice": 50.00,
      "platformCost": 30.00,
      "profit": 20.00,
      "profitMargin": 40.0,
      "paymentMethod": "cash",
      "paymentStatus": "paid",
      "saleDate": "2025-01-20T16:30:00Z",
      "notes": "Customer requested immediate delivery",
      "metadata": {
        "source": "website",
        "campaign": "summer-promo"
      },
      "createdAt": "2025-01-20T16:30:00Z",
      "updatedAt": "2025-01-20T16:30:00Z"
    }
  }
}
```

## 📊 Analytics and Reporting API

### Get Financial Dashboard Data
```http
GET /api/analytics/financial-dashboard
```

**Query Parameters:**
- `startDate` (string): Analysis start date
- `endDate` (string): Analysis end date
- `platformId` (string): Platform filter
- `granularity` (string): Data granularity (daily, weekly, monthly)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 12500.00,
      "totalProfit": 5000.00,
      "profitMargin": 40.0,
      "totalSales": 125,
      "averageSaleValue": 100.00,
      "creditUtilization": 75.5
    },
    "platformMetrics": [
      {
        "platformId": "platform-123",
        "platformName": "Netflix Supplier",
        "revenue": 7500.00,
        "profit": 3000.00,
        "profitMargin": 40.0,
        "salesCount": 75,
        "creditUsed": 4500.00
      }
    ],
    "trends": {
      "revenueGrowth": 15.5,
      "profitGrowth": 18.2,
      "salesGrowth": 12.8
    }
  }
}
```

### Get Platform Profitability Report
```http
GET /api/analytics/platform-profitability
```

### Get Credit Utilization Report
```http
GET /api/analytics/credit-utilization
```

## 🔔 Notification API

### Get Notifications
```http
GET /api/notifications
```

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `type` (string): Notification type filter
- `severity` (string): Severity filter
- `unreadOnly` (boolean): Show only unread notifications
- `platformId` (string): Platform filter

### Mark Notification as Read
```http
PUT /api/notifications/{id}/read
```

### Create Custom Notification
```http
POST /api/notifications
Content-Type: application/json

{
  "type": "custom",
  "title": "System Maintenance",
  "message": "Scheduled maintenance will occur tonight from 2-4 AM",
  "severity": "info",
  "actionRequired": false,
  "metadata": {
    "maintenanceWindow": "2025-01-21T02:00:00Z"
  }
}
```

## 📈 Webhook API

### Register Webhook
```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/digitalmanager",
  "events": ["sale.completed", "platform.low_credit", "product.out_of_stock"],
  "secret": "your-webhook-secret",
  "active": true
}
```

### Webhook Events
- `sale.completed`: Sale transaction completed
- `sale.refunded`: Sale refunded
- `platform.low_credit`: Platform credit below threshold
- `platform.critical_credit`: Platform credit critically low
- `product.out_of_stock`: Product stock depleted
- `product.low_stock`: Product stock below minimum
- `user.created`: New user account created
- `system.maintenance`: System maintenance scheduled

### Webhook Payload Example
```json
{
  "event": "sale.completed",
  "timestamp": "2025-01-20T16:30:00Z",
  "data": {
    "saleId": "sale-456",
    "customerEmail": "jane@example.com",
    "totalAmount": 50.00,
    "profit": 20.00,
    "platformId": "platform-123"
  },
  "signature": "sha256=webhook-signature"
}
```

## 🚨 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Platform does not have sufficient credits for this operation",
    "details": {
      "platformId": "platform-123",
      "requiredAmount": 150.00,
      "availableAmount": 100.00
    },
    "timestamp": "2025-01-20T16:45:00Z",
    "requestId": "req-789"
  }
}
```

### Common Error Codes
- `INVALID_API_KEY`: Invalid or expired API key
- `INSUFFICIENT_PERMISSIONS`: Insufficient permissions for operation
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `VALIDATION_ERROR`: Request validation failed
- `INSUFFICIENT_CREDITS`: Platform credit balance too low
- `OUT_OF_STOCK`: Product out of stock
- `PLATFORM_INACTIVE`: Platform is not active
- `RATE_LIMIT_EXCEEDED`: API rate limit exceeded
- `INTERNAL_ERROR`: Internal server error

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Unprocessable Entity
- `429`: Too Many Requests
- `500`: Internal Server Error

## 🔒 Rate Limiting

### Rate Limits
- **Standard**: 1000 requests per hour
- **Premium**: 5000 requests per hour
- **Enterprise**: 10000 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
```

## 📚 SDK and Libraries

### Official SDKs
- **JavaScript/Node.js**: `npm install @digitalmanager/sdk`
- **Python**: `pip install digitalmanager-sdk`
- **PHP**: `composer require digitalmanager/sdk`
- **C#**: `Install-Package DigitalManager.SDK`

### Community Libraries
- **Ruby**: `gem install digitalmanager`
- **Go**: `go get github.com/digitalmanager/go-sdk`
- **Java**: Maven/Gradle packages available

## 📞 API Support

### Getting Help
- 📧 **Email**: api-support@digitalmanager.com
- 💬 **Developer Chat**: Available in developer portal
- 📞 **Phone**: +1-800-API-HELP
- 📖 **Developer Portal**: [developers.digitalmanager.com](https://developers.digitalmanager.com)

### Resources
- **API Explorer**: Interactive API testing
- **Postman Collection**: Pre-configured API requests
- **Code Examples**: Sample implementations
- **Changelog**: API version updates and changes

---

*For the latest API updates and detailed examples, visit our [Developer Portal](https://developers.digitalmanager.com)*
