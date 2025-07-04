import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications, Notification } from '@/context/NotificationContext';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Trash2, Check, CheckCheck, Settings, Filter, Calendar, MessageCircle, Heart, Bookmark, CircleAlert as AlertCircle } from 'lucide-react-native';

export default function NotificationsScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Simulate loading notifications
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      'حذف الإشعار',
      'هل تريد حذف هذا الإشعار؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => deleteNotification(notificationId)
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'مسح جميع الإشعارات',
      'هل تريد مسح جميع الإشعارات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مسح الكل',
          style: 'destructive',
          onPress: () => {
            setIsRefreshing(true);
            setTimeout(() => {
              clearAllNotifications();
              setIsRefreshing(false);
            }, 500);
          }
        }
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      markAllAsRead();
      setIsRefreshing(false);
    }, 500);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'event_reminder':
        return <Calendar size={20} color={theme.colors.warning} />;
      case 'message':
        return <MessageCircle size={20} color={theme.colors.secondary} />;
      case 'like':
        return <Heart size={20} color="#FF3040" />;
      case 'comment':
        return <MessageCircle size={20} color={theme.colors.primary} />;
      case 'booking_confirmed':
        return <Check size={20} color={theme.colors.success} />;
      case 'system':
        return <AlertCircle size={20} color={theme.colors.textSecondary} />;
      default:
        return <Bell size={20} color={theme.colors.textSecondary} />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'الآن' : `${diffInMinutes} د`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} س`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? 'أمس' : `${diffInDays} أيام`;
    }
  };

  const renderNotification = (notification: Notification) => {
    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          { 
            backgroundColor: notification.isRead ? theme.colors.surface : theme.colors.primary + '10',
            borderLeftColor: notification.isRead ? theme.colors.border : theme.colors.primary
          }
        ]}
        onPress={() => handleNotificationPress(notification)}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationLeft}>
            <View style={[styles.notificationIcon, { backgroundColor: theme.colors.background }]}>
              {getNotificationIcon(notification.type)}
            </View>
            
            {notification.fromUser?.avatar || notification.imageUrl ? (
              <Image 
                source={{ uri: notification.fromUser?.avatar || notification.imageUrl }} 
                style={styles.notificationAvatar} 
              />
            ) : null}
          </View>

          <View style={styles.notificationBody}>
            <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
              {notification.title}
            </Text>
            <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}>
              {notification.message}
            </Text>
            <Text style={[styles.notificationTime, { color: theme.colors.textSecondary }]}>
              {formatTime(notification.createdAt)}
            </Text>
          </View>

          <View style={styles.notificationActions}>
            {!notification.isRead && (
              <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteNotification(notification.id)}
            >
              <Trash2 size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
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
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerButton: {
      padding: 8,
    },
    unreadBadge: {
      backgroundColor: theme.colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    badgeText: {
      fontSize: 12,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    filterContainer: {
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
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      opacity: 1,
    },
    actionButtonDisabled: {
      opacity: 0.6,
    },
    actionButtonSecondary: {
      backgroundColor: theme.colors.error,
    },
    actionButtonText: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
    },
    notificationsList: {
      flex: 1,
      paddingVertical: 8,
    },
    notificationItem: {
      borderLeftWidth: 4,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    notificationContent: {
      flexDirection: 'row',
      padding: 16,
      alignItems: 'flex-start',
    },
    notificationLeft: {
      position: 'relative',
      marginRight: 12,
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationAvatar: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    notificationBody: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      marginBottom: 4,
    },
    notificationMessage: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      lineHeight: 20,
      marginBottom: 8,
    },
    notificationTime: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
    },
    notificationActions: {
      alignItems: 'center',
      gap: 8,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    deleteButton: {
      padding: 8,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
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
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    refreshIndicator: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    refreshText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      marginTop: 8,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>الإشعارات</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.refreshText, { marginTop: 16 }]}>جاري تحميل الإشعارات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>الإشعارات</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Settings size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive
            ]}>
              الكل ({notifications.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[
              styles.filterTabText,
              filter === 'unread' && styles.filterTabTextActive
            ]}>
              غير مقروءة ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton, 
                unreadCount === 0 && styles.actionButtonDisabled
              ]}
              onPress={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck size={16} color="white" />
              <Text style={styles.actionButtonText}>تحديد الكل كمقروء</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleClearAll}
            >
              <Trash2 size={16} color="white" />
              <Text style={styles.actionButtonText}>مسح الكل</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
        {isRefreshing && (
          <View style={styles.refreshIndicator}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.refreshText}>جاري التحديث...</Text>
          </View>
        )}
        
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(renderNotification)
        ) : (
          <View style={styles.emptyState}>
            <Bell size={64} color={theme.colors.border} />
            <Text style={styles.emptyStateTitle}>
              {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات'}
            </Text>
            <Text style={styles.emptyStateText}>
              {filter === 'unread' 
                ? 'جميع إشعاراتك مقروءة'
                : 'ستظهر إشعاراتك هنا عند وصولها'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
