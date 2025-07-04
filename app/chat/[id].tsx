import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useChat, Message } from '@/context/ChatContext';
import { ArrowLeft, Send, Phone, Video, MoveVertical as MoreVertical, Image as ImageIcon, Paperclip } from 'lucide-react-native';

const { height } = Dimensions.get('window');

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useI18n();
  const { theme } = useTheme();
  const { getChatById, getSchoolById, getMessagesByChatId, sendMessage, markMessagesAsRead } = useChat();
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const chat = getChatById(id);
  const school = chat ? getSchoolById(chat.schoolId) : null;

  useEffect(() => {
    if (chat) {
      const chatMessages = getMessagesByChatId(chat.id);
      setMessages(chatMessages);
      markMessagesAsRead(chat.id);
    }

    // Set up interval to check for new messages
    const interval = setInterval(() => {
      if (chat) {
        const updatedMessages = getMessagesByChatId(chat.id);
        if (updatedMessages.length !== messages.length) {
          setMessages(updatedMessages);
          markMessagesAsRead(chat.id);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [chat, id]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !chat || isSending) return;

    try {
      setIsSending(true);
      const newMessage = await sendMessage(chat.id, messageText.trim());
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
      
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إرسال الرسالة');
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(locale === 'ar' ? 'ar-LY' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'اليوم';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'أمس';
    } else {
      return date.toLocaleDateString(locale === 'ar' ? 'ar-LY' : 'en-US');
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.senderType === 'user';
    const showDate = index === 0 || 
      new Date(message.timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString();

    return (
      <View key={message.id}>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>{formatMessageDate(message.timestamp)}</Text>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.adminMessageContainer
        ]}>
          {!isUser && (
            <Image source={{ uri: school?.image }} style={styles.senderAvatar} />
          )}
          
          <View style={[
            styles.messageBubble,
            isUser ? [styles.userMessageBubble, { backgroundColor: theme.colors.primary }] : [styles.adminMessageBubble, { backgroundColor: theme.colors.surface }]
          ]}>
            {!isUser && (
              <Text style={[styles.senderName, { color: theme.colors.primary }]}>{message.senderName}</Text>
            )}
            
            <Text style={[
              styles.messageText,
              isUser ? styles.userMessageText : [styles.adminMessageText, { color: theme.colors.text }]
            ]}>
              {message.content}
            </Text>
            
            <View style={[
              styles.messageFooter,
              isUser ? styles.userMessageFooter : styles.adminMessageFooter
            ]}>
              <Text style={[
                styles.messageTime,
                isUser ? styles.userMessageTime : [styles.adminMessageTime, { color: theme.colors.textSecondary }]
              ]}>
                {formatMessageTime(message.timestamp)}
              </Text>
              
              {isUser && (
                <View style={styles.messageStatus}>
                  <View style={[
                    styles.statusDot,
                    message.isRead ? styles.readStatus : styles.sentStatus
                  ]} />
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (!chat || !school) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>المحادثة غير موجودة</Text>
          <TouchableOpacity
            style={[styles.backToChatsButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/chat')}
            activeOpacity={0.7}
          >
            <Text style={styles.backToChatsButtonText}>العودة للمحادثات</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const schoolName = locale === 'ar' ? school.nameAr : school.name;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    header: {
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: theme.colors.border,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerActionButton: {
      padding: 8,
    },
    messagesContainer: {
      flex: 1,
    },
    messagesContent: {
      padding: 16,
      paddingBottom: 20,
    },
    dateSeparator: {
      alignItems: 'center',
      marginVertical: 16,
    },
    dateText: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    messageContainer: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    userMessageContainer: {
      justifyContent: 'flex-end',
    },
    adminMessageContainer: {
      justifyContent: 'flex-start',
    },
    senderAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 8,
      backgroundColor: theme.colors.border,
    },
    messageBubble: {
      maxWidth: '75%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
    },
    userMessageBubble: {
      borderBottomRightRadius: 4,
    },
    adminMessageBubble: {
      borderBottomLeftRadius: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    senderName: {
      fontSize: 12,
      fontFamily: 'Cairo-SemiBold',
      marginBottom: 4,
    },
    messageText: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      lineHeight: 22,
    },
    userMessageText: {
      color: 'white',
    },
    adminMessageText: {
      color: theme.colors.text,
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    userMessageFooter: {
      justifyContent: 'flex-end',
    },
    adminMessageFooter: {
      justifyContent: 'flex-start',
    },
    messageTime: {
      fontSize: 11,
      fontFamily: 'Cairo-Regular',
    },
    userMessageTime: {
      color: 'rgba(255, 255, 255, 0.8)',
    },
    adminMessageTime: {
      color: theme.colors.textSecondary,
    },
    messageStatus: {
      marginLeft: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    readStatus: {
      backgroundColor: '#10B981',
    },
    sentStatus: {
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    inputContainer: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    attachmentButton: {
      padding: 8,
    },
    messageInput: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      maxHeight: 100,
      color: theme.colors.text,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    sendButtonInactive: {
      backgroundColor: theme.colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      minHeight: height - 200,
    },
    errorText: {
      fontSize: 18,
      fontFamily: 'Cairo-Regular',
      marginBottom: 24,
    },
    backToChatsButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    backToChatsButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
    },
    emptyChat: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      minHeight: height - 300,
    },
    emptyChatText: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/chat')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Image source={{ uri: school.image }} style={styles.headerAvatar} />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle} numberOfLines={1}>{schoolName}</Text>
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
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerActionButton}
              activeOpacity={0.7}
            >
              <Phone size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerActionButton}
              activeOpacity={0.7}
            >
              <Video size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerActionButton}
              activeOpacity={0.7}
            >
              <MoreVertical size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && { flexGrow: 1, justifyContent: 'center' }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {messages.length > 0 ? (
            messages.map(renderMessage)
          ) : (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>
                ابدأ المحادثة مع {schoolName} بإرسال رسالة...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity 
              style={styles.attachmentButton}
              activeOpacity={0.7}
            >
              <Paperclip size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.attachmentButton}
              activeOpacity={0.7}
            >
              <ImageIcon size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.messageInput}
              placeholder="اكتب رسالة..."
              placeholderTextColor={theme.colors.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
              textAlign="right"
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                messageText.trim() && !isSending ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || isSending}
              activeOpacity={0.7}
            >
              <Send size={20} color={messageText.trim() && !isSending ? 'white' : theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
