import clsx from 'clsx';

/**
 * Merge class names with clsx
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Get the current locale from i18n or fallback to browser locale
 */
export function getCurrentLocale() {
  // Try to get from i18n if available
  if (typeof window !== 'undefined' && window.__i18n__) {
    return window.__i18n__.language === 'ru' ? 'ru-RU' : 'en-US';
  }
  // Fallback to navigator language or en-US
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language || navigator.userLanguage;
    return lang.startsWith('ru') ? 'ru-RU' : 'en-US';
  }
  return 'en-US';
}

/**
 * Format currency
 * Handles both fiat currencies (USD, EUR, etc.) and cryptocurrencies (USDT, BTC, etc.)
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale for formatting (default: current locale)
 */
export function formatCurrency(amount, currency = 'USD', locale = null) {
  const effectiveLocale = locale || getCurrentLocale();
  
  // List of cryptocurrencies that need special handling
  const cryptoCurrencies = ['USDT', 'BTC', 'ETH', 'USDC', 'DAI'];
  
  // If it's a cryptocurrency, format as number with currency symbol appended
  if (cryptoCurrencies.includes(currency?.toUpperCase())) {
    const formatted = new Intl.NumberFormat(effectiveLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} ${currency.toUpperCase()}`;
  }
  
  // For fiat currencies, use standard Intl.NumberFormat
  // Fallback to USD if currency is not supported
  try {
    return new Intl.NumberFormat(effectiveLocale, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // If currency code is invalid, fallback to USD
    console.warn(`Invalid currency code: ${currency}, falling back to USD`);
    return new Intl.NumberFormat(effectiveLocale, {
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
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale for formatting (default: current locale)
 */
export function formatDistanceToNow(date, locale = null) {
  if (!date) return '';
  
  const effectiveLocale = locale || getCurrentLocale();
  const isRussian = effectiveLocale.startsWith('ru');
  
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  
  if (isRussian) {
    if (diffSec < 60) return 'только что';
    if (diffMin < 60) return `${diffMin} мин назад`;
    if (diffHour < 24) return `${diffHour} ч назад`;
    if (diffDay < 7) return `${diffDay} дн назад`;
    if (diffWeek < 4) return `${diffWeek} нед назад`;
    if (diffMonth < 12) return `${diffMonth} мес назад`;
  } else {
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffWeek < 4) return `${diffWeek}w ago`;
    if (diffMonth < 12) return `${diffMonth}mo ago`;
  }
  
  return formatDate(date, {}, locale);
}

/**
 * Format number with locale
 * @param {number} num - Number to format
 * @param {object} options - Intl.NumberFormat options
 * @param {string} locale - Locale for formatting (default: current locale)
 */
export function formatNumber(num, options = {}, locale = null) {
  if (num === null || num === undefined) return '';
  
  const effectiveLocale = locale || getCurrentLocale();
  return new Intl.NumberFormat(effectiveLocale, options).format(num);
}
