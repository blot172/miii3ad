import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  type: 'event_reminder' | 'message' | 'like' | 'comment' | 'booking_confirmed' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  imageUrl?: string;
  fromUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  getNotificationsByType: (type: Notification['type']) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Active mock notifications data
const initialNotifications: Notification[] = [
  {
    id: '2',
    type: 'event_reminder',
    title: 'تذكير بالفعالية',
    message: 'مؤتمر التحول الرقمي الحكومي يبدأ خلال ساعة',
    isRead: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    actionUrl: '/event/1',
    imageUrl: 'https://images.pexels.com/photos/3184435/pexels-photo-3184435.jpeg',
  },
  {
    id: '3',
    type: 'message',
    title: 'رسالة جديدة',
    message: 'أحمد محمد أرسل لك رسالة',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/chat',
    fromUser: {
      id: '1',
      name: 'أحمد محمد',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    },
  },
  {
    id: '4',
    type: 'like',
    title: 'إعجاب جديد',
    message: 'فاطمة علي أعجبت بمنشورك',
    isRead: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    fromUser: {
      id: '2',
      name: 'فاطمة علي',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
    },
  },
  {
    id: '5',
    type: 'booking_confirmed',
    title: 'تأكيد الحجز',
    message: 'تم تأكيد حجزك لفعالية معرض المدارس الدولية',
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/bookings',
    imageUrl: 'https://images.pexels.com/photos/289737/pexels-photo-289737.jpeg',
  },
  {
    id: '6',
    type: 'system',
    title: 'تحديث التطبيق',
    message: 'إصدار جديد من التطبيق متاح الآن',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/settings',
  },
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Simulate receiving new notifications
    const interval = setInterval(() => {
      simulateNewNotification();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        setNotifications([...initialNotifications, ...parsed]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = async (updatedNotifications: Notification[]) => {
    try {
      // Only save user-generated notifications, not the initial ones
      const userNotifications = updatedNotifications.filter(n => 
        !initialNotifications.some(initial => initial.id === n.id)
      );
      await AsyncStorage.setItem('notifications', JSON.stringify(userNotifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const simulateNewNotification = () => {
    const randomNotifications = [
      {
        type: 'message' as const,
        title: 'رسالة جديدة',
        message: 'لديك رسالة جديدة من صديق',
        actionUrl: '/chat',
      },
      {
        type: 'like' as const,
        title: 'إعجاب جديد',
        message: 'أعجب شخص ما بمنشورك',
      },
    ];

    const randomNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
    
    // Only add if there are less than 10 notifications to avoid spam
    if (notifications.length < 10) {
      addNotification(randomNotification);
    }
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      );
      setNotifications(updatedNotifications);
      await saveNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        isRead: true,
      }));
      setNotifications(updatedNotifications);
      await saveNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
      const updatedNotifications = notifications.filter(
        notification => notification.id !== notificationId
      );
      setNotifications(updatedNotifications);
      await saveNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async (): Promise<void> => {
    try {
      setNotifications([]);
      await saveNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const addNotification = async (
    notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
  ): Promise<void> => {
    try {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      const updatedNotifications = [newNotification, ...notifications];
      setNotifications(updatedNotifications);
      await saveNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const getNotificationsByType = (type: Notification['type']): Notification[] => {
    return notifications.filter(notification => notification.type === type);
  };

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
    getNotificationsByType,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
