import { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  const { user, profile } = useAuth();
  
  // Track language in state to trigger re-renders
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  
  // Flag to prevent profile sync from overwriting manual language change
  const manualChangeRef = useRef(false);
  
  // Listen for language changes from i18n
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLanguage(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // Sync global window.__i18n__ for utility functions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__i18n__ = i18n;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__i18n__;
      }
    };
  }, [i18n]);

  // Sync language from profile on login (only on initial load, not after manual changes)
  useEffect(() => {
    // Skip if user just manually changed language
    if (manualChangeRef.current) {
      return;
    }
    
    if (profile?.preferred_language && profile.preferred_language !== 'auto') {
      // If user has explicit preference, use it
      if (i18n.language !== profile.preferred_language) {
        i18n.changeLanguage(profile.preferred_language);
      }
    }
    // If 'auto', let browser detection handle it (already configured in i18n.js)
  }, [profile?.preferred_language, i18n]);

  // Change language and save to profile
  const setLanguage = useCallback(async (lang) => {
    // Mark as manual change to prevent profile sync from reverting
    manualChangeRef.current = true;
    
    // Update i18n immediately
    i18n.changeLanguage(lang);

    // Save to localStorage (handled by i18n automatically)
    
    // Update profile in Supabase if user is logged in
    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ preferred_language: lang })
          .eq('id', user.id);
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  }, [user?.id, i18n]);

  const value = {
    language: currentLanguage,
    setLanguage,
    isRussian: currentLanguage?.startsWith('ru'),
    isEnglish: currentLanguage?.startsWith('en'),
    supportedLanguages: ['en', 'ru'],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
