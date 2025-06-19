import { Language } from '../types';

export const translations = {
  fr: {
    // Authentication
    login: 'Connexion',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    loginButton: 'Se connecter',
    logout: 'Déconnexion',
    
    // Navigation
    dashboard: 'Tableau de bord',
    subscribers: 'Abonnés',
    digitalProducts: 'Produits Digitaux',
    purchases: 'Achats',
    reports: 'Rapports',
    settings: 'Paramètres',
    
    // Dashboard
    totalSubscribers: 'Total Abonnés',
    activeSubscriptions: 'Abonnements Actifs',
    expiringSoon: 'Expirent Bientôt',
    totalRevenue: 'Chiffre d\'Affaires',
    recentSubscribers: 'Abonnés Récents',
    
    // Subscribers
    addSubscriber: 'Ajouter Abonné',
    editSubscriber: 'Modifier Abonné',
    subscriberName: 'Nom',
    phone: 'Téléphone',
    subscriptionType: 'Type d\'Abonnement',
    duration: 'Durée',
    startDate: 'Date de Début',
    endDate: 'Date de Fin',
    status: 'Statut',
    paymentReceived: 'Paiement Reçu',
    paymentAmount: 'Montant Payé',
    remainingAmount: 'Reste',
    paymentMethod: 'Mode de Paiement',
    notes: 'Notes',
    
    // Status
    active: 'Actif',
    expired: 'Expiré',
    pending: 'En Attente',
    
    // Payment Methods
    cash: 'Espèces',
    transfer: 'Virement',
    baridimob: 'BaridiMob',
    other: 'Autre',
    
    // Subscription Types
    iptv: 'IPTV',
    digitalAccount: 'Compte Numérique',
    digitali: 'Offre Digitali',
    
    // Duration
    '1month': '1 Mois',
    '3months': '3 Mois',
    '6months': '6 Mois',
    '12months': '12 Mois',
    custom: 'Personnalisé',
    
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    search: 'Rechercher',
    filter: 'Filtrer',
    export: 'Exporter',
    import: 'Importer',
    
    // Digital Products
    productName: 'Nom du Produit',
    supplier: 'Fournisseur',
    purchaseCost: 'Coût d\'Achat',
    sellPrice: 'Prix de Vente',
    margin: 'Marge',
    category: 'Catégorie',
    
    // Reports
    salesReport: 'Rapport des Ventes',
    purchaseReport: 'Rapport des Achats',
    profitReport: 'Rapport de Bénéfices',
    totalSales: 'Total Ventes',
    totalPurchases: 'Total Achats',
    netProfit: 'Bénéfice Net',
    profitMargin: 'Marge Bénéficiaire',
  },
  ar: {
    // Authentication
    login: 'تسجيل الدخول',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    loginButton: 'دخول',
    logout: 'تسجيل الخروج',
    
    // Navigation
    dashboard: 'لوحة القيادة',
    subscribers: 'المشتركين',
    digitalProducts: 'المنتجات الرقمية',
    purchases: 'المشتريات',
    reports: 'التقارير',
    settings: 'الإعدادات',
    
    // Dashboard
    totalSubscribers: 'إجمالي المشتركين',
    activeSubscriptions: 'الاشتراكات النشطة',
    expiringSoon: 'تنتهي قريباً',
    totalRevenue: 'إجمالي الإيرادات',
    recentSubscribers: 'المشتركين الجدد',
    
    // Subscribers
    addSubscriber: 'إضافة مشترك',
    editSubscriber: 'تعديل مشترك',
    subscriberName: 'الاسم',
    phone: 'الهاتف',
    subscriptionType: 'نوع الاشتراك',
    duration: 'المدة',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ الانتهاء',
    status: 'الحالة',
    paymentReceived: 'الدفع المستلم',
    paymentAmount: 'المبلغ المدفوع',
    remainingAmount: 'المتبقي',
    paymentMethod: 'طريقة الدفع',
    notes: 'ملاحظات',
    
    // Status
    active: 'نشط',
    expired: 'منتهي',
    pending: 'في الانتظار',
    
    // Payment Methods
    cash: 'نقداً',
    transfer: 'تحويل',
    baridimob: 'بريدي موب',
    other: 'أخرى',
    
    // Subscription Types
    iptv: 'IPTV',
    digitalAccount: 'حساب رقمي',
    digitali: 'عرض ديجيتالي',
    
    // Duration
    '1month': 'شهر واحد',
    '3months': '3 أشهر',
    '6months': '6 أشهر',
    '12months': '12 شهر',
    custom: 'مخصص',
    
    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    import: 'استيراد',
    
    // Digital Products
    productName: 'اسم المنتج',
    supplier: 'المورد',
    purchaseCost: 'تكلفة الشراء',
    sellPrice: 'سعر البيع',
    margin: 'الهامش',
    category: 'الفئة',
    
    // Reports
    salesReport: 'تقرير المبيعات',
    purchaseReport: 'تقرير المشتريات',
    profitReport: 'تقرير الأرباح',
    totalSales: 'إجمالي المبيعات',
    totalPurchases: 'إجمالي المشتريات',
    netProfit: 'صافي الربح',
    profitMargin: 'هامش الربح',
  },
};

export function t(key: keyof typeof translations.fr, language: Language = 'fr'): string {
  return translations[language][key] || translations.fr[key] || key;
}