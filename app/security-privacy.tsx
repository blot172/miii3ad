import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useSecurity, SecurityScanResult } from '@/context/SecurityContext';
import { router } from 'expo-router';
import { ArrowLeft, Users, CircleCheck as CheckCircle, Circle as XCircle, Fingerprint, Eye, Shield, Lock, Download, Upload, Trash2, Clock, MapPin, ChartBar as BarChart3, Bell, Database, Key, Smartphone, Timer, TriangleAlert as AlertTriangle, Search, FileText, Settings, ShieldCheck, Activity, Zap, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function SecurityPrivacyScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const {
    securitySettings,
    isOnline,
    isBiometricAvailable,
    biometricType,
    hasSecureHardwareSupport,
    auditLogs,
    updateBiometricSettings,
    updatePrivacySettings,
    updateSecuritySettings,
    setOnlineStatus,
    authenticateWithBiometric,
    exportUserData,
    importUserData,
    clearAllData,
    getAuditLogs,
    clearAuditLogs,
    enableMaximumSecurity,
    performSecurityScan,
  } = useSecurity();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showSecurityScan, setShowSecurityScan] = useState(false);
  const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleToggleOnlineStatus = (value: boolean) => {
    setOnlineStatus(value);
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (value && !isBiometricAvailable) {
      Alert.alert(
        'غير متاح',
        'المصادقة البيومترية غير متاحة على هذا الجهاز أو لم يتم تفعيلها في إعدادات النظام'
      );
      return;
    }

    if (value) {
      const success = await authenticateWithBiometric();
      if (success) {
        await updateBiometricSettings({ 
          enabled: true,
          type: biometricType as any || 'fingerprint'
        });
        Alert.alert('تم التفعيل', 'تم تفعيل المصادقة البيومترية بنجاح');
      }
    } else {
      await updateBiometricSettings({ enabled: false });
    }
  };

  const handleExportData = async () => {
    if (securitySettings.privacy.requirePasswordForExport) {
      Alert.prompt(
        'كلمة مرور التصدير',
        'أدخل كلمة مرور لحماية البيانات المصدرة',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'تصدير',
            onPress: async (password) => {
              if (password && password.length >= 6) {
                await performExport(password);
              } else {
                Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
              }
            }
          }
        ],
        'secure-text'
      );
    } else {
      await performExport();
    }
  };

  const performExport = async (password?: string) => {
    setIsExporting(true);
    try {
      const data = await exportUserData(password);
      const fileName = `mi3ad-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        // Web download
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Mobile sharing
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, data);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'حفظ نسخة احتياطية',
          });
        }
      }
      
      Alert.alert('تم التصدير', 'تم تصدير بياناتك بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تصدير البيانات');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    setIsImporting(true);
    try {
      let fileContent: string;
      
      if (Platform.OS === 'web') {
        // Web file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        const filePromise = new Promise<string>((resolve, reject) => {
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const text = await file.text();
              resolve(text);
            } else {
              reject(new Error('No file selected'));
            }
          };
        });
        
        input.click();
        fileContent = await filePromise;
      } else {
        // Mobile document picker
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });
        
        if (result.canceled) {
          setIsImporting(false);
          return;
        }
        
        fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      }
      
      // Check if data is encrypted
      try {
        const parsed = JSON.parse(fileContent);
        if (parsed.data && parsed.salt && parsed.hash) {
          // Data is encrypted, ask for password
          Alert.prompt(
            'كلمة مرور الاستيراد',
            'هذا الملف محمي بكلمة مرور. أدخل كلمة المرور لفك التشفير',
            [
              { text: 'إلغاء', style: 'cancel' },
              {
                text: 'استيراد',
                onPress: async (password) => {
                  if (password) {
                    await performImport(fileContent, password);
                  }
                }
              }
            ],
            'secure-text'
          );
        } else {
          // Data is not encrypted
          await performImport(fileContent);
        }
      } catch (error) {
        Alert.alert('خطأ', 'تنسيق الملف غير صحيح');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في قراءة الملف');
    } finally {
      setIsImporting(false);
    }
  };

  const performImport = async (fileContent: string, password?: string) => {
    Alert.alert(
      'تأكيد الاستيراد',
      'سيتم استبدال جميع البيانات الحالية. هل تريد المتابعة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استيراد',
          style: 'destructive',
          onPress: async () => {
            const success = await importUserData(fileContent, password);
            if (success) {
              Alert.alert(
                'تم الاستيراد',
                'تم استيراد البيانات بنجاح. سيتم إعادة تشغيل التطبيق.',
                [{ text: 'موافق', onPress: () => router.replace('/') }]
              );
            }
          }
        }
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'حذف جميع البيانات',
      'تحذير: سيتم حذف جميع بياناتك نهائياً. هذا الإجراء لا يمكن التراجع عنه.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائياً',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف البيانات');
            }
          }
        }
      ]
    );
  };

  const handleSecurityScan = async () => {
    setIsScanning(true);
    try {
      const result = await performSecurityScan();
      setScanResult(result);
      setShowSecurityScan(true);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إجراء فحص الأمان');
    } finally {
      setIsScanning(false);
    }
  };

  const handleEnableMaxSecurity = () => {
    Alert.alert(
      'تفعيل الحد الأقصى للأمان',
      'سيتم تطبيق أعلى مستويات الأمان والخصوصية. قد يؤثر هذا على سهولة الاستخدام.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تفعيل',
          onPress: async () => {
            try {
              await enableMaximumSecurity();
            } catch (error) {
              Alert.alert('خطأ', 'فشل في تفعيل الحد الأقصى للأمان');
            }
          }
        }
      ]
    );
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'face':
        return <Eye size={20} color={theme.colors.primary} />;
      case 'fingerprint':
        return <Fingerprint size={20} color={theme.colors.primary} />;
      default:
        return <Smartphone size={20} color={theme.colors.primary} />;
    }
  };

  const getBiometricLabel = () => {
    switch (biometricType) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Touch ID / بصمة الإصبع';
      case 'iris':
        return 'مسح القزحية';
      default:
        return 'المصادقة البيومترية';
    }
  };

  const getSecurityLevelColor = () => {
    switch (securitySettings.securityLevel) {
      case 'maximum':
        return theme.colors.success;
      case 'enhanced':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getSecurityLevelLabel = () => {
    switch (securitySettings.securityLevel) {
      case 'maximum':
        return 'الحد الأقصى';
      case 'enhanced':
        return 'محسّن';
      default:
        return 'أساسي';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    statusCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
      alignItems: 'center',
    },
    statusIcon: {
      marginBottom: 16,
    },
    statusTitle: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    statusSubtitle: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    statusToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 12,
    },
    statusToggleText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
    },
    securityLevelCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    securityLevelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    securityLevelTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    securityLevelBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    securityLevelText: {
      fontSize: 14,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    quickActions: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    quickActionButton: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    quickActionIcon: {
      marginBottom: 8,
    },
    quickActionText: {
      fontSize: 12,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    lastSettingItem: {
      borderBottomWidth: 0,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    actionButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      gap: 12,
      marginBottom: 12,
    },
    actionButtonSecondary: {
      backgroundColor: theme.colors.secondary,
    },
    actionButtonDanger: {
      backgroundColor: theme.colors.error,
    },
    actionButtonDisabled: {
      backgroundColor: theme.colors.textSecondary,
      opacity: 0.6,
    },
    actionButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 8,
    },
    scanResultCard: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    scoreContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    scoreCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    scoreText: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    scoreLabel: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
    },
    resultSection: {
      marginBottom: 16,
    },
    resultSectionTitle: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    resultItem: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      marginBottom: 4,
      lineHeight: 20,
    },
    auditLogItem: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 4,
    },
    auditLogSuccess: {
      borderLeftColor: theme.colors.success,
    },
    auditLogError: {
      borderLeftColor: theme.colors.error,
    },
    auditLogHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    auditLogAction: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
    },
    auditLogTime: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
    },
    auditLogDetails: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },
    warningCard: {
      backgroundColor: '#FEF3C7',
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
      borderLeftWidth: 4,
      borderLeftColor: '#F59E0B',
    },
    warningText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: '#92400E',
      lineHeight: 20,
    },
    infoCard: {
      backgroundColor: '#EEF2FF',
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    infoText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: '#4338CA',
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الأمان والخصوصية</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Online Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            {isOnline ? (
              <CheckCircle size={64} color={theme.colors.success} />
            ) : (
              <XCircle size={64} color={theme.colors.textSecondary} />
            )}
          </View>
          
          <Text style={styles.statusTitle}>
            {isOnline ? 'متصل' : 'غير متصل'}
          </Text>
          
          <Text style={styles.statusSubtitle}>
            {isOnline 
              ? 'أنت متاح الآن للتواصل مع الآخرين'
              : 'أنت غير متاح حالياً للتواصل'
            }
          </Text>

          <View style={styles.statusToggle}>
            <Text style={styles.statusToggleText}>
              {isOnline ? 'متصل' : 'غير متصل'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnlineStatus}
              trackColor={{ false: theme.colors.border, true: theme.colors.success }}
              thumbColor={isOnline ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Security Level Card */}
        <View style={styles.securityLevelCard}>
          <View style={styles.securityLevelHeader}>
            <Text style={styles.securityLevelTitle}>مستوى الأمان</Text>
            <View style={[styles.securityLevelBadge, { backgroundColor: getSecurityLevelColor() }]}>
              <Shield size={16} color="white" />
              <Text style={styles.securityLevelText}>{getSecurityLevelLabel()}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleEnableMaxSecurity}
          >
            <ShieldCheck size={20} color="white" />
            <Text style={styles.actionButtonText}>تفعيل الحد الأقصى للأمان</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleSecurityScan}
            disabled={isScanning}
          >
            <View style={styles.quickActionIcon}>
              {isScanning ? (
                <Activity size={24} color={theme.colors.primary} />
              ) : (
                <Search size={24} color={theme.colors.primary} />
              )}
            </View>
            <Text style={styles.quickActionText}>
              {isScanning ? 'جاري الفحص...' : 'فحص الأمان'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setShowAuditLogs(true)}
          >
            <View style={styles.quickActionIcon}>
              <FileText size={24} color={theme.colors.secondary} />
            </View>
            <Text style={styles.quickActionText}>سجلات التدقيق</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleExportData}
          >
            <View style={styles.quickActionIcon}>
              <Download size={24} color={theme.colors.success} />
            </View>
            <Text style={styles.quickActionText}>تصدير البيانات</Text>
          </TouchableOpacity>
        </View>

        {/* Biometric Authentication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المصادقة البيومترية</Text>
          
          <View style={[styles.settingItem, styles.lastSettingItem]}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                {getBiometricIcon()}
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{getBiometricLabel()}</Text>
                <Text style={styles.settingSubtitle}>
                  {isBiometricAvailable 
                    ? 'استخدم بصمتك أو وجهك لحماية التطبيق'
                    : 'غير متاح على هذا الجهاز'
                  }
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.biometric.enabled}
              onValueChange={handleToggleBiometric}
              disabled={!isBiometricAvailable}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={securitySettings.biometric.enabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إعدادات الخصوصية</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Users size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>إظهار الحالة الإلكترونية</Text>
                <Text style={styles.settingSubtitle}>
                  السماح للآخرين برؤية ما إذا كنت متصلاً أم لا
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.privacy.showOnlineStatus}
              onValueChange={(value) => updatePrivacySettings({ showOnlineStatus: value })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={securitySettings.privacy.showOnlineStatus ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <MapPin size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>تتبع الموقع</Text>
                <Text style={styles.settingSubtitle}>
                  السماح للتطبيق بالوصول لموقعك لإظهار الفعاليات القريبة
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.privacy.allowLocationTracking}
              onValueChange={(value) => updatePrivacySettings({ allowLocationTracking: value })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={securitySettings.privacy.allowLocationTracking ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <BarChart3 size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>مشاركة بيانات التحليل</Text>
                <Text style={styles.settingSubtitle}>
                  مساعدتنا في تحسين التطبيق من خلال مشاركة بيانات الاستخدام
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.privacy.shareAnalytics}
              onValueChange={(value) => updatePrivacySettings({ shareAnalytics: value })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={securitySettings.privacy.shareAnalytics ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Database size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>تشفير البيانات المحلية</Text>
                <Text style={styles.settingSubtitle}>
                  تشفير البيانات المحفوظة على جهازك لحماية إضافية
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.privacy.encryptLocalData}
              onValueChange={(value) => updatePrivacySettings({ encryptLocalData: value })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={securitySettings.privacy.encryptLocalData ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={[styles.settingItem, styles.lastSettingItem]}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Bell size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>السماح بالإشعارات</Text>
                <Text style={styles.settingSubtitle}>
                  تلقي إشعارات حول الفعاليات والرسائل الجديدة
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.privacy.allowNotifications}
              onValueChange={(value) => updatePrivacySettings({ allowNotifications: value })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={securitySettings.privacy.allowNotifications ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إعدادات الأمان</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Timer size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>قفل تلقائي</Text>
                <Text style={styles.settingSubtitle}>
                  قفل التطبيق تلقائياً بعد {securitySettings.sessionTimeout} دقيقة من عدم النشاط
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.autoLockEnabled}
              onValueChange={(value) => updateSecuritySettings({ autoLockEnabled: value })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={securitySettings.autoLockEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={[styles.settingItem, styles.lastSettingItem]}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Key size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>طلب كلمة مرور للتصدير</Text>
                <Text style={styles.settingSubtitle}>
                  طلب التحقق من الهوية عند تصدير البيانات
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.privacy.requirePasswordForExport}
              onValueChange={(value) => updatePrivacySettings({ requirePasswordForExport: value })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={securitySettings.privacy.requirePasswordForExport ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إدارة البيانات</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, isExporting && styles.actionButtonDisabled]}
            onPress={handleExportData}
            disabled={isExporting}
          >
            <Download size={24} color="white" />
            <Text style={styles.actionButtonText}>
              {isExporting ? 'جاري التصدير...' : 'تصدير البيانات'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary, isImporting && styles.actionButtonDisabled]}
            onPress={handleImportData}
            disabled={isImporting}
          >
            <Upload size={24} color="white" />
            <Text style={styles.actionButtonText}>
              {isImporting ? 'جاري الاستيراد...' : 'استيراد البيانات'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleClearAllData}
          >
            <Trash2 size={24} color="white" />
            <Text style={styles.actionButtonText}>حذف جميع البيانات</Text>
          </TouchableOpacity>
        </View>

        {/* Warning Card */}
        <View style={styles.warningCard}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <AlertTriangle size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              تحذير: حذف البيانات إجراء نهائي لا يمكن التراجع عنه. 
              تأكد من تصدير نسخة احتياطية قبل الحذف.
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 نحن ملتزمون بحماية خصوصيتك وأمان بياناتك. جميع البيانات محفوظة محلياً على جهازك 
            ولا يتم مشاركتها مع أطراف ثالثة إلا بموافقتك الصريحة.
          </Text>
        </View>

        {/* Footer Info */}
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={[styles.settingSubtitle, { textAlign: 'center' }]}>
            Mi3AD - تطبيق آمن وموثوق{'\n'}
            الإصدار 1.0.0 - آخر تحديث أمني: {new Date().toLocaleDateString('ar-LY')}
            {hasSecureHardwareSupport && '\n🔒 الجهاز يدعم الأجهزة الآمنة'}
          </Text>
        </View>
      </ScrollView>

      {/* Security Scan Modal */}
      <Modal visible={showSecurityScan} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>نتائج فحص الأمان</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSecurityScan(false)}
              >
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {scanResult && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.scoreContainer}>
                  <View style={[
                    styles.scoreCircle,
                    { 
                      backgroundColor: scanResult.overallScore >= 80 
                        ? theme.colors.success 
                        : scanResult.overallScore >= 60 
                          ? theme.colors.warning 
                          : theme.colors.error 
                    }
                  ]}>
                    <Text style={styles.scoreText}>{scanResult.overallScore}</Text>
                  </View>
                  <Text style={styles.scoreLabel}>نقاط الأمان من 100</Text>
                </View>

                {scanResult.strengths.length > 0 && (
                  <View style={styles.resultSection}>
                    <Text style={[styles.resultSectionTitle, { color: theme.colors.success }]}>
                      ✅ نقاط القوة
                    </Text>
                    {scanResult.strengths.map((strength, index) => (
                      <Text key={index} style={styles.resultItem}>• {strength}</Text>
                    ))}
                  </View>
                )}

                {scanResult.vulnerabilities.length > 0 && (
                  <View style={styles.resultSection}>
                    <Text style={[styles.resultSectionTitle, { color: theme.colors.error }]}>
                      ⚠️ نقاط الضعف
                    </Text>
                    {scanResult.vulnerabilities.map((vulnerability, index) => (
                      <Text key={index} style={styles.resultItem}>• {vulnerability}</Text>
                    ))}
                  </View>
                )}

                {scanResult.recommendations.length > 0 && (
                  <View style={styles.resultSection}>
                    <Text style={[styles.resultSectionTitle, { color: theme.colors.primary }]}>
                      💡 التوصيات
                    </Text>
                    {scanResult.recommendations.map((recommendation, index) => (
                      <Text key={index} style={styles.resultItem}>• {recommendation}</Text>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Audit Logs Modal */}
      <Modal visible={showAuditLogs} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>سجلات التدقيق</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAuditLogs(false)}
              >
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {getAuditLogs().slice(0, 50).map((log) => (
                <View
                  key={log.id}
                  style={[
                    styles.auditLogItem,
                    log.success ? styles.auditLogSuccess : styles.auditLogError
                  ]}
                >
                  <View style={styles.auditLogHeader}>
                    <Text style={styles.auditLogAction}>{log.action}</Text>
                    <Text style={styles.auditLogTime}>
                      {new Date(log.timestamp).toLocaleString('ar-LY')}
                    </Text>
                  </View>
                  <Text style={styles.auditLogDetails}>{log.details}</Text>
                </View>
              ))}

              {auditLogs.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <FileText size={48} color={theme.colors.border} />
                  <Text style={[styles.settingSubtitle, { marginTop: 16, textAlign: 'center' }]}>
                    لا توجد سجلات تدقيق متاحة
                  </Text>
                </View>
              )}

              {auditLogs.length > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDanger, { marginTop: 16 }]}
                  onPress={async () => {
                    Alert.alert(
                      'مسح السجلات',
                      'هل تريد مسح جميع سجلات التدقيق؟',
                      [
                        { text: 'إلغاء', style: 'cancel' },
                        {
                          text: 'مسح',
                          style: 'destructive',
                          onPress: async () => {
                            await clearAuditLogs();
                            setShowAuditLogs(false);
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Trash2 size={20} color="white" />
                  <Text style={styles.actionButtonText}>مسح السجلات</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
