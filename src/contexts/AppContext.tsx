import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, Subscriber, DigitalProduct, StockSale, StockMovement, Language, AppSettings, UserManagement, Platform, PlatformCreditMovement } from '../types';
import { apiClient } from '../utils/api';

interface AppState {
  user: User | null;
  subscribers: Subscriber[];
  digitalProducts: DigitalProduct[];
  // Note: stockPurchases removed as part of platform migration
  stockSales: StockSale[];
  stockMovements: StockMovement[];
  platforms: Platform[];
  platformCreditMovements: PlatformCreditMovement[];
  settings: AppSettings;
  userManagement: UserManagement;
  isLoading: boolean;
  isInitialized: boolean;
  initializationError: string | null;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_INITIALIZATION_ERROR'; payload: string | null }
  | { type: 'ADD_SUBSCRIBER'; payload: Subscriber }
  | { type: 'UPDATE_SUBSCRIBER'; payload: Subscriber }
  | { type: 'DELETE_SUBSCRIBER'; payload: string }
  | { type: 'SET_SUBSCRIBERS'; payload: Subscriber[] }
  | { type: 'ADD_DIGITAL_PRODUCT'; payload: DigitalProduct }
  | { type: 'UPDATE_DIGITAL_PRODUCT'; payload: DigitalProduct }
  | { type: 'DELETE_DIGITAL_PRODUCT'; payload: string }
  | { type: 'SET_DIGITAL_PRODUCTS'; payload: DigitalProduct[] }
  // Note: Stock purchase actions removed as part of platform migration
  | { type: 'ADD_STOCK_SALE'; payload: StockSale }
  | { type: 'UPDATE_STOCK_SALE'; payload: StockSale }
  | { type: 'DELETE_STOCK_SALE'; payload: string }
  | { type: 'SET_STOCK_SALES'; payload: StockSale[] }
  | { type: 'ADD_STOCK_MOVEMENT'; payload: StockMovement }
  | { type: 'SET_STOCK_MOVEMENTS'; payload: StockMovement[] }
  | { type: 'ADD_PLATFORM'; payload: Platform }
  | { type: 'UPDATE_PLATFORM'; payload: Platform }
  | { type: 'DELETE_PLATFORM'; payload: string }
  | { type: 'SET_PLATFORMS'; payload: Platform[] }
  | { type: 'ADD_PLATFORM_CREDIT_MOVEMENT'; payload: PlatformCreditMovement }
  | { type: 'SET_PLATFORM_CREDIT_MOVEMENTS'; payload: PlatformCreditMovement[] }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'UPDATE_USER_MANAGEMENT'; payload: Partial<UserManagement> };

