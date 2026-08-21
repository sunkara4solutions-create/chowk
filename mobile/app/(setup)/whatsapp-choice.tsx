import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, TextInput, Alert, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../lib/config';
import { useAuthStore } from '../../store/auth';
import { setWorkerPreferences, setContractorPreferences } from '../../lib/api';

const CHOWK_WA_NUMBER = '917989018757';

const REFERRAL_OPTIONS = [
  'Friend / Family',
  'WhatsApp group',
  'Contractor told me',
  'Saw it on Facebook',
  'Other',
];

export default function WhatsAppChoiceScreen() {
  const { profile, role } = useAuthStore();
  const phone = profile?.phone ?? '';
  const [selected, setSelected] = useState<'app' | 'whatsapp' | null>(null);
  const [referral, setReferral] = useState('');
  const [showOther, setShowOther] = useState(false);
  const [loading, setLoading] = useState(false);

  const openWhatsApp = () => {
    const url = `https://wa.me/${CHOWK_WA_NUMBER}?text=Hi`;
    Linking.openURL(url).catch(() =>
      Alert.alert('WhatsApp not found', 'Please install WhatsApp and try again.')
    );
  };

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert('Please select', 'How do you want to receive job alerts?');
      return;
    }
    setLoading(true);
    try {
      const prefs = {
        whatsapp_primary: selected === 'whatsapp',
        referral_source: referral || undefined,
      };
      if (role === 'worker') await setWorkerPreferences(prefs);
      else if (role === 'contractor') await setContractorPreferences(prefs);
    } catch {}
    setLoading(false);
    if (selected === 'whatsapp') {
      openWhatsApp();
    }
    router.replace(role === 'contractor' ? '/(contractor)' : '/(worker)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Chowk works on both channels</Text>
        <Text style={styles.sub}>
          Whether you use the app or WhatsApp, your jobs, profile and applications stay in sync.
        </Text>

        {/* WhatsApp channel card */}
        <View style={styles.channelCard}>
          <View style={[styles.channelIcon, { backgroundColor: '#E8F9EE' }]}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
          </View>
          <View style={styles.channelBody}>
            <Text style={styles.channelTitle}>WhatsApp · +91 {phone}</Text>
            <Text style={styles.channelDesc}>
              We send matching jobs to your WhatsApp. Reply directly — no need to open the app.
            </Text>
            <View style={styles.cmdBlock}>
              <CmdRow cmd="Reply YES" desc="to apply for a job we send" />
              <CmdRow cmd="Type JOBS" desc="to see all available jobs" />
              <CmdRow cmd="Type STOP" desc="to pause alerts" />
              <CmdRow cmd="Type HELP" desc="for all commands" />
            </View>
          </View>
        </View>

        {/* App channel card */}
        <View style={styles.channelCard}>
          <View style={[styles.channelIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="phone-portrait-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.channelBody}>
            <Text style={styles.channelTitle}>This App</Text>
            <Text style={styles.channelDesc}>
              Browse and filter jobs, track applications, update your profile anytime.
            </Text>
          </View>
        </View>

        {/* Preference question */}
        <Text style={styles.sectionLabel}>Where should we send your job alerts?</Text>

        <TouchableOpacity
          style={[styles.optionBtn, selected === 'whatsapp' && styles.optionBtnActive]}
          onPress={() => setSelected('whatsapp')}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-whatsapp" size={20} color={selected === 'whatsapp' ? '#fff' : '#25D366'} />
          <Text style={[styles.optionText, selected === 'whatsapp' && styles.optionTextActive]}>
            Send to WhatsApp
          </Text>
          {selected === 'whatsapp' && <Ionicons name="checkmark-circle" size={18} color="#fff" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionBtn, selected === 'app' && styles.optionBtnActive]}
          onPress={() => setSelected('app')}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={20} color={selected === 'app' ? '#fff' : COLORS.primary} />
          <Text style={[styles.optionText, selected === 'app' && styles.optionTextActive]}>
            Notify me in the app
          </Text>
          {selected === 'app' && <Ionicons name="checkmark-circle" size={18} color="#fff" />}
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>How did you find Chowk? (optional)</Text>
        <View style={styles.referralGrid}>
          {REFERRAL_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.refChip, referral === opt && styles.refChipActive]}
              onPress={() => {
                setReferral(referral === opt ? '' : opt);
                setShowOther(opt === 'Other');
              }}
            >
              <Text style={[styles.refChipText, referral === opt && styles.refChipTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {showOther && (
          <TextInput
            style={styles.otherInput}
            placeholder="Tell us how you found Chowk"
            placeholderTextColor={COLORS.textSecondary}
            value={referral === 'Other' ? '' : referral}
            onChangeText={v => setReferral(v)}
          />
        )}

        {selected === 'whatsapp' && (
          <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.waBtnText}>Open WhatsApp to activate</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.continueBtn, loading && { opacity: 0.6 }]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            {loading ? 'Setting up...' : 'Start Using Chowk'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function CmdRow({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 5 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#25D366', minWidth: 68 }}>{cmd}</Text>
      <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  sub: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 24 },
  channelCard: {
    flexDirection: 'row', gap: 14, backgroundColor: COLORS.card,
    borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  channelIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  channelBody: { flex: 1 },
  channelTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  channelDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  cmdBlock: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10,
  },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 10,
  },
  optionBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  optionTextActive: { color: '#fff' },
  referralGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  refChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  refChipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  refChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  refChipTextActive: { color: '#fff' },
  otherInput: {
    marginTop: 10, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    padding: 14, fontSize: 14, color: COLORS.textPrimary, backgroundColor: COLORS.card,
  },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, marginTop: 28,
  },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  waBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#25D366', borderRadius: 14, padding: 16, marginTop: 16,
  },
  waBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
