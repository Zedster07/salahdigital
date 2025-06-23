// Validation utilities for API endpoints
const Joi = require('joi');

// Platform validation schemas
const platformSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required()
      .messages({
        'string.empty': 'Platform name is required',
        'string.max': 'Platform name must be less than 255 characters'
      }),
    description: Joi.string().max(1000).allow('', null)
      .messages({
        'string.max': 'Description must be less than 1000 characters'
      }),
    contactName: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Contact name must be less than 255 characters'
      }),
    contactEmail: Joi.string().email().max(255).allow('', null)
      .messages({
        'string.email': 'Contact email must be a valid email address',
        'string.max': 'Contact email must be less than 255 characters'
      }),
    contactPhone: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Contact phone must be less than 255 characters'
      }),
    creditBalance: Joi.number().min(0).default(0)
      .messages({
        'number.min': 'Credit balance cannot be negative'
      }),
    lowBalanceThreshold: Joi.number().min(0).default(100)
      .messages({
        'number.min': 'Low balance threshold cannot be negative'
      }),
    isActive: Joi.boolean().default(true),
    metadata: Joi.object().default({})
  }),

  update: Joi.object({
    id: Joi.string().required()
      .messages({
        'string.empty': 'Platform ID is required'
      }),
    name: Joi.string().min(1).max(255)
      .messages({
        'string.empty': 'Platform name cannot be empty',
        'string.max': 'Platform name must be less than 255 characters'
      }),
    description: Joi.string().max(1000).allow('', null)
      .messages({
        'string.max': 'Description must be less than 1000 characters'
      }),
    contactName: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Contact name must be less than 255 characters'
      }),
    contactEmail: Joi.string().email().max(255).allow('', null)
      .messages({
        'string.email': 'Contact email must be a valid email address',
        'string.max': 'Contact email must be less than 255 characters'
      }),
    contactPhone: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Contact phone must be less than 255 characters'
      }),
    creditBalance: Joi.number().min(0)
      .messages({
        'number.min': 'Credit balance cannot be negative'
      }),
    lowBalanceThreshold: Joi.number().min(0)
      .messages({
        'number.min': 'Low balance threshold cannot be negative'
      }),
    isActive: Joi.boolean(),
    metadata: Joi.object()
  }),

  creditAdd: Joi.object({
    platformId: Joi.string().required()
      .messages({
        'string.empty': 'Platform ID is required'
      }),
    amount: Joi.number().positive().required()
      .messages({
        'number.positive': 'Amount must be positive',
        'any.required': 'Amount is required'
      }),
    description: Joi.string().max(500).required()
      .messages({
        'string.empty': 'Description is required',
        'string.max': 'Description must be less than 500 characters'
      }),
    createdBy: Joi.string().max(255).required()
      .messages({
        'string.empty': 'Created by is required',
        'string.max': 'Created by must be less than 255 characters'
      })
  }),

  creditDeduct: Joi.object({
    platformId: Joi.string().required()
      .messages({
        'string.empty': 'Platform ID is required'
      }),
    amount: Joi.number().positive().required()
      .messages({
        'number.positive': 'Amount must be positive',
        'any.required': 'Amount is required'
      }),
    description: Joi.string().max(500).required()
      .messages({
        'string.empty': 'Description is required',
        'string.max': 'Description must be less than 500 characters'
      }),
    createdBy: Joi.string().max(255).required()
      .messages({
        'string.empty': 'Created by is required',
        'string.max': 'Created by must be less than 255 characters'
      }),
    reference: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Reference must be less than 255 characters'
      })
  }),

  balanceAdjust: Joi.object({
    platformId: Joi.string().required()
      .messages({
        'string.empty': 'Platform ID is required'
      }),
    adjustmentAmount: Joi.number().not(0).required()
      .messages({
        'number.base': 'Adjustment amount must be a number',
        'any.invalid': 'Adjustment amount cannot be zero',
        'any.required': 'Adjustment amount is required'
      }),
    reason: Joi.string().max(500).required()
      .messages({
        'string.empty': 'Reason is required',
        'string.max': 'Reason must be less than 500 characters'
      }),
    createdBy: Joi.string().max(255).required()
      .messages({
        'string.empty': 'Created by is required',
        'string.max': 'Created by must be less than 255 characters'
      })
  })
};