const initialState: AppState = {
  user: null,
  subscribers: [],
  digitalProducts: [],
  // Note: stockPurchases removed as part of platform migration
  stockSales: [],
  stockMovements: [],
  platforms: [],
  platformCreditMovements: [],
  settings: {
    language: 'fr',
    currency: 'DZD',
    notifications: true,
    autoBackup: false,
    
    // Paramètres de tarification
    defaultProfitMargin: 30,
    exchangeRates: {
      EUR_DZD: 145,
      USD_DZD: 135,
    },
    categoryPricing: {
      iptv: 1500,
      'digital-account': 800,
      digitali: 2000,
    },
    
    // Paramètres des produits
    productCategories: ['iptv', 'digital-account', 'digitali', 'netflix', 'spotify', 'adobe'],
    productStatuses: ['actif', 'en rupture', 'expiré', 'archivé'],
    
    // Notifications et alertes
    lowStockNotifications: true,
    expirationNotifications: true,
    emailNotifications: false,
    
    // Paramètres financiers
    paymentMethods: ['cash', 'transfer', 'baridimob', 'ccp', 'paypal'],
    transactionFees: {
      baridimob: 2.5,
      transfer: 1.0,
      other: 0,
    },
    
    // Personnalisation
    theme: 'light',
    companyName: 'Digital Manager',
    welcomeMessage: 'Bienvenue dans votre gestionnaire d\'abonnements digitaux',
    
    // Sauvegarde et export
    autoExportEnabled: false,
    exportFormat: 'csv',
    backupFrequency: 'weekly',
    
    // Sécurité
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    emailVerificationExpiry: 24,
    requireEmailVerification: true,
    twoFactorRequired: false,
  },
  userManagement: {
    users: [],
    currentUser: {
      id: 'admin',
      username: 'admin',
      email: 'admin@digitalmanager.com',
      role: 'admin',
      status: 'verified',
      emailVerified: true,
      loginAttempts: 0,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
    },
    permissions: {
      canAddUsers: true,
      canDeleteUsers: true,
      canModifySettings: true,
      canViewReports: true,
    },
    securitySettings: {
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      emailVerificationRequired: true,
      twoFactorRequired: false,
    },
  },
  isLoading: false,
  isInitialized: false,
  initializationError: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_INITIALIZATION_ERROR':
      return { ...state, initializationError: action.payload };
    case 'ADD_SUBSCRIBER':
      return { ...state, subscribers: [...state.subscribers, action.payload] };
    case 'UPDATE_SUBSCRIBER':
      return {
        ...state,
        subscribers: state.subscribers.map(sub =>
          sub.id === action.payload.id ? action.payload : sub
        ),
      };
    case 'DELETE_SUBSCRIBER':
      return {
        ...state,
        subscribers: state.subscribers.filter(sub => sub.id !== action.payload),
      };
    case 'SET_SUBSCRIBERS':
      return { ...state, subscribers: action.payload };
    case 'ADD_DIGITAL_PRODUCT':
      return { ...state, digitalProducts: [...state.digitalProducts, action.payload] };
    case 'UPDATE_DIGITAL_PRODUCT':
      return {
        ...state,
        digitalProducts: state.digitalProducts.map(product =>
          product.id === action.payload.id ? action.payload : product
        ),
      };
    case 'DELETE_DIGITAL_PRODUCT':
      return {
        ...state,
        digitalProducts: state.digitalProducts.filter(product => product.id !== action.payload),
      };
    case 'SET_DIGITAL_PRODUCTS':
      return { ...state, digitalProducts: action.payload };
    // Note: Stock purchase reducer cases removed as part of platform migration
    case 'ADD_STOCK_SALE':
      return { ...state, stockSales: [...state.stockSales, action.payload] };
    case 'UPDATE_STOCK_SALE':
      return {
        ...state,
        stockSales: state.stockSales.map(sale =>
          sale.id === action.payload.id ? action.payload : sale
        ),
      };
    case 'DELETE_STOCK_SALE':
      return {
        ...state,
        stockSales: state.stockSales.filter(sale => sale.id !== action.payload),
      };
    case 'SET_STOCK_SALES':
      return { ...state, stockSales: action.payload };
    case 'ADD_STOCK_MOVEMENT':
      return { ...state, stockMovements: [...state.stockMovements, action.payload] };
    case 'SET_STOCK_MOVEMENTS':
      return { ...state, stockMovements: action.payload };
    case 'ADD_PLATFORM':
      return { ...state, platforms: [...state.platforms, action.payload] };
    case 'UPDATE_PLATFORM':
      return {
        ...state,
        platforms: state.platforms.map(platform =>
          platform.id === action.payload.id ? action.payload : platform
        ),
      };
    case 'DELETE_PLATFORM':
      return {
        ...state,
        platforms: state.platforms.filter(platform => platform.id !== action.payload),
      };
    case 'SET_PLATFORMS':
      return { ...state, platforms: action.payload };
    case 'ADD_PLATFORM_CREDIT_MOVEMENT':
      return { ...state, platformCreditMovements: [...state.platformCreditMovements, action.payload] };
    case 'SET_PLATFORM_CREDIT_MOVEMENTS':
      return { ...state, platformCreditMovements: action.payload };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'ADD_USER':
      return {
        ...state,
        userManagement: {
          ...state.userManagement,
          users: [...state.userManagement.users, action.payload],
        },
      };
    case 'UPDATE_USER':
      return {
        ...state,
        userManagement: {
          ...state.userManagement,
          users: state.userManagement.users.map(user =>
            user.id === action.payload.id ? action.payload : user
          ),
        },
      };
    case 'DELETE_USER':
      return {
        ...state,
        userManagement: {
          ...state.userManagement,
          users: state.userManagement.users.filter(user => user.id !== action.payload),
        },
      };
    case 'SET_USERS':
      return {
        ...state,
        userManagement: {
          ...state.userManagement,
          users: action.payload,
        },
      };
    case 'UPDATE_USER_MANAGEMENT':
      return {
        ...state,
        userManagement: { ...state.userManagement, ...action.payload },
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize database and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_INITIALIZATION_ERROR', payload: null });
        
        console.log('Starting app initialization...');
        
        // Try to initialize database schema
        const dbInitResult = await apiClient.initializeDatabase();
        console.log('Database initialization result:', dbInitResult);
        
        // Load all data from database (with fallbacks)
        console.log('Loading data from database...');
        const [
          settings,
          users,
          subscribers,
          digitalProducts,
          platforms,
          // Note: stockPurchases removed as part of platform migration
          stockSales,
          stockMovements
        ] = await Promise.all([
          apiClient.getSettings(),
          apiClient.getUsers(),
          apiClient.getSubscribers(),
          apiClient.getDigitalProducts(),
          apiClient.getPlatforms(),
          // Note: getStockPurchases() removed
          apiClient.getStockSales(),
          apiClient.getStockMovements()
        ]);

        console.log('Data loaded successfully:', {
          settings: Object.keys(settings).length,
          users: users.length,
          subscribers: subscribers.length,
          digitalProducts: digitalProducts.length,
          platforms: platforms?.data?.length || platforms?.length || 0,
          // Note: stockPurchases removed as part of platform migration
          stockSales: stockSales.length,
          stockMovements: stockMovements.length
        });

        // Update state with loaded data
        dispatch({ type: 'SET_SETTINGS', payload: { ...initialState.settings, ...settings } });
        dispatch({ type: 'SET_USERS', payload: users });
        dispatch({ type: 'SET_SUBSCRIBERS', payload: subscribers });
        dispatch({ type: 'SET_DIGITAL_PRODUCTS', payload: digitalProducts });
        dispatch({ type: 'SET_PLATFORMS', payload: platforms?.data || platforms || [] });
        // Note: SET_STOCK_PURCHASES dispatch removed
        dispatch({ type: 'SET_STOCK_SALES', payload: stockSales });
        dispatch({ type: 'SET_STOCK_MOVEMENTS', payload: stockMovements });
        
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        console.log('App initialization completed successfully');
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        dispatch({ type: 'SET_INITIALIZATION_ERROR', payload: error.message });
        
        // Fallback to localStorage if database fails
        console.log('Attempting to load from localStorage as fallback...');
        try {
          const savedData = localStorage.getItem('digitalManagerData');
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            console.log('Loading data from localStorage:', Object.keys(parsedData));
            
            dispatch({ type: 'SET_SUBSCRIBERS', payload: parsedData.subscribers || [] });
            dispatch({ type: 'SET_DIGITAL_PRODUCTS', payload: parsedData.digitalProducts || [] });
            dispatch({ type: 'SET_PLATFORMS', payload: parsedData.platforms || [] });
            // Note: SET_STOCK_PURCHASES dispatch removed as part of platform migration
            dispatch({ type: 'SET_STOCK_SALES', payload: parsedData.stockSales || [] });
            dispatch({ type: 'SET_STOCK_MOVEMENTS', payload: parsedData.stockMovements || [] });
            if (parsedData.settings) {
              dispatch({ type: 'SET_SETTINGS', payload: { ...initialState.settings, ...parsedData.settings } });
            }
            if (parsedData.userManagement) {
              dispatch({ type: 'SET_USERS', payload: parsedData.userManagement.users || [] });
            }
            console.log('Successfully loaded data from localStorage');
          } else {
            console.log('No localStorage data found, using default state');
          }
        } catch (parseError) {
          console.error('Error parsing localStorage data:', parseError);
        }
        
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeApp();
  }, []);

  // Sync changes to database
  useEffect(() => {
    if (!state.isInitialized) return;

    const syncToDatabase = async () => {
      try {
        // Always save to localStorage as backup
        const dataToSave = {
          subscribers: state.subscribers,
          digitalProducts: state.digitalProducts,
          platforms: state.platforms,
          // Note: stockPurchases removed as part of platform migration
          stockSales: state.stockSales,
          stockMovements: state.stockMovements,
          settings: state.settings,
          userManagement: state.userManagement,
        };
        
        localStorage.setItem('digitalManagerData', JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error syncing to localStorage:', error);
      }
    };

    const timeoutId = setTimeout(syncToDatabase, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    state.subscribers,
    state.digitalProducts,
    state.platforms,
    // Note: state.stockPurchases removed as part of platform migration
    state.stockSales,
    state.stockMovements,
    state.settings,
    state.userManagement,
    state.isInitialized
  ]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Database operation hooks
export const useDatabase = () => {
  const { dispatch } = useApp();

  return {
    // Subscribers
    async addSubscriber(subscriberData: Subscriber) {
      try {
        const result = await apiClient.createSubscriber(subscriberData);
        dispatch({ type: 'ADD_SUBSCRIBER', payload: result });
        return result;
      } catch (error) {
        console.error('Error adding subscriber:', error);
        throw error;
      }
    },

    async updateSubscriber(subscriberData: Subscriber) {
      try {
        const result = await apiClient.updateSubscriber(subscriberData);
        dispatch({ type: 'UPDATE_SUBSCRIBER', payload: result });
        return result;
      } catch (error) {
        console.error('Error updating subscriber:', error);
        throw error;
      }
    },

    async deleteSubscriber(subscriberId: string) {
      try {
        await apiClient.deleteSubscriber(subscriberId);
        dispatch({ type: 'DELETE_SUBSCRIBER', payload: subscriberId });
      } catch (error) {
        console.error('Error deleting subscriber:', error);
        throw error;
      }
    },

    // Digital Products
    async addDigitalProduct(productData: DigitalProduct) {
      try {
        const result = await apiClient.createDigitalProduct(productData);
        dispatch({ type: 'ADD_DIGITAL_PRODUCT', payload: result });
        return result;
      } catch (error) {
        console.error('Error adding digital product:', error);
        throw error;
      }
    },

    async updateDigitalProduct(productData: DigitalProduct) {
      try {
        const result = await apiClient.updateDigitalProduct(productData);
        dispatch({ type: 'UPDATE_DIGITAL_PRODUCT', payload: result });
        return result;
      } catch (error) {
        console.error('Error updating digital product:', error);
        throw error;
      }
    },

    async deleteDigitalProduct(productId: string) {
      try {
        await apiClient.deleteDigitalProduct(productId);
        dispatch({ type: 'DELETE_DIGITAL_PRODUCT', payload: productId });
      } catch (error) {
        console.error('Error deleting digital product:', error);
        throw error;
      }
    },

    // Note: Stock Purchases methods removed as part of platform migration
    // The system now uses platform-based credit management instead

    // Stock Sales
    async addStockSale(saleData: StockSale) {
      try {
        const result = await apiClient.createStockSale(saleData);
        dispatch({ type: 'ADD_STOCK_SALE', payload: result });
        return result;
      } catch (error) {
        console.error('Error adding stock sale:', error);
        throw error;
      }
    },

    async updateStockSale(saleData: StockSale) {
      try {
        const result = await apiClient.updateStockSale(saleData);
        dispatch({ type: 'UPDATE_STOCK_SALE', payload: result });
        return result;
      } catch (error) {
        console.error('Error updating stock sale:', error);
        throw error;
      }
    },

    async deleteStockSale(saleId: string) {
      try {
        await apiClient.deleteStockSale(saleId);
        dispatch({ type: 'DELETE_STOCK_SALE', payload: saleId });
      } catch (error) {
        console.error('Error deleting stock sale:', error);
        throw error;
      }
    },

    // Stock Movements
    async addStockMovement(movementData: StockMovement) {
      try {
        const result = await apiClient.createStockMovement(movementData);
        dispatch({ type: 'ADD_STOCK_MOVEMENT', payload: result });
        return result;
      } catch (error) {
        console.error('Error adding stock movement:', error);
        throw error;
      }
    },

    // Users
    async addUser(userData: User) {
      try {
        const result = await apiClient.createUser(userData);
        dispatch({ type: 'ADD_USER', payload: result });
        return result;
      } catch (error) {
        console.error('Error adding user:', error);
        throw error;
      }
    },

    async updateUser(userData: User) {
      try {
        const result = await apiClient.updateUser(userData);
        dispatch({ type: 'UPDATE_USER', payload: result });
        return result;
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    },

    async deleteUser(userId: string) {
      try {
        await apiClient.deleteUser(userId);
        dispatch({ type: 'DELETE_USER', payload: userId });
      } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
    },

    // Settings
    async updateSettings(settings: Partial<AppSettings>) {
      try {
        const currentSettings = await apiClient.getSettings();
        const updatedSettings = { ...currentSettings, ...settings };
        const result = await apiClient.updateSettings(updatedSettings);
        dispatch({ type: 'SET_SETTINGS', payload: result });
        return result;
      } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
      }
    },
  };
};