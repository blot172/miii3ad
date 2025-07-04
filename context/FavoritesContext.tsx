import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedPost {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  author: string;
  savedDate: string;
  category: string;
  likes: number;
  isLiked: boolean;
}

export interface SavedEvent {
  id: string;
  eventId: string;
  savedDate: string;
}

interface FavoritesContextType {
  savedPosts: SavedPost[];
  savedEvents: SavedEvent[];
  isPostSaved: (postId: string) => boolean;
  isEventSaved: (eventId: string) => boolean;
  savePost: (post: SavedPost) => Promise<void>;
  unsavePost: (postId: string) => Promise<void>;
  saveEvent: (eventId: string) => Promise<void>;
  unsaveEvent: (eventId: string) => Promise<void>;
  getSavedPostsCount: () => number;
  getSavedEventsCount: () => number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);

  useEffect(() => {
    loadSavedItems();
  }, []);

  const loadSavedItems = async () => {
    try {
      const [postsData, eventsData] = await Promise.all([
        AsyncStorage.getItem('savedPosts'),
        AsyncStorage.getItem('savedEvents')
      ]);

      if (postsData) {
        setSavedPosts(JSON.parse(postsData));
      }
      if (eventsData) {
        setSavedEvents(JSON.parse(eventsData));
      }
    } catch (error) {
      console.error('Error loading saved items:', error);
    }
  };

  const savePosts = async (posts: SavedPost[]) => {
    try {
      await AsyncStorage.setItem('savedPosts', JSON.stringify(posts));
    } catch (error) {
      console.error('Error saving posts:', error);
    }
  };

  const saveEventsData = async (events: SavedEvent[]) => {
    try {
      await AsyncStorage.setItem('savedEvents', JSON.stringify(events));
    } catch (error) {
      console.error('Error saving events:', error);
    }
  };

  const isPostSaved = (postId: string): boolean => {
    return savedPosts.some(post => post.id === postId);
  };

  const isEventSaved = (eventId: string): boolean => {
    return savedEvents.some(event => event.eventId === eventId);
  };

  const savePost = async (post: SavedPost): Promise<void> => {
    const postWithSaveDate = {
      ...post,
      savedDate: new Date().toISOString(),
    };
    
    const updatedPosts = [postWithSaveDate, ...savedPosts];
    setSavedPosts(updatedPosts);
    await savePosts(updatedPosts);
  };

  const unsavePost = async (postId: string): Promise<void> => {
    const updatedPosts = savedPosts.filter(post => post.id !== postId);
    setSavedPosts(updatedPosts);
    await savePosts(updatedPosts);
  };

  const saveEvent = async (eventId: string): Promise<void> => {
    const savedEvent: SavedEvent = {
      id: Date.now().toString(),
      eventId,
      savedDate: new Date().toISOString(),
    };
    
    const updatedEvents = [savedEvent, ...savedEvents];
    setSavedEvents(updatedEvents);
    await saveEventsData(updatedEvents);
  };

  const unsaveEvent = async (eventId: string): Promise<void> => {
    const updatedEvents = savedEvents.filter(event => event.eventId !== eventId);
    setSavedEvents(updatedEvents);
    await saveEventsData(updatedEvents);
  };

  const getSavedPostsCount = (): number => savedPosts.length;
  const getSavedEventsCount = (): number => savedEvents.length;

  const value: FavoritesContextType = {
    savedPosts,
    savedEvents,
    isPostSaved,
    isEventSaved,
    savePost,
    unsavePost,
    saveEvent,
    unsaveEvent,
    getSavedPostsCount,
    getSavedEventsCount,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