// Sales validation schemas (Task 12)
const salesSchemas = {
  create: Joi.object({
    id: Joi.string().max(255).allow('', null),
    productId: Joi.string().required()
      .messages({
        'string.empty': 'Product ID is required'
      }),
    productName: Joi.string().max(255).required()
      .messages({
        'string.empty': 'Product name is required',
        'string.max': 'Product name must be less than 255 characters'
      }),
    subscriberId: Joi.string().max(255).allow('', null),
    customerName: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Customer name must be less than 255 characters'
      }),
    customerPhone: Joi.string().max(50).allow('', null)
      .messages({
        'string.max': 'Customer phone must be less than 50 characters'
      }),
    quantity: Joi.number().integer().min(1).required()
      .messages({
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity is required'
      }),
    unitPrice: Joi.number().min(0).required()
      .messages({
        'number.min': 'Unit price cannot be negative',
        'any.required': 'Unit price is required'
      }),
    totalPrice: Joi.number().min(0).required()
      .messages({
        'number.min': 'Total price cannot be negative',
        'any.required': 'Total price is required'
      }),
    saleDate: Joi.date().iso().required()
      .messages({
        'date.format': 'Sale date must be in ISO format',
        'any.required': 'Sale date is required'
      }),
    paymentMethod: Joi.string().valid('cash', 'transfer', 'baridimob', 'other').required()
      .messages({
        'any.only': 'Payment method must be one of: cash, transfer, baridimob, other',
        'any.required': 'Payment method is required'
      }),
    paymentStatus: Joi.string().valid('paid', 'pending', 'partial').default('pending')
      .messages({
        'any.only': 'Payment status must be one of: paid, pending, partial'
      }),
    paidAmount: Joi.number().min(0).default(0)
      .messages({
        'number.min': 'Paid amount cannot be negative'
      }),
    remainingAmount: Joi.number().min(0).default(0)
      .messages({
        'number.min': 'Remaining amount cannot be negative'
      }),
    profit: Joi.number().required()
      .messages({
        'any.required': 'Profit is required'
      }),
    // Platform-related fields (Task 12)
    platformId: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Platform ID must be less than 255 characters'
      }),
    platformBuyingPrice: Joi.number().min(0).default(0)
      .messages({
        'number.min': 'Platform buying price cannot be negative'
      }),
    paymentType: Joi.string().valid('one-time', 'recurring').default('one-time')
      .messages({
        'any.only': 'Payment type must be one of: one-time, recurring'
      }),
    subscriptionDuration: Joi.number().integer().min(1).allow(null)
      .messages({
        'number.min': 'Subscription duration must be at least 1 month'
      }),
    subscriptionStartDate: Joi.date().iso().allow('', null)
      .messages({
        'date.format': 'Subscription start date must be in ISO format'
      }),
    subscriptionEndDate: Joi.date().iso().allow('', null)
      .messages({
        'date.format': 'Subscription end date must be in ISO format'
      }),
    notes: Joi.string().max(1000).allow('', null)
      .messages({
        'string.max': 'Notes must be less than 1000 characters'
      })
  }).custom((value, helpers) => {
    // Custom validation: if platformId is provided, platformBuyingPrice should be > 0
    if (value.platformId && value.platformBuyingPrice <= 0) {
      return helpers.error('custom.platformBuyingPriceRequired');
    }

    // Custom validation: if paymentType is recurring, subscriptionDuration is required
    if (value.paymentType === 'recurring' && !value.subscriptionDuration) {
      return helpers.error('custom.subscriptionDurationRequired');
    }

    return value;
  }).messages({
    'custom.platformBuyingPriceRequired': 'Platform buying price must be greater than 0 when platform is specified',
    'custom.subscriptionDurationRequired': 'Subscription duration is required for recurring payments'
  }),

  update: Joi.object({
    id: Joi.string().required()
      .messages({
        'string.empty': 'Sale ID is required'
      }),
    productId: Joi.string()
      .messages({
        'string.empty': 'Product ID cannot be empty'
      }),
    productName: Joi.string().max(255)
      .messages({
        'string.max': 'Product name must be less than 255 characters'
      }),
    subscriberId: Joi.string().max(255).allow('', null),
    customerName: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Customer name must be less than 255 characters'
      }),
    customerPhone: Joi.string().max(50).allow('', null)
      .messages({
        'string.max': 'Customer phone must be less than 50 characters'
      }),
    quantity: Joi.number().integer().min(1)
      .messages({
        'number.min': 'Quantity must be at least 1'
      }),
    unitPrice: Joi.number().min(0)
      .messages({
        'number.min': 'Unit price cannot be negative'
      }),
    totalPrice: Joi.number().min(0)
      .messages({
        'number.min': 'Total price cannot be negative'
      }),
    saleDate: Joi.date().iso()
      .messages({
        'date.format': 'Sale date must be in ISO format'
      }),
    paymentMethod: Joi.string().valid('cash', 'transfer', 'baridimob', 'other')
      .messages({
        'any.only': 'Payment method must be one of: cash, transfer, baridimob, other'
      }),
    paymentStatus: Joi.string().valid('paid', 'pending', 'partial')
      .messages({
        'any.only': 'Payment status must be one of: paid, pending, partial'
      }),
    paidAmount: Joi.number().min(0)
      .messages({
        'number.min': 'Paid amount cannot be negative'
      }),
    remainingAmount: Joi.number().min(0)
      .messages({
        'number.min': 'Remaining amount cannot be negative'
      }),
    profit: Joi.number(),
    // Platform-related fields (Task 12)
    platformId: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Platform ID must be less than 255 characters'
      }),
    platformBuyingPrice: Joi.number().min(0)
      .messages({
        'number.min': 'Platform buying price cannot be negative'
      }),
    paymentType: Joi.string().valid('one-time', 'recurring')
      .messages({
        'any.only': 'Payment type must be one of: one-time, recurring'
      }),
    subscriptionDuration: Joi.number().integer().min(1).allow(null)
      .messages({
        'number.min': 'Subscription duration must be at least 1 month'
      }),
    subscriptionStartDate: Joi.date().iso().allow('', null)
      .messages({
        'date.format': 'Subscription start date must be in ISO format'
      }),
    subscriptionEndDate: Joi.date().iso().allow('', null)
      .messages({
        'date.format': 'Subscription end date must be in ISO format'
      }),
    notes: Joi.string().max(1000).allow('', null)
      .messages({
        'string.max': 'Notes must be less than 1000 characters'
      })
  }).custom((value, helpers) => {
    // Custom validation: if platformId is provided, platformBuyingPrice should be > 0
    if (value.platformId && value.platformBuyingPrice !== undefined && value.platformBuyingPrice <= 0) {
      return helpers.error('custom.platformBuyingPriceRequired');
    }

    // Custom validation: if paymentType is recurring, subscriptionDuration is required
    if (value.paymentType === 'recurring' && !value.subscriptionDuration) {
      return helpers.error('custom.subscriptionDurationRequired');
    }

    return value;
  }).messages({
    'custom.platformBuyingPriceRequired': 'Platform buying price must be greater than 0 when platform is specified',
    'custom.subscriptionDurationRequired': 'Subscription duration is required for recurring payments'
  })
};

