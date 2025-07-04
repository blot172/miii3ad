import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Complete translations
const translations = {
  ar: {
    // Navigation
    events: 'الفعاليات',
    bookings: 'الحجوزات',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    
    // Common
    welcome: 'مرحباً بك في Mi3AD',
    discoverEvents: 'اكتشف الفعاليات القريبة منك',
    featuredEvents: 'الفعاليات المميزة',
    allEvents: 'جميع الفعاليات',
    noFeaturedEvents: 'لا توجد فعاليات مميزة حالياً',
    noEventsAvailable: 'لا توجد فعاليات متاحة حالياً',
    logout: 'تسجيل الخروج',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
    
    // Events
    bookNow: 'احجز الآن',
    free: 'مجاني',
    currency: 'د.ل',
    searchEvents: 'البحث في الفعاليات',
    
    // Categories
    government: 'حكومي',
    schools: 'مدارس',
    clinics: 'عيادات',
    occasions: 'مناسبات',
    entertainment: 'ترفيه',
    openings: 'افتتاحات',
    
    // Language
    selectLanguage: 'اختر اللغة',
    arabic: 'العربية',
    english: 'English',
  },
  en: {
    // Navigation
    events: 'Events',
    bookings: 'Bookings',
    profile: 'Profile',
    settings: 'Settings',
    
    // Common
    welcome: 'Welcome to Mi3AD',
    discoverEvents: 'Discover events near you',
    featuredEvents: 'Featured Events',
    allEvents: 'All Events',
    noFeaturedEvents: 'No featured events available',
    noEventsAvailable: 'No events available',
    logout: 'Logout',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    
    // Events
    bookNow: 'Book Now',
    free: 'Free',
    currency: 'LYD',
    searchEvents: 'Search Events',
    
    // Categories
    government: 'Government',
    schools: 'Schools',
    clinics: 'Clinics',
    occasions: 'Occasions',
    entertainment: 'Entertainment',
    openings: 'Openings',
    
    // Language
    selectLanguage: 'Select Language',
    arabic: 'العربية',
    english: 'English',
  }
};

// Language configuration
const supportedLanguages = [
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇱🇾',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
];

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  changeLanguage: (locale: string) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
  getSupportedLanguages: () => typeof supportedLanguages;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocale] = useState<string>('en');
  const [i18n] = useState(() => {
    const i18nInstance = new I18n(translations);
    i18nInstance.defaultLocale = 'en';
    i18nInstance.locale = 'en';
    i18nInstance.enableFallback = true;
    return i18nInstance;
  });

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage && translations[savedLanguage as keyof typeof translations]) {
        setLocale(savedLanguage);
        i18n.locale = savedLanguage;
      } else {
        // Use device locale as fallback
        const deviceLocale = Localization.locale.split('-')[0];
        const supportedLocale = translations[deviceLocale as keyof typeof translations] ? deviceLocale : 'en';
        setLocale(supportedLocale);
        i18n.locale = supportedLocale;
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
      // Fallback to English
      setLocale('en');
      i18n.locale = 'en';
    }
  };

  const changeLanguage = async (newLocale: string): Promise<void> => {
    try {
      if (translations[newLocale as keyof typeof translations]) {
        setLocale(newLocale);
        i18n.locale = newLocale;
        await AsyncStorage.setItem('language', newLocale);
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const handleSetLocale = (newLocale: string) => {
    changeLanguage(newLocale);
  };

  const t = (key: string): string => {
    return i18n.t(key);
  };

  const isRTL = locale === 'ar';

  const getSupportedLanguages = () => supportedLanguages;

  const value: I18nContextType = {
    locale,
    setLocale: handleSetLocale,
    changeLanguage,
    t,
    isRTL,
    getSupportedLanguages,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}