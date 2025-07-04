import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert } from 'react-native';
import { storeSecureData, getSecureData, deleteSecureData, encryptUserData, decryptUserData, generateSecureToken, hasSecureHardware } from '@/utils/securityUtils';

export interface BiometricSettings {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'iris' | 'none';
  requireForLogin: boolean;
  requireForSensitiveActions: boolean;
  lockTimeout: number; // minutes
  maxFailedAttempts: number;
  enableAdvancedSecurity: boolean;
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  allowLocationTracking: boolean;
  shareAnalytics: boolean;
  allowNotifications: boolean;
  dataRetentionDays: number;
  autoDeleteOldData: boolean;
  encryptLocalData: boolean;
  requirePasswordForExport: boolean;
  anonymizeData: boolean;
  limitDataCollection: boolean;
  secureMemoryMode: boolean;
}

export interface SecuritySettings {
  biometric: BiometricSettings;
  privacy: PrivacySettings;
  sessionTimeout: number;
  autoLockEnabled: boolean;
  lastAuthTime: string | null;
  failedAttempts: number;
  isLocked: boolean;
  securityLevel: 'basic' | 'enhanced' | 'maximum';
  deviceFingerprint: string | null;
  encryptionEnabled: boolean;
  auditLogEnabled: boolean;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  ipAddress?: string;
  deviceInfo: string;
  success: boolean;
}

interface SecurityContextType {
  securitySettings: SecuritySettings;
  isOnline: boolean;
  isAuthenticated: boolean;
  isBiometricAvailable: boolean;
  biometricType: string | null;
  hasSecureHardwareSupport: boolean;
  auditLogs: SecurityAuditLog[];
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<void>;
  updateBiometricSettings: (settings: Partial<BiometricSettings>) => Promise<void>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  authenticateWithBiometric: () => Promise<boolean>;
  authenticateWithPassword: (password: string) => Promise<boolean>;
  lockApp: () => void;
  unlockApp: () => Promise<boolean>;
  checkSessionTimeout: () => boolean;
  exportUserData: (password?: string) => Promise<string>;
  importUserData: (data: string, password?: string) => Promise<boolean>;
  clearAllData: () => Promise<void>;
  addAuditLog: (action: string, details: string, success: boolean) => Promise<void>;
  getAuditLogs: () => SecurityAuditLog[];
  clearAuditLogs: () => Promise<void>;
  enableMaximumSecurity: () => Promise<void>;
  performSecurityScan: () => Promise<SecurityScanResult>;
}