// Product validation schemas (Task 10)
const productSchemas = {
  create: Joi.object({
    id: Joi.string().max(255).allow('', null),
    name: Joi.string().max(255).required()
      .messages({
        'string.empty': 'Product name is required',
        'string.max': 'Product name must be less than 255 characters'
      }),
    category: Joi.string().valid('iptv', 'digital-account', 'digitali').required()
      .messages({
        'any.only': 'Category must be one of: iptv, digital-account, digitali',
        'any.required': 'Category is required'
      }),
    durationType: Joi.string().valid('1month', '3months', '6months', '12months', 'custom').required()
      .messages({
        'any.only': 'Duration type must be one of: 1month, 3months, 6months, 12months, custom',
        'any.required': 'Duration type is required'
      }),
    description: Joi.string().max(1000).allow('', null)
      .messages({
        'string.max': 'Description must be less than 1000 characters'
      }),
    currentStock: Joi.number().integer().min(0).default(0)
      .messages({
        'number.min': 'Current stock cannot be negative'
      }),
    minStockAlert: Joi.number().integer().min(0).default(5)
      .messages({
        'number.min': 'Minimum stock alert cannot be negative'
      }),
    averagePurchasePrice: Joi.number().min(0).default(0)
      .messages({
        'number.min': 'Average purchase price cannot be negative'
      }),
    suggestedSellPrice: Joi.number().min(0).default(0)
      .messages({
        'number.min': 'Suggested sell price cannot be negative'
      }),
    // Platform-related fields (Task 10)
    platformId: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Platform ID must be less than 255 characters'
      }),
    platformBuyingPrice: Joi.number().min(0).default(0)
      .messages({
        'number.min': 'Platform buying price cannot be negative'
      }),
    profitMargin: Joi.number().min(0).default(0)
      .messages({
        'number.min': 'Profit margin cannot be negative'
      }),
    isActive: Joi.boolean().default(true)
  }).custom((value, helpers) => {
    // Custom validation: if platformId is provided, platformBuyingPrice should be > 0
    if (value.platformId && value.platformBuyingPrice <= 0) {
      return helpers.error('custom.platformBuyingPriceRequired');
    }

    // Custom validation: if platformId is provided, profitMargin should be > 0
    if (value.platformId && value.profitMargin <= 0) {
      return helpers.error('custom.profitMarginRequired');
    }

    return value;
  }).messages({
    'custom.platformBuyingPriceRequired': 'Platform buying price must be greater than 0 when platform is specified',
    'custom.profitMarginRequired': 'Profit margin must be greater than 0 when platform is specified'
  }),

  update: Joi.object({
    id: Joi.string().required()
      .messages({
        'string.empty': 'Product ID is required'
      }),
    name: Joi.string().max(255)
      .messages({
        'string.max': 'Product name must be less than 255 characters'
      }),
    category: Joi.string().valid('iptv', 'digital-account', 'digitali')
      .messages({
        'any.only': 'Category must be one of: iptv, digital-account, digitali'
      }),
    durationType: Joi.string().valid('1month', '3months', '6months', '12months', 'custom')
      .messages({
        'any.only': 'Duration type must be one of: 1month, 3months, 6months, 12months, custom'
      }),
    description: Joi.string().max(1000).allow('', null)
      .messages({
        'string.max': 'Description must be less than 1000 characters'
      }),
    currentStock: Joi.number().integer().min(0)
      .messages({
        'number.min': 'Current stock cannot be negative'
      }),
    minStockAlert: Joi.number().integer().min(0)
      .messages({
        'number.min': 'Minimum stock alert cannot be negative'
      }),
    averagePurchasePrice: Joi.number().min(0)
      .messages({
        'number.min': 'Average purchase price cannot be negative'
      }),
    suggestedSellPrice: Joi.number().min(0)
      .messages({
        'number.min': 'Suggested sell price cannot be negative'
      }),
    // Platform-related fields (Task 10)
    platformId: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Platform ID must be less than 255 characters'
      }),
    platformBuyingPrice: Joi.number().min(0)
      .messages({
        'number.min': 'Platform buying price cannot be negative'
      }),
    profitMargin: Joi.number().min(0)
      .messages({
        'number.min': 'Profit margin cannot be negative'
      }),
    isActive: Joi.boolean()
  }).custom((value, helpers) => {
    // Custom validation: if platformId is provided, platformBuyingPrice should be > 0
    if (value.platformId && value.platformBuyingPrice !== undefined && value.platformBuyingPrice <= 0) {
      return helpers.error('custom.platformBuyingPriceRequired');
    }

    // Custom validation: if platformId is provided, profitMargin should be > 0
    if (value.platformId && value.profitMargin !== undefined && value.profitMargin <= 0) {
      return helpers.error('custom.profitMarginRequired');
    }

    return value;
  }).messages({
    'custom.platformBuyingPriceRequired': 'Platform buying price must be greater than 0 when platform is specified',
    'custom.profitMarginRequired': 'Profit margin must be greater than 0 when platform is specified'
  }),

  platformAssociation: Joi.object({
    productId: Joi.string().required()
      .messages({
        'string.empty': 'Product ID is required'
      }),
    platformId: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Platform ID must be less than 255 characters'
      })
  }),

  pricingCalculation: Joi.object({
    platformBuyingPrice: Joi.number().min(0).required()
      .messages({
        'number.min': 'Platform buying price cannot be negative',
        'any.required': 'Platform buying price is required'
      }),
    profitMargin: Joi.number().min(0).required()
      .messages({
        'number.min': 'Profit margin cannot be negative',
        'any.required': 'Profit margin is required'
      })
  })
};

