/**
 * Utility functions for formatting data with Indian localization
 */

// Indian locale settings
const INDIAN_LOCALE = 'en-IN';
const INDIAN_TIMEZONE = 'Asia/Kolkata';
const INDIAN_CURRENCY = 'INR';

export function formatNumber(num: number): string {
  return new Intl.NumberFormat(INDIAN_LOCALE).format(Math.round(num));
}

export function formatPercentage(num: number): string {
  return `${Math.round(num)}%`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function formatCurrency(amount: number, currency: string = INDIAN_CURRENCY): string {
  return new Intl.NumberFormat(INDIAN_LOCALE, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  // Indian date format: DD/MM/YYYY
  return new Intl.DateTimeFormat(INDIAN_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: INDIAN_TIMEZONE,
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  // Indian date-time format with IST timezone
  return new Intl.DateTimeFormat(INDIAN_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: INDIAN_TIMEZONE,
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's an Indian number
  if (cleaned.length === 10) {
    // Indian mobile number format: +91 XXXXX XXXXX
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    // Already has country code
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('091')) {
    // With leading 0
    return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`;
  }
  
  // For other international numbers, just add + if not present
  return phone.startsWith('+') ? phone : `+${phone}`;
}

// Indian-specific formatting functions
export function formatIndianCurrency(amount: number): string {
  // Indian numbering system with lakhs and crores
  return new Intl.NumberFormat(INDIAN_LOCALE, {
    style: 'currency',
    currency: INDIAN_CURRENCY,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatIndianNumber(num: number): string {
  // Indian numbering system (lakhs, crores)
  return new Intl.NumberFormat(INDIAN_LOCALE).format(num);
}

export function formatTimeInIST(date: string | Date): string {
  return new Intl.DateTimeFormat(INDIAN_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: INDIAN_TIMEZONE,
    timeZoneName: 'short',
  }).format(new Date(date));
}