import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useEvents } from '@/context/EventContext';
import { useFavorites } from '@/context/FavoritesContext';
import { router } from 'expo-router';
import { ArrowLeft, Bookmark, Calendar, MapPin, Users, Heart, Trash2, FileImage, Building2, GraduationCap, PartyPopper, Clapperboard, Ribbon } from 'lucide-react-native';

const categoryIcons = {
  government: Building2,
  schools: GraduationCap,
  clinics: Heart,
  occasions: PartyPopper,
  entertainment: Clapperboard,
  openings: Ribbon,
};

const { width } = Dimensions.get('window');

export default function SavedScreen() {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const { getEventById } = useEvents();
  const { savedPosts, savedEvents, unsavePost, unsaveEvent } = useFavorites();
  const [activeTab, setActiveTab] = useState<'posts' | 'events'>('posts');

  const handleRemovePost = (postId: string) => {
    Alert.alert(
      'إزالة من المحفوظات',
      'هل تريد إزالة هذا المنشور من المحفوظات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إزالة',
          style: 'destructive',
          onPress: () => unsavePost(postId)
        }
      ]
    );
  };

  const handleRemoveEvent = (eventId: string) => {
    Alert.alert(
      'إزالة من المحفوظات',
      'هل تريد إزالة هذه الفعالية من المحفوظات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إزالة',
          style: 'destructive',
          onPress: () => unsaveEvent(eventId)
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} س`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)} د`;
    } else {
      return date.toLocaleDateString('ar-LY', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const renderPostCard = (post: any) => {
    return (
      <View key={post.id} style={[styles.postCard, { backgroundColor: theme.colors.surface }]}>
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
        
        <View style={styles.postContent}>
          <View style={styles.postHeader}>
            <View style={styles.postInfo}>
              <Text style={[styles.postTitle, { color: theme.colors.text }]} numberOfLines={2}>
                {post.title}
              </Text>
              <Text style={[styles.postAuthor, { color: theme.colors.textSecondary }]}>
                بواسطة {post.author}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemovePost(post.id)}
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.postDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {post.description}
          </Text>

          <View style={styles.postFooter}>
            <View style={styles.postStats}>
              <View style={styles.statItem}>
                <Heart 
                  size={16} 
                  color={post.isLiked ? '#FF3040' : theme.colors.textSecondary}
                  fill={post.isLiked ? '#FF3040' : 'transparent'}
                />
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  {post.likes}
                </Text>
              </View>
              
              <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
                  {post.category}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.savedDate, { color: theme.colors.textSecondary }]}>
              محفوظ منذ {formatDate(post.savedDate)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEventCard = (savedEvent: any) => {
    const event = getEventById(savedEvent.eventId);
    if (!event) return null;

    const title = locale === 'ar' ? event.titleAr : event.title;
    const location = locale === 'ar' ? event.locationAr : event.location;
    const CategoryIcon = categoryIcons[event.category];

    return (
      <TouchableOpacity
        key={savedEvent.id}
        style={[styles.eventCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => router.push(`/event/${event.id}`)}
      >
        <Image source={{ uri: event.image }} style={styles.eventImage} />
        
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, { color: theme.colors.text }]} numberOfLines={2}>
                {title}
              </Text>
              <View style={styles.eventMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: theme.colors.background }]}>
                  <CategoryIcon size={12} color={theme.colors.primary} />
                  <Text style={[styles.categoryText, { color: theme.colors.textSecondary }]}>
                    {event.category}
                  </Text>
                </View>
                <View style={[styles.priceBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Text style={[styles.priceText, { color: theme.colors.primary }]}>
                    {event.price === 0 ? 'مجاني' : `${event.price} د.ل`}
                  </Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveEvent(savedEvent.eventId)}
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <View style={styles.eventDetails}>
            <View style={styles.eventDetail}>
              <Calendar size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.eventDetailText, { color: theme.colors.textSecondary }]}>
                {new Date(event.date).toLocaleDateString('ar-LY')} - {event.time}
              </Text>
            </View>
            
            <View style={styles.eventDetail}>
              <MapPin size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.eventDetailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {location}
              </Text>
            </View>
            
            <View style={styles.eventDetail}>
              <Users size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.eventDetailText, { color: theme.colors.textSecondary }]}>
                {event.currentAttendees}/{event.maxAttendees} مشارك
              </Text>
            </View>
          </View>

          <View style={styles.eventFooter}>
            <TouchableOpacity
              style={[styles.bookButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.push(`/booking/${event.id}`)}
            >
              <Text style={styles.bookButtonText}>احجز الآن</Text>
            </TouchableOpacity>
            
            <Text style={[styles.savedDate, { color: theme.colors.textSecondary }]}>
              محفوظ منذ {formatDate(savedEvent.savedDate)}
            </Text>
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
      marginBottom: 16,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      flex: 1,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.textSecondary,
    },
    activeTabText: {
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statItem: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    statNumber: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
    },
    postCard: {
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    postImage: {
      width: '100%',
      height: 200,
      backgroundColor: theme.colors.border,
    },
    postContent: {
      padding: 16,
    },
    postHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    postInfo: {
      flex: 1,
      marginRight: 12,
    },
    postTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      marginBottom: 4,
      lineHeight: 24,
    },
    postAuthor: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
    },
    removeButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: '#FEE2E2',
    },
    postDescription: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      lineHeight: 20,
      marginBottom: 16,
    },
    postFooter: {
      gap: 12,
    },
    postStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      marginLeft: 4,
    },
    categoryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    categoryText: {
      fontSize: 12,
      fontFamily: 'Cairo-Bold',
    },
    savedDate: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
    },
    eventCard: {
      borderRadius: 12,
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
      height: 160,
      backgroundColor: theme.colors.border,
    },
    eventContent: {
      padding: 16,
    },
    eventHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    eventInfo: {
      flex: 1,
      marginRight: 12,
    },
    eventTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      marginBottom: 8,
      lineHeight: 24,
    },
    eventMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    priceBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    priceText: {
      fontSize: 12,
      fontFamily: 'Cairo-Bold',
    },
    eventDetails: {
      gap: 8,
      marginBottom: 16,
    },
    eventDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    eventDetailText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      flex: 1,
    },
    eventFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bookButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    bookButtonText: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 64,
      paddingHorizontal: 32,
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
    exploreButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    exploreButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>المحفوظات</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'posts' && styles.activeTabText
            ]}>
              المنشورات ({savedPosts.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'events' && styles.activeTab]}
            onPress={() => setActiveTab('events')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'events' && styles.activeTabText
            ]}>
              الفعاليات ({savedEvents.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {savedPosts.length}
            </Text>
            <Text style={styles.statLabel}>منشور محفوظ</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.secondary }]}>
              {savedEvents.length}
            </Text>
            <Text style={styles.statLabel}>فعالية محفوظة</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>
              {savedPosts.length + savedEvents.length}
            </Text>
            <Text style={styles.statLabel}>إجمالي المحفوظات</Text>
          </View>
        </View>

        {/* Content */}
        {activeTab === 'posts' ? (
          savedPosts.length > 0 ? (
            savedPosts.map(renderPostCard)
          ) : (
            <View style={styles.emptyState}>
              <FileImage size={64} color={theme.colors.border} />
              <Text style={styles.emptyStateTitle}>لا توجد منشورات محفوظة</Text>
              <Text style={styles.emptyStateText}>
                ابدأ بحفظ المنشورات المفضلة لديك لتجدها هنا
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push('/(tabs)/')}
              >
                <Text style={styles.exploreButtonText}>استكشف المنشورات</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          savedEvents.length > 0 ? (
            savedEvents.map(renderEventCard)
          ) : (
            <View style={styles.emptyState}>
              <Bookmark size={64} color={theme.colors.border} />
              <Text style={styles.emptyStateTitle}>لا توجد فعاليات محفوظة</Text>
              <Text style={styles.emptyStateText}>
                احفظ الفعاليات التي تهمك لتجدها هنا
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push('/(tabs)/events')}
              >
                <Text style={styles.exploreButtonText}>استكشف الفعاليات</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
