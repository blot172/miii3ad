import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Event {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: 'government' | 'schools' | 'clinics' | 'occasions' | 'entertainment' | 'openings';
  date: string;
  time: string;
  location: string;
  locationAr: string;
  price: number;
  image: string;
  organizer: string;
  organizerAr: string;
  isFeatured: boolean;
  latitude?: number;
  longitude?: number;
  maxAttendees: number;
  currentAttendees: number;
}

export interface Booking {
  id: string;
  eventId: string;
  userId: string;
  ticketCount: number;
  totalPrice: number;
  bookingDate: string;
  status: 'confirmed' | 'cancelled' | 'used';
  qrCode: string;
}

interface EventContextType {
  events: Event[];
  bookings: Booking[];
  isLoading: boolean;
  getEventById: (id: string) => Event | undefined;
  getBookingById: (id: string) => Booking | undefined;
  bookEvent: (eventId: string, ticketCount: number) => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  markTicketAsUsed: (bookingId: string) => Promise<void>;
  searchEvents: (query: string) => Event[];
  getEventsByCategory: (category: Event['category']) => Event[];
  getFeaturedEvents: () => Event[];
  getNearbyEvents: (latitude: number, longitude: number, radius: number) => Event[];
}

const EventContext = createContext<EventContextType | undefined>(undefined);

