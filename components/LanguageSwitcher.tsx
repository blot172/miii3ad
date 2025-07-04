import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions } from 'react-native';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { Globe, Check, X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface LanguageSwitcherProps {
  visible?: boolean;
}

export default function LanguageSwitcher({ visible = false }: LanguageSwitcherProps) {
  const { locale, changeLanguage, getSupportedLanguages, t } = useI18n();
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const supportedLanguages = getSupportedLanguages();
  const currentLanguage = supportedLanguages.find(lang => lang.code === locale);

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const openModal = () => {
    animateButtonPress();
    setIsVisible(true);
    setSelectedLanguage(locale);
    
    // Reset animation values
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const handleLanguageSelect = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    
    // Add a small delay for visual feedback
    setTimeout(async () => {
      await changeLanguage(languageCode);
      closeModal();
    }, 100);
  };

  const styles = StyleSheet.create({
    container: {
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
    },
    switcherButton: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: '#4F46E5', // Bright indigo background
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 2,
      borderColor: '#6366F1', // Lighter indigo border
      position: 'relative',
    },
    flagText: {
      fontSize: 20,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    activeIndicator: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#10B981', // Bright green indicator
      borderWidth: 2,
      borderColor: 'white',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.6,
      shadowRadius: 4,
      elevation: 6,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      width: '100%',
      maxWidth: 340,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: theme.isDark ? 0.6 : 0.3,
      shadowRadius: 25,
      elevation: 25,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.isDark ? '#374151' : '#E5E7EB',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: '#4F46E5', // Bright header background
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: 'Cairo-Bold',
      color: 'white', // White text on bright background
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    languagesList: {
      paddingVertical: 12,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    languageItemSelected: {
      backgroundColor: '#EEF2FF', // Light indigo background for selection
      borderLeftWidth: 4,
      borderLeftColor: '#4F46E5', // Bright indigo accent
    },
    languageFlag: {
      fontSize: 28,
      marginRight: 16,
      width: 32,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: 18,
      fontFamily: 'Cairo-SemiBold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    languageNativeName: {
      fontSize: 14,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      marginBottom: 6,
    },
    languageStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    languageCode: {
      fontSize: 11,
      fontFamily: 'Cairo-Bold',
      color: '#6366F1', // Bright indigo text
      textTransform: 'uppercase',
      backgroundColor: '#EEF2FF', // Light indigo background
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#C7D2FE',
    },
    currentBadge: {
      backgroundColor: '#10B981', // Bright green background
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    currentBadgeText: {
      fontSize: 10,
      fontFamily: 'Cairo-Bold',
      color: 'white', // White text on bright green
      textTransform: 'uppercase',
    },
    checkIconContainer: {
      marginLeft: 12,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#10B981', // Bright green background
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    modalFooter: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: '#F8FAFC', // Light background
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    footerText: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
      color: '#64748B', // Muted text color
      textAlign: 'center',
    },
  });

  // Don't render anything if not visible
  if (!visible) {
    return null;
  }

  return (
    <>
      <Animated.View style={[styles.container, { transform: [{ scale: buttonScaleAnim }] }]}>
        <TouchableOpacity style={styles.switcherButton} onPress={openModal} activeOpacity={0.8}>
          <Text style={styles.flagText}>{currentLanguage?.flag}</Text>
          <View style={styles.activeIndicator} />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={{ flex: 1, width: '100%' }} 
            activeOpacity={1} 
            onPress={closeModal}
          >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <Animated.View style={[
                  styles.modalContainer,
                  {
                    transform: [{ scale: scaleAnim }]
                  }
                ]}>
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                      <X size={18} color="white" />
                    </TouchableOpacity>
                  </View>

                  {/* Languages List */}
                  <View style={styles.languagesList}>
                    {supportedLanguages.map((language, index) => {
                      const isSelected = selectedLanguage === language.code;
                      const isCurrentLanguage = locale === language.code;
                      
                      return (
                        <TouchableOpacity
                          key={language.code}
                          style={[
                            styles.languageItem,
                            isSelected && styles.languageItemSelected,
                            index === supportedLanguages.length - 1 && { borderBottomWidth: 0 }
                          ]}
                          onPress={() => handleLanguageSelect(language.code)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.languageFlag}>{language.flag}</Text>
                          
                          <View style={styles.languageInfo}>
                            <Text style={styles.languageName}>{language.name}</Text>
                            <Text style={styles.languageNativeName}>{language.nativeName}</Text>
                            <View style={styles.languageStats}>
                              <Text style={styles.languageCode}>{language.code}</Text>
                              {isCurrentLanguage && (
                                <View style={styles.currentBadge}>
                                  <Text style={styles.currentBadgeText}>Current</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          
                          {isCurrentLanguage && (
                            <View style={styles.checkIconContainer}>
                              <Check size={14} color="white" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Footer */}
                  <View style={styles.modalFooter}>
                    <Text style={styles.footerText}>
                      Changes apply immediately
                    </Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}
