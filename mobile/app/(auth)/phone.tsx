import { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../../lib/config';
import { sendOtp } from '../../lib/api';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', digits: 10 },
  { code: '+1',  flag: '🇺🇸', digits: 10 },
];

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryIdx, setCountryIdx] = useState(0);
  const sendingRef = useRef(false);

  const country = COUNTRY_CODES[countryIdx];
  const isValid = phone.replace(/\D/g, '').length === country.digits;

  const cycleCountry = () => setCountryIdx(i => (i + 1) % COUNTRY_CODES.length);

  const handleSendOtp = async () => {
    if (sendingRef.current) return;
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== country.digits) {
      Alert.alert('Invalid Number', `Please enter a valid ${country.digits}-digit number.`);
      return;
    }
    // Send full E.164 number without leading +
    const e164 = country.code.replace('+', '') + cleanPhone;
    sendingRef.current = true;
    setLoading(true);
    try {
      await sendOtp(e164);
      router.push({ pathname: '/(auth)/otp', params: { phone: e164, display: `${country.code} ${cleanPhone}` } });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to send OTP. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.logoArea}>
          <Image source={require('../../assets/icon.png')} style={styles.logoImage} />
          <Text style={styles.tagline}>Connecting Rural India</Text>
        </View>

        <View style={styles.formArea}>
          <Text style={styles.heading}>Welcome to Chowk</Text>
          <Text style={styles.subheading}>Enter your mobile number to get started</Text>

          <View style={styles.phoneInputRow}>
            <TouchableOpacity style={styles.prefix} onPress={cycleCountry} activeOpacity={0.7}>
              <Text style={styles.prefixText}>{country.flag} {country.code}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              placeholder={country.digits === 10 ? '9876543210' : '2025550123'}
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
              maxLength={country.digits}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, !isValid && styles.sendButtonDisabled]}
            onPress={handleSendOtp}
            disabled={!isValid || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink} onPress={() => Linking.openURL('https://chowk.yourstockpicker.com/privacy')}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 22,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  formArea: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    height: 52,
  },
  prefix: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 18,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sendButtonDisabled: {
    backgroundColor: '#f0c4a8',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
