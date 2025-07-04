import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  content: string;
  timestamp: string;
  isRead: boolean;
  messageType: 'text' | 'image' | 'file';
  attachmentUrl?: string;
}

export interface Chat {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolNameAr: string;
  userId: string;
  userName: string;
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  image: string;
  location: string;
  locationAr: string;
  phone: string;
  email: string;
  website?: string;
  adminIds: string[];
  isOnline: boolean;
  responseTime: string;
}

interface ChatContextType {
  chats: Chat[];
  messages: Message[];
  schools: School[];
  isLoading: boolean;
  getSchoolById: (id: string) => School | undefined;
  getChatById: (id: string) => Chat | undefined;
  getMessagesByChatId: (chatId: string) => Message[];
  createChat: (schoolId: string) => Promise<Chat>;
  sendMessage: (chatId: string, content: string, messageType?: 'text' | 'image' | 'file', attachmentUrl?: string) => Promise<Message>;
  markMessagesAsRead: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  searchSchools: (query: string) => School[];
  getUnreadChatsCount: () => number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Active mock data for schools
const mockSchools: School[] = [
  {
    id: '1',
    name: 'International School of Tripoli',
    nameAr: 'المدرسة الدولية طرابلس',
    description: 'Leading international education in Libya with modern facilities and qualified teachers.',
    descriptionAr: 'رائدة في التعليم الدولي في ليبيا مع مرافق حديثة ومعلمين مؤهلين.',
    image: 'https://images.pexels.com/photos/289737/pexels-photo-289737.jpeg',
    location: 'Tripoli, Libya',
    locationAr: 'طرابلس، ليبيا',
    phone: '+218-21-123-4567',
    email: 'info@ist.ly',
    website: 'www.ist.ly',
    adminIds: ['admin1', 'admin2'],
    isOnline: true,
    responseTime: 'Usually responds within 30 minutes',
  },
  {
    id: '2',
    name: 'Benghazi American School',
    nameAr: 'المدرسة الأمريكية بنغازي',
    description: 'American curriculum school providing quality education since 1995.',
    descriptionAr: 'مدرسة منهج أمريكي تقدم تعليماً عالي الجودة منذ 1995.',
    image: 'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg',
    location: 'Benghazi, Libya',
    locationAr: 'بنغازي، ليبيا',
    phone: '+218-61-987-6543',
    email: 'contact@bas.ly',
    adminIds: ['admin3'],
    isOnline: false,
    responseTime: 'Usually responds within 2 hours',
  },
  {
    id: '3',
    name: 'Libya International Academy',
    nameAr: 'أكاديمية ليبيا الدولية',
    description: 'Bilingual education with focus on science and technology.',
    descriptionAr: 'تعليم ثنائي اللغة مع التركيز على العلوم والتكنولوجيا.',
    image: 'https://images.pexels.com/photos/1454360/pexels-photo-1454360.jpeg',
    location: 'Misrata, Libya',
    locationAr: 'مصراتة، ليبيا',
    phone: '+218-51-555-0123',
    email: 'info@lia.ly',
    adminIds: ['admin4', 'admin5'],
    isOnline: true,
    responseTime: 'Usually responds within 1 hour',
  },
  {
    id: '4',
    name: 'Green Mountain School',
    nameAr: 'مدرسة الجبل الأخضر',
    description: 'Environmental-focused education in the heart of Cyrenaica.',
    descriptionAr: 'تعليم يركز على البيئة في قلب برقة.',
    image: 'https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg',
    location: 'Al Bayda, Libya',
    locationAr: 'البيضاء، ليبيا',
    phone: '+218-84-222-3333',
    email: 'contact@gms.ly',
    adminIds: ['admin6'],
    isOnline: true,
    responseTime: 'Usually responds within 45 minutes',
  },
];

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [schools] = useState<School[]>(mockSchools);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadChatsFromStorage();
    loadMessagesFromStorage();
    // Simulate receiving new messages
    const interval = setInterval(() => {
      simulateIncomingMessage();
    }, 45000); // Every 45 seconds

