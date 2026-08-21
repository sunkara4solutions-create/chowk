import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getWorkerApplications } from '../../lib/api';
import { COLORS, SKILL_LABELS } from '../../lib/config';
import { openWhatsApp } from '../../lib/whatsapp';
import type { Application } from '../../lib/types';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: COLORS.warning,       icon: 'time-outline' as const },
  accepted: { label: 'Confirmed', color: COLORS.success,      icon: 'checkmark-circle-outline' as const },
  rejected: { label: 'Rejected', color: '#E74C3C',            icon: 'close-circle-outline' as const },
};

export default function MyJobs() {
  const [tab, setTab] = useState<'pending' | 'accepted'>('pending');

  const { data = [], isLoading, refetch, isRefetching } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => getWorkerApplications().then(r => r.data),
  });

  const filtered = data.filter(a =>
    tab === 'pending' ? a.status === 'pending' : a.status === 'accepted'
  );

  const renderItem = ({ item }: { item: Application }) => {
    const cfg = STATUS_CONFIG[item.status];
    const dateStr = new Date(item.job.job_date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short',
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.skill}>
            {SKILL_LABELS[item.job.skill as keyof typeof SKILL_LABELS] ?? item.job.skill}
          </Text>
          <View style={[styles.badge, { backgroundColor: cfg.color + '20' }]}>
            <Ionicons name={cfg.icon} size={12} color={cfg.color} />
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.meta}>{item.job.location}, {item.job.city}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.meta}>{dateStr}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="cash-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.meta}>₹{item.job.rate}/day</Text>
        </View>

        {item.status === 'accepted' && item.job.contractor && (
          <TouchableOpacity
            style={styles.waBtn}
            onPress={() => openWhatsApp(
              item.job.contractor!.phone,
              `Hi, I confirmed for the ${SKILL_LABELS[item.job.skill as keyof typeof SKILL_LABELS] ?? item.job.skill} job on ${dateStr}`
            )}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            <Text style={styles.waBtnText}>WhatsApp Contractor</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(['pending', 'accepted'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'pending' ? 'Applied' : 'Confirmed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={a => a.application_id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[COLORS.primary]} />}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{tab === 'pending' ? '📋' : '✅'}</Text>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading...' : tab === 'pending' ? 'No pending applications' : 'No confirmed jobs yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginHorizontal: 16, marginVertical: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  skill: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  waBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#25D36618', padding: 10, borderRadius: 10, justifyContent: 'center' },
  waBtnText: { color: '#25D366', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
});
