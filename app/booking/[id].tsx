import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useEvents } from '@/context/EventContext';
import { ArrowLeft, Plus, Minus, CreditCard, Calendar, MapPin, Users, Ticket } from 'lucide-react-native';

const { height } = Dimensions.get('window');

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale, t } = useI18n();
  const { theme } = useTheme();
  const { getEventById, bookEvent } = useEvents();
  const [ticketCount, setTicketCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');

  const event = getEventById(id);

  if (!event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>الفعالية غير موجودة</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const title = locale === 'ar' ? event.titleAr : event.title;
  const location = locale === 'ar' ? event.locationAr : event.location;
  const totalPrice = event.price * ticketCount;
  const availableTickets = event.maxAttendees - event.currentAttendees;

  const handleBooking = async () => {
    if (ticketCount > availableTickets) {
      Alert.alert('خطأ', 'عدد التذاكر المطلوبة غير متاح');
      return;
    }

    setIsLoading(true);
    try {
      const booking = await bookEvent(event.id, ticketCount);
      Alert.alert(
        'تم الحجز بنجاح! 🎉',
        `تم حجز ${ticketCount} تذكرة للفعالية`,
        [
          {
            text: 'عرض التذكرة',
            onPress: () => router.push(`/ticket/${booking.id}`)
          },
          {
            text: 'عرض الحجوزات',
            onPress: () => router.push('/(tabs)/bookings')
          }
        ]
      );
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إتمام الحجز');
    } finally {
      setIsLoading(false);
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
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    content: {
      padding: 20,
    },
    eventSummary: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    eventTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 16,
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
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    ticketSelector: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    ticketRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    ticketInfo: {
      flex: 1,
    },
    ticketType: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    ticketPrice: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
    },
    ticketControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    controlButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    ticketCountText: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      minWidth: 30,
      textAlign: 'center',
    },
    availableTickets: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.warning,
      textAlign: 'center',
    },
    paymentSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    paymentMethod: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    paymentMethodActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    paymentMethodIcon: {
      marginRight: 12,
    },
    paymentMethodText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
      flex: 1,
    },
    totalSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    totalLabel: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
    },
    totalValue: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
    },
    totalFinal: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
    },
    totalFinalLabel: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    totalFinalValue: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.primary,
    },
    bookButtonContainer: {
      padding: 20,
      paddingBottom: 30,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    bookButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    bookButtonDisabled: {
      backgroundColor: theme.colors.textSecondary,
      shadowOpacity: 0.1,
    },
    bookButtonText: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: 'white',
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
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>حجز التذاكر</Text>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Event Summary */}
            <View style={styles.eventSummary}>
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
              
              <View style={styles.eventDetail}>
                <Users size={20} color={theme.colors.primary} />
                <Text style={styles.eventDetailText}>{availableTickets} تذكرة متاحة</Text>
              </View>
            </View>

            {/* Ticket Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>اختيار التذاكر</Text>
              <View style={styles.ticketSelector}>
                <View style={styles.ticketRow}>
                  <View style={styles.ticketInfo}>
                    <Text style={styles.ticketType}>تذكرة عامة</Text>
                    <Text style={styles.ticketPrice}>
                      {event.price === 0 ? 'مجاني' : `${event.price} د.ل`}
                    </Text>
                  </View>
                  
                  <View style={styles.ticketControls}>
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        ticketCount <= 1 && styles.controlButtonDisabled
                      ]}
                      onPress={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      disabled={ticketCount <= 1}
                      activeOpacity={0.7}
                    >
                      <Minus size={20} color="white" />
                    </TouchableOpacity>
                    
                    <Text style={styles.ticketCountText}>{ticketCount}</Text>
                    
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        ticketCount >= availableTickets && styles.controlButtonDisabled
                      ]}
                      onPress={() => setTicketCount(Math.min(availableTickets, ticketCount + 1))}
                      disabled={ticketCount >= availableTickets}
                      activeOpacity={0.7}
                    >
                      <Plus size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.availableTickets}>
                  متاح {availableTickets} تذكرة
                </Text>
              </View>
            </View>

            {/* Payment Method */}
            {event.price > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>طريقة الدفع</Text>
                <View style={styles.paymentSection}>
                  <TouchableOpacity
                    style={[
                      styles.paymentMethod,
                      paymentMethod === 'card' && styles.paymentMethodActive
                    ]}
                    onPress={() => setPaymentMethod('card')}
                    activeOpacity={0.7}
                  >
                    <CreditCard size={24} color={theme.colors.primary} style={styles.paymentMethodIcon} />
                    <Text style={styles.paymentMethodText}>بطاقة ائتمان</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.paymentMethod,
                      paymentMethod === 'cash' && styles.paymentMethodActive
                    ]}
                    onPress={() => setPaymentMethod('cash')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.paymentMethodIcon, { fontSize: 24 }]}>💰</Text>
                    <Text style={styles.paymentMethodText}>دفع نقدي عند الباب</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Total */}
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>عدد التذاكر</Text>
                <Text style={styles.totalValue}>{ticketCount}</Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>سعر التذكرة الواحدة</Text>
                <Text style={styles.totalValue}>
                  {event.price === 0 ? 'مجاني' : `${event.price} د.ل`}
                </Text>
              </View>
              
              <View style={[styles.totalRow, styles.totalFinal]}>
                <Text style={styles.totalFinalLabel}>المجموع</Text>
                <Text style={styles.totalFinalValue}>
                  {totalPrice === 0 ? 'مجاني' : `${totalPrice} د.ل`}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Book Button - Fixed at bottom */}
      <View style={styles.bookButtonContainer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (isLoading || availableTickets === 0) && styles.bookButtonDisabled
          ]}
          onPress={handleBooking}
          disabled={isLoading || availableTickets === 0}
          activeOpacity={0.7}
        >
          <Text style={styles.bookButtonText}>
            {isLoading ? 'جاري الحجز...' : availableTickets === 0 ? 'نفدت التذاكر' : 'تأكيد الحجز'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
