import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getIndividualJobs, getMyPostedJobs } from '../../lib/api';
import { COLORS, SKILL_LABELS, SKILL_EMOJIS } from '../../lib/config';
import type { IndividualJob } from '../../lib/types';

const STATUS_COLOR: Record<string, string> = {
  open: COLORS.success,
  filled: COLORS.warning,
  completed: COLORS.textSecondary,
  cancelled: '#E74C3C',
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
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[job.status] ?? COLORS.textSecondary }]} />
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.skillTag}>{skillEmoji} {skillLabel}</Text>
        <Text style={styles.metaSep}>·</Text>
        <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
        <Text style={styles.metaText}>{job.city}</Text>
        <Text style={styles.metaSep}>·</Text>
        <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
        <Text style={styles.metaText}>{dateStr}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.rate}>
          {job.rate > 0 ? `₹${job.rate}` : 'Open to bids'}
        </Text>
        <View style={styles.bidCount}>
          <Ionicons name="people-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.bidCountText}>{job.bid_count} bid{job.bid_count !== 1 ? 's' : ''}</Text>
        </View>
      </View>
      {job.poster_name && (
        <Text style={styles.posterName}>Posted by {job.poster_name}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function HireTab() {
  const [tab, setTab] = useState<'browse' | 'my-posts'>('browse');

  const { data: browseData, isLoading: browseLoading, refetch: refetchBrowse, isRefetching: browseRefetching } = useQuery({
    queryKey: ['individual-jobs'],
    queryFn: () => getIndividualJobs().then(r => r.data),
    enabled: tab === 'browse',
  });

  const { data: myJobs = [], isLoading: myLoading, refetch: refetchMy, isRefetching: myRefetching } = useQuery<IndividualJob[]>({
    queryKey: ['my-individual-jobs'],
    queryFn: () => getMyPostedJobs().then(r => r.data),
    enabled: tab === 'my-posts',
  });

  const browseJobs: IndividualJob[] = browseData?.items ?? [];

  const activeJobs = browseJobs;
  const isLoading = tab === 'browse' ? browseLoading : myLoading;
  const refetch = tab === 'browse' ? refetchBrowse : refetchMy;
  const isRefetching = tab === 'browse' ? browseRefetching : myRefetching;
  const displayJobs: IndividualJob[] = tab === 'browse' ? activeJobs : myJobs;

  return (
    <View style={styles.container}>
      {/* Inner tabs */}
      <View style={styles.tabBar}>
        {(['browse', 'my-posts'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.innerTab, tab === t && styles.innerTabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.innerTabText, tab === t && styles.innerTabTextActive]}>
              {t === 'browse' ? 'Browse Jobs' : 'My Posted Jobs'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={displayJobs}
          keyExtractor={j => j.job_id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[COLORS.primary]} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push({ pathname: '/(worker)/individual-job/[id]', params: { id: item.job_id } })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>{tab === 'browse' ? '🔍' : '📋'}</Text>
              <Text style={styles.emptyTitle}>
                {tab === 'browse' ? 'No jobs posted yet' : 'No jobs posted by you'}
              </Text>
              <Text style={styles.emptySub}>
                {tab === 'browse'
                  ? 'Be the first to post a small job!'
                  : 'Tap "+ Post a Job" to get started'}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(worker)/post-individual-job')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#fff" />
        <Text style={styles.fabText}>Post a Job</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabBar: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  innerTab: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  innerTabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  innerTabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  innerTabTextActive: { color: COLORS.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    marginBottom: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginRight: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, flexWrap: 'wrap' },
  skillTag: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  metaSep: { color: COLORS.border, fontSize: 12 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rate: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  bidCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bidCountText: { fontSize: 12, color: COLORS.textSecondary },
  posterName: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: 28,
    paddingVertical: 14, paddingHorizontal: 20,
    elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
