import clsx from 'clsx';

/**
 * Merge class names with clsx
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Format currency
 * Handles both fiat currencies (USD, EUR, etc.) and cryptocurrencies (USDT, BTC, etc.)
 */
export function formatCurrency(amount, currency = 'USD') {
  // List of cryptocurrencies that need special handling
  const cryptoCurrencies = ['USDT', 'BTC', 'ETH', 'USDC', 'DAI'];
  
  // If it's a cryptocurrency, format as number with currency symbol appended
  if (cryptoCurrencies.includes(currency?.toUpperCase())) {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} ${currency.toUpperCase()}`;
  }
  
  // For fiat currencies, use standard Intl.NumberFormat
  // Fallback to USD if currency is not supported
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // If currency code is invalid, fallback to USD
    console.warn(`Invalid currency code: ${currency}, falling back to USD`);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

/**
 * Format date
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Date(date).toLocaleDateString('en-US', {
    ...defaultOptions,
    ...options,
  });
}

/**
 * Format date and time
 */
export function formatDateTime(date, options = {}) {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(date).toLocaleString('en-US', {
    ...defaultOptions,
    ...options,
  });
}

/**
 * Generate unique ID
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * Truncate text
 */
export function truncate(str, length = 50) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format distance to now (e.g., "5 minutes ago", "2 days ago")
 */
export function formatDistanceToNow(date) {
  if (!date) return '';
  
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  
  return formatDate(date);
}
