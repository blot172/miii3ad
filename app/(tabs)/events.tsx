import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useEvents, Event } from '@/context/EventContext';
import { useLocalSearchParams, router } from 'expo-router';
import { Search, SlidersHorizontal, MapPin, Calendar, Users, Building2, GraduationCap, Heart, PartyPopper, Clapperboard, Ribbon } from 'lucide-react-native';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useSharedValue, useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

const { height } = Dimensions.get('window');

const categoryIcons = {
  government: Building2,
  schools: GraduationCap,
  clinics: Heart,
  occasions: PartyPopper,
  entertainment: Clapperboard,
  openings: Ribbon,
};

export default function EventsScreen() {
  const { t, isRTL, locale } = useI18n();
  const { theme } = useTheme();
  const { events, getEventsByCategory, searchEvents } = useEvents();
  const params = useLocalSearchParams();
  
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);
  const [searchQuery, setSearchQuery] = useState(params.search as string || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(params.category as string || 'all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'popularity'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(true);
  const scrollY = useSharedValue(0);

  const categories = [
    { key: 'all', name: 'الكل', icon: Calendar },
    { key: 'government', name: t('government'), icon: categoryIcons.government },
    { key: 'schools', name: t('schools'), icon: categoryIcons.schools },
    { key: 'clinics', name: t('clinics'), icon: categoryIcons.clinics },
    { key: 'occasions', name: t('occasions'), icon: categoryIcons.occasions },
    { key: 'entertainment', name: t('entertainment'), icon: categoryIcons.entertainment },
    { key: 'openings', name: t('openings'), icon: categoryIcons.openings },
  ];

  // Create a unified scroll handler that works on all platforms
  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Call the global tab bar scroll handler if it exists
    if (global.tabBarScrollHandler) {
      global.tabBarScrollHandler(scrollY);
    }
    
    // Hide language switcher when scrolling down
    setShowLanguageSwitcher(scrollY < 50);
  };

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, sortBy, events]);

  const applyFilters = () => {
    let filtered = events;

    // Apply search
    if (searchQuery.trim()) {
      filtered = searchEvents(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = getEventsByCategory(selectedCategory as Event['category']);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'price':
          return a.price - b.price;
        case 'popularity':
          return b.currentAttendees - a.currentAttendees;
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
  };

  const handleBookNow = (eventId: string) => {
    router.push(`/booking/${eventId}`);
  };

  const renderEventCard = (event: Event) => {
    const title = locale === 'ar' ? event.titleAr : event.title;
    const location = locale === 'ar' ? event.locationAr : event.location;
    const organizer = locale === 'ar' ? event.organizerAr : event.organizer;
    const description = locale === 'ar' ? event.descriptionAr : event.description;

    const CategoryIcon = categoryIcons[event.category];

    return (
      <TouchableOpacity
        key={event.id}
        style={[styles.eventCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => router.push(`/event/${event.id}`)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: event.image }} style={styles.eventImage} />
        <View style={styles.eventInfo}>
          <View style={styles.eventHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: theme.colors.background }]}>
              <CategoryIcon size={16} color={theme.colors.primary} />
              <Text style={[styles.categoryText, { color: theme.colors.textSecondary }]}>
                {categories.find(c => c.key === event.category)?.name}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={[styles.eventPrice, { color: theme.colors.primary }]}>
                {event.price === 0 ? t('free') : `${event.price} د.ل`}
              </Text>
            </View>
          </View>

          <Text style={[styles.eventTitle, { color: theme.colors.text }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.eventDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>{description}</Text>

          <View style={styles.eventDetails}>
            <View style={styles.eventDetail}>
              <Calendar size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.eventDetailText, { color: theme.colors.textSecondary }]}>
                {new Date(event.date).toLocaleDateString(locale === 'ar' ? 'ar-LY' : 'en-US')} - {event.time}
              </Text>
            </View>
            <View style={styles.eventDetail}>
              <MapPin size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.eventDetailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>{location}</Text>
            </View>
            <View style={styles.eventDetail}>
              <Users size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.eventDetailText, { color: theme.colors.textSecondary }]}>
                {event.currentAttendees}/{event.maxAttendees} مشارك
              </Text>
            </View>
          </View>

          <Text style={[styles.eventOrganizer, { color: theme.colors.textSecondary }]} numberOfLines={1}>{organizer}</Text>

          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleBookNow(event.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.bookButtonText}>{t('bookNow')}</Text>
          </TouchableOpacity>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.text,
    },
    searchInputRTL: {
      textAlign: 'right',
    },
    filterButton: {
      padding: 8,
    },
    categoryFilter: {
      paddingBottom: 16,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      marginRight: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    categoryChipActive: {
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.4,
    },
    categoryChipIcon: {
      marginRight: 8,
    },
    categoryChipText: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
    },
    categoryChipTextActive: {
      color: 'white',
    },
    sortContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 16,
    },
    sortLabel: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    sortOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    sortOption: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
    },
    sortOptionActive: {
      backgroundColor: theme.colors.secondary,
    },
    sortOptionText: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
    },
    sortOptionTextActive: {
      color: 'white',
    },
    eventsContainer: {
      padding: 20,
      paddingBottom: 100, // Add padding for tab bar
    },
    resultsCount: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    eventCard: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    eventImage: {
      width: '100%',
      height: 200,
      backgroundColor: theme.colors.border,
    },
    eventInfo: {
      padding: 16,
    },
    eventHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    categoryText: {
      fontSize: 12,
      fontFamily: 'Cairo-SemiBold',
      marginLeft: 6,
    },
    priceContainer: {
      backgroundColor: theme.isDark ? 'rgba(168, 85, 247, 0.2)' : '#DDD6FE',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    eventPrice: {
      fontSize: 14,
      fontFamily: 'Cairo-Bold',
    },
    eventTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      marginBottom: 8,
      lineHeight: 24,
    },
    eventDescription: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      lineHeight: 20,
      marginBottom: 16,
    },
    eventDetails: {
      gap: 8,
      marginBottom: 12,
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
    eventOrganizer: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
      fontStyle: 'italic',
      marginBottom: 16,
      opacity: 0.7,
    },
    bookButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
    },
    bookButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
      minHeight: height - 300, // Ensure it fills most of the screen
      justifyContent: 'center',
    },
    emptyStateText: {
      fontSize: 18,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    clearFiltersButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    clearFiltersButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
    },
    // Fixed Language Switcher Position
    languageSwitcherContainer: {
      position: 'absolute',
      top: 60,
      right: 20,
      zIndex: 1000,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed Language Switcher */}
      <View style={styles.languageSwitcherContainer}>
        <LanguageSwitcher visible={showLanguageSwitcher} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t('events')}</Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, isRTL && styles.searchInputRTL]}
            placeholder={t('searchEvents')}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.7}
          >
            <SlidersHorizontal size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <Animated.ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryFilter}
        >
          {categories.map((category) => {
            const CategoryIcon = category.icon;
            const isActive = selectedCategory === category.key;
            
            return (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category.key)}
                activeOpacity={0.7}
              >
                <CategoryIcon 
                  size={18} 
                  color={isActive ? 'white' : theme.colors.primary}
                  style={styles.categoryChipIcon}
                />
                <Text style={[
                  styles.categoryChipText,
                  isActive && styles.categoryChipTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.ScrollView>

        {/* Sort Options */}
        {showFilters && (
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>ترتيب حسب:</Text>
            <View style={styles.sortOptions}>
              {[
                { key: 'date', label: 'التاريخ' },
                { key: 'price', label: 'السعر' },
                { key: 'popularity', label: 'الشعبية' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    sortBy === option.key && styles.sortOptionActive
                  ]}
                  onPress={() => setSortBy(option.key as any)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortBy === option.key && styles.sortOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Events List */}
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.eventsContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {filteredEvents.length > 0 ? (
          <>
            <Text style={styles.resultsCount}>
              {filteredEvents.length} فعالية متاحة
            </Text>
            {filteredEvents.map(renderEventCard)}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>لا توجد فعاليات متاحة</Text>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSortBy('date');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.clearFiltersButtonText}>مسح المرشحات</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