// Financial Reporting validation schemas (Task 14)
const financialReportingSchemas = {
  reportQuery: Joi.object({
    // Common parameters
    type: Joi.string().valid(
      'platform-profitability',
      'credit-utilization',
      'sales-profit',
      'low-credit-platforms',
      'dashboard'
    ).required()
      .messages({
        'any.only': 'Report type must be one of: platform-profitability, credit-utilization, sales-profit, low-credit-platforms, dashboard',
        'any.required': 'Report type is required'
      }),
    format: Joi.string().valid('json', 'csv').default('json')
      .messages({
        'any.only': 'Format must be json or csv'
      }),

    // Filtering parameters
    platformId: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Platform ID must be less than 255 characters'
      }),
    productId: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Product ID must be less than 255 characters'
      }),
    category: Joi.string().valid('iptv', 'digital-account', 'digitali').allow('', null)
      .messages({
        'any.only': 'Category must be one of: iptv, digital-account, digitali'
      }),
    paymentType: Joi.string().valid('one-time', 'recurring').allow('', null)
      .messages({
        'any.only': 'Payment type must be one of: one-time, recurring'
      }),

    // Date range parameters
    startDate: Joi.date().iso().allow('', null)
      .messages({
        'date.format': 'Start date must be in ISO format (YYYY-MM-DD)'
      }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow('', null)
      .messages({
        'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
        'date.min': 'End date must be after start date'
      }),

    // Grouping and sorting parameters
    groupBy: Joi.string().valid('platform', 'product', 'category', 'month', 'total').default('total')
      .messages({
        'any.only': 'Group by must be one of: platform, product, category, month, total'
      }),
    sortBy: Joi.string().allow('', null)
      .messages({
        'string.base': 'Sort by must be a string'
      }),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
      .messages({
        'any.only': 'Sort order must be asc or desc'
      }),

    // Pagination parameters
    page: Joi.number().integer().min(1).default(1)
      .messages({
        'number.min': 'Page must be at least 1',
        'number.integer': 'Page must be an integer'
      }),
    limit: Joi.number().integer().min(1).max(1000).default(50)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 1000',
        'number.integer': 'Limit must be an integer'
      }),

    // Threshold for low credit platforms
    threshold: Joi.number().min(0).default(100)
      .messages({
        'number.min': 'Threshold must be non-negative'
      }),

    // Cache control
    noCache: Joi.boolean().default(false)
      .messages({
        'boolean.base': 'No cache must be a boolean'
      })
  }).custom((value, helpers) => {
    // Custom validation: if startDate is provided, endDate should also be provided
    if (value.startDate && !value.endDate) {
      return helpers.error('custom.endDateRequired');
    }

    // Custom validation: date range should not exceed 1 year
    if (value.startDate && value.endDate) {
      const startDate = new Date(value.startDate);
      const endDate = new Date(value.endDate);
      const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);

      if (daysDiff > 365) {
        return helpers.error('custom.dateRangeTooLarge');
      }
    }

    return value;
  }).messages({
    'custom.endDateRequired': 'End date is required when start date is provided',
    'custom.dateRangeTooLarge': 'Date range cannot exceed 365 days'
  }),

  platformProfitabilityQuery: Joi.object({
    platformId: Joi.string().max(255).allow('', null),
    startDate: Joi.date().iso().allow('', null),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow('', null),
    format: Joi.string().valid('json', 'csv').default('json'),
    sortBy: Joi.string().valid(
      'totalRevenue', 'totalProfit', 'profitMarginPercentage', 'totalSales',
      'platformName', 'currentBalance', 'roi'
    ).default('totalRevenue'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(50),
    noCache: Joi.boolean().default(false)
  }),

  creditUtilizationQuery: Joi.object({
    platformId: Joi.string().max(255).allow('', null),
    startDate: Joi.date().iso().allow('', null),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow('', null),
    format: Joi.string().valid('json', 'csv').default('json'),
    sortBy: Joi.string().valid(
      'totalCreditsUsed', 'utilizationRate', 'totalCreditsAdded',
      'platformName', 'currentBalance', 'netCreditFlow'
    ).default('totalCreditsUsed'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(50),
    noCache: Joi.boolean().default(false)
  }),

  salesProfitQuery: Joi.object({
    platformId: Joi.string().max(255).allow('', null),
    productId: Joi.string().max(255).allow('', null),
    category: Joi.string().valid('iptv', 'digital-account', 'digitali').allow('', null),
    paymentType: Joi.string().valid('one-time', 'recurring').allow('', null),
    startDate: Joi.date().iso().allow('', null),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow('', null),
    groupBy: Joi.string().valid('platform', 'product', 'category', 'month', 'total').default('total'),
    format: Joi.string().valid('json', 'csv').default('json'),
    sortBy: Joi.string().valid(
      'totalRevenue', 'totalProfit', 'profitMarginPercentage', 'totalSales',
      'groupName', 'totalCost', 'roi'
    ).default('totalRevenue'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(50),
    noCache: Joi.boolean().default(false)
  }),

  lowCreditPlatformsQuery: Joi.object({
    threshold: Joi.number().min(0).default(100),
    format: Joi.string().valid('json', 'csv').default('json'),
    sortBy: Joi.string().valid(
      'creditBalance', 'urgencyLevel', 'recentCreditUsage',
      'platformName', 'estimatedDaysUntilDepletion', 'recommendedTopUp'
    ).default('creditBalance'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(50),
    noCache: Joi.boolean().default(false)
  })
};

// Query parameter validation schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1)
      .messages({
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number().integer().min(1).max(100).default(20)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    search: Joi.string().max(255).allow('', null)
      .messages({
        'string.max': 'Search term must be less than 255 characters'
      }),
    sortBy: Joi.string().valid('name', 'created_at', 'credit_balance', 'updated_at').default('created_at')
      .messages({
        'any.only': 'Sort by must be one of: name, created_at, credit_balance, updated_at'
      }),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      }),
    isActive: Joi.boolean()
  }),

  creditMovements: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string().valid('credit_added', 'credit_deducted', 'sale_deduction', 'adjustment').allow('', null),
    startDate: Joi.date().iso().allow('', null),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow('', null)
      .messages({
        'date.min': 'End date must be after start date'
      })
  })
};

