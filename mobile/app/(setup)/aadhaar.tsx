import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../lib/config';
import { aadhaarInitiate, aadhaarVerifyNumber, aadhaarComplete } from '../../lib/api';

type Step = 'number' | 'otp';

export default function AadhaarScreen() {
  const [step, setStep] = useState<Step>('number');
  const [requestId, setRequestId] = useState('');
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [aadhaar, setAadhaar] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [otp, setOtp] = useState('');
  const [shareCode] = useState('1234');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initiate();
  }, []);

  async function initiate() {
    try {
      const res = await aadhaarInitiate();
      setRequestId(res.data.request_id);
      setCaptchaImage(res.data.captcha_image ?? null);
      setIsMock(res.data.mock ?? false);
    } catch {
      Alert.alert('Error', 'Could not start Aadhaar verification. Try again.');
    }
  }

  async function handleSendOtp() {
    if (aadhaar.length !== 12) {
      Alert.alert('Invalid Aadhaar', 'Please enter your 12-digit Aadhaar number.');
      return;
    }
    setLoading(true);
    try {
      await aadhaarVerifyNumber(requestId, aadhaar, captcha || 'mock');
      setStep('otp');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      await aadhaarComplete(requestId, otp, shareCode);
      Alert.alert(
        'Verified!',
        'Your Aadhaar has been verified successfully.',
        [{ text: 'Continue', onPress: () => router.replace('/(worker)') }],
      );
    } catch (e: any) {
      Alert.alert('Verification Failed', e?.response?.data?.detail ?? 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Aadhaar Verification</Text>
        <Text style={styles.subtitle}>
          Verify your identity to build trust with contractors.
        </Text>

        {isMock && (
          <View style={styles.mockBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#856404" />
            <Text style={styles.mockText}>
              Test mode — use any 12-digit number, OTP: <Text style={{ fontWeight: '800' }}>123456</Text>
            </Text>
          </View>
        )}

        {step === 'number' ? (
          <>
            <Text style={styles.label}>Aadhaar Number</Text>
            <TextInput
              style={styles.input}
              value={aadhaar}
              onChangeText={t => setAadhaar(t.replace(/\D/g, '').slice(0, 12))}
              keyboardType="number-pad"
              maxLength={12}
              placeholder="Enter 12-digit Aadhaar"
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.hint}>
              {aadhaar.length}/12 digits
            </Text>

            {captchaImage && !isMock && (
              <>
                <Text style={styles.label}>Enter Captcha</Text>
                <Image
                  source={{ uri: `data:image/png;base64,${captchaImage}` }}
                  style={styles.captchaImg}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.input}
                  value={captcha}
                  onChangeText={setCaptcha}
                  placeholder="Type the text above"
                  placeholderTextColor={COLORS.textSecondary}
                  autoCapitalize="characters"
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.btn, (loading || aadhaar.length !== 12) && styles.btnDisabled]}
              onPress={handleSendOtp}
              disabled={loading || aadhaar.length !== 12}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter OTP</Text>
            <Text style={styles.otpHint}>
              OTP sent to the mobile number linked with Aadhaar ending ****{aadhaar.slice(-4)}
            </Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="6-digit OTP"
              placeholderTextColor={COLORS.textSecondary}
            />

            <TouchableOpacity
              style={[styles.btn, (loading || otp.length !== 6) && styles.btnDisabled]}
              onPress={handleComplete}
              disabled={loading || otp.length !== 6}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Verify Aadhaar</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('number')} style={styles.back}>
              <Text style={styles.backText}>← Change Aadhaar number</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.skip}
          onPress={() => router.replace('/(worker)')}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, alignItems: 'stretch' },
  iconWrap: { alignItems: 'center', marginBottom: 16, marginTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  mockBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff3cd', borderRadius: 10, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: '#ffc107',
  },
  mockText: { fontSize: 13, color: '#856404', flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: COLORS.card, borderRadius: 10, padding: 14,
    fontSize: 16, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
    letterSpacing: 2,
  },
  hint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, textAlign: 'right' },
  captchaImg: { width: '100%', height: 60, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 8 },
  otpHint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  btnDisabled: { backgroundColor: '#f0c4a8' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  back: { alignItems: 'center', marginTop: 16 },
  backText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  skip: { alignItems: 'center', marginTop: 24 },
  skipText: { color: COLORS.textSecondary, fontSize: 14 },
});
