import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Image as ImageIcon, User, CreditCard as Edit3, Save, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();
  
  // Form state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Animation refs
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;
  
  // Track changes
  React.useEffect(() => {
    const nameChanged = name !== (user?.name || '');
    const bioChanged = bio !== (user?.bio || '');
    const avatarChanged = avatar !== (user?.avatar || '');
    setHasChanges(nameChanged || bioChanged || avatarChanged);
  }, [name, bio, avatar, user]);

  const animateButton = (animationRef: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animationRef, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animationRef, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
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

    animateButton(avatarScale);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
        Alert.alert('تم التحديث! ✅', 'تم تحديث صورتك الشخصية بنجاح');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('خطأ', 'فشل في اختيار الصورة');
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

    animateButton(avatarScale);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
        Alert.alert('تم التحديث! ✅', 'تم تحديث صورتك الشخصية بنجاح');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('خطأ', 'فشل في التقاط الصورة');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'تغيير الصورة الشخصية',
      'اختر مصدر الصورة',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'الكاميرا', onPress: takePhoto },
        { text: 'المعرض', onPress: pickImage },
        ...(avatar ? [{ text: 'حذف الصورة', style: 'destructive', onPress: () => setAvatar('') }] : []),
      ]
    );
  };

  const handleSave = async () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    if (!name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم');
      return;
    }

    animateButton(saveButtonScale);
    setIsLoading(true);

    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        avatar: avatar,
      });

      Alert.alert(
        'تم الحفظ! ✅',
        'تم تحديث ملفك الشخصي بنجاح',
        [{ text: 'موافق', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('خطأ', 'فشل في تحديث الملف الشخصي');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'تجاهل التغييرات؟',
        'لديك تغييرات غير محفوظة. هل تريد تجاهلها؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تجاهل', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

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
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
    },
    saveButton: {
      backgroundColor: hasChanges ? theme.colors.primary : theme.colors.textSecondary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      shadowColor: hasChanges ? theme.colors.primary : 'transparent',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    saveButtonText: {
      fontSize: 16,
      fontFamily: 'Cairo-Bold',
      color: 'white',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 32,
      paddingVertical: 20,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.border,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme.isDark ? 0.4 : 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
    editAvatarButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.secondary,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.surface,
      shadowColor: theme.colors.secondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    avatarHint: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    formSection: {
      gap: 24,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    inputContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    inputContainerFocused: {
      borderColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.2,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      paddingVertical: 16,
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.text,
      textAlign: locale === 'ar' ? 'right' : 'left',
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
      paddingTop: 16,
    },
    inputHint: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      marginTop: 4,
      textAlign: locale === 'ar' ? 'right' : 'left',
    },
    characterCount: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'left',
      marginTop: 4,
    },
    characterCountWarning: {
      color: theme.colors.warning,
    },
    characterCountError: {
      color: theme.colors.error,
    },
    previewSection: {
      marginTop: 32,
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    previewTitle: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    previewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    previewAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.border,
    },
    previewAvatarPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewInfo: {
      flex: 1,
    },
    previewName: {
      fontSize: 18,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    previewBio: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    previewBioPlaceholder: {
      fontStyle: 'italic',
      opacity: 0.7,
    },
    changesIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 16,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.primary + '20',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
    },
    changesText: {
      fontSize: 14,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.primary,
    },
  });

  const maxBioLength = 150;
  const bioLength = bio.length;
  const bioWarning = bioLength > maxBioLength * 0.8;
  const bioError = bioLength > maxBioLength;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
          </View>
          
          <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isLoading || !hasChanges}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <Text style={styles.saveButtonText}>جاري الحفظ...</Text>
              ) : (
                <>
                  <Save size={16} color="white" />
                  <Text style={styles.saveButtonText}>حفظ</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Animated.View style={[styles.avatarContainer, { transform: [{ scale: avatarScale }] }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={48} color="white" />
                </View>
              )}
              
              <TouchableOpacity style={styles.editAvatarButton} onPress={showImagePicker}>
                <Camera size={18} color="white" />
              </TouchableOpacity>
            </Animated.View>
            
            <Text style={styles.avatarHint}>اضغط لتغيير الصورة الشخصية</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>الاسم *</Text>
              <View style={[styles.inputContainer, name && styles.inputContainerFocused]}>
                <View style={styles.inputWithIcon}>
                  <User size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="أدخل اسمك الكامل"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                    maxLength={50}
                  />
                </View>
              </View>
              <Text style={styles.inputHint}>سيظهر هذا الاسم في ملفك الشخصي</Text>
            </View>

            {/* Bio Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>النبذة الشخصية</Text>
              <View style={[styles.inputContainer, bio && styles.inputContainerFocused]}>
                <View style={styles.inputWithIcon}>
                  <Edit3 size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="اكتب نبذة قصيرة عن نفسك..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    maxLength={maxBioLength}
                  />
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.inputHint}>نبذة مختصرة تظهر في ملفك الشخصي</Text>
                <Text style={[
                  styles.characterCount,
                  bioWarning && styles.characterCountWarning,
                  bioError && styles.characterCountError
                ]}>
                  {bioLength}/{maxBioLength}
                </Text>
              </View>
            </View>
          </View>

          {/* Preview Section */}
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>معاينة الملف الشخصي</Text>
            
            <View style={styles.previewCard}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.previewAvatar} />
              ) : (
                <View style={styles.previewAvatarPlaceholder}>
                  <User size={24} color="white" />
                </View>
              )}
              
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>
                  {name.trim() || 'اسم المستخدم'}
                </Text>
                <Text style={[
                  styles.previewBio,
                  !bio.trim() && styles.previewBioPlaceholder
                ]}>
                  {bio.trim() || 'لا توجد نبذة شخصية'}
                </Text>
              </View>
            </View>

            {hasChanges && (
              <View style={styles.changesIndicator}>
                <Check size={16} color={theme.colors.primary} />
                <Text style={styles.changesText}>لديك تغييرات غير محفوظة</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
