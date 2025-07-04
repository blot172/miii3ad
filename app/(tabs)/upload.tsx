import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { Camera, Image as ImageIcon, Upload, X, Loader, CircleCheck as CheckCircle, CircleAlert as AlertCircle, FileImage, Folder, Calendar, MapPin, DollarSign, Users, Info } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSharedValue, useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { TextInput } from 'react-native';

interface MediaItem {
  id: string;
  type: 'image';
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  uploadProgress?: number;
}

interface EventFormData {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: 'government' | 'schools' | 'clinics' | 'occasions' | 'entertainment' | 'openings';
  date: string;
  time: string;
  location: string;
  locationAr: string;
  price: string;
  maxAttendees: string;
  image: string;
}

const { width } = Dimensions.get('window');

export default function UploadScreen() {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const { isBusinessAccount } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState<'media' | 'event'>('media');
  const [eventForm, setEventForm] = useState<EventFormData>({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    category: 'entertainment',
    date: '',
    time: '',
    location: '',
    locationAr: '',
    price: '0',
    maxAttendees: '100',
    image: '',
  });
  
  const scrollY = useSharedValue(0);

  // Create onScroll handler function using Reanimated
  const animatedScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      // Call the global tab bar scroll handler if it exists
      if (global.tabBarScrollHandler) {
        runOnJS(global.tabBarScrollHandler)(event.contentOffset.y);
      }
    },
  });

  // Create a unified scroll handler that works on all platforms
  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Call the global tab bar scroll handler if it exists
    if (global.tabBarScrollHandler) {
      global.tabBarScrollHandler(scrollY);
    }

    // For native platforms, also call the animated scroll handler if it's a function
    if (Platform.OS !== 'web' && typeof animatedScrollHandler === 'function') {
      animatedScrollHandler(event);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'نحتاج إلى إذن للوصول إلى معرض الصور');
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
        selectionLimit: 10, // Limit to 10 images
      });

      if (!result.canceled && result.assets) {
        const newMedia: MediaItem[] = result.assets.map((asset, index) => ({
          id: Date.now().toString() + index,
          type: 'image',
          uri: asset.uri,
          name: asset.fileName || `صورة_${Date.now()}_${index}.jpg`,
          size: asset.fileSize,
          mimeType: asset.mimeType,
          uploadStatus: 'pending',
          uploadProgress: 0,
        }));
        setSelectedMedia(prev => [...prev, ...newMedia]);
        
        // If in event mode and no image selected yet, use the first image
        if (uploadMode === 'event' && !eventForm.image && newMedia.length > 0) {
          setEventForm(prev => ({ ...prev, image: newMedia[0].uri }));
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('خطأ', 'فشل في اختيار الصور');
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('غير متاح', 'الكاميرا غير متاحة على الويب. يرجى استخدام خيار اختيار من المعرض.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطأ', 'نحتاج إلى إذن للوصول إلى الكاميرا');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newMedia: MediaItem = {
          id: Date.now().toString(),
          type: 'image',
          uri: asset.uri,
          name: `كاميرا_${Date.now()}.jpg`,
          size: asset.fileSize,
          mimeType: asset.mimeType,
          uploadStatus: 'pending',
          uploadProgress: 0,
        };
        setSelectedMedia(prev => [...prev, newMedia]);
        
        // If in event mode and no image selected yet, use this image
        if (uploadMode === 'event' && !eventForm.image) {
          setEventForm(prev => ({ ...prev, image: asset.uri }));
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('خطأ', 'فشل في التقاط الصورة');
    }
  };

  const removeMedia = (id: string) => {
    setSelectedMedia(prev => prev.filter(item => item.id !== id));
    
    // If this was the event image, clear it
    const removedItem = selectedMedia.find(item => item.id === id);
    if (removedItem && eventForm.image === removedItem.uri) {
      setEventForm(prev => ({ ...prev, image: '' }));
    }
  };

  const clearAllMedia = () => {
    Alert.alert(
      'مسح جميع الصور',
      'هل أنت متأكد من رغبتك في مسح جميع الصور المحددة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مسح الكل',
          style: 'destructive',
          onPress: () => {
            setSelectedMedia([]);
            if (uploadMode === 'event') {
              setEventForm(prev => ({ ...prev, image: '' }));
            }
          }
        }
      ]
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const simulateUpload = async (item: MediaItem, index: number): Promise<boolean> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Update item status
          setSelectedMedia(prev => 
            prev.map(media => 
              media.id === item.id 
                ? { ...media, uploadStatus: 'success', uploadProgress: 100 }
                : media
            )
          );
          
          resolve(true);
        } else {
          // Update progress
          setSelectedMedia(prev => 
            prev.map(media => 
              media.id === item.id 
                ? { ...media, uploadStatus: 'uploading', uploadProgress: progress }
                : media
            )
          );
        }
      }, 100 + Math.random() * 200);
    });
  };

  const uploadMedia = async () => {
    if (selectedMedia.length === 0) {
      Alert.alert('تنبيه', 'يرجى اختيار صور للرفع');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Reset all items to uploading status
      setSelectedMedia(prev => 
        prev.map(item => ({ ...item, uploadStatus: 'uploading' as const, uploadProgress: 0 }))
      );

      // Upload items one by one
      for (let i = 0; i < selectedMedia.length; i++) {
        const item = selectedMedia[i];
        await simulateUpload(item, i);
        setUploadProgress(((i + 1) / selectedMedia.length) * 100);
      }
      
      Alert.alert(
        'تم الرفع بنجاح! 🎉',
        `تم رفع ${selectedMedia.length} صورة بنجاح إلى الخادم`,
        [
          {
            text: 'عرض النتائج',
            onPress: () => {
              // Keep the results visible for review
            }
          },
          {
            text: 'رفع المزيد',
            onPress: () => {
              setSelectedMedia([]);
              setUploadProgress(0);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('خطأ في الرفع', 'فشل في رفع بعض الصور. يرجى المحاولة مرة أخرى.');
      
      // Mark failed items
      setSelectedMedia(prev => 
        prev.map(item => 
          item.uploadStatus === 'uploading' 
            ? { ...item, uploadStatus: 'error' as const }
            : item
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  const createEvent = async () => {
    // Validate form
    if (!eventForm.title || !eventForm.titleAr || !eventForm.date || !eventForm.location || !eventForm.image) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsUploading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'تم إنشاء الفعالية! 🎉',
        'تم إنشاء الفعالية بنجاح وستظهر في قائمة الفعاليات قريباً',
        [
          {
            text: 'عرض الفعاليات',
            onPress: () => router.push('/(tabs)/events')
          },
          {
            text: 'إنشاء فعالية أخرى',
            onPress: () => {
              setEventForm({
                title: '',
                titleAr: '',
                description: '',
                descriptionAr: '',
                category: 'entertainment',
                date: '',
                time: '',
                location: '',
                locationAr: '',
                price: '0',
                maxAttendees: '100',
                image: '',
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Event creation error:', error);
      Alert.alert('خطأ', 'فشل في إنشاء الفعالية. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
    }
  };

  const retryFailedUploads = async () => {
    const failedItems = selectedMedia.filter(item => item.uploadStatus === 'error');
    if (failedItems.length === 0) return;

    setIsUploading(true);
    
    try {
      for (const item of failedItems) {
        await simulateUpload(item, 0);
      }
      Alert.alert('نجح!', 'تم رفع جميع الصور المتبقية بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إعادة رفع بعض الصور');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: MediaItem['uploadStatus']) => {
    switch (status) {
      case 'uploading':
        return <Loader size={16} color={theme.colors.primary} />;
      case 'success':
        return <CheckCircle size={16} color={theme.colors.success} />;
      case 'error':
        return <AlertCircle size={16} color={theme.colors.error} />;
      default:
        return <FileImage size={16} color={theme.colors.textSecondary} />;
    }
  };

  const getStatusColor = (status: MediaItem['uploadStatus']) => {
    switch (status) {
      case 'uploading':
        return theme.colors.primary;
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderMediaItem = (item: MediaItem) => {
    const cardWidth = (width - 60) / 2; // Account for padding and gap
    
    return (
      <View key={item.id} style={[styles.mediaItem, { backgroundColor: theme.colors.surface, width: cardWidth }]}>
        <View style={styles.mediaPreview}>
          <Image source={{ uri: item.uri }} style={styles.mediaImage} />
          
          {/* Upload Progress Overlay */}
          {item.uploadStatus === 'uploading' && (
            <View style={styles.progressOverlay}>
              <View style={[styles.progressBar, { width: `${item.uploadProgress || 0}%` }]} />
            </View>
          )}
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.uploadStatus) }]}>
            {getStatusIcon(item.uploadStatus)}
          </View>
          
          {/* Remove Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeMedia(item.id)}
            activeOpacity={0.7}
          >
            <X size={16} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.mediaInfo}>
          <Text style={[styles.mediaName, { color: theme.colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.mediaDetails}>
            {item.size && (
              <Text style={[styles.mediaSize, { color: theme.colors.textSecondary }]}>
                {formatFileSize(item.size)}
              </Text>
            )}
            {item.uploadStatus === 'uploading' && (
              <Text style={[styles.uploadProgress, { color: theme.colors.primary }]}>
                {Math.round(item.uploadProgress || 0)}%
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEventForm = () => {
    return (
      <View style={styles.eventForm}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>إنشاء فعالية جديدة</Text>
        
        {/* Event Image */}
        <TouchableOpacity 
          style={styles.eventImagePicker}
          onPress={pickImage}
          activeOpacity={0.7}
        >
          {eventForm.image ? (
            <Image source={{ uri: eventForm.image }} style={styles.eventImagePreview} />
          ) : (
            <View style={styles.eventImagePlaceholder}>
              <ImageIcon size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.eventImageText, { color: theme.colors.textSecondary }]}>
                اضغط لاختيار صورة الفعالية
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>عنوان الفعالية (بالعربية) *</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            placeholder="أدخل عنوان الفعالية بالعربية"
            placeholderTextColor={theme.colors.textSecondary}
            value={eventForm.titleAr}
            onChangeText={(text) => setEventForm(prev => ({ ...prev, titleAr: text }))}
            textAlign="right"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>عنوان الفعالية (بالإنجليزية) *</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            placeholder="Enter event title in English"
            placeholderTextColor={theme.colors.textSecondary}
            value={eventForm.title}
            onChangeText={(text) => setEventForm(prev => ({ ...prev, title: text }))}
          />
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>وصف الفعالية (بالعربية)</Text>
          <TextInput
            style={[styles.formTextarea, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            placeholder="أدخل وصف الفعالية بالعربية"
            placeholderTextColor={theme.colors.textSecondary}
            value={eventForm.descriptionAr}
            onChangeText={(text) => setEventForm(prev => ({ ...prev, descriptionAr: text }))}
            multiline
            numberOfLines={4}
            textAlign="right"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>وصف الفعالية (بالإنجليزية)</Text>
          <TextInput
            style={[styles.formTextarea, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            placeholder="Enter event description in English"
            placeholderTextColor={theme.colors.textSecondary}
            value={eventForm.description}
            onChangeText={(text) => setEventForm(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Category */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>فئة الفعالية *</Text>
          <View style={styles.categoryButtons}>
            {[
              { key: 'government', label: 'حكومي' },
              { key: 'schools', label: 'مدارس' },
              { key: 'clinics', label: 'عيادات' },
              { key: 'occasions', label: 'مناسبات' },
              { key: 'entertainment', label: 'ترفيه' },
              { key: 'openings', label: 'افتتاحات' },
            ].map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryButton,
                  { backgroundColor: theme.colors.surface },
                  eventForm.category === cat.key && { 
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary
                  }
                ]}
                onPress={() => setEventForm(prev => ({ ...prev, category: cat.key as any }))}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.categoryButtonText,
                  { color: theme.colors.textSecondary },
                  eventForm.category === cat.key && { color: theme.colors.primary }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date and Time */}
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>التاريخ *</Text>
            <View style={[styles.formInputWithIcon, { backgroundColor: theme.colors.surface }]}>
              <Calendar size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.formInputIcon, { color: theme.colors.text }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textSecondary}
                value={eventForm.date}
                onChangeText={(text) => setEventForm(prev => ({ ...prev, date: text }))}
              />
            </View>
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>الوقت *</Text>
            <View style={[styles.formInputWithIcon, { backgroundColor: theme.colors.surface }]}>
              <Clock size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.formInputIcon, { color: theme.colors.text }]}
                placeholder="HH:MM"
                placeholderTextColor={theme.colors.textSecondary}
                value={eventForm.time}
                onChangeText={(text) => setEventForm(prev => ({ ...prev, time: text }))}
              />
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>الموقع (بالعربية) *</Text>
          <View style={[styles.formInputWithIcon, { backgroundColor: theme.colors.surface }]}>
            <MapPin size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.formInputIcon, { color: theme.colors.text }]}
              placeholder="أدخل موقع الفعالية بالعربية"
              placeholderTextColor={theme.colors.textSecondary}
              value={eventForm.locationAr}
              onChangeText={(text) => setEventForm(prev => ({ ...prev, locationAr: text }))}
              textAlign="right"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>الموقع (بالإنجليزية) *</Text>
          <View style={[styles.formInputWithIcon, { backgroundColor: theme.colors.surface }]}>
            <MapPin size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.formInputIcon, { color: theme.colors.text }]}
              placeholder="Enter event location in English"
              placeholderTextColor={theme.colors.textSecondary}
              value={eventForm.location}
              onChangeText={(text) => setEventForm(prev => ({ ...prev, location: text }))}
            />
          </View>
        </View>

        {/* Price and Capacity */}
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>السعر (د.ل) *</Text>
            <View style={[styles.formInputWithIcon, { backgroundColor: theme.colors.surface }]}>
              <DollarSign size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.formInputIcon, { color: theme.colors.text }]}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                value={eventForm.price}
                onChangeText={(text) => setEventForm(prev => ({ ...prev, price: text.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>الحد الأقصى للحضور *</Text>
            <View style={[styles.formInputWithIcon, { backgroundColor: theme.colors.surface }]}>
              <Users size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.formInputIcon, { color: theme.colors.text }]}
                placeholder="100"
                placeholderTextColor={theme.colors.textSecondary}
                value={eventForm.maxAttendees}
                onChangeText={(text) => setEventForm(prev => ({ ...prev, maxAttendees: text.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.createEventButton,
            isUploading && styles.uploadButtonDisabled
          ]}
          onPress={createEvent}
          disabled={isUploading}
          activeOpacity={0.7}
        >
          {isUploading ? (
            <Loader size={24} color="white" />
          ) : (
            <Calendar size={24} color="white" />
          )}
          <Text style={styles.createEventButtonText}>
            {isUploading ? 'جاري الإنشاء...' : 'إنشاء الفعالية'}
          </Text>
        </TouchableOpacity>

        <View style={styles.eventFormNote}>
          <Info size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.eventFormNoteText, { color: theme.colors.textSecondary }]}>
            سيتم مراجعة الفعالية من قبل الإدارة قبل نشرها
          </Text>
        </View>
      </View>
    );
  };

  const successCount = selectedMedia.filter(item => item.uploadStatus === 'success').length;
  const errorCount = selectedMedia.filter(item => item.uploadStatus === 'error').length;
  const pendingCount = selectedMedia.filter(item => item.uploadStatus === 'pending').length;

  // Check if user is a business account
  const isBusinessUser = isBusinessAccount();

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
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    headerSubtitle: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    content: {
      padding: 20,
      flexGrow: 1,
      paddingBottom: 100, // Extra padding for tab bar
    },
    uploadOptions: {
      gap: 16,
      marginBottom: 32,
    },
    uploadOption: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    uploadOptionIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    uploadOptionContent: {
      flex: 1,
    },
    uploadOptionTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    uploadOptionSubtitle: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    uploadModeSelector: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 24,
    },
    uploadModeButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
    },
    uploadModeButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    uploadModeButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.textSecondary,
    },
    uploadModeButtonTextActive: {
      color: 'white',
    },
    selectedSection: {
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    clearButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: theme.colors.error + '20',
    },
    clearButtonText: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.error,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
    },
    mediaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 16,
    },
    mediaItem: {
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    mediaPreview: {
      position: 'relative',
      height: 120,
    },
    mediaImage: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.border,
    },
    progressOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.colors.primary,
    },
    statusBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    mediaInfo: {
      padding: 12,
    },
    mediaName: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
      marginBottom: 4,
      lineHeight: 18,
    },
    mediaDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    mediaSize: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
    },
    uploadProgress: {
      fontSize: 12,
      fontFamily: 'Cairo-Bold',
    },
    actionButtons: {
      gap: 12,
    },
    uploadButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      gap: 12,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    uploadButtonDisabled: {
      backgroundColor: theme.colors.textSecondary,
      shadowOpacity: 0.1,
    },
    uploadButtonText: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    retryButton: {
      backgroundColor: theme.colors.warning,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    retryButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 64,
    },
    emptyStateIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 32,
    },
    // Event form styles
    eventForm: {
      gap: 16,
    },
    eventImagePicker: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
    },
    eventImagePreview: {
      width: '100%',
      height: '100%',
    },
    eventImagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      borderRadius: 12,
    },
    eventImageText: {
      marginTop: 12,
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
    },
    formGroup: {
      marginBottom: 16,
    },
    formRow: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    formLabel: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      marginBottom: 8,
    },
    formInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
    },
    formInputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    formInputIcon: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      marginLeft: 12,
    },
    formTextarea: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      textAlignVertical: 'top',
      minHeight: 120,
    },
    categoryButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 8,
    },
    categoryButtonText: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
    },
    createEventButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      gap: 12,
      marginTop: 16,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    createEventButtonText: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    eventFormNote: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 8,
      marginTop: 16,
      gap: 8,
    },
    eventFormNoteText: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      flex: 1,
    },
    // Clock component for time picker
    clock: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.textSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    clockHand: {
      width: 1,
      height: 6,
      backgroundColor: theme.colors.textSecondary,
      position: 'absolute',
      bottom: 10,
      left: 10,
      transformOrigin: 'bottom',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>رفع المحتوى</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {isBusinessUser 
            ? 'اختر نوع المحتوى الذي تريد رفعه أو إنشاءه'
            : 'اختر الصور التي تريد رفعها ومشاركتها'
          }
        </Text>
        
        {/* Upload Mode Selector - Only for business users */}
        {isBusinessUser && (
          <View style={styles.uploadModeSelector}>
            <TouchableOpacity
              style={[
                styles.uploadModeButton,
                uploadMode === 'media' && styles.uploadModeButtonActive
              ]}
              onPress={() => setUploadMode('media')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.uploadModeButtonText,
                uploadMode === 'media' && styles.uploadModeButtonTextActive
              ]}>
                رفع صور
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.uploadModeButton,
                uploadMode === 'event' && styles.uploadModeButtonActive
              ]}
              onPress={() => setUploadMode('event')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.uploadModeButtonText,
                uploadMode === 'event' && styles.uploadModeButtonTextActive
              ]}>
                إنشاء فعالية
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Upload Options */}
        <View style={styles.uploadOptions}>
          <TouchableOpacity 
            style={styles.uploadOption} 
            onPress={takePhoto}
            activeOpacity={0.7}
          >
            <View style={styles.uploadOptionIcon}>
              <Camera size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.uploadOptionContent}>
              <Text style={styles.uploadOptionTitle}>التقاط صورة</Text>
              <Text style={styles.uploadOptionSubtitle}>
                {Platform.OS === 'web' 
                  ? 'غير متاح على الويب' 
                  : 'استخدم الكاميرا لالتقاط صورة جديدة'
                }
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.uploadOption} 
            onPress={pickImage}
            activeOpacity={0.7}
          >
            <View style={styles.uploadOptionIcon}>
              <Folder size={32} color={theme.colors.secondary} />
            </View>
            <View style={styles.uploadOptionContent}>
              <Text style={styles.uploadOptionTitle}>اختيار من المعرض</Text>
              <Text style={styles.uploadOptionSubtitle}>اختر صور متعددة من معرض الصور (حتى 10 صور)</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Event Form or Media Upload based on mode */}
        {isBusinessUser && uploadMode === 'event' ? (
          renderEventForm()
        ) : (
          <>
            {/* Selected Media */}
            {selectedMedia.length > 0 && (
              <View style={styles.selectedSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    الصور المحددة ({selectedMedia.length})
                  </Text>
                  <TouchableOpacity 
                    style={styles.clearButton} 
                    onPress={clearAllMedia}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearButtonText}>مسح الكل</Text>
                  </TouchableOpacity>
                </View>

                {/* Upload Statistics */}
                {(successCount > 0 || errorCount > 0) && (
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: theme.colors.success }]}>{successCount}</Text>
                      <Text style={styles.statLabel}>نجح</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: theme.colors.error }]}>{errorCount}</Text>
                      <Text style={styles.statLabel}>فشل</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: theme.colors.textSecondary }]}>{pendingCount}</Text>
                      <Text style={styles.statLabel}>في الانتظار</Text>
                    </View>
                  </View>
                )}
                
                <View style={styles.mediaGrid}>
                  {selectedMedia.map(renderMediaItem)}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            {selectedMedia.length > 0 && (
              <View style={styles.actionButtons}>
                {/* Retry Failed Uploads */}
                {errorCount > 0 && !isUploading && (
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={retryFailedUploads}
                    activeOpacity={0.7}
                  >
                    <Upload size={20} color="white" />
                    <Text style={styles.retryButtonText}>إعادة رفع الصور الفاشلة ({errorCount})</Text>
                  </TouchableOpacity>
                )}

                {/* Main Upload Button */}
                <TouchableOpacity
                  style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
                  onPress={uploadMedia}
                  disabled={isUploading || selectedMedia.length === 0}
                  activeOpacity={0.7}
                >
                  {isUploading ? (
                    <Loader size={24} color="white" />
                  ) : (
                    <Upload size={24} color="white" />
                  )}
                  <Text style={styles.uploadButtonText}>
                    {isUploading 
                      ? `جاري الرفع... ${Math.round(uploadProgress)}%`
                      : `رفع ${selectedMedia.length} صورة`
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Empty State */}
            {selectedMedia.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <ImageIcon size={64} color={theme.colors.primary} />
                </View>
                <Text style={styles.emptyStateTitle}>ابدأ برفع صورك</Text>
                <Text style={styles.emptyStateText}>
                  استخدم الخيارات أعلاه لالتقاط صورة جديدة أو اختيار صور من المعرض. 
                  يمكنك رفع حتى 10 صور في المرة الواحدة.
                </Text>
              </View>
            )}
          </>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// Clock component for time picker
function Clock() {
  return (
    <View style={styles.clock}>
      <View style={[styles.clockHand, { transform: [{ rotate: '45deg' }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  clock: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockHand: {
    width: 1,
    height: 6,
    backgroundColor: '#6B7280',
    position: 'absolute',
    bottom: 10,
    left: 10,
    transform: [{ rotate: '45deg' }],
  },
});
