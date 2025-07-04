import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Platform, Animated, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useEvents } from '@/context/EventContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Download, Share as ShareIcon, Calendar, MapPin, QrCode, Ticket, User, Wallet, Smartphone } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { addToMobileWallet, downloadTicket, isWalletAvailable, PassData } from '@/utils/walletUtils';

const { width, height } = Dimensions.get('window');

export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale, t } = useI18n();
  const { theme } = useTheme();
  const { getBookingById, getEventById } = useEvents();
  const { user } = useAuth();
  const [isAddingToWallet, setIsAddingToWallet] = useState(false);
  const [walletAvailable, setWalletAvailable] = useState(false);
  
  // Animation values
  const walletButtonScale = new Animated.Value(1);
  const downloadButtonScale = new Animated.Value(1);

  const booking = getBookingById(id);
  const event = booking ? getEventById(booking.eventId) : null;

  useEffect(() => {
    setWalletAvailable(isWalletAvailable());
  }, []);

  if (!booking || !event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>التذكرة غير موجودة</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/(tabs)/bookings')}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>العودة للحجوزات</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const title = locale === 'ar' ? event.titleAr : event.title;
  const location = locale === 'ar' ? event.locationAr : event.location;
  const organizer = locale === 'ar' ? event.organizerAr : event.organizer;

  const animateButton = (animationValue: Animated.Value, callback?: () => void) => {
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animationValue, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleAddToWallet = async () => {
    animateButton(walletButtonScale);
    setIsAddingToWallet(true);

    try {
      const passData: PassData = {
        eventTitle: title,
        eventDate: new Date(event.date).toLocaleDateString('ar-LY'),
        eventTime: event.time,
        location: location,
        ticketCount: booking.ticketCount,
        totalPrice: booking.totalPrice,
        qrCode: booking.qrCode,
        holderName: user?.name || 'المستخدم',
        organizerName: organizer,
        bookingId: booking.id,
      };

      const success = await addToMobileWallet(passData);
      
      if (success) {
        Alert.alert(
          'تمت الإضافة! 📱',
          Platform.OS === 'ios' 
            ? 'تم إعداد التذكرة لإضافتها إلى محفظة Apple'
            : 'تم إعداد التذكرة لإضافتها إلى Google Pay',
          [{ text: 'رائع!' }]
        );
      }
    } catch (error) {
      console.error('Error adding to wallet:', error);
      Alert.alert('خطأ', 'فشل في إضافة التذكرة إلى المحفظة');
    } finally {
      setIsAddingToWallet(false);
    }
  };

  const handleDownload = async () => {
    animateButton(downloadButtonScale);

    try {
      const passData: PassData = {
        eventTitle: title,
        eventDate: new Date(event.date).toLocaleDateString('ar-LY'),
        eventTime: event.time,
        location: location,
        ticketCount: booking.ticketCount,
        totalPrice: booking.totalPrice,
        qrCode: booking.qrCode,
        holderName: user?.name || 'المستخدم',
        organizerName: organizer,
        bookingId: booking.id,
      };

      await downloadTicket(passData);
    } catch (error) {
      console.error('Error downloading ticket:', error);
      Alert.alert('خطأ', 'فشل في تحميل التذكرة');
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = {
        title: 'تذكرة Mi3AD',
        message: `تذكرتي لفعالية: ${title}\nالتاريخ: ${new Date(event.date).toLocaleDateString('ar-LY')}\nرقم التذكرة: ${booking.qrCode}`,
      };

      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: shareContent.title,
            text: shareContent.message,
          });
        } else {
          await navigator.clipboard.writeText(shareContent.message);
          Alert.alert('تم النسخ!', 'تم نسخ تفاصيل التذكرة إلى الحافظة');
        }
      } else {
        await Share.share({
          title: shareContent.title,
          message: shareContent.message,
        });
      }
    } catch (error) {
      console.error('Error sharing ticket:', error);
    }
  };

  const handleBackToBookings = () => {
    router.push('/(tabs)/bookings');
  };

  const getStatusColor = () => {
    switch (booking.status) {
      case 'confirmed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      case 'used':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = () => {
    switch (booking.status) {
      case 'confirmed':
        return 'مؤكدة';
      case 'cancelled':
        return 'ملغاة';
      case 'used':
        return 'مستخدمة';
      default:
        return booking.status;
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
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      padding: 8,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 30,
    },
    content: {
      padding: 20,
    },
    ticketCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme.isDark ? 0.4 : 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
    ticketHeader: {
      backgroundColor: theme.colors.primary,
      padding: 24,
      alignItems: 'center',
    },
    ticketIcon: {
      marginBottom: 12,
    },
    ticketTitle: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: 8,
    },
    ticketSubtitle: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
    },
    ticketBody: {
      padding: 24,
    },
    holderSection: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    holderTitle: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.textSecondary,
      marginBottom: 8,
      textAlign: 'center',
    },
    holderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    holderName: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    eventInfo: {
      marginBottom: 24,
    },
    eventTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    eventDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    eventDetailText: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      flex: 1,
    },
    qrSection: {
      alignItems: 'center',
      marginBottom: 24,
      paddingVertical: 24,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    qrCode: {
      marginBottom: 16,
    },
    qrText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    ticketDetails: {
      gap: 16,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
    },
    detailValue: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: 'flex-end',
    },
    statusText: {
      fontSize: 14,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    ticketFooter: {
      backgroundColor: theme.colors.background,
      padding: 20,
      alignItems: 'center',
    },
    ticketCode: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.primary,
      letterSpacing: 2,
    },
    walletSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    walletTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    walletButtons: {
      gap: 12,
    },
    walletButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      gap: 12,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    walletButtonDisabled: {
      backgroundColor: theme.colors.textSecondary,
      shadowOpacity: 0.1,
    },
    walletButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    downloadButton: {
      backgroundColor: theme.colors.secondary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      gap: 12,
      shadowColor: theme.colors.secondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    instructions: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    instructionsTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    instructionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    instructionNumber: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.primary,
      marginRight: 8,
      minWidth: 20,
    },
    instructionText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    errorText: {
      fontSize: 18,
      fontFamily: 'Cairo-Regular',
      marginBottom: 24,
    },
    backButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
    },
    bookingsButton: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 16,
      alignItems: 'center',
    },
    bookingsButtonText: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToBookings}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تذكرتي</Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <ShareIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Ticket Card */}
          <View style={styles.ticketCard}>
            {/* Ticket Header */}
            <View style={styles.ticketHeader}>
              <Ticket size={48} color="white" style={styles.ticketIcon} />
              <Text style={styles.ticketTitle}>تذكرة دخول</Text>
              <Text style={styles.ticketSubtitle}>Mi3AD Event Ticket</Text>
            </View>

            {/* Ticket Body */}
            <View style={styles.ticketBody}>
              {/* Ticket Holder Section */}
              <View style={styles.holderSection}>
                <Text style={styles.holderTitle}>حامل التذكرة</Text>
                <View style={styles.holderInfo}>
                  <User size={20} color={theme.colors.primary} />
                  <Text style={styles.holderName}>{user?.name || 'المستخدم'}</Text>
                </View>
              </View>

              {/* Event Info */}
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{title}</Text>
                
                <View style={styles.eventDetail}>
                  <Calendar size={20} color={theme.colors.primary} />
                  <Text style={styles.eventDetailText}>
                    {new Date(event.date).toLocaleDateString(locale === 'ar' ? 'ar-LY' : 'en-US')} - {event.time}
                  </Text>
                </View>
                
                <View style={styles.eventDetail}>
                  <MapPin size={20} color={theme.colors.primary} />
                  <Text style={styles.eventDetailText}>{location}</Text>
                </View>
              </View>

              {/* QR Code */}
              <View style={styles.qrSection}>
                <View style={styles.qrCode}>
                  <QRCode
                    value={booking.qrCode}
                    size={150}
                    color={theme.colors.text}
                    backgroundColor={theme.colors.surface}
                  />
                </View>
                <Text style={styles.qrText}>امسح هذا الرمز عند الدخول</Text>
              </View>

              {/* Ticket Details */}
              <View style={styles.ticketDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>عدد التذاكر</Text>
                  <Text style={styles.detailValue}>{booking.ticketCount}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>السعر الإجمالي</Text>
                  <Text style={styles.detailValue}>
                    {booking.totalPrice === 0 ? 'مجاني' : `${booking.totalPrice} د.ل`}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>تاريخ الحجز</Text>
                  <Text style={styles.detailValue}>
                    {new Date(booking.bookingDate).toLocaleDateString('ar-LY')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>حالة التذكرة</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                    <Text style={styles.statusText}>{getStatusLabel()}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Ticket Footer */}
            <View style={styles.ticketFooter}>
              <Text style={styles.ticketCode}>{booking.qrCode}</Text>
            </View>
          </View>

          {/* Wallet & Download Section */}
          <View style={styles.walletSection}>
            <Text style={styles.walletTitle}>حفظ وتحميل التذكرة</Text>
            
            <View style={styles.walletButtons}>
              {/* Add to Wallet Button */}
              <Animated.View style={{ transform: [{ scale: walletButtonScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.walletButton,
                    (!walletAvailable || isAddingToWallet) && styles.walletButtonDisabled
                  ]}
                  onPress={handleAddToWallet}
                  disabled={!walletAvailable || isAddingToWallet}
                  activeOpacity={0.7}
                >
                  {Platform.OS === 'ios' ? (
                    <Wallet size={24} color="white" />
                  ) : (
                    <Smartphone size={24} color="white" />
                  )}
                  <Text style={styles.walletButtonText}>
                    {isAddingToWallet 
                      ? 'جاري الإضافة...'
                      : Platform.OS === 'ios' 
                        ? 'إضافة إلى محفظة Apple'
                        : Platform.OS === 'android'
                          ? 'إضافة إلى Google Pay'
                          : 'إضافة إلى المحفظة'
                    }
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Download Button */}
              <Animated.View style={{ transform: [{ scale: downloadButtonScale }] }}>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={handleDownload}
                  activeOpacity={0.7}
                >
                  <Download size={24} color="white" />
                  <Text style={styles.walletButtonText}>تحميل التذكرة</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          {/* View Bookings Button */}
          <TouchableOpacity
            style={[styles.bookingsButton, { alignSelf: 'center' }]}
            onPress={handleBackToBookings}
            activeOpacity={0.7}
          >
            <Text style={styles.bookingsButtonText}>عرض جميع الحجوزات</Text>
          </TouchableOpacity>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>تعليمات مهمة</Text>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1.</Text>
              <Text style={styles.instructionText}>
                احضر هذه التذكرة معك إلى الفعالية (رقمياً أو مطبوعة)
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2.</Text>
              <Text style={styles.instructionText}>
                اعرض رمز QR للمسح عند نقطة الدخول
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3.</Text>
              <Text style={styles.instructionText}>
                احضر هوية شخصية صالحة للتحقق من الهوية
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>4.</Text>
              <Text style={styles.instructionText}>
                الوصول قبل 30 دقيقة من بداية الفعالية مستحسن
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
