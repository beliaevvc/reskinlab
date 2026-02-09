import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { useLanguageContext } from '../contexts/LanguageContext';

/**
 * Custom hook for language operations
 * Combines react-i18next functionality with our LanguageContext
 * 
 * @param {string} ns - Optional namespace for translations
 * @returns {object} Language utilities
 */
export function useLanguage(ns) {
  const { t, i18n } = useTranslation(ns);
  
  // Try to use context if available, fallback to i18n directly
  let contextValue;
  try {
    contextValue = useLanguageContext();
  } catch {
    // Context not available (e.g., in public pages before auth)
    contextValue = null;
  }

  const language = i18n.language || 'en';
  const isRussian = language.startsWith('ru');
  const isEnglish = language.startsWith('en');

  // Change language - uses context if available, otherwise direct i18n
  const setLanguage = useCallback((lang) => {
    if (contextValue?.setLanguage) {
      contextValue.setLanguage(lang);
    } else {
      i18n.changeLanguage(lang);
    }
  }, [contextValue, i18n]);

  // Toggle between RU and EN
  const toggleLanguage = useCallback(() => {
    const newLang = isRussian ? 'en' : 'ru';
    setLanguage(newLang);
  }, [isRussian, setLanguage]);

  // Get localized content from bilingual object
  // e.g., getLocalized({ desc: 'Russian', descEn: 'English' }, 'desc')
  const getLocalized = useCallback((obj, baseProp) => {
    if (!obj) return '';
    
    const enProp = `${baseProp}En`;
    
    if (isEnglish && obj[enProp]) {
      return obj[enProp];
    }
    
    return obj[baseProp] || obj[enProp] || '';
  }, [isEnglish]);

  // Get localized category/item name
  // Supports both { name, nameRu, nameEn } and { name } formats
  const getLocalizedName = useCallback((obj) => {
    if (!obj) return '';
    
    if (isRussian && obj.nameRu) {
      return obj.nameRu;
    }
    if (isEnglish && obj.nameEn) {
      return obj.nameEn;
    }
    
    return obj.name || '';
  }, [isRussian, isEnglish]);

  // Format date with locale
  const formatDate = useCallback((date, options = {}) => {
    const locale = isRussian ? 'ru-RU' : 'en-US';
    const defaultOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...options,
    };
    try {
      return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
    } catch {
      return String(date);
    }
  }, [isRussian]);

  // Format number with locale
  const formatNumber = useCallback((number, options = {}) => {
    const locale = isRussian ? 'ru-RU' : 'en-US';
    try {
      return new Intl.NumberFormat(locale, options).format(number);
    } catch {
      return String(number);
    }
  }, [isRussian]);

  // Format currency
  const formatCurrency = useCallback((amount, currency = 'USD') => {
    const locale = isRussian ? 'ru-RU' : 'en-US';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `$${amount}`;
    }
  }, [isRussian]);

  return useMemo(() => ({
    // Translation function
    t,
    
    // Current language
    language,
    isRussian,
    isEnglish,
    
    // Language change
    setLanguage,
    toggleLanguage,
    
    // Bilingual helpers
    getLocalized,
    getLocalizedName,
    
    // Formatting
    formatDate,
    formatNumber,
    formatCurrency,
    
    // i18n instance (for advanced usage)
    i18n,
  }), [
    t,
    language,
    isRussian,
    isEnglish,
    setLanguage,
    toggleLanguage,
    getLocalized,
    getLocalizedName,
    formatDate,
    formatNumber,
    formatCurrency,
    i18n,
  ]);
}

export default useLanguage;
