import { format, addMonths, addDays, differenceInDays, parseISO } from 'date-fns';
import { fr, arDZ } from 'date-fns/locale';

export function formatDate(date: string | Date, lang: 'fr' | 'ar' = 'fr'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const locale = lang === 'ar' ? arDZ : fr;
  return format(dateObj, 'dd/MM/yyyy', { locale });
}

export function formatDateTime(date: string | Date, lang: 'fr' | 'ar' = 'fr'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const locale = lang === 'ar' ? arDZ : fr;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale });
}

export function calculateEndDate(startDate: string, duration: string, customDuration?: number): string {
  const start = parseISO(startDate);
  
  switch (duration) {
    case '1month':
      return addMonths(start, 1).toISOString();
    case '3months':
      return addMonths(start, 3).toISOString();
    case '6months':
      return addMonths(start, 6).toISOString();
    case '12months':
      return addMonths(start, 12).toISOString();
    case 'custom':
      return addDays(start, customDuration || 30).toISOString();
    default:
      return addMonths(start, 1).toISOString();
  }
}

export function isExpiringSoon(endDate: string, daysThreshold: number = 7): boolean {
  const end = parseISO(endDate);
  const now = new Date();
  const daysUntilExpiry = differenceInDays(end, now);
  return daysUntilExpiry <= daysThreshold && daysUntilExpiry >= 0;
}

export function isExpired(endDate: string): boolean {
  const end = parseISO(endDate);
  const now = new Date();
  return end < now;
}

export function getDaysUntilExpiry(endDate: string): number {
  const end = parseISO(endDate);
  const now = new Date();
  return differenceInDays(end, now);
}