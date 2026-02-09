import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
import enCommon from '../locales/en/common.json';
import enNavigation from '../locales/en/navigation.json';
import enAuth from '../locales/en/auth.json';
import enCalculator from '../locales/en/calculator.json';
import enProjects from '../locales/en/projects.json';
import enInvoices from '../locales/en/invoices.json';
import enOffers from '../locales/en/offers.json';
import enNotifications from '../locales/en/notifications.json';
import enAdmin from '../locales/en/admin.json';
import enErrors from '../locales/en/errors.json';
import enAudit from '../locales/en/audit.json';
import enTasks from '../locales/en/tasks.json';
import enSpecs from '../locales/en/specs.json';
import enFiles from '../locales/en/files.json';
import enComments from '../locales/en/comments.json';

// Russian translations
import ruCommon from '../locales/ru/common.json';
import ruNavigation from '../locales/ru/navigation.json';
import ruAuth from '../locales/ru/auth.json';
import ruCalculator from '../locales/ru/calculator.json';
import ruProjects from '../locales/ru/projects.json';
import ruInvoices from '../locales/ru/invoices.json';
import ruOffers from '../locales/ru/offers.json';
import ruNotifications from '../locales/ru/notifications.json';
import ruAdmin from '../locales/ru/admin.json';
import ruErrors from '../locales/ru/errors.json';
import ruAudit from '../locales/ru/audit.json';
import ruTasks from '../locales/ru/tasks.json';
import ruSpecs from '../locales/ru/specs.json';
import ruFiles from '../locales/ru/files.json';
import ruComments from '../locales/ru/comments.json';

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    calculator: enCalculator,
    projects: enProjects,
    invoices: enInvoices,
    offers: enOffers,
    notifications: enNotifications,
    admin: enAdmin,
    errors: enErrors,
    audit: enAudit,
    tasks: enTasks,
    specs: enSpecs,
    files: enFiles,
    comments: enComments,
  },
  ru: {
    common: ruCommon,
    navigation: ruNavigation,
    auth: ruAuth,
    calculator: ruCalculator,
    projects: ruProjects,
    invoices: ruInvoices,
    offers: ruOffers,
    notifications: ruNotifications,
    admin: ruAdmin,
    errors: ruErrors,
    audit: ruAudit,
    tasks: ruTasks,
    specs: ruSpecs,
    files: ruFiles,
    comments: ruComments,
  },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    
    // Fallback language when translation is missing
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: ['en', 'ru'],
    
    // Default namespace
    defaultNS: 'common',
    
    // All namespaces
    ns: [
      'common',
      'navigation',
      'auth',
      'calculator',
      'projects',
      'invoices',
      'offers',
      'notifications',
      'admin',
      'errors',
      'audit',
      'tasks',
      'specs',
      'files',
      'comments',
    ],
    
    // Language detection configuration
    detection: {
      // Order of lookup methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Where to cache the language
      caches: ['localStorage'],
      // localStorage key
      lookupLocalStorage: 'i18nextLng',
    },
    
    // Interpolation options
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },
    
    // React-specific options
    react: {
      // Don't use Suspense (show content immediately with fallback)
      useSuspense: false,
      // Bind to language change events for proper re-renders
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
    
    // Debug mode (only in development)
    debug: import.meta.env.DEV,
  });

// Expose i18n globally for utility functions that need locale
if (typeof window !== 'undefined') {
  window.__i18n__ = i18n;
}

export default i18n;

// Helper to get current language
export const getCurrentLanguage = () => i18n.language || 'en';

// Helper to check if current language is Russian
export const isRussian = () => getCurrentLanguage().startsWith('ru');

// Helper to check if current language is English
export const isEnglish = () => getCurrentLanguage().startsWith('en');

// Helper to change language
export const changeLanguage = (lang) => i18n.changeLanguage(lang);

// Helper for localized date formatting
export const formatLocalizedDate = (date, options = {}) => {
  const locale = isRussian() ? 'ru-RU' : 'en-US';
  const defaultOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
};

// Helper for localized number formatting
export const formatLocalizedNumber = (number, options = {}) => {
  const locale = isRussian() ? 'ru-RU' : 'en-US';
  return new Intl.NumberFormat(locale, options).format(number);
};

// Helper for localized currency formatting
export const formatLocalizedCurrency = (amount, currency = 'USD') => {
  const locale = isRussian() ? 'ru-RU' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
