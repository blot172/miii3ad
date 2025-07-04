import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useEvents, Booking } from '@/context/EventContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Flashlight, FlashlightOff, RotateCcw, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, Camera } from 'lucide-react-native';

// Platform-specific camera import
let CameraView: any = null;
let useCameraPermissions: any = null;

if (Platform.OS !== 'web') {
  try {
    const cameraModule = require('expo-camera');
    CameraView = cameraModule.CameraView;
    useCameraPermissions = cameraModule.useCameraPermissions;
  } catch (error) {
    console.warn('Camera module not available:', error);
  }
}

const { height } = Dimensions.get('window');

const statusColors = {
  confirmed: '#10B981',
  cancelled: '#EF4444',
  used: '#6B7280',
};

const statusLabels = {
  confirmed: 'مؤكد',
  cancelled: 'ملغي',
  used: 'مستخدم',
};

export default function ScannerScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const { bookings, getEventById, markTicketAsUsed } = useEvents();
  const { isBusinessAccount } = useAuth();
  
  // Camera permissions (only for native platforms)
  const [permission, requestPermission] = Platform.OS !== 'web' && useCameraPermissions ? 
    useCameraPermissions() : [null, () => Promise.resolve()];
  
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  } | null>(null);

  // Web-specific QR scanning state
  const [manualQRCode, setManualQRCode] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(Platform.OS === 'web');

  // Debounce scanning to prevent multiple scans
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScannedCode = useRef<string>('');

  useEffect(() => {
    // Check if user is a business account
    if (!isBusinessAccount()) {
      Alert.alert(
        'غير مصرح',
        'هذه الميزة متاحة فقط لحسابات الأعمال',
        [{ text: 'العودة', onPress: () => router.back() }]
      );
    }
    
    // Request camera permissions only on native platforms
    if (Platform.OS !== 'web' && !permission?.granted && useCameraPermissions) {
      requestPermission();
    }
  }, [permission, isBusinessAccount]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Prevent duplicate scans
    if (scanned || data === lastScannedCode.current) return;
    
    // Debounce scanning
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    
    await processQRCode(data);
  };

  const handleManualQRSubmit = async () => {
    if (!manualQRCode.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رمز QR');
      return;
    }
    await processQRCode(manualQRCode.trim());
  };

  const processQRCode = async (data: string) => {
    setScanned(true);
    lastScannedCode.current = data;
    
    try {
      // Find booking by QR code
      const booking = bookings.find(b => b.qrCode === data);
      
      if (!booking) {
        setScanResult({
          type: 'error',
          title: 'تذكرة غير صالحة ❌',
          message: 'رمز QR غير صحيح أو التذكرة غير موجودة في النظام'
        });
        return;
      }
      
      if (booking.status === 'used') {
        setScanResult({
          type: 'warning',
          title: 'تذكرة مستخدمة ⚠️',
          message: `تم استخدام هذه التذكرة مسبقاً\nعدد التذاكر: ${booking.ticketCount}\nالسعر: ${booking.totalPrice === 0 ? 'مجاني' : `${booking.totalPrice} د.ل`}`
        });
        return;
      }
      
      if (booking.status === 'cancelled') {
        setScanResult({
          type: 'error',
          title: 'تذكرة ملغاة ❌',
          message: 'هذه التذكرة تم إلغاؤها ولا يمكن استخدامها'
        });
        return;
      }
      
      // Valid ticket - show confirmation dialog
      setScanResult({
        type: 'success',
        title: 'تذكرة صالحة ✅',
        message: `تذكرة صحيحة!\nعدد التذاكر: ${booking.ticketCount}\nالسعر: ${booking.totalPrice === 0 ? 'مجاني' : `${booking.totalPrice} د.ل`}`
      });
      
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        type: 'error',
        title: 'خطأ في المسح',
        message: 'حدث خطأ أثناء معالجة التذكرة. يرجى المحاولة مرة أخرى.'
      });
    }
  };

  const confirmEntry = async () => {
    try {
      const booking = bookings.find(b => b.qrCode === lastScannedCode.current);
      if (booking && booking.status === 'confirmed') {
        await markTicketAsUsed(booking.id);
        
        Alert.alert(
          'تم تأكيد الدخول! 🎉',
          'تم تسجيل دخول الضيف بنجاح',
          [{ text: 'موافق', onPress: resetScanner }]
        );
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تسجيل الدخول');
      resetScanner();
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanResult(null);
    lastScannedCode.current = '';
    setManualQRCode('');
    
    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    
    // Set a small delay before allowing next scan
    scanTimeoutRef.current = setTimeout(() => {
      setScanned(false);
    }, 1000);
  };

  const toggleFlash = () => {
    if (Platform.OS !== 'web') {
      setFlashEnabled(prev => !prev);
    }
  };

  const getResultIcon = () => {
    if (!scanResult) return null;
    
    switch (scanResult.type) {
      case 'success':
        return <CheckCircle size={48} color={theme.colors.success} />;
      case 'warning':
        return <AlertTriangle size={48} color={theme.colors.warning} />;
      case 'error':
        return <XCircle size={48} color={theme.colors.error} />;
      default:
        return null;
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
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    flashButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: flashEnabled ? theme.colors.primary : theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: flashEnabled ? 2 : 1,
      borderColor: flashEnabled ? theme.colors.primary : theme.colors.border,
    },
    cameraContainer: {
      flex: 1,
      position: 'relative',
    },
    camera: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanArea: {
      width: 250,
      height: 250,
      borderWidth: 2,
      borderColor: 'white',
      borderRadius: 20,
      backgroundColor: 'transparent',
    },
    scanAreaCorner: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderColor: theme.colors.primary,
      borderWidth: 4,
    },
    topLeft: {
      top: -2,
      left: -2,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderTopLeftRadius: 20,
    },
    topRight: {
      top: -2,
      right: -2,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
      borderTopRightRadius: 20,
    },
    bottomLeft: {
      bottom: -2,
      left: -2,
      borderRightWidth: 0,
      borderTopWidth: 0,
      borderBottomLeftRadius: 20,
    },
    bottomRight: {
      bottom: -2,
      right: -2,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      borderBottomRightRadius: 20,
    },
    instructions: {
      position: 'absolute',
      bottom: 200,
      left: 20,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 16,
      padding: 20,
    },
    instructionsTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: 12,
    },
    instructionsText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      lineHeight: 20,
    },
    webScannerContainer: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
    },
    webScannerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    webScannerTitle: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    webScannerSubtitle: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
    },
    manualEntryContainer: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    qrInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    scanButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    scanButtonText: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    resultModal: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 12,
    },
    resultHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    resultTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    resultMessage: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    resultActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    confirmButton: {
      flex: 1,
      backgroundColor: theme.colors.success,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    confirmButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    retryButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    retryButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
    },
    singleActionButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      fontSize: 18,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.text,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      backgroundColor: theme.colors.background,
    },
    permissionTitle: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    permissionText: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    permissionButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 12,
    },
    permissionButtonText: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    unauthorizedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      backgroundColor: theme.colors.background,
    },
    unauthorizedTitle: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    unauthorizedText: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    backToHomeButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 12,
    },
    backToHomeButtonText: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
  });

  // Check if user is a business account
  if (!isBusinessAccount()) {
    return (
      <SafeAreaView style={styles.unauthorizedContainer}>
        <AlertTriangle size={64} color={theme.colors.warning} />
        <Text style={styles.unauthorizedTitle}>غير مصرح</Text>
        <Text style={styles.unauthorizedText}>
          هذه الميزة متاحة فقط لحسابات الأعمال. يرجى الترقية إلى حساب أعمال للوصول إلى ماسح رمز QR.
        </Text>
        <TouchableOpacity
          style={styles.backToHomeButton}
          onPress={() => router.push('/(tabs)/')}
          activeOpacity={0.7}
        >
          <Text style={styles.backToHomeButtonText}>العودة للرئيسية</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Web platform - show manual QR entry
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>مسح التذاكر</Text>
          </View>
        </View>

        <View style={styles.webScannerContainer}>
          <View style={styles.webScannerCard}>
            <Camera size={64} color={theme.colors.primary} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={styles.webScannerTitle}>مسح رمز QR</Text>
            <Text style={styles.webScannerSubtitle}>
              أدخل رمز QR الخاص بالتذكرة يدوياً أو استخدم التطبيق على الهاتف المحمول للمسح التلقائي
            </Text>

            <View style={styles.manualEntryContainer}>
              <Text style={styles.inputLabel}>رمز QR للتذكرة</Text>
              <TextInput
                style={styles.qrInput}
                placeholder="MI3AD-1234567890-ABC123"
                placeholderTextColor={theme.colors.textSecondary}
                value={manualQRCode}
                onChangeText={setManualQRCode}
                autoCapitalize="characters"
              />
              
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleManualQRSubmit}
                activeOpacity={0.7}
              >
                <CheckCircle size={20} color="white" />
                <Text style={styles.scanButtonText}>فحص التذكرة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Result Modal */}
        {scanResult && (
          <View style={styles.resultModal}>
            <View style={styles.resultHeader}>
              {getResultIcon()}
              <Text style={styles.resultTitle}>{scanResult.title}</Text>
              <Text style={styles.resultMessage}>{scanResult.message}</Text>
            </View>

            <View style={styles.resultActions}>
              {scanResult.type === 'success' ? (
                <>
                  <TouchableOpacity 
                    style={styles.confirmButton} 
                    onPress={confirmEntry}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmButtonText}>تأكيد الدخول</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={resetScanner}
                    activeOpacity={0.7}
                  >
                    <RotateCcw size={20} color="white" />
                    <Text style={styles.retryButtonText}>مسح آخر</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={styles.singleActionButton} 
                  onPress={resetScanner}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={20} color="white" />
                  <Text style={styles.retryButtonText}>مسح مرة أخرى</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Native platforms - check permissions
  if (!permission) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جاري تحميل الكاميرا...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>إذن الكاميرا مطلوب</Text>
        <Text style={styles.permissionText}>
          نحتاج إلى إذن الكاميرا لمسح رموز QR الخاصة بالتذاكر
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          activeOpacity={0.7}
        >
          <Text style={styles.permissionButtonText}>منح الإذن</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Native camera view
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>مسح التذاكر</Text>
        </View>
        
        <TouchableOpacity
          style={styles.flashButton}
          onPress={toggleFlash}
          activeOpacity={0.7}
        >
          {flashEnabled ? (
            <FlashlightOff size={24} color="white" />
          ) : (
            <Flashlight size={24} color={theme.colors.text} />
          )}
        </TouchableOpacity>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        {CameraView && (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            enableTorch={flashEnabled}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            {/* Scan Overlay */}
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                <View style={[styles.scanAreaCorner, styles.topLeft]} />
                <View style={[styles.scanAreaCorner, styles.topRight]} />
                <View style={[styles.scanAreaCorner, styles.bottomLeft]} />
                <View style={[styles.scanAreaCorner, styles.bottomRight]} />
              </View>
            </View>

            {/* Instructions */}
            {!scanned && (
              <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>وجه الكاميرا نحو رمز QR</Text>
                <Text style={styles.instructionsText}>
                  ضع رمز QR الخاص بالتذكرة داخل الإطار المربع لمسحه تلقائياً
                  {flashEnabled && '\n\n💡 الفلاش مفعل'}
                </Text>
              </View>
            )}

            {/* Result Modal */}
            {scanResult && (
              <View style={styles.resultModal}>
                <View style={styles.resultHeader}>
                  {getResultIcon()}
                  <Text style={styles.resultTitle}>{scanResult.title}</Text>
                  <Text style={styles.resultMessage}>{scanResult.message}</Text>
                </View>

                <View style={styles.resultActions}>
                  {scanResult.type === 'success' ? (
                    <>
                      <TouchableOpacity 
                        style={styles.confirmButton} 
                        onPress={confirmEntry}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.confirmButtonText}>تأكيد الدخول</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.retryButton} 
                        onPress={resetScanner}
                        activeOpacity={0.7}
                      >
                        <RotateCcw size={20} color="white" />
                        <Text style={styles.retryButtonText}>مسح آخر</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity 
                      style={styles.singleActionButton} 
                      onPress={resetScanner}
                      activeOpacity={0.7}
                    >
                      <RotateCcw size={20} color="white" />
                      <Text style={styles.retryButtonText}>مسح مرة أخرى</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </CameraView>
        )}
      </View>
    </SafeAreaView>
  );
}