    return () => clearInterval(interval);
  }, []);

  const loadChatsFromStorage = async () => {
    try {
      const storedChats = await AsyncStorage.getItem('chats');
      if (storedChats) {
        setChats(JSON.parse(storedChats));
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadMessagesFromStorage = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem('messages');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveChatsToStorage = async (updatedChats: Chat[]) => {
    try {
      await AsyncStorage.setItem('chats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  };

  const saveMessagesToStorage = async (updatedMessages: Message[]) => {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const simulateIncomingMessage = () => {
    if (chats.length === 0) return;

    const randomChat = chats[Math.floor(Math.random() * chats.length)];
    const school = getSchoolById(randomChat.schoolId);
    if (!school || !school.isOnline) return;

    const responses = [
      'شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.',
      'تم استلام رسالتك. هل يمكنك تقديم المزيد من التفاصيل؟',
      'نحن هنا لمساعدتك. ما هو السؤال المحدد الذي تريد الاستفسار عنه؟',
      'مرحباً! كيف يمكن لفريق الإدارة مساعدتك؟',
      'شكراً لاهتمامك بمدرستنا. سنتواصل معك قريباً.',
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    const adminMessage: Message = {
      id: Date.now().toString(),
      chatId: randomChat.id,
      senderId: school.adminIds[0],
      senderName: `${school.name} Admin`,
      senderType: 'admin',
      content: randomResponse,
      timestamp: new Date().toISOString(),
      isRead: false,
      messageType: 'text',
    };

    const updatedMessages = [...messages, adminMessage];
    setMessages(updatedMessages);
    saveMessagesToStorage(updatedMessages);

    // Update chat with last message and increment unread count
    const updatedChats = chats.map(c =>
      c.id === randomChat.id
        ? { 
            ...c, 
            lastMessage: adminMessage, 
            unreadCount: c.unreadCount + 1,
            updatedAt: new Date().toISOString() 
          }
        : c
    );
    setChats(updatedChats);
    saveChatsToStorage(updatedChats);
  };

  const getSchoolById = (id: string): School | undefined => {
    return schools.find(school => school.id === id);
  };

  const getChatById = (id: string): Chat | undefined => {
    return chats.find(chat => chat.id === id);
  };

  const getMessagesByChatId = (chatId: string): Message[] => {
    return messages
      .filter(message => message.chatId === chatId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const createChat = async (schoolId: string): Promise<Chat> => {
    const school = getSchoolById(schoolId);
    if (!school) throw new Error('School not found');

    // Check if chat already exists
    const existingChat = chats.find(chat => chat.schoolId === schoolId);
    if (existingChat) return existingChat;

    const newChat: Chat = {
      id: Date.now().toString(),
      schoolId,
      schoolName: school.name,
      schoolNameAr: school.nameAr,
      userId: 'current-user-id',
      userName: 'Current User',
      unreadCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    await saveChatsToStorage(updatedChats);

    // Send welcome message from school admin
    setTimeout(() => {
      sendWelcomeMessage(newChat.id, school);
    }, 1000);

    return newChat;
  };

  const sendWelcomeMessage = async (chatId: string, school: School) => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      chatId,
      senderId: school.adminIds[0],
      senderName: `${school.name} Admin`,
      senderType: 'admin',
      content: `مرحباً بك في ${school.nameAr}! كيف يمكننا مساعدتك اليوم؟`,
      timestamp: new Date().toISOString(),
      isRead: false,
      messageType: 'text',
    };

    const updatedMessages = [...messages, welcomeMessage];
    setMessages(updatedMessages);
    await saveMessagesToStorage(updatedMessages);

    // Update chat with last message
    const updatedChats = chats.map(chat =>
      chat.id === chatId
        ? { ...chat, lastMessage: welcomeMessage, unreadCount: chat.unreadCount + 1, updatedAt: new Date().toISOString() }
        : chat
    );
    setChats(updatedChats);
    await saveChatsToStorage(updatedChats);
  };

  const sendMessage = async (
    chatId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    attachmentUrl?: string
  ): Promise<Message> => {
    const chat = getChatById(chatId);
    if (!chat) throw new Error('Chat not found');

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId,
      senderId: 'current-user-id',
      senderName: 'Current User',
      senderType: 'user',
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
      messageType,
      attachmentUrl,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    await saveMessagesToStorage(updatedMessages);

    // Update chat with last message
    const updatedChats = chats.map(c =>
      c.id === chatId
        ? { ...c, lastMessage: newMessage, updatedAt: new Date().toISOString() }
        : c
    );
    setChats(updatedChats);
    await saveChatsToStorage(updatedChats);

    // Simulate admin response after a delay
    setTimeout(() => {
      simulateAdminResponse(chatId);
    }, 2000 + Math.random() * 3000);

    return newMessage;
  };

  const simulateAdminResponse = async (chatId: string) => {
    const chat = getChatById(chatId);
    if (!chat) return;

    const school = getSchoolById(chat.schoolId);
    if (!school || !school.isOnline) return;

    const responses = [
      'شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.',
      'تم استلام رسالتك. هل يمكنك تقديم المزيد من التفاصيل؟',
      'نحن هنا لمساعدتك. ما هو السؤال المحدد الذي تريد الاستفسار عنه؟',
      'مرحباً! كيف يمكن لفريق الإدارة مساعدتك؟',
      'شكراً لاهتمامك بمدرستنا. سنتواصل معك قريباً.',
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    const adminMessage: Message = {
      id: Date.now().toString(),
      chatId,
      senderId: school.adminIds[0],
      senderName: `${school.name} Admin`,
      senderType: 'admin',
      content: randomResponse,
      timestamp: new Date().toISOString(),
      isRead: false,
      messageType: 'text',
    };

    const updatedMessages = [...messages, adminMessage];
    setMessages(updatedMessages);
    await saveMessagesToStorage(updatedMessages);

    // Update chat with last message and increment unread count
    const updatedChats = chats.map(c =>
      c.id === chatId
        ? { 
            ...c, 
            lastMessage: adminMessage, 
            unreadCount: c.unreadCount + 1,
            updatedAt: new Date().toISOString() 
          }
        : c
    );
    setChats(updatedChats);
    await saveChatsToStorage(updatedChats);
  };

  const markMessagesAsRead = async (chatId: string): Promise<void> => {
    const updatedMessages = messages.map(message =>
      message.chatId === chatId && !message.isRead
        ? { ...message, isRead: true }
        : message
    );
    setMessages(updatedMessages);
    await saveMessagesToStorage(updatedMessages);

    // Reset unread count for chat
    const updatedChats = chats.map(chat =>
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    );
    setChats(updatedChats);
    await saveChatsToStorage(updatedChats);
  };

  const deleteChat = async (chatId: string): Promise<void> => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    const updatedMessages = messages.filter(message => message.chatId !== chatId);
    
    setChats(updatedChats);
    setMessages(updatedMessages);
    
    await saveChatsToStorage(updatedChats);
    await saveMessagesToStorage(updatedMessages);
  };

  const searchSchools = (query: string): School[] => {
    const lowercaseQuery = query.toLowerCase();
    return schools.filter(school =>
      school.name.toLowerCase().includes(lowercaseQuery) ||
      school.nameAr.includes(query) ||
      school.location.toLowerCase().includes(lowercaseQuery) ||
      school.locationAr.includes(query)
    );
  };

  const getUnreadChatsCount = (): number => {
    return chats.reduce((count, chat) => count + chat.unreadCount, 0);
  };

  const value: ChatContextType = {
    chats,
    messages,
    schools,
    isLoading,
    getSchoolById,
    getChatById,
    getMessagesByChatId,
    createChat,
    sendMessage,
    markMessagesAsRead,
    deleteChat,
    searchSchools,
    getUnreadChatsCount,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
