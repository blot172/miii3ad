import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, TextInput, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useChat, Chat } from '@/context/ChatContext';
import { router } from 'expo-router';
import { Search, MessageCircle, Trash2, ArrowLeft, Plus } from 'lucide-react-native';

const { height } = Dimensions.get('window');

export default function ChatListScreen() {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const { chats, deleteChat, getSchoolById, getUnreadChatsCount } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Simulate refreshing chats
    const refreshChats = async () => {
      setIsRefreshing(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsRefreshing(false);
    };

    refreshChats();
  }, []);

  const filteredChats = chats.filter(chat => {
    const school = getSchoolById(chat.schoolId);
    if (!school) return false;
    
    const schoolName = locale === 'ar' ? school.nameAr : school.name;
    return schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           chat.lastMessage?.content.includes(searchQuery);
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      'حذف المحادثة',
      'هل أنت متأكد من رغبتك في حذف هذه المحادثة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChat(chatId);
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف المحادثة');
            }
          },
        },
      ]
    );
  };

  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    // Simulate a refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

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

  const renderChatItem = (chat: Chat) => {
    const school = getSchoolById(chat.schoolId);
    if (!school) return null;

    const schoolName = locale === 'ar' ? school.nameAr : school.name;
    const lastMessageTime = chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : '';

    return (
      <TouchableOpacity
        key={chat.id}
        style={[styles.chatItem, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}
        onPress={() => router.push(`/chat/${chat.id}`)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: school.image }} style={styles.schoolAvatar} />
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.schoolName, { color: theme.colors.text }]} numberOfLines={1}>{schoolName}</Text>
            <View style={styles.chatMeta}>
              {lastMessageTime && (
                <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>{lastMessageTime}</Text>
              )}
              {chat.unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.unreadBadgeText}>{chat.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.lastMessageContainer}>
            <Text style={[
              styles.lastMessage,
              { color: theme.colors.textSecondary },
              chat.unreadCount > 0 && [styles.lastMessageUnread, { color: theme.colors.text }]
            ]} numberOfLines={2}>
              {chat.lastMessage?.content || 'لا توجد رسائل بعد'}
            </Text>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteChat(chat.id)}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color="#EF4444" />
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
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    newChatButton: {
      padding: 8,
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
    chatList: {
      flexGrow: 1,
      paddingBottom: 100, // Extra padding for tab bar
    },
    chatItem: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    schoolAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginRight: 16,
      backgroundColor: theme.colors.border,
    },
    chatContent: {
      flex: 1,
    },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    schoolName: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      flex: 1,
    },
    chatMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timeText: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
    },
    unreadBadge: {
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
    lastMessageContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    lastMessage: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      flex: 1,
      lineHeight: 20,
    },
    lastMessageUnread: {
      fontFamily: 'Cairo-SemiBold',
    },
    deleteButton: {
      padding: 8,
      marginLeft: 8,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
      minHeight: height - 200, // Ensure it fills most of the screen
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
    startChatButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    startChatButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>المحادثات</Text>
          
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => router.push('/(tabs)/schools')}
            activeOpacity={0.7}
          >
            <Plus size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث في المحادثات..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
        </View>
      </View>

      {/* Chat List */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.chatList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {filteredChats.length > 0 ? (
          filteredChats.map(renderChatItem)
        ) : (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color={theme.colors.border} />
            <Text style={styles.emptyStateTitle}>لا توجد محادثات</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'لم يتم العثور على محادثات تطابق البحث'
                : 'ابدأ محادثة جديدة مع إحدى المدارس'
              }
            </Text>
            <TouchableOpacity
              style={styles.startChatButton}
              onPress={() => router.push('/(tabs)/schools')}
              activeOpacity={0.7}
            >
              <Text style={styles.startChatButtonText}>تصفح المدارس</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
