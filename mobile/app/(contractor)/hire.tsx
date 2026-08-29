import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getMyPostedJobs } from '../../lib/api';
import { COLORS, SKILL_LABELS, SKILL_EMOJIS } from '../../lib/config';
import type { IndividualJob } from '../../lib/types';

const STATUS_COLOR: Record<string, string> = {
  open: COLORS.success,
  filled: COLORS.warning,
  completed: COLORS.textSecondary,
  cancelled: '#E74C3C',
};
const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  filled: 'Bid Accepted',
  completed: 'Done',
  cancelled: 'Cancelled',
};

function JobCard({ job, onPress }: { job: IndividualJob; onPress: () => void }) {
  const dateStr = new Date(job.job_date + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });
  const skillLabel = SKILL_LABELS[job.skill as keyof typeof SKILL_LABELS] ?? job.skill;
  const skillEmoji = SKILL_EMOJIS[job.skill as keyof typeof SKILL_EMOJIS] ?? '🔧';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{job.title || skillLabel}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[job.status] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[job.status] }]}>
            {STATUS_LABEL[job.status] ?? job.status}
          </Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.skillTag}>{skillEmoji} {skillLabel}</Text>
        <Text style={styles.metaSep}>·</Text>
        <Ionicons name="location-outline" size={11} color={COLORS.textSecondary} />
        <Text style={styles.metaText}>{job.city}</Text>
        <Text style={styles.metaSep}>·</Text>
        <Ionicons name="calendar-outline" size={11} color={COLORS.textSecondary} />
        <Text style={styles.metaText}>{dateStr}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.rate}>{job.rate > 0 ? `₹${job.rate}` : 'Open to bids'}</Text>
        <View style={styles.bidRow}>
          <Ionicons name="people-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.bidText}>{job.bid_count} bid{job.bid_count !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ContractorHire() {
  const { data = [], isLoading, refetch, isRefetching } = useQuery<IndividualJob[]>({
    queryKey: ['my-individual-jobs'],
    queryFn: () => getMyPostedJobs().then(r => r.data),
  });

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={j => j.job_id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[COLORS.primary]} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push({ pathname: '/(contractor)/individual-job/[id]', params: { id: item.job_id } })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏠</Text>
              <Text style={styles.emptyTitle}>No small jobs posted yet</Text>
              <Text style={styles.emptySub}>Tap "Post a Small Job" to get started</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(contractor)/post-individual-job')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#fff" />
        <Text style={styles.fabText}>Post a Small Job</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    marginBottom: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, flexWrap: 'wrap' },
  skillTag: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  metaSep: { color: COLORS.border, fontSize: 12 },
  metaText: { fontSize: 11, color: COLORS.textSecondary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rate: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  bidRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bidText: { fontSize: 11, color: COLORS.textSecondary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: 28,
    paddingVertical: 14, paddingHorizontal: 20, elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
