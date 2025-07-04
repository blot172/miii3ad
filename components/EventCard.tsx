import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Event } from '@/context/EventContext';
import { useI18n } from '@/context/I18nContext';
import { Calendar, MapPin } from 'lucide-react-native';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

export default function EventCard({ event, onPress }: EventCardProps) {
  const { t, locale } = useI18n();
  const title = locale === 'ar' ? event.titleAr : event.title;
  const location = locale === 'ar' ? event.locationAr : event.location;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: event.image }} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        
        <View style={styles.details}>
          <View style={styles.detail}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {new Date(event.date).toLocaleDateString(locale === 'ar' ? 'ar-LY' : 'en-US')}
            </Text>
          </View>
          
          <View style={styles.detail}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.detailText}>{location}</Text>
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {event.price === 0 ? t('free') : `${event.price} ${t('currency')}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#E5E7EB',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
  },
  priceContainer: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  price: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    color: '#B45309',
  },
});
