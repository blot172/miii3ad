import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useEvents } from '@/context/EventContext';
import EventCard from '@/components/EventCard';
import { Calendar, MapPin } from 'lucide-react-native';

export default function HomeScreen() {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const { events, getFeaturedEvents } = useEvents();
  const featuredEvents = getFeaturedEvents();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      backgroundColor: theme.colors.surface,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    eventsContainer: {
      gap: 16,
    },
    emptyState: {
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('welcome')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('discoverEvents')}
          </Text>
        </View>

        {/* Featured Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('featuredEvents')}</Text>
          {featuredEvents.length > 0 ? (
            <View style={styles.eventsContainer}>
              {featuredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('noFeaturedEvents')}</Text>
            </View>
          )}
        </View>

        {/* All Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('allEvents')}</Text>
          {events.length > 0 ? (
            <View style={styles.eventsContainer}>
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('noEventsAvailable')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
