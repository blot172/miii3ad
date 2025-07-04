import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useEvents, Booking } from '@/context/EventContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { Calendar, MapPin, Users, QrCode, Download, X, Ticket } from 'lucide-react-native';
import { useSharedValue, useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

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

export default function BookingsScreen() {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const { bookings, getEventById, cancelBooking } = useEvents();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useSharedValue(0);

  const userBookings = bookings.filter(booking => booking.userId === user?.id);

  const filteredBookings = userBookings.filter(booking => {
    const event = getEventById(booking.eventId);
    if (!event) return false;

    const eventDate = new Date(event.date);
    const now = new Date();

    switch (filter) {
      case 'upcoming':
        return eventDate >= now && booking.status === 'confirmed';
      case 'past':
        return eventDate < now || booking.status === 'used';
      default:
        return true;
    }
  });

  // Create animated scroll handler for native platforms
  const animatedScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      // Call the global tab bar scroll handler if it exists
      if (global.tabBarScrollHandler) {
        runOnJS(global.tabBarScrollHandler)(event.contentOffset.y);
      }
    },
  });

  // Create a unified scroll handler that works on all platforms
  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Call the global tab bar scroll handler if it exists
    if (global.tabBarScrollHandler) {
      global.tabBarScrollHandler(scrollY);
    }

    // For native platforms, also call the animated scroll handler if it's a function
    if (Platform.OS !== 'web' && typeof animatedScrollHandler === 'function') {
      animatedScrollHandler(event);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate a refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      'إلغاء الحجز',
      'هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟',
      [
        { text: 'لا', style: 'cancel' },
        {
          text: 'نعم',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(bookingId);
              Alert.alert('تم الإلغاء', 'تم إلغاء الحجز بنجاح');
            } catch (error) {
              Alert.alert('خطأ', 'فشل في إلغاء الحجز');
            }
          },
        },
      ]
    );
  };

  const renderBookingCard = (booking: Booking) => {
    const event = getEventById(booking.eventId);
    if (!event) return null;

    const title = locale === 'ar' ? event.titleAr : event.title;
    const location = locale === 'ar' ? event.locationAr : event.location;
    const isUpcoming = new Date(event.date) >= new Date() && booking.status === 'confirmed';

    return (
      <View key={booking.id} style={[styles.bookingCard, { backgroundColor: theme.colors.surface }]}>
        <Image source={{ uri: event.image }} style={styles.eventImage} />
        
        <View style={styles.bookingInfo}>
          <View style={styles.bookingHeader}>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: statusColors[booking.status] + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: statusColors[booking.status] }
                ]}>
                  {statusLabels[booking.status]}
                </Text>
              </View>
            </View>

            {booking.status === 'confirmed' && isUpcoming && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelBooking(booking.id)}
                activeOpacity={0.7}
              >
                <X size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.eventTitle, { color: theme.colors.text }]} numberOfLines={2}>{title}</Text>

          <View style={styles.bookingDetails}>
            <View style={styles.bookingDetail}>
              <Calendar size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.bookingDetailText, { color: theme.colors.textSecondary }]}>
                {new Date(event.date).toLocaleDateString(locale === 'ar' ? 'ar-LY' : 'en-US')} - {event.time}
              </Text>
            </View>
            
            <View style={styles.bookingDetail}>
              <MapPin size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.bookingDetailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>{location}</Text>
            </View>
            
            <View style={styles.bookingDetail}>
              <Ticket size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.bookingDetailText, { color: theme.colors.textSecondary }]}>
                {booking.ticketCount} تذكرة - {booking.totalPrice} د.ل
              </Text>
            </View>
          </View>

          <View style={styles.bookingActions}>
            <TouchableOpacity
              style={[styles.viewTicketButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.push(`/ticket/${booking.id}`)}
              activeOpacity={0.7}
            >
              <QrCode size={16} color="white" />
              <Text style={styles.viewTicketButtonText}>عرض التذكرة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
              onPress={() => {
                // Handle download ticket
                Alert.alert('تحميل التذكرة', 'سيتم تحميل التذكرة قريباً');
              }}
              activeOpacity={0.7}
            >
              <Download size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.bookingDate, { color: theme.colors.textSecondary }]}>
            تاريخ الحجز: {new Date(booking.bookingDate).toLocaleDateString(locale === 'ar' ? 'ar-LY' : 'en-US')}
          </Text>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    filterTabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 4,
    },
    filterTab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      alignItems: 'center',
    },
    filterTabActive: {
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    filterTabText: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.textSecondary,
    },
    filterTabTextActive: {
      color: theme.colors.text,
    },
    bookingsContainer: {
      padding: 20,
      paddingBottom: 100, // Extra padding for tab bar
    },
    resultsCount: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    bookingCard: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    eventImage: {
      width: '100%',
      height: 120,
      backgroundColor: theme.colors.border,
    },
    bookingInfo: {
      padding: 16,
    },
    bookingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Cairo-Bold',
    },
    cancelButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: '#FEE2E2',
    },
    eventTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      marginBottom: 12,
      lineHeight: 24,
    },
    bookingDetails: {
      gap: 8,
      marginBottom: 16,
    },
    bookingDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    bookingDetailText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      flex: 1,
    },
    bookingActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    viewTicketButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    viewTicketButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    actionButton: {
      padding: 12,
      borderRadius: 8,
    },
    bookingDate: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
      opacity: 0.7,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 64,
      minHeight: height - 200, // Ensure it fills most of the screen
      justifyContent: 'center',
    },
    emptyStateTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    browseEventsButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    browseEventsButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t('bookings')}</Text>
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { key: 'all', label: 'الكل' },
            { key: 'upcoming', label: 'القادمة' },
            { key: 'past', label: 'السابقة' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                filter === tab.key && styles.filterTabActive
              ]}
              onPress={() => setFilter(tab.key as any)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterTabText,
                filter === tab.key && styles.filterTabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bookings List */}
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.bookingsContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {filteredBookings.length > 0 ? (
          <>
            <Text style={styles.resultsCount}>
              {filteredBookings.length} حجز
            </Text>
            {filteredBookings.map(renderBookingCard)}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ticket size={64} color={theme.colors.border} />
            <Text style={styles.emptyStateTitle}>لا توجد حجوزات</Text>
            <Text style={styles.emptyStateText}>
              {filter === 'upcoming' 
                ? 'لا توجد حجوزات قادمة' 
                : filter === 'past'
                ? 'لا توجد حجوزات سابقة'
                : 'لم تقم بأي حجوزات بعد'
              }
            </Text>
            <TouchableOpacity
              style={styles.browseEventsButton}
              onPress={() => router.push('/(tabs)/events')}
              activeOpacity={0.7}
            >
              <Text style={styles.browseEventsButtonText}>تصفح الفعاليات</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
