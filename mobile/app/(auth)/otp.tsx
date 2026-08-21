import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../lib/config';
import { verifyOtp, sendOtp } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import OTPInput from '../../components/OTPInput';

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    startCountdown();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startCountdown() {
    setCountdown(60);
    setCanResend(false);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await sendOtp(phone);
      setOtp('');
      startCountdown();
      Alert.alert('OTP Sent', `A new OTP has been sent via SMS to +91 ${phone}`);
    } catch {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const response = await verifyOtp(phone, otp);
      const { access_token, role, profile } = response.data;
      await setAuth(access_token, role, profile);

      if (role === 'new') {
        router.replace('/(setup)/role');
      } else if (role === 'worker') {
        router.replace('/(worker)');
      } else if (role === 'contractor') {
        router.replace('/(contractor)');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Invalid OTP. Please try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.iconArea}>
          <View style={styles.smsIcon}>
            <Text style={styles.smsEmoji}>💬</Text>
          </View>
        </View>

        <Text style={styles.heading}>Enter OTP</Text>
        <Text style={styles.subheading}>
          We sent a 6-digit code via SMS to{'\n'}
          <Text style={styles.phoneHighlight}>+91 {phone}</Text>
        </Text>

        <OTPInput value={otp} onChange={setOtp} length={6} />

        <TouchableOpacity
          style={[styles.verifyButton, otp.length !== 6 && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={otp.length !== 6 || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendActive}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendDisabled}>
              Resend OTP in <Text style={styles.countdownText}>{countdown}s</Text>
            </Text>
          )}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconArea: {
    marginBottom: 24,
  },
  smsIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smsEmoji: {
    fontSize: 36,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  phoneHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    backgroundColor: '#f0c4a8',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  resendRow: {
    alignItems: 'center',
  },
  resendActive: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
    padding: 8,
  },
  resendDisabled: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  countdownText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
