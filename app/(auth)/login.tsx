
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Phone, User, ArrowRight, Loader } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useI18n();

  const handleSendOtp = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call to send OTP
    setTimeout(() => {
      setIsLoading(false);
      setShowOtpField(true);
      Alert.alert('OTP Sent', `Verification code sent to ${phone}`);
    }, 1500);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 5) {
      Alert.alert('Error', 'Please enter the 5-digit verification code');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate OTP verification
      await login(phone, name);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LinearGradient
          colors={['#7C3AED', '#4F46E5']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome to Mi3AD</Text>
              <Text style={styles.subtitle}>Book events with ease</Text>
            </View>

            <View style={styles.form}>
              {!showOtpField ? (
                <>
                  <View style={styles.inputContainer}>
                    <User size={20} color="#6B7280" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#9CA3AF"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Phone size={20} color="#6B7280" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone Number"
                      placeholderTextColor="#9CA3AF"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={15}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleSendOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader size={20} color="white" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Send Verification Code</Text>
                        <ArrowRight size={20} color="white" />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.otpText}>
                    Enter the 5-digit code sent to {phone}
                  </Text>

                  <View style={styles.otpContainer}>
                    {[0, 1, 2, 3, 4].map((index) => (
                      <TextInput
                        key={index}
                        style={styles.otpInput}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={otp[index] || ''}
                        onChangeText={(text) => {
                          const newOtp = [...otp];
                          newOtp[index] = text;
                          setOtp(newOtp.join(''));
                          
                          // Auto focus next input
                          if (text && index < 4) {
                            // Focus next input
                          }
                        }}
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleVerifyOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader size={20} color="white" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Verify & Sign In</Text>
                        <ArrowRight size={20} color="white" />
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendLink}
                    onPress={handleSendOtp}
                  >
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
 