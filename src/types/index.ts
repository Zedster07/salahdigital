export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  status: 'verified' | 'pending' | 'blocked' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: string;
  loginAttempts: number;
  lockedUntil?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
}

// Abonnés = Base de données clients uniquement
export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  wilaya?: string;
  facebook?: string;
  instagram?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Système de gestion de stock
export interface DigitalProduct {
  id: string;
  name: string;
  category: 'iptv' | 'digital-account' | 'digitali';
  durationType: '1month' | '3months' | '6months' | '12months' | 'custom';
  description?: string;
  currentStock: number;
  minStockAlert: number;
  averagePurchasePrice: number;
  suggestedSellPrice: number;
  platformId?: string; // Reference to platform
  platformBuyingPrice: number; // Cost from platform
  profitMargin: number; // Profit margin percentage
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Note: StockPurchase interface removed as part of platform migration
// The system now uses platform-based credit management instead

export interface PaymentHistoryEntry {
  id: string;
  amount: number;
  date: string;
  method: string;
  notes?: string;
}

export interface StockSale {
  id: string;
  productId: string;
  productName: string;
  subscriberId?: string;
  customerName?: string;
  customerPhone?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleDate: string;
  paymentMethod: 'cash' | 'transfer' | 'baridimob' | 'other';
  paymentStatus: 'paid' | 'pending' | 'partial';
  paidAmount?: number;
  remainingAmount?: number;
  profit: number;
  platformId?: string; // Reference to platform
  platformBuyingPrice: number; // Cost from platform at time of sale
  paymentType: 'one-time' | 'recurring'; // Payment type
  subscriptionDuration?: number; // Duration in months for recurring payments
  subscriptionStartDate?: string; // Start date for subscriptions
  subscriptionEndDate?: string; // End date for subscriptions
  notes?: string;
  paymentHistory?: PaymentHistoryEntry[];
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'purchase' | 'sale' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reference: string;
  date: string;
  notes?: string;
}

export type Language = 'fr' | 'ar';

export interface AppSettings {
  language: Language;
  currency: string;
  notifications: boolean;
  autoBackup: boolean;
  
  // Paramètres de tarification
  defaultProfitMargin: number;
  exchangeRates: {
    EUR_DZD: number;
    USD_DZD: number;
  };
  categoryPricing: {
    iptv: number;
    'digital-account': number;
    digitali: number;
  };
  
  // Paramètres des produits
  productCategories: string[];
  productStatuses: string[];
  
  // Notifications et alertes
  lowStockNotifications: boolean;
  expirationNotifications: boolean;
  emailNotifications: boolean;
  
  // Paramètres financiers
  paymentMethods: string[];
  transactionFees: {
    baridimob: number;
    transfer: number;
    other: number;
  };
  
  // Personnalisation
  theme: 'light' | 'dark';
  companyName: string;
  companyLogo?: string;
  welcomeMessage: string;
  customColors?: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // Sauvegarde et export
  autoExportEnabled: boolean;
  exportFormat: 'csv' | 'excel' | 'pdf';
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  
  // Sécurité
  maxLoginAttempts: number;
  lockoutDuration: number; // en minutes
  emailVerificationExpiry: number; // en heures
  requireEmailVerification: boolean;
  twoFactorRequired: boolean;
}

export interface UserManagement {
  users: User[];
  currentUser: User;
  permissions: {
    canAddUsers: boolean;
    canDeleteUsers: boolean;
    canModifySettings: boolean;
    canViewReports: boolean;
  };
  securitySettings: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    emailVerificationRequired: boolean;
    twoFactorRequired: boolean;
  };
}

export interface EmailVerificationRequest {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  verified: boolean;
}

export interface SecurityLog {
  id: string;
  userId?: string;
  action: 'login_success' | 'login_failed' | 'account_locked' | 'email_verified' | 'password_changed' | 'account_created';
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  details?: string;
}

// Platform Management - New entities for supplier platform management
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