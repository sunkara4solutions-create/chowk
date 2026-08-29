import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, Image, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../lib/config';
import { markOnboardingSeen } from '../../lib/storage';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'construct-outline' as const,
    title: 'Find Work Every Day',
    subtitle: 'Chowk connects skilled workers with local contractors.\nGet daily job alerts in your city — Mason, Painter, Electrician and more.',
    bg: '#FFF5F0',
    iconColor: COLORS.primary,
  },
  {
    id: '2',
    icon: 'people-outline' as const,
    title: 'Hire the Right Workers',
    subtitle: 'Post a job in minutes. Chowk matches you with verified, available workers within 50 km.',
    bg: '#F0F4FF',
    iconColor: '#3B5BDB',
  },
  {
    id: '3',
    icon: 'logo-whatsapp' as const,
    title: 'Works on WhatsApp Too',
    subtitle: 'No smartphone? No problem.\nUse Chowk entirely through WhatsApp — apply for jobs by replying YES.',
    bg: '#F0FFF4',
    iconColor: '#25D366',
  },
];

export default function OnboardingScreen() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const listRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIdx < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIdx + 1, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await markOnboardingSeen();
    router.replace('/(auth)/phone');
  };

  const isLast = currentIdx === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.skipBtn} onPress={handleGetStarted}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={s => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIdx(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width, backgroundColor: item.bg }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.iconColor + '20' }]}>
              <Ionicons name={item.icon} size={72} color={item.iconColor} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIdx && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>{isLast ? 'Get Started' : 'Next'}</Text>
          <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  skipBtn: { alignSelf: 'flex-end', padding: 16, paddingBottom: 0 },
  skipText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, paddingTop: 0 },
  iconCircle: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center', marginBottom: 36,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16, backgroundColor: '#fff' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