// Validation helper functions
function validateData(schema, data) {
  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    
    return {
      isValid: false,
      errors: validationErrors,
      data: null
    };
  }
  
  return {
    isValid: true,
    errors: null,
    data: value
  };
}

function validateQueryParams(schema, queryParams) {
  // Convert query string parameters to appropriate types
  const processedParams = {};
  
  for (const [key, value] of Object.entries(queryParams || {})) {
    if (value === '' || value === 'undefined' || value === 'null') {
      processedParams[key] = null;
    } else if (key === 'page' || key === 'limit') {
      processedParams[key] = parseInt(value, 10);
    } else if (key === 'isActive') {
      processedParams[key] = value === 'true';
    } else {
      processedParams[key] = value;
    }
  }
  
  return validateData(schema, processedParams);
}

// Platform ID validation
function validatePlatformId(platformId) {
  const schema = Joi.string().required().messages({
    'string.empty': 'Platform ID is required',
    'any.required': 'Platform ID is required'
  });
  
  return validateData(schema, platformId);
}

// Response formatting helpers
function formatValidationError(validationResult) {
  return {
    error: 'Validation failed',
    details: validationResult.errors,
    statusCode: 400
  };
}

function formatSuccessResponse(data, meta = null) {
  const response = { data };
  if (meta) {
    response.meta = meta;
  }
  return response;
}

function formatErrorResponse(message, statusCode = 500, details = null) {
  const response = { error: message };
  if (details) {
    response.details = details;
  }
  return { ...response, statusCode };
}

module.exports = {
  platformSchemas,
  salesSchemas,
  productSchemas,
  financialReportingSchemas,
  querySchemas,
  validateData,
  validateQueryParams,
  validatePlatformId,
  formatValidationError,
  formatSuccessResponse,
  formatErrorResponse
};
