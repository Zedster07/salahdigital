# 🏗️ Platform Entity Documentation

## Overview

The Platform entity represents supplier platforms in the digital subscription management system. This entity is central to the new credit-based business model, replacing the traditional inventory approach with platform credit management.

## Database Schema

### Platforms Table

```sql
CREATE TABLE platforms (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(255),
  credit_balance DECIMAL(10,2) DEFAULT 0 CHECK (credit_balance >= 0),
  low_balance_threshold DECIMAL(10,2) DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Platform Credit Movements Table

```sql
CREATE TABLE platform_credit_movements (
  id VARCHAR(255) PRIMARY KEY,
  platform_id VARCHAR(255) NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('credit_added', 'credit_deducted', 'sale_deduction', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  previous_balance DECIMAL(10,2) NOT NULL,
  new_balance DECIMAL(10,2) NOT NULL,
  reference VARCHAR(255),
  description TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Field Descriptions

### Platforms Table Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | VARCHAR(255) | Yes | Unique identifier for the platform |
| `name` | VARCHAR(255) | Yes | Platform name (must be unique) |
| `description` | TEXT | No | Optional description of the platform |
| `contact_name` | VARCHAR(255) | No | Primary contact person name |
| `contact_email` | VARCHAR(255) | No | Contact email address |
| `contact_phone` | VARCHAR(255) | No | Contact phone number |
| `credit_balance` | DECIMAL(10,2) | No | Current credit balance (≥ 0) |
| `low_balance_threshold` | DECIMAL(10,2) | No | Alert threshold for low balance |
| `is_active` | BOOLEAN | No | Whether platform is active |
| `metadata` | JSONB | No | Extensible JSON field for additional data |
| `created_at` | TIMESTAMP | No | Record creation timestamp |
| `updated_at` | TIMESTAMP | No | Last update timestamp |

### Platform Credit Movements Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | VARCHAR(255) | Yes | Unique identifier for the movement |
| `platform_id` | VARCHAR(255) | Yes | Reference to platforms table |
| `type` | VARCHAR(50) | Yes | Movement type (see types below) |
| `amount` | DECIMAL(10,2) | Yes | Movement amount (> 0) |
| `previous_balance` | DECIMAL(10,2) | Yes | Balance before movement |
| `new_balance` | DECIMAL(10,2) | Yes | Balance after movement |
| `reference` | VARCHAR(255) | No | Reference ID (sale ID, etc.) |
| `description` | TEXT | No | Human-readable description |
| `created_by` | VARCHAR(255) | No | User who performed the operation |
| `created_at` | TIMESTAMP | No | Movement timestamp |

## Movement Types

| Type | Description | Use Case |
|------|-------------|----------|
| `credit_added` | Credits added to platform | Manual credit top-up |
| `credit_deducted` | Credits manually deducted | Manual adjustments |
| `sale_deduction` | Credits deducted for sale | Automatic sale processing |
| `adjustment` | Balance adjustment | Corrections or reconciliation |

## TypeScript Interfaces

### Platform Interface

```typescript
export interface Platform {
  id: string;
  name: string;
  description?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  creditBalance: number;
  lowBalanceThreshold: number;
  isActive: boolean;
  metadata?: Record<string, any>; // JSON field for extensibility
  createdAt: string;
  updatedAt: string;
}
```

### Platform Credit Movement Interface

```typescript
export interface PlatformCreditMovement {
  id: string;
  platformId: string;
  type: 'credit_added' | 'credit_deducted' | 'sale_deduction' | 'adjustment';
  amount: number;
  previousBalance: number;
  newBalance: number;
  reference?: string; // Reference to sale ID or manual operation
  description?: string;
  createdBy?: string; // User who performed the operation
  createdAt: string;
}
```

## Database Indexes

### Performance Optimization

```sql
-- Platforms table indexes
CREATE INDEX idx_platforms_name ON platforms(name);
CREATE INDEX idx_platforms_active ON platforms(is_active);
CREATE INDEX idx_platforms_credit_balance ON platforms(credit_balance);

-- Credit movements table indexes
CREATE INDEX idx_credit_movements_platform ON platform_credit_movements(platform_id);
CREATE INDEX idx_credit_movements_type ON platform_credit_movements(type);
CREATE INDEX idx_credit_movements_date ON platform_credit_movements(created_at);
CREATE INDEX idx_credit_movements_reference ON platform_credit_movements(reference);
```

## Business Rules

### Credit Balance Management

1. **Non-negative Balance**: Credit balance cannot go below zero
2. **Low Balance Alerts**: System alerts when balance falls below threshold
3. **Automatic Deduction**: Credits automatically deducted on successful sales
4. **Audit Trail**: All credit movements are logged with full audit information

### Platform Management

1. **Unique Names**: Platform names must be unique across the system
2. **Active Status**: Only active platforms can be used for new sales
3. **Contact Information**: Optional but recommended for platform management
4. **Metadata Extensibility**: JSON field allows for future feature additions

## Usage Examples

### Creating a Platform

```typescript
const newPlatform: Platform = {
  id: 'netflix-supplier-001',
  name: 'Netflix Supplier Premium',
  description: 'Premium Netflix account supplier',
  contactName: 'John Doe',
  contactEmail: 'john@netflixsupplier.com',
  contactPhone: '+1234567890',
  creditBalance: 1000.00,
  lowBalanceThreshold: 100.00,
  isActive: true,
  metadata: {
    apiUrl: 'https://api.netflixsupplier.com',
    supportedRegions: ['US', 'EU', 'ASIA'],
    accountTypes: ['premium', 'standard']
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
```

### Recording Credit Movement

```typescript
const creditMovement: PlatformCreditMovement = {
  id: 'mov-' + Date.now(),
  platformId: 'netflix-supplier-001',
  type: 'sale_deduction',
  amount: 15.99,
  previousBalance: 1000.00,
  newBalance: 984.01,
  reference: 'sale-12345',
  description: 'Netflix Premium account sale to customer',
  createdBy: 'user-admin',
  createdAt: new Date().toISOString()
};
```

## Migration Information

### Default Platform

A default platform (`default-platform`) is automatically created during migration to handle existing products that don't have platform associations.

### Data Migration Strategy

1. All existing products are associated with the default platform
2. Historical sales data is updated with platform references
3. Credit balances start at zero and must be manually configured
4. Existing purchase data is preserved but marked as legacy

## Security Considerations

### Data Protection

- Contact information should be encrypted in production
- Credit movements provide complete audit trail
- Access to platform management should be role-restricted
- All operations should be logged for security auditing

### Validation Rules

- Credit balance must be non-negative
- Movement amounts must be positive
- Platform names must be unique and non-empty
- Movement types must be from allowed enum values

---

**Note**: This documentation covers the Platform entity implementation as part of the digital subscription management system refactoring. For API endpoints and frontend components, see the respective documentation files.