export interface SecurityScanResult {
  overallScore: number;
  recommendations: string[];
  vulnerabilities: string[];
  strengths: string[];
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const defaultBiometricSettings: BiometricSettings = {
  enabled: false,
  type: 'none',
  requireForLogin: false,
  requireForSensitiveActions: true,
  lockTimeout: 5,
  maxFailedAttempts: 3,
  enableAdvancedSecurity: false,
};

const defaultPrivacySettings: PrivacySettings = {
  showOnlineStatus: true,
  allowLocationTracking: false,
  shareAnalytics: false,
  allowNotifications: true,
  dataRetentionDays: 365,
  autoDeleteOldData: false,
  encryptLocalData: true,
  requirePasswordForExport: true,
  anonymizeData: false,
  limitDataCollection: true,
  secureMemoryMode: false,
};

const defaultSecuritySettings: SecuritySettings = {
  biometric: defaultBiometricSettings,
  privacy: defaultPrivacySettings,
  sessionTimeout: 30, // minutes
  autoLockEnabled: true,
  lastAuthTime: null,
  failedAttempts: 0,
  isLocked: false,
  securityLevel: 'basic',
  deviceFingerprint: null,
  encryptionEnabled: true,
  auditLogEnabled: true,
};

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSecuritySettings);
  const [isOnline, setIsOnline] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [hasSecureHardwareSupport, setHasSecureHardwareSupport] = useState(false);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);

  useEffect(() => {
    initializeSecurity();
  }, []);

  useEffect(() => {
    // Check session timeout periodically
    const interval = setInterval(() => {
      if (securitySettings.autoLockEnabled && checkSessionTimeout()) {
        lockApp();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [securitySettings.autoLockEnabled, securitySettings.sessionTimeout]);

  const initializeSecurity = async () => {
    try {
      // Load security settings
      await loadSettings();
      
      // Check secure hardware support
      const hasSecureHW = await hasSecureHardware();
      setHasSecureHardwareSupport(hasSecureHW);
      
      // Check biometric availability
      if (Platform.OS !== 'web') {
        const isAvailable = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricAvailable(isAvailable && isEnrolled);

        if (isAvailable && isEnrolled) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('face');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('fingerprint');
          } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            setBiometricType('iris');
          }
        }
      }

      // Load audit logs
      await loadAuditLogs();
      
      // Add initialization log
      await addAuditLog('app_start', 'تم تشغيل التطبيق', true);
    } catch (error) {
      console.error('Error initializing security:', error);
      await addAuditLog('init_error', `خطأ في تهيئة الأمان: ${error}`, false);
    }
  };

  const loadSettings = async () => {
    try {
      const securityData = await getSecureData('securitySettings');
      if (securityData) {
        const parsed = JSON.parse(securityData);
        setSecuritySettings({ ...defaultSecuritySettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const saveSettings = async (settings: SecuritySettings) => {
    try {
      await storeSecureData('securitySettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving security settings:', error);
      throw error;
    }
  };

  const loadAuditLogs = async () => {
    try {
      const logsData = await getSecureData('auditLogs');
      if (logsData) {
        setAuditLogs(JSON.parse(logsData));
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const saveAuditLogs = async (logs: SecurityAuditLog[]) => {
    try {
      // Keep only last 1000 logs to prevent storage bloat
      const recentLogs = logs.slice(-1000);
      await storeSecureData('auditLogs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Error saving audit logs:', error);
    }
  };

  const updateSecuritySettings = async (newSettings: Partial<SecuritySettings>) => {
    try {
      const updatedSettings = { ...securitySettings, ...newSettings };
      setSecuritySettings(updatedSettings);
      await saveSettings(updatedSettings);
      await addAuditLog('settings_update', 'تم تحديث إعدادات الأمان', true);
    } catch (error) {
      console.error('Error updating security settings:', error);
      await addAuditLog('settings_update_error', `فشل تحديث الإعدادات: ${error}`, false);
      throw error;
    }
  };

  const updateBiometricSettings = async (newSettings: Partial<BiometricSettings>) => {
    try {
      const updatedBiometric = { ...securitySettings.biometric, ...newSettings };
      const updatedSettings = { ...securitySettings, biometric: updatedBiometric };
      setSecuritySettings(updatedSettings);
      await saveSettings(updatedSettings);
      await addAuditLog('biometric_update', 'تم تحديث إعدادات المصادقة البيومترية', true);
    } catch (error) {
      console.error('Error updating biometric settings:', error);
      await addAuditLog('biometric_update_error', `فشل تحديث المصادقة البيومترية: ${error}`, false);
      throw error;
    }
  };

  const updatePrivacySettings = async (newSettings: Partial<PrivacySettings>) => {
    try {
      const updatedPrivacy = { ...securitySettings.privacy, ...newSettings };
      const updatedSettings = { ...securitySettings, privacy: updatedPrivacy };
      setSecuritySettings(updatedSettings);
      await saveSettings(updatedSettings);
      await addAuditLog('privacy_update', 'تم تحديث إعدادات الخصوصية', true);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      await addAuditLog('privacy_update_error', `فشل تحديث الخصوصية: ${error}`, false);
      throw error;
    }
  };

  const setOnlineStatus = (status: boolean) => {
    if (securitySettings.privacy.showOnlineStatus) {
      setIsOnline(status);
      addAuditLog('status_change', `تم تغيير الحالة إلى: ${status ? 'متصل' : 'غير متصل'}`, true);
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('غير متاح', 'المصادقة البيومترية غير متاحة على الويب');
        await addAuditLog('biometric_auth_web', 'محاولة مصادقة بيومترية على الويب', false);
        return false;
      }

      if (!isBiometricAvailable) {
        Alert.alert('غير متاح', 'المصادقة البيومترية غير متاحة على هذا الجهاز');
        await addAuditLog('biometric_auth_unavailable', 'المصادقة البيومترية غير متاحة', false);
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'تأكيد الهوية',
        subtitle: 'استخدم بصمتك أو وجهك للمتابعة',
        cancelLabel: 'إلغاء',
        fallbackLabel: 'استخدام كلمة المرور',
        disableDeviceFallback: !securitySettings.biometric.enableAdvancedSecurity,
      });

      if (result.success) {
        setIsAuthenticated(true);
        await updateSecuritySettings({
          lastAuthTime: new Date().toISOString(),
          failedAttempts: 0,
          isLocked: false,
        });
        await addAuditLog('biometric_auth_success', 'نجحت المصادقة البيومترية', true);
        return true;
      } else {
        const newFailedAttempts = securitySettings.failedAttempts + 1;
        await updateSecuritySettings({
          failedAttempts: newFailedAttempts,
        });

        await addAuditLog('biometric_auth_failed', `فشلت المصادقة البيومترية (المحاولة ${newFailedAttempts})`, false);

        if (newFailedAttempts >= securitySettings.biometric.maxFailedAttempts) {
          lockApp();
          Alert.alert('تم قفل التطبيق', 'تم تجاوز عدد المحاولات المسموحة');
          await addAuditLog('app_locked', 'تم قفل التطبيق بسبب تجاوز المحاولات', true);
        }
        return false;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      await addAuditLog('biometric_auth_error', `خطأ في المصادقة البيومترية: ${error}`, false);
      return false;
    }
  };

  const authenticateWithPassword = async (password: string): Promise<boolean> => {
    try {
      // In a real app, you would verify against a stored hash
      // For demo purposes, we'll use a simple check
      const isValid = password.length >= 6; // Simple validation
      
      if (isValid) {
        setIsAuthenticated(true);
        await updateSecuritySettings({
          lastAuthTime: new Date().toISOString(),
          failedAttempts: 0,
          isLocked: false,
        });
        await addAuditLog('password_auth_success', 'نجحت المصادقة بكلمة المرور', true);
        return true;
      } else {
        const newFailedAttempts = securitySettings.failedAttempts + 1;
        await updateSecuritySettings({
          failedAttempts: newFailedAttempts,
        });
        await addAuditLog('password_auth_failed', `فشلت المصادقة بكلمة المرور (المحاولة ${newFailedAttempts})`, false);
        return false;
      }
    } catch (error) {
      console.error('Password authentication error:', error);
      await addAuditLog('password_auth_error', `خطأ في المصادقة بكلمة المرور: ${error}`, false);
      return false;
    }
  };

  const lockApp = () => {
    setIsAuthenticated(false);
    updateSecuritySettings({ isLocked: true });
    addAuditLog('app_lock', 'تم قفل التطبيق', true);
  };

  const unlockApp = async (): Promise<boolean> => {
    if (securitySettings.biometric.enabled) {
      return await authenticateWithBiometric();
    } else {
      // For demo, auto-unlock. In production, show password prompt
      setIsAuthenticated(true);
      await updateSecuritySettings({
        isLocked: false,
        lastAuthTime: new Date().toISOString(),
      });
      await addAuditLog('app_unlock', 'تم إلغاء قفل التطبيق', true);
      return true;
    }
  };

  const checkSessionTimeout = (): boolean => {
    if (!securitySettings.lastAuthTime) return false;
    
    const lastAuth = new Date(securitySettings.lastAuthTime);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastAuth.getTime()) / (1000 * 60);
    
    return diffMinutes > securitySettings.sessionTimeout;
  };

  const exportUserData = async (password?: string): Promise<string> => {
    try {
      await addAuditLog('data_export_start', 'بدء تصدير البيانات', true);
      
      // Collect all user data
      const userData = {
        profile: await AsyncStorage.getItem('user'),
        bookings: await AsyncStorage.getItem('bookings'),
        savedPosts: await AsyncStorage.getItem('savedPosts'),
        savedEvents: await AsyncStorage.getItem('savedEvents'),
        chats: await AsyncStorage.getItem('chats'),
        messages: await AsyncStorage.getItem('messages'),
        settings: await getSecureData('securitySettings'),
        theme: await AsyncStorage.getItem('isDarkMode'),
        language: await AsyncStorage.getItem('language'),
        auditLogs: securitySettings.auditLogEnabled ? JSON.stringify(auditLogs) : null,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        deviceFingerprint: securitySettings.deviceFingerprint,
      };

      // Filter out null values
      const filteredData = Object.fromEntries(
        Object.entries(userData).filter(([_, value]) => value !== null)
      );

      let exportData: string;
      
      if (password && securitySettings.privacy.requirePasswordForExport) {
        // Encrypt the data
        exportData = await encryptUserData(filteredData, password);
        await addAuditLog('data_export_encrypted', 'تم تصدير البيانات مع التشفير', true);
      } else {
        exportData = JSON.stringify(filteredData, null, 2);
        await addAuditLog('data_export_plain', 'تم تصدير البيانات بدون تشفير', true);
      }

      return exportData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      await addAuditLog('data_export_error', `فشل تصدير البيانات: ${error}`, false);
      throw new Error('فشل في تصدير البيانات');
    }
  };

  const importUserData = async (data: string, password?: string): Promise<boolean> => {
    try {
      await addAuditLog('data_import_start', 'بدء استيراد البيانات', true);
      
      let parsedData: any;
      
      if (password) {
        // Try to decrypt the data
        parsedData = await decryptUserData(data, password);
        await addAuditLog('data_import_decrypted', 'تم فك تشفير البيانات', true);
      } else {
        parsedData = JSON.parse(data);
      }
      
      // Validate data structure
      if (!parsedData.exportDate || !parsedData.version) {
        throw new Error('تنسيق البيانات غير صحيح');
      }

      // Import each data type
      const importPromises = Object.entries(parsedData).map(async ([key, value]) => {
        if (key !== 'exportDate' && key !== 'version' && key !== 'deviceFingerprint' && typeof value === 'string') {
          if (key === 'settings' || key === 'auditLogs') {
            await storeSecureData(key, value);
          } else {
            await AsyncStorage.setItem(key, value);
          }
        }
      });

      await Promise.all(importPromises);
      
      await addAuditLog('data_import_success', 'تم استيراد البيانات بنجاح', true);
      Alert.alert('تم الاستيراد بنجاح', 'تم استيراد جميع البيانات بنجاح');
      return true;
    } catch (error) {
      console.error('Error importing user data:', error);
      await addAuditLog('data_import_error', `فشل استيراد البيانات: ${error}`, false);
      Alert.alert('خطأ في الاستيراد', 'فشل في استيراد البيانات. تأكد من صحة الملف وكلمة المرور.');
      return false;
    }
  };

  const clearAllData = async (): Promise<void> => {
    try {
      await addAuditLog('data_clear_start', 'بدء مسح جميع البيانات', true);
      
      // Clear AsyncStorage
      await AsyncStorage.clear();
      
      // Clear SecureStore
      const secureKeys = ['securitySettings', 'auditLogs'];
      for (const key of secureKeys) {
        try {
          await deleteSecureData(key);
        } catch (error) {
          console.warn(`Failed to delete secure key ${key}:`, error);
        }
      }
      
      setSecuritySettings(defaultSecuritySettings);
      setIsAuthenticated(false);
      setAuditLogs([]);
      
      await addAuditLog('data_clear_success', 'تم مسح جميع البيانات', true);
      Alert.alert('تم مسح البيانات', 'تم حذف جميع البيانات من التطبيق');
    } catch (error) {
      console.error('Error clearing data:', error);
      await addAuditLog('data_clear_error', `فشل مسح البيانات: ${error}`, false);
      throw new Error('فشل في مسح البيانات');
    }
  };

  const addAuditLog = async (action: string, details: string, success: boolean): Promise<void> => {
    if (!securitySettings.auditLogEnabled) return;
    
    try {
      const newLog: SecurityAuditLog = {
        id: await generateSecureToken(16),
        timestamp: new Date().toISOString(),
        action,
        details,
        deviceInfo: `${Platform.OS} ${Platform.Version}`,
        success,
      };
      
      const updatedLogs = [...auditLogs, newLog];
      setAuditLogs(updatedLogs);
      await saveAuditLogs(updatedLogs);
    } catch (error) {
      console.error('Error adding audit log:', error);
    }
  };

  const getAuditLogs = (): SecurityAuditLog[] => {
    return auditLogs.slice().reverse(); // Return newest first
  };

  const clearAuditLogs = async (): Promise<void> => {
    try {
      setAuditLogs([]);
      await storeSecureData('auditLogs', JSON.stringify([]));
      await addAuditLog('audit_logs_cleared', 'تم مسح سجلات التدقيق', true);
    } catch (error) {
      console.error('Error clearing audit logs:', error);
      throw new Error('فشل في مسح سجلات التدقيق');
    }
  };

  const enableMaximumSecurity = async (): Promise<void> => {
    try {
      const maxSecuritySettings: Partial<SecuritySettings> = {
        securityLevel: 'maximum',
        sessionTimeout: 5, // 5 minutes
        autoLockEnabled: true,
        encryptionEnabled: true,
        auditLogEnabled: true,
        biometric: {
          ...securitySettings.biometric,
          enabled: isBiometricAvailable,
          requireForLogin: true,
          requireForSensitiveActions: true,
          lockTimeout: 1, // 1 minute
          maxFailedAttempts: 2,
          enableAdvancedSecurity: true,
        },
        privacy: {
          ...securitySettings.privacy,
          encryptLocalData: true,
          requirePasswordForExport: true,
          anonymizeData: true,
          limitDataCollection: true,
          secureMemoryMode: true,
          shareAnalytics: false,
          allowLocationTracking: false,
        },
      };
      
      await updateSecuritySettings(maxSecuritySettings);
      await addAuditLog('max_security_enabled', 'تم تفعيل الحد الأقصى للأمان', true);
      
      Alert.alert(
        'تم تفعيل الحد الأقصى للأمان',
        'تم تطبيق أعلى مستويات الأمان والخصوصية على حسابك'
      );
    } catch (error) {
      console.error('Error enabling maximum security:', error);
      await addAuditLog('max_security_error', `فشل تفعيل الحد الأقصى للأمان: ${error}`, false);
      throw error;
    }
  };

  const performSecurityScan = async (): Promise<SecurityScanResult> => {
    try {
      await addAuditLog('security_scan_start', 'بدء فحص الأمان', true);
      
      let score = 0;
      const recommendations: string[] = [];
      const vulnerabilities: string[] = [];
      const strengths: string[] = [];
      
      // Check biometric authentication
      if (securitySettings.biometric.enabled && isBiometricAvailable) {
        score += 25;
        strengths.push('المصادقة البيومترية مفعلة');
      } else {
        vulnerabilities.push('المصادقة البيومترية غير مفعلة');
        recommendations.push('فعّل المصادقة البيومترية لحماية إضافية');
      }
      
      // Check encryption
      if (securitySettings.encryptionEnabled && securitySettings.privacy.encryptLocalData) {
        score += 20;
        strengths.push('تشفير البيانات مفعل');
      } else {
        vulnerabilities.push('تشفير البيانات غير مفعل');
        recommendations.push('فعّل تشفير البيانات المحلية');
      }
      
      // Check session timeout
      if (securitySettings.sessionTimeout <= 15) {
        score += 15;
        strengths.push('مهلة الجلسة قصيرة ومناسبة');
      } else {
        vulnerabilities.push('مهلة الجلسة طويلة جداً');
        recommendations.push('قلل مهلة انتهاء الجلسة إلى 15 دقيقة أو أقل');
      }
      
      // Check auto-lock
      if (securitySettings.autoLockEnabled) {
        score += 10;
        strengths.push('القفل التلقائي مفعل');
      } else {
        vulnerabilities.push('القفل التلقائي غير مفعل');
        recommendations.push('فعّل القفل التلقائي للتطبيق');
      }
      
      // Check audit logging
      if (securitySettings.auditLogEnabled) {
        score += 10;
        strengths.push('سجلات التدقيق مفعلة');
      } else {
        vulnerabilities.push('سجلات التدقيق غير مفعلة');
        recommendations.push('فعّل سجلات التدقيق لمراقبة النشاط');
      }
      
      // Check privacy settings
      if (!securitySettings.privacy.shareAnalytics && securitySettings.privacy.limitDataCollection) {
        score += 10;
        strengths.push('إعدادات الخصوصية محسّنة');
      } else {
        vulnerabilities.push('إعدادات الخصوصية تحتاج تحسين');
        recommendations.push('راجع إعدادات الخصوصية وقلل مشاركة البيانات');
      }
      
      // Check secure hardware
      if (hasSecureHardwareSupport) {
        score += 10;
        strengths.push('الجهاز يدعم الأجهزة الآمنة');
      } else {
        vulnerabilities.push('الجهاز لا يدعم الأجهزة الآمنة');
        recommendations.push('استخدم جهازاً يدعم الأجهزة الآمنة إن أمكن');
      }
      
      const result: SecurityScanResult = {
        overallScore: score,
        recommendations,
        vulnerabilities,
        strengths,
      };
      
      await addAuditLog('security_scan_complete', `فحص الأمان مكتمل - النتيجة: ${score}/100`, true);
      
      return result;
    } catch (error) {
      console.error('Error performing security scan:', error);
      await addAuditLog('security_scan_error', `فشل فحص الأمان: ${error}`, false);
      throw new Error('فشل في إجراء فحص الأمان');
    }
  };

  const value: SecurityContextType = {
    securitySettings,
    isOnline,
    isAuthenticated,
    isBiometricAvailable,
    biometricType,
    hasSecureHardwareSupport,
    auditLogs,
    updateSecuritySettings,
    updateBiometricSettings,
    updatePrivacySettings,
    setOnlineStatus,
    authenticateWithBiometric,
    authenticateWithPassword,
    lockApp,
    unlockApp,
    checkSessionTimeout,
    exportUserData,
    importUserData,
    clearAllData,
    addAuditLog,
    getAuditLogs,
    clearAuditLogs,
    enableMaximumSecurity,
    performSecurityScan,
  };

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
