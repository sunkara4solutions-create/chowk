import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminLogin, getAdminStats, listAllJobs, listAllContractors } from '../lib/adminApi';
import { getAdminToken, saveAdminToken, removeAdminToken } from '../lib/storage';
import { COLORS, SKILL_LABELS } from '../lib/config';

type Stats = {
  total_workers: number;
  total_contractors: number;
  total_jobs: number;
  total_individual_jobs: number;
  jobs_today: number;
  workers_available: number;
};

type AdminJob = {
  job_id: string;
  job_type?: string;
  title?: string;
  poster_name?: string;
  skill: string;
  city: string;
  required_count: number;
  confirmed_count: number;
  status: string;
  job_date: string;
};

type AdminContractor = {
  contractor_id: string;
  name: string;
  company_name?: string;
  city: string;
  phone: string;
};

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const [checkingSession, setCheckingSession] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [contractors, setContractors] = useState<AdminContractor[]>([]);

  useEffect(() => {
    (async () => {
      const token = await getAdminToken();
      if (token) {
        setAuthed(true);
        await loadData();
      }
      setCheckingSession(false);
    })();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes, contractorsRes] = await Promise.all([
        getAdminStats(),
        listAllJobs(),
        listAllContractors(),
      ]);
      setStats(statsRes.data);
      setJobs(jobsRes.data);
      setContractors(contractorsRes.data);
    } catch (e: any) {
      if (e.response?.status === 401) {
        await removeAdminToken();
        setAuthed(false);
        setLoginError('Session expired. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password) return;
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await adminLogin('7070108833', password);
      await saveAdminToken(res.data.access_token);
      setAuthed(true);
      setPassword('');
      await loadData();
    } catch {
      setLoginError('Incorrect password.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Admin Logout', 'End this admin session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          await removeAdminToken();
          setAuthed(false);
          setStats(null);
          setJobs([]);
          setContractors([]);
        },
      },
    ]);
  };

  if (checkingSession) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin</Text>
        {authed ? (
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      {!authed ? (
        <View style={styles.loginWrap}>
          <Ionicons name="shield-checkmark-outline" size={40} color={COLORS.primary} />
          <Text style={styles.loginTitle}>Admin Access</Text>
          <Text style={styles.loginSub}>Enter the admin password to continue</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholderTextColor={COLORS.textSecondary}
          />
          {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
          <TouchableOpacity
            style={[styles.loginBtn, (!password || loggingIn) && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={!password || loggingIn}
          >
            <Text style={styles.loginBtnText}>{loggingIn ? 'Checking...' : 'Login'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {loading && !stats ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {stats && (
                <View style={styles.statsGrid}>
                  {[
                    ['Workers', stats.total_workers],
                    ['Contractors', stats.total_contractors],
                    ['Total Jobs', stats.total_jobs],
                    ['Small Jobs', stats.total_individual_jobs],
                    ['Jobs Today', stats.jobs_today],
                    ['Available Now', stats.workers_available],
                  ].map(([label, value]) => (
                    <View key={String(label)} style={styles.statTile}>
                      <Text style={styles.statValue}>{value}</Text>
                      <Text style={styles.statLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.sectionTitle}>RECENT JOBS ({jobs.length})</Text>
              <View style={styles.card}>
                {jobs.slice(0, 30).map(j => {
                  const isIndividual = j.job_type === 'individual';
                  const skillLabel = SKILL_LABELS[j.skill as keyof typeof SKILL_LABELS] ?? j.skill;
                  return (
                    <View key={j.job_id} style={styles.row}>
                      <View style={styles.rowTop}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {isIndividual ? (j.title || skillLabel) : skillLabel}
                        </Text>
                        {isIndividual ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>Small Job</Text>
                          </View>
                        ) : (
                          <Text style={styles.rowCount}>{j.confirmed_count}/{j.required_count}</Text>
                        )}
                      </View>
                      <Text style={styles.rowSub}>
                        {isIndividual && j.poster_name ? `${j.poster_name} • ` : ''}
                        {j.city} • {j.job_date} • {j.status}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.sectionTitle}>CONTRACTORS ({contractors.length})</Text>
              <View style={styles.card}>
                {contractors.slice(0, 30).map(c => (
                  <View key={c.contractor_id} style={styles.row}>
                    <Text style={styles.rowTitle}>{c.name}</Text>
                    <Text style={styles.rowSub}>
                      {[c.company_name, c.city, c.phone].filter(Boolean).join(' • ')}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingBottom: 14,
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },

  loginWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loginTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 10 },
  loginSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 20, textAlign: 'center' },
  input: {
    width: '100%', backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10,
  },
  errorText: { color: '#E74C3C', fontSize: 12, marginBottom: 10 },
  loginBtn: { width: '100%', backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },

  content: { padding: 16, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statTile: {
    width: '31%', backgroundColor: COLORS.card, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },

  sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20, overflow: 'hidden' },
  row: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  rowCount: { fontSize: 12, color: COLORS.textSecondary },
  rowSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  badge: { backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#7E22CE' },
});
