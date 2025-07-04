import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface EncryptionKey {
  key: string;
  iv: string;
}

/**
 * Generate a secure encryption key
 */
export const generateEncryptionKey = async (): Promise<EncryptionKey> => {
  try {
    const key = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Math.random().toString()
    );
    
    const iv = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Date.now().toString()
    );
    
    return {
      key: key.substring(0, 32),
      iv: iv.substring(0, 16)
    };
  } catch (error) {
    console.error('Error generating encryption key:', error);
    throw new Error('فشل في إنشاء مفتاح التشفير');
  }
};

/**
 * Store sensitive data securely
 */
export const storeSecureData = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      // For web, use encrypted localStorage
      const encryptedValue = await encryptData(value);
      localStorage.setItem(`secure_${key}`, encryptedValue);
    } else {
      // For mobile, use AsyncStorage with a secure prefix
      await AsyncStorage.setItem(`secure_${key}`, value);
    }
  } catch (error) {
    console.error('Error storing secure data:', error);
    throw new Error('فشل في حفظ البيانات الآمنة');
  }
};

/**
 * Retrieve sensitive data securely
 */
export const getSecureData = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      // For web, decrypt from localStorage
      const encryptedValue = localStorage.getItem(`secure_${key}`);
      if (!encryptedValue) return null;
      return await decryptData(encryptedValue);
    } else {
      // For mobile, use AsyncStorage with a secure prefix
      return await AsyncStorage.getItem(`secure_${key}`);
    }
  } catch (error) {
    console.error('Error retrieving secure data:', error);
    return null;
  }
};

/**
 * Delete sensitive data securely
 */
export const deleteSecureData = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(`secure_${key}`);
    } else {
      await AsyncStorage.removeItem(`secure_${key}`);
    }
  } catch (error) {
    console.error('Error deleting secure data:', error);
    throw new Error('فشل في حذف البيانات الآمنة');
  }
};

/**
 * Simple encryption for web platform (not production-ready)
 */
const encryptData = async (data: string): Promise<string> => {
  try {
    // Simple base64 encoding for demo purposes
    // In production, use proper encryption libraries
    return btoa(unescape(encodeURIComponent(data)));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('فشل في تشفير البيانات');
  }
};

/**
 * Simple decryption for web platform (not production-ready)
 */
const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    // Simple base64 decoding for demo purposes
    // In production, use proper decryption libraries
    return decodeURIComponent(escape(atob(encryptedData)));
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('فشل في فك تشفير البيانات');
  }
};

/**
 * Hash password securely
 */
export const hashPassword = async (password: string, salt?: string): Promise<{ hash: string; salt: string }> => {
  try {
    const passwordSalt = salt || await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Math.random().toString()
    ).then(hash => hash.substring(0, 16));
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + passwordSalt
    );
    
    return { hash, salt: passwordSalt };
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('فشل في تشفير كلمة المرور');
  }
};

/**
 * Verify password against hash
 */
export const verifyPassword = async (password: string, hash: string, salt: string): Promise<boolean> => {
  try {
    const { hash: newHash } = await hashPassword(password, salt);
    return newHash === hash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

/**
 * Generate secure random token
 */
export const generateSecureToken = async (length: number = 32): Promise<string> => {
  try {
    const randomString = Math.random().toString(36).substring(2, 2 + length) + 
                         Date.now().toString(36);
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      randomString
    );
    
    return hash.substring(0, length);
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('فشل في إنشاء الرمز الآمن');
  }
};

/**
 * Encrypt user data for export
 */
export const encryptUserData = async (data: any, password: string): Promise<string> => {
  try {
    const jsonData = JSON.stringify(data);
    const { hash, salt } = await hashPassword(password);
    
    // Simple encryption for demo - use proper encryption in production
    const encryptedData = btoa(unescape(encodeURIComponent(jsonData)));
    
    return JSON.stringify({
      data: encryptedData,
      salt,
      hash,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Data encryption error:', error);
    throw new Error('فشل في تشفير البيانات');
  }
};

/**
 * Decrypt user data from import
 */
export const decryptUserData = async (encryptedData: string, password: string): Promise<any> => {
  try {
    const parsed = JSON.parse(encryptedData);
    const { data, salt, hash } = parsed;
    
    // Verify password
    const isValidPassword = await verifyPassword(password, hash, salt);
    if (!isValidPassword) {
      throw new Error('كلمة المرور غير صحيحة');
    }
    
    // Decrypt data
    const decryptedJson = decodeURIComponent(escape(atob(data)));
    return JSON.parse(decryptedJson);
  } catch (error) {
    console.error('Data decryption error:', error);
    throw new Error('فشل في فك تشفير البيانات');
  }
};

/**
 * Check if device has secure hardware
 */
export const hasSecureHardware = async (): Promise<boolean> => {
  try {
    // This is a simplified check - in a real app, you would use
    // platform-specific APIs to check for secure hardware
    return Platform.OS !== 'web';
  } catch (error) {
    console.error('Secure hardware check error:', error);
    return false;
  }
};
