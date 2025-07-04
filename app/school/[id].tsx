import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useChat } from '@/context/ChatContext';
import { ArrowLeft, MapPin, Phone, Mail, Globe, MessageCircle, Users, Clock, Star } from 'lucide-react-native';

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useI18n();
  const { theme } = useTheme();
  const { getSchoolById, createChat } = useChat();

  const school = getSchoolById(id);

  const handleStartChat = async () => {
    if (!school) return;
    
    try {
      const chat = await createChat(school.id);
      router.push(`/chat/${chat.id}`);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إنشاء المحادثة');
    }
  };

  const handlePhoneCall = () => {
    if (school?.phone) {
      Linking.openURL(`tel:${school.phone}`);
    }
  };

  const handleEmail = () => {
    if (school?.email) {
      Linking.openURL(`mailto:${school.email}`);
    }
  };

  const handleWebsite = () => {
    if (school?.website) {
      Linking.openURL(`https://${school.website}`);
    }
  };

  if (!school) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>المدرسة غير موجودة</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const name = locale === 'ar' ? school.nameAr : school.name;
  const description = locale === 'ar' ? school.descriptionAr : school.description;
  const location = locale === 'ar' ? school.locationAr : school.location;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    imageContainer: {
      position: 'relative',
      height: 250,
    },
    schoolImage: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.border,
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusOverlay: {
      position: 'absolute',
      top: 50,
      right: 20,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'white',
    },
    statusBadgeText: {
      fontSize: 12,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
    },
    content: {
      padding: 20,
    },
    schoolHeader: {
      marginBottom: 16,
    },
    schoolName: {
      fontSize: 28,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 8,
      lineHeight: 36,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      color: '#F59E0B',
    },
    reviewsText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
    },
    schoolDescription: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 24,
      marginBottom: 24,
    },
    quickInfo: {
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
    quickInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    quickInfoText: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.text,
      flex: 1,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    contactMethod: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    contactMethodLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    contactMethodIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contactMethodTitle: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    contactMethodSubtitle: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
    },
    features: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    feature: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    featureText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.text,
    },
    bottomContainer: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    chatButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      gap: 12,
    },
    chatButtonText: {
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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: school.image }} style={styles.schoolImage} />
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.statusOverlay}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: school.isOnline ? '#10B981' : '#6B7280' }
            ]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>
                {school.isOnline ? 'متاح الآن' : 'غير متاح'}
              </Text>
            </View>
          </View>
        </View>

        {/* School Info */}
        <View style={styles.content}>
          <View style={styles.schoolHeader}>
            <Text style={styles.schoolName}>{name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>4.8</Text>
              <Text style={styles.reviewsText}>(124 تقييم)</Text>
            </View>
          </View>

          <Text style={styles.schoolDescription}>{description}</Text>

          {/* Quick Info */}
          <View style={styles.quickInfo}>
            <View style={styles.quickInfoItem}>
              <MapPin size={20} color={theme.colors.primary} />
              <Text style={styles.quickInfoText}>{location}</Text>
            </View>
            
            <View style={styles.quickInfoItem}>
              <Clock size={20} color={theme.colors.primary} />
              <Text style={styles.quickInfoText}>{school.responseTime}</Text>
            </View>
            
            <View style={styles.quickInfoItem}>
              <Users size={20} color={theme.colors.primary} />
              <Text style={styles.quickInfoText}>{school.adminIds.length} مشرف متاح</Text>
            </View>
          </View>

          {/* Contact Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>طرق التواصل</Text>
            
            <TouchableOpacity style={styles.contactMethod} onPress={handlePhoneCall}>
              <View style={styles.contactMethodLeft}>
                <View style={styles.contactMethodIcon}>
                  <Phone size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.contactMethodTitle}>اتصال هاتفي</Text>
                  <Text style={styles.contactMethodSubtitle}>{school.phone}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactMethod} onPress={handleEmail}>
              <View style={styles.contactMethodLeft}>
                <View style={styles.contactMethodIcon}>
                  <Mail size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.contactMethodTitle}>البريد الإلكتروني</Text>
                  <Text style={styles.contactMethodSubtitle}>{school.email}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {school.website && (
              <TouchableOpacity style={styles.contactMethod} onPress={handleWebsite}>
                <View style={styles.contactMethodLeft}>
                  <View style={styles.contactMethodIcon}>
                    <Globe size={20} color={theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.contactMethodTitle}>الموقع الإلكتروني</Text>
                    <Text style={styles.contactMethodSubtitle}>{school.website}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المميزات</Text>
            <View style={styles.features}>
              <View style={styles.feature}>
                <Text style={styles.featureText}>✅ رد سريع</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureText}>✅ دعم متعدد اللغات</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureText}>✅ استشارات تعليمية</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureText}>✅ متابعة أولياء الأمور</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.chatButton} onPress={handleStartChat}>
          <MessageCircle size={24} color="white" />
          <Text style={styles.chatButtonText}>بدء محادثة</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
