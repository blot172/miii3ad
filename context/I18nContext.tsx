import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Update translations to remove stories/friends references
const translations = {
  ar: {
    welcome: 'مرحباً بك في Mi3AD',
    discoverEvents: 'اكتشف الفعاليات القريبة منك',
    featuredEvents: 'الفعاليات المميزة',
    allEvents: 'جميع الفعاليات',
    noFeaturedEvents: 'لا توجد فعاليات مميزة حالياً',
    noEventsAvailable: 'لا توجد فعاليات متاحة حالياً',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
  },
  en: {
    welcome: 'Welcome to Mi3AD',
    discoverEvents: 'Discover events near you',
    featuredEvents: 'Featured Events',
    allEvents: 'All Events',
    noFeaturedEvents: 'No featured events available',
    noEventsAvailable: 'No events available',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
  }
};

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
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
    i18nInstance.locale = Localization.locale.split('-')[0] || 'en';
    i18nInstance.enableFallback = true;
    return i18nInstance;
  });

  useEffect(() => {
    const deviceLocale = Localization.locale.split('-')[0];
    const supportedLocale = translations[deviceLocale as keyof typeof translations] ? deviceLocale : 'en';
    setLocale(supportedLocale);
    i18n.locale = supportedLocale;
  }, [i18n]);

  const handleSetLocale = (newLocale: string) => {
    setLocale(newLocale);
    i18n.locale = newLocale;
  };

  const t = (key: string): string => {
    return i18n.t(key);
  };

  const isRTL = locale === 'ar';

  const value: I18nContextType = {
    locale,
    setLocale: handleSetLocale,
    t,
    isRTL,
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