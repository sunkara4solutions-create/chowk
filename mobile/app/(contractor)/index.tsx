import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getContractorJobs, getContractorMe } from '../../lib/api';
import { COLORS, SKILL_LABELS } from '../../lib/config';
import type { Job, ContractorProfile } from '../../lib/types';

const STATUS_COLORS: Record<string, string> = { open: COLORS.success, filled: COLORS.warning, cancelled: '#E74C3C', closed: '#E74C3C', completed: COLORS.textSecondary };

export default function ContractorDashboard() {
  const { data: profile } = useQuery<ContractorProfile>({
    queryKey: ['contractor-me'],
    queryFn: () => getContractorMe().then(r => r.data),
  });

  const { data: jobs = [], isLoading, refetch, isRefetching } = useQuery<Job[]>({
    queryKey: ['contractor-jobs'],
    queryFn: () => getContractorJobs().then(r => r.data),
  });

  const activeJobs = jobs.filter(j => j.status === 'open');
  const totalConfirmed = jobs.reduce((s, j) => s + j.confirmed_count, 0);
  const totalRequired = jobs.reduce((s, j) => s + j.required_count, 0);

  return (
    <View style={styles.container}>
      <View style={styles.greeting}>
        <Text style={styles.greetText}>Hello, {profile?.name?.split(' ')[0] ?? 'there'} 👋</Text>
        <Text style={styles.greetSub}>{profile?.city ?? ''}</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Active Jobs" value={activeJobs.length} color={COLORS.success} />
        <StatCard label="Total Posted" value={jobs.length} color={COLORS.primary} />
        <StatCard
          label="Fill Rate"
          value={totalRequired > 0 ? `${Math.round((totalConfirmed / totalRequired) * 100)}%` : '0%'}
          color={COLORS.warning}
        />
      </View>

      <Text style={styles.sectionTitle}>All Jobs</Text>

      <FlatList
        data={jobs}
        keyExtractor={j => j.job_id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[COLORS.primary]} />}
        renderItem={({ item }) => {
          const fillPct = item.required_count > 0 ? (item.confirmed_count / item.required_count) * 100 : 0;
          const dateStr = new Date(item.job_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

          return (
            <TouchableOpacity
              style={styles.jobCard}
              onPress={() => router.push(`/(contractor)/job/${item.job_id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.jobHeader}>
                <Text style={styles.jobSkill}>{SKILL_LABELS[item.skill as keyof typeof SKILL_LABELS] ?? item.skill}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.jobMeta}>{item.city} · {dateStr} · ₹{item.rate}/day</Text>
              <View style={styles.fillRow}>
                <Text style={styles.fillText}>{item.confirmed_count}/{item.required_count} workers</Text>
                <View style={styles.fillBar}>
                  <View style={[styles.fillProgress, { width: `${fillPct}%` as any, backgroundColor: fillPct >= 100 ? COLORS.success : COLORS.primary }]} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            {isLoading ? <Text style={styles.emptyText}>Loading...</Text> : (
              <>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No jobs posted yet</Text>
                <TouchableOpacity style={styles.postBtn} onPress={() => router.push('/(contractor)/post-job')}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.postBtnText}>Post Your First Job</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  greeting: { backgroundColor: COLORS.secondary, padding: 20, paddingTop: 16 },
  greetText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  greetSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 10, padding: 12, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  jobCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginHorizontal: 16, marginVertical: 5, elevation: 2 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  jobSkill: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  jobMeta: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  fillRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fillText: { fontSize: 12, color: COLORS.textSecondary, width: 80 },
  fillBar: { flex: 1, height: 5, backgroundColor: COLORS.border, borderRadius: 3 },
  fillProgress: { height: 5, borderRadius: 3 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 16 },
  postBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  postBtnText: { color: '#fff', fontWeight: '700' },
});
