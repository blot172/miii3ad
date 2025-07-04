import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useChat, School } from '@/context/ChatContext';
import { router } from 'expo-router';
import { Search, MessageCircle, Phone, Mail, Globe, MapPin, Clock, Users, ChevronRight } from 'lucide-react-native';

export default function SchoolsScreen() {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const { schools, chats, searchSchools, createChat, getUnreadChatsCount } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSchools, setFilteredSchools] = useState<School[]>(schools);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setFilteredSchools(searchSchools(query));
    } else {
      setFilteredSchools(schools);
    }
  };

  const handleStartChat = async (school: School) => {
    try {
      const chat = await createChat(school.id);
      router.push(`/chat/${chat.id}`);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إنشاء المحادثة');
    }
  };

  const renderSchoolCard = (school: School) => {
    const name = locale === 'ar' ? school.nameAr : school.name;
    const description = locale === 'ar' ? school.descriptionAr : school.description;
    const location = locale === 'ar' ? school.locationAr : school.location;

    const existingChat = chats.find(chat => chat.schoolId === school.id);

    return (
      <View key={school.id} style={[styles.schoolCard, { backgroundColor: theme.colors.surface }]}>
        <Image source={{ uri: school.image }} style={styles.schoolImage} />
        
        <View style={styles.schoolInfo}>
          <View style={styles.schoolHeader}>
            <View style={styles.schoolTitleContainer}>
              <Text style={[styles.schoolName, { color: theme.colors.text }]} numberOfLines={2}>{name}</Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: school.isOnline ? '#10B981' : '#6B7280' }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: school.isOnline ? '#10B981' : '#6B7280' }
                ]}>
                  {school.isOnline ? 'متاح الآن' : 'غير متاح'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.schoolDescription, { color: theme.colors.textSecondary }]} numberOfLines={3}>{description}</Text>

          <View style={styles.schoolDetails}>
            <View style={styles.schoolDetail}>
              <MapPin size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.schoolDetailText, { color: theme.colors.textSecondary }]}>{location}</Text>
            </View>
            
            <View style={styles.schoolDetail}>
              <Clock size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.schoolDetailText, { color: theme.colors.textSecondary }]}>{school.responseTime}</Text>
            </View>
            
            <View style={styles.schoolDetail}>
              <Users size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.schoolDetailText, { color: theme.colors.textSecondary }]}>{school.adminIds.length} مشرف</Text>
            </View>
          </View>

          <View style={styles.contactInfo}>
            <TouchableOpacity style={styles.contactButton}>
              <Phone size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.contactButtonText, { color: theme.colors.textSecondary }]}>{school.phone}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactButton}>
              <Mail size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.contactButtonText, { color: theme.colors.textSecondary }]}>{school.email}</Text>
            </TouchableOpacity>
            
            {school.website && (
              <TouchableOpacity style={styles.contactButton}>
                <Globe size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.contactButtonText, { color: theme.colors.textSecondary }]}>{school.website}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.chatButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleStartChat(school)}
            >
              <MessageCircle size={20} color="white" />
              <Text style={styles.chatButtonText}>
                {existingChat ? 'متابعة المحادثة' : 'بدء محادثة'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewButton, { borderColor: theme.colors.primary }]}
              onPress={() => router.push(`/school/${school.id}`)}
            >
              <Text style={[styles.viewButtonText, { color: theme.colors.primary }]}>عرض التفاصيل</Text>
              <ChevronRight size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const unreadCount = getUnreadChatsCount();

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
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    chatListButton: {
      position: 'relative',
      padding: 8,
    },
    unreadBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: '#EF4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unreadBadgeText: {
      fontSize: 12,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    headerSubtitle: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
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
    schoolsContainer: {
      padding: 20,
    },
    resultsCount: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    schoolCard: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    schoolImage: {
      width: '100%',
      height: 160,
      backgroundColor: theme.colors.border,
    },
    schoolInfo: {
      padding: 20,
    },
    schoolHeader: {
      marginBottom: 12,
    },
    schoolTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    schoolName: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      flex: 1,
      marginRight: 12,
      lineHeight: 28,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Cairo-SemiBold',
    },
    schoolDescription: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      lineHeight: 20,
      marginBottom: 16,
    },
    schoolDetails: {
      gap: 8,
      marginBottom: 16,
    },
    schoolDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    schoolDetailText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      flex: 1,
    },
    contactInfo: {
      gap: 8,
      marginBottom: 20,
    },
    contactButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
    },
    contactButtonText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    chatButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    chatButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    viewButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    viewButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 64,
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
    clearSearchButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    clearSearchButtonText: {
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
          <Text style={styles.headerTitle}>المدارس</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.chatListButton}
              onPress={() => router.push('/chat')}
            >
              <MessageCircle size={24} color={theme.colors.primary} />
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.headerSubtitle}>تواصل مع إدارات المدارس مباشرة</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن مدرسة..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            textAlign="right"
          />
        </View>
      </View>

      {/* Schools List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.schoolsContainer}>
        {filteredSchools.length > 0 ? (
          <>
            <Text style={styles.resultsCount}>
              {filteredSchools.length} مدرسة متاحة
            </Text>
            {filteredSchools.map(renderSchoolCard)}
          </>
        ) : (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color={theme.colors.border} />
            <Text style={styles.emptyStateTitle}>لا توجد مدارس</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'لم يتم العثور على مدارس تطابق البحث' : 'لا توجد مدارس متاحة حالياً'}
            </Text>
            {searchQuery && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => {
                  setSearchQuery('');
                  setFilteredSchools(schools);
                }}
              >
                <Text style={styles.clearSearchButtonText}>مسح البحث</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
