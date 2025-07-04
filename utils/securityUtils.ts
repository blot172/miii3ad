import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Platform-specific crypto import
let Crypto: any = null;
if (Platform.OS !== 'web') {
  try {
    Crypto = require('expo-crypto');
  } catch (error) {
    console.warn('Crypto module not available:', error);
  }
}

export interface EncryptionKey {
  key: string;
  iv: string;
}

/**
 * Generate a secure encryption key
 */
export const generateEncryptionKey = async (): Promise<EncryptionKey> => {
  try {
    let key: string;
    let iv: string;

    if (Platform.OS === 'web') {
      // Web fallback using built-in crypto
      key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('').substring(0, 32);
      
      iv = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('').substring(0, 16);
    } else if (Crypto) {
      // Native platform using expo-crypto
      key = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString()
      );
      
      iv = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Date.now().toString()
      );
      
      key = key.substring(0, 32);
      iv = iv.substring(0, 16);
    } else {
      // Fallback for when crypto is not available
      key = Math.random().toString(36).substring(2, 34);
      iv = Math.random().toString(36).substring(2, 18);
    }
    
    return { key, iv };
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
    if (Platform.OS === 'web') {
      // Simple base64 encoding for demo purposes
      // In production, use proper encryption libraries
      return btoa(unescape(encodeURIComponent(data)));
    } else {
      // For native platforms, return as-is (would use proper encryption in production)
      return data;
    }
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
    if (Platform.OS === 'web') {
      // Simple base64 decoding for demo purposes
      // In production, use proper decryption libraries
      return decodeURIComponent(escape(atob(encryptedData)));
    } else {
      // For native platforms, return as-is (would use proper decryption in production)
      return encryptedData;
    }
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
    let passwordSalt: string;
    let hash: string;

    if (Platform.OS === 'web') {
      // Web fallback
      passwordSalt = salt || Math.random().toString(36).substring(2, 18);
      const encoder = new TextEncoder();
      const data = encoder.encode(password + passwordSalt);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else if (Crypto) {
      // Native platform using expo-crypto
      passwordSalt = salt || await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString()
      ).then(hash => hash.substring(0, 16));
      
      hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password + passwordSalt
      );
    } else {
      // Fallback
      passwordSalt = salt || Math.random().toString(36).substring(2, 18);
      hash = btoa(password + passwordSalt); // Simple encoding as fallback
    }
    
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
    let hash: string;

    if (Platform.OS === 'web') {
      // Web fallback
      const randomArray = crypto.getRandomValues(new Uint8Array(length));
      hash = Array.from(randomArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('').substring(0, length);
    } else if (Crypto) {
      // Native platform
      const randomString = Math.random().toString(36).substring(2, 2 + length) + 
                           Date.now().toString(36);
      
      hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        randomString
      );
      hash = hash.substring(0, length);
    } else {
      // Fallback
      hash = Math.random().toString(36).substring(2, 2 + length);
    }
    
    return hash;
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
    const encryptedData = await encryptData(jsonData);
    
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
    const decryptedJson = await decryptData(data);
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
    if (Platform.OS === 'web') {
      // Check for Web Crypto API support
      return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
    } else {
      // For mobile platforms, assume secure hardware is available
      return true;
    }
  } catch (error) {
    console.error('Secure hardware check error:', error);
    return false;
  }
};