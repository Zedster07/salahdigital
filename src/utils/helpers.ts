import { Subscriber, DigitalProduct, PurchaseRecord } from '../types';

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatCurrency(amount: number, currency: string = 'DZD'): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function calculateMargin(sellPrice: number, purchaseCost: number): number {
  if (purchaseCost === 0) return 100;
  return ((sellPrice - purchaseCost) / purchaseCost) * 100;
}

export function calculateProfitMargin(sellPrice: number, purchaseCost: number): number {
  if (sellPrice === 0) return 0;
  return ((sellPrice - purchaseCost) / sellPrice) * 100;
}

export function getSubscriptionStatus(subscriber: Subscriber): 'active' | 'expired' | 'pending' {
  const now = new Date();
  const endDate = new Date(subscriber.endDate);
  
  if (!subscriber.paymentReceived) {
    return 'pending';
  }
  
  if (endDate < now) {
    return 'expired';
  }
  
  return 'active';
}

export function filterSubscribers(
  subscribers: Subscriber[],
  filters: {
    search?: string;
    type?: string;
    status?: string;
    duration?: string;
  }
): Subscriber[] {
  return subscribers.filter(subscriber => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!subscriber.name.toLowerCase().includes(searchLower) &&
          !subscriber.phone.includes(filters.search) &&
          !subscriber.subscriptionName.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    if (filters.type && subscriber.subscriptionType !== filters.type) {
      return false;
    }
    
    if (filters.status && getSubscriptionStatus(subscriber) !== filters.status) {
      return false;
    }
    
    if (filters.duration && subscriber.duration !== filters.duration) {
      return false;
    }
    
    return true;
  });
}

export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        typeof row[header] === 'string' && row[header].includes(',') 
          ? `"${row[header]}"` 
          : row[header]
      ).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}