// Mock data
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Government Digital Transformation Conference',
    titleAr: 'مؤتمر التحول الرقمي الحكومي',
    description: 'Learn about the latest government digital initiatives and transformation strategies.',
    descriptionAr: 'تعرف على أحدث المبادرات الحكومية للتحول الرقمي واستراتيجيات التطوير.',
    category: 'government',
    date: '2024-02-15',
    time: '09:00',
    location: 'Tripoli Convention Center',
    locationAr: 'مركز طرابلس للمؤتمرات',
    price: 0,
    image: 'https://images.pexels.com/photos/3184435/pexels-photo-3184435.jpeg',
    organizer: 'Ministry of Digital Transformation',
    organizerAr: 'وزارة التحول الرقمي',
    isFeatured: true,
    latitude: 32.8872,
    longitude: 13.1913,
    maxAttendees: 500,
    currentAttendees: 245,
  },
  {
    id: '2',
    title: 'International School Fair',
    titleAr: 'معرض المدارس الدولية',
    description: 'Discover the best international schools in Libya and their programs.',
    descriptionAr: 'اكتشف أفضل المدارس الدولية في ليبيا وبرامجها التعليمية.',
    category: 'schools',
    date: '2024-02-20',
    time: '10:00',
    location: 'Benghazi Educational Complex',
    locationAr: 'مجمع بنغازي التعليمي',
    price: 5,
    image: 'https://images.pexels.com/photos/289737/pexels-photo-289737.jpeg',
    organizer: 'Libya Education Council',
    organizerAr: 'مجلس التعليم الليبي',
    isFeatured: true,
    latitude: 32.1244,
    longitude: 20.0707,
    maxAttendees: 300,
    currentAttendees: 156,
  },
  {
    id: '3',
    title: 'Health & Wellness Expo',
    titleAr: 'معرض الصحة والعافية',
    description: 'Latest medical technologies and wellness solutions for a healthier Libya.',
    descriptionAr: 'أحدث التقنيات الطبية وحلول العافية من أجل ليبيا أكثر صحة.',
    category: 'clinics',
    date: '2024-02-25',
    time: '08:30',
    location: 'Tripoli Medical Center',
    locationAr: 'المركز الطبي طرابلس',
    price: 10,
    image: 'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg',
    organizer: 'Libya Health Association',
    organizerAr: 'جمعية الصحة الليبية',
    isFeatured: false,
    latitude: 32.8925,
    longitude: 13.1802,
    maxAttendees: 200,
    currentAttendees: 89,
  },
  {
    id: '4',
    title: 'Traditional Wedding Celebration',
    titleAr: 'احتفال الزفاف التقليدي',
    description: 'Experience authentic Libyan wedding traditions and celebrations.',
    descriptionAr: 'اختبر تقاليد الزفاف الليبية الأصيلة والاحتفالات التراثية.',
    category: 'occasions',
    date: '2024-03-01',
    time: '18:00',
    location: 'Al-Saraya Al-Hamra',
    locationAr: 'السرايا الحمراء',
    price: 25,
    image: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg',
    organizer: 'Cultural Heritage Society',
    organizerAr: 'جمعية التراث الثقافي',
    isFeatured: true,
    latitude: 32.8925,
    longitude: 13.1802,
    maxAttendees: 150,
    currentAttendees: 127,
  },
  {
    id: '5',
    title: 'Comedy Night Show',
    titleAr: 'عرض الكوميديا الليلي',
    description: 'Laugh the night away with Libya\'s top comedians.',
    descriptionAr: 'استمتع بليلة من الضحك مع أفضل الكوميديين في ليبيا.',
    category: 'entertainment',
    date: '2024-03-05',
    time: '20:00',
    location: 'Tripoli Theatre',
    locationAr: 'مسرح طرابلس',
    price: 15,
    image: 'https://images.pexels.com/photos/713149/pexels-photo-713149.jpeg',
    organizer: 'Entertainment Libya',
    organizerAr: 'ترفيه ليبيا',
    isFeatured: false,
    latitude: 32.8872,
    longitude: 13.1913,
    maxAttendees: 400,
    currentAttendees: 298,
  },
  {
    id: '6',
    title: 'New Shopping Mall Opening',
    titleAr: 'افتتاح المركز التجاري الجديد',
    description: 'Grand opening of Libya\'s newest and largest shopping destination.',
    descriptionAr: 'الافتتاح الكبير لأحدث وأكبر وجهة تسوق في ليبيا.',
    category: 'openings',
    date: '2024-03-10',
    time: '11:00',
    location: 'New Tripoli Mall',
    locationAr: 'مول طرابلس الجديد',
    price: 0,
    image: 'https://images.pexels.com/photos/264507/pexels-photo-264507.jpeg',
    organizer: 'Libya Commercial Group',
    organizerAr: 'المجموعة التجارية الليبية',
    isFeatured: true,
    latitude: 32.8925,
    longitude: 13.1802,
    maxAttendees: 1000,
    currentAttendees: 756,
  },
];

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBookingsFromStorage();
  }, []);

  const loadBookingsFromStorage = async () => {
    try {
      const storedBookings = await AsyncStorage.getItem('bookings');
      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const saveBookingsToStorage = async (updatedBookings: Booking[]) => {
    try {
      await AsyncStorage.setItem('bookings', JSON.stringify(updatedBookings));
    } catch (error) {
      console.error('Error saving bookings:', error);
    }
  };

  const getEventById = (id: string): Event | undefined => {
    return events.find(event => event.id === id);
  };

  const getBookingById = (id: string): Booking | undefined => {
    return bookings.find(booking => booking.id === id);
  };

  const bookEvent = async (eventId: string, ticketCount: number): Promise<Booking> => {
    const event = getEventById(eventId);
    if (!event) throw new Error('Event not found');

    const booking: Booking = {
      id: Date.now().toString(),
      eventId,
      userId: 'current-user-id',
      ticketCount,
      totalPrice: event.price * ticketCount,
      bookingDate: new Date().toISOString(),
      status: 'confirmed',
      qrCode: `MI3AD-${Date.now()}-${eventId}`,
    };

    const updatedBookings = [...bookings, booking];
    setBookings(updatedBookings);
    await saveBookingsToStorage(updatedBookings);
    
    // Update event attendance
    setEvents(prev => 
      prev.map(e => 
        e.id === eventId 
          ? { ...e, currentAttendees: e.currentAttendees + ticketCount }
          : e
      )
    );

    return booking;
  };

  const cancelBooking = async (bookingId: string): Promise<void> => {
    const booking = getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found');

    const updatedBookings = bookings.map(b => 
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
    );
    setBookings(updatedBookings);
    await saveBookingsToStorage(updatedBookings);

    // Update event attendance
    setEvents(prev => 
      prev.map(e => 
        e.id === booking.eventId 
          ? { ...e, currentAttendees: Math.max(0, e.currentAttendees - booking.ticketCount) }
          : e
      )
    );
  };

  const markTicketAsUsed = async (bookingId: string): Promise<void> => {
    const updatedBookings = bookings.map(b => 
      b.id === bookingId ? { ...b, status: 'used' as const } : b
    );
    setBookings(updatedBookings);
    await saveBookingsToStorage(updatedBookings);
  };

  const searchEvents = (query: string): Event[] => {
    const lowercaseQuery = query.toLowerCase();
    return events.filter(event => 
      event.title.toLowerCase().includes(lowercaseQuery) ||
      event.titleAr.includes(query) ||
      event.description.toLowerCase().includes(lowercaseQuery) ||
      event.descriptionAr.includes(query) ||
      event.location.toLowerCase().includes(lowercaseQuery) ||
      event.locationAr.includes(query)
    );
  };

  const getEventsByCategory = (category: Event['category']): Event[] => {
    return events.filter(event => event.category === category);
  };

  const getFeaturedEvents = (): Event[] => {
    return events.filter(event => event.isFeatured);
  };

  const getNearbyEvents = (latitude: number, longitude: number, radius: number): Event[] => {
    return events.filter(event => {
      if (!event.latitude || !event.longitude) return false;
      
      const distance = getDistance(latitude, longitude, event.latitude, event.longitude);
      return distance <= radius;
    });
  };

  // Helper function to calculate distance between two coordinates
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const value: EventContextType = {
    events,
    bookings,
    isLoading,
    getEventById,
    getBookingById,
    bookEvent,
    cancelBooking,
    markTicketAsUsed,
    searchEvents,
    getEventsByCategory,
    getFeaturedEvents,
    getNearbyEvents,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
}
