import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  getIndividualJob, placeBid, acceptBid, markJobComplete, leaveReview,
} from '../../../lib/api';
import { COLORS, SKILL_LABELS, SKILL_EMOJIS } from '../../../lib/config';
import type { IndividualJobDetail, Bid } from '../../../lib/types';

function Stars({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={12}
          color="#F5A623"
        />
      ))}
      <Text style={styles.ratingText}> {rating.toFixed(1)}</Text>
    </View>
  );
}

function BidCard({
  bid, onAccept, canAccept,
}: { bid: Bid; onAccept: () => void; canAccept: boolean }) {
  return (
    <View style={styles.bidCard}>
      <View style={styles.bidHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bidWorkerName}>{bid.worker.name}</Text>
          <View style={styles.bidWorkerMeta}>
            <Stars rating={bid.worker.average_rating} />
            {bid.worker.average_rating && <Text style={styles.dot}>·</Text>}
            <Text style={styles.bidMetaText}>{bid.worker.city}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.bidMetaText}>{bid.worker.experience}yr exp</Text>
          </View>
        </View>
        <Text style={styles.bidAmount}>₹{bid.amount}</Text>
      </View>
      {bid.message ? (
        <Text style={styles.bidMessage}>"{bid.message}"</Text>
      ) : null}
      {bid.status === 'accepted' ? (
        <View style={styles.acceptedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          <Text style={styles.acceptedText}>Accepted</Text>
        </View>
      ) : bid.status === 'rejected' ? (
        <View style={[styles.acceptedBadge, { backgroundColor: '#FEE2E2' }]}>
          <Text style={{ fontSize: 11, color: '#E74C3C', fontWeight: '700' }}>Not selected</Text>
        </View>
      ) : canAccept ? (
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
          <Ionicons name="checkmark" size={14} color={COLORS.success} />
          <Text style={styles.acceptBtnText}>Accept This Bid</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function IndividualJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const { data: job, isLoading } = useQuery<IndividualJobDetail>({
    queryKey: ['individual-job', id],
    queryFn: () => getIndividualJob(id!).then(r => r.data),
    enabled: !!id,
  });

  const bidMutation = useMutation({
    mutationFn: () => placeBid(id!, parseInt(bidAmount), bidMessage || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['individual-job', id] });
      qc.invalidateQueries({ queryKey: ['individual-jobs'] });
      Alert.alert('Bid Placed!', 'The job poster will review your bid.');
      setBidAmount('');
      setBidMessage('');
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.detail ?? 'Failed to place bid'),
  });

  const acceptMutation = useMutation({
    mutationFn: (bid_id: string) => acceptBid(id!, bid_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['individual-job', id] });
      qc.invalidateQueries({ queryKey: ['my-individual-jobs'] });
      Alert.alert('Bid Accepted!', 'The worker has been notified.');
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.detail ?? 'Failed'),
  });

  const completeMutation = useMutation({
    mutationFn: () => markJobComplete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['individual-job', id] });
      qc.invalidateQueries({ queryKey: ['my-individual-jobs'] });
      Alert.alert('Marked Complete', 'Now leave a review for the worker!');
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.detail ?? 'Failed'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => leaveReview(id!, rating, reviewComment || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['individual-job', id] });
      Alert.alert('Review Submitted!', 'Thank you. Your rating helps other users.');
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.detail ?? 'Failed'),
  });

  if (isLoading || !job) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const skillLabel = SKILL_LABELS[job.skill as keyof typeof SKILL_LABELS] ?? job.skill;
  const skillEmoji = SKILL_EMOJIS[job.skill as keyof typeof SKILL_EMOJIS] ?? '🔧';
  const dateStr = new Date(job.job_date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const STATUS_COLOR: Record<string, string> = {
    open: COLORS.success,
    filled: COLORS.warning,
    completed: COLORS.textSecondary,
    cancelled: '#E74C3C',
  };
  const STATUS_LABEL: Record<string, string> = {
    open: 'Open',
    filled: 'Bid Accepted',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>{job.title || skillLabel}</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[job.status] + '20' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLOR[job.status] }]}>
                {STATUS_LABEL[job.status] ?? job.status}
              </Text>
            </View>
          </View>
          <View style={styles.chipRow}>
            <Text style={styles.skillChip}>{skillEmoji} {skillLabel}</Text>
            <Text style={styles.metaChip}>📍 {job.city}</Text>
            <Text style={styles.metaChip}>📅 {dateStr}</Text>
          </View>
          <Text style={styles.locationText}>📌 {job.location}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>
              {job.rate > 0 ? `₹${job.rate}` : 'Open to bids'}
            </Text>
            {job.poster_name && (
              <Text style={styles.posterText}>by {job.poster_name}</Text>
            )}
          </View>
          {job.description ? (
            <Text style={styles.description}>{job.description}</Text>
          ) : null}
        </View>

        {/* ── POSTER VIEW ── */}
        {job.is_poster && (
          <>
            {job.bids.length === 0 ? (
              <View style={styles.noBids}>
                <Text style={styles.noBidsEmoji}>⏳</Text>
                <Text style={styles.noBidsText}>No bids yet. Workers will bid soon.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>{job.bids.length} BID{job.bids.length !== 1 ? 'S' : ''} RECEIVED</Text>
                {job.bids.map(bid => (
                  <BidCard
                    key={bid.bid_id}
                    bid={bid}
                    canAccept={job.status === 'open'}
                    onAccept={() =>
                      Alert.alert(
                        'Accept bid from ' + bid.worker.name + '?',
                        `₹${bid.amount} · All other bids will be rejected.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Accept', onPress: () => acceptMutation.mutate(bid.bid_id) },
                        ]
                      )
                    }
                  />
                ))}
              </>
            )}

            {job.status === 'filled' && (
              <TouchableOpacity
                style={styles.completeBtn}
                onPress={() =>
                  Alert.alert('Mark as Complete?', 'Confirm the work has been done.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Complete', onPress: () => completeMutation.mutate() },
                  ])
                }
                disabled={completeMutation.isPending}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.completeBtnText}>
                  {completeMutation.isPending ? 'Updating...' : 'Mark Job as Complete'}
                </Text>
              </TouchableOpacity>
            )}

            {job.status === 'completed' && (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewTitle}>Rate the Worker</Text>
                <Text style={styles.reviewSub}>Leave a review to help the community</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity key={i} onPress={() => setRating(i)}>
                      <Ionicons
                        name={i <= rating ? 'star' : 'star-outline'}
                        size={32}
                        color="#F5A623"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Comment (optional)"
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  placeholderTextColor={COLORS.textSecondary}
                />
                <TouchableOpacity
                  style={[styles.reviewSubmitBtn, rating === 0 && styles.btnDisabled]}
                  onPress={() => reviewMutation.mutate()}
                  disabled={rating === 0 || reviewMutation.isPending}
                >
                  <Text style={styles.reviewSubmitText}>
                    {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ── BIDDER VIEW ── */}
        {!job.is_poster && job.status === 'open' && (
          <View style={styles.bidForm}>
            <Text style={styles.bidFormTitle}>Place Your Bid</Text>
            <Text style={styles.bidFormSub}>Enter your price for this job</Text>
            <Text style={styles.fieldLabel}>Your price (₹) *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 500"
              value={bidAmount}
              onChangeText={t => setBidAmount(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.fieldLabel}>Message to poster (optional)</Text>
            <TextInput
              style={[styles.fieldInput, { height: 64 }]}
              placeholder="e.g. I have all tools, can come immediately"
              value={bidMessage}
              onChangeText={setBidMessage}
              multiline
              textAlignVertical="top"
              placeholderTextColor={COLORS.textSecondary}
            />
            <TouchableOpacity
              style={[styles.bidSubmitBtn, (!bidAmount || bidMutation.isPending) && styles.btnDisabled]}
              onPress={() => bidMutation.mutate()}
              disabled={!bidAmount || bidMutation.isPending}
            >
              <Text style={styles.bidSubmitText}>
                {bidMutation.isPending ? 'Submitting...' : 'Submit Bid'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!job.is_poster && job.status !== 'open' && (
          <View style={styles.closedNote}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.closedText}>This job is no longer accepting bids.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    padding: 16, paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  content: { paddingBottom: 40 },

  hero: {
    backgroundColor: COLORS.card, marginHorizontal: 16, borderRadius: 14,
    padding: 16, marginBottom: 14,
    elevation: 2,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  heroTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  skillChip: {
    fontSize: 11, fontWeight: '700', color: COLORS.primary,
    backgroundColor: '#FFF0E8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  metaChip: {
    fontSize: 11, color: COLORS.textSecondary,
    backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  locationText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  posterText: { fontSize: 11, color: COLORS.textSecondary },
  description: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, lineHeight: 18 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 0.06, paddingHorizontal: 16, marginBottom: 8,
  },
  bidCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 12,
    marginHorizontal: 16, marginBottom: 10, elevation: 1,
  },
  bidHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  bidWorkerName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  bidWorkerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  bidMetaText: { fontSize: 11, color: COLORS.textSecondary },
  ratingText: { fontSize: 11, color: COLORS.textSecondary },
  dot: { color: COLORS.border, fontSize: 12 },
  bidAmount: { fontSize: 17, fontWeight: '800', color: COLORS.primary },
  bidMessage: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: 8 },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#D4EDDA', borderRadius: 8, padding: 8,
  },
  acceptBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.success },
  acceptedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#D4EDDA', borderRadius: 8, padding: 8, justifyContent: 'center',
  },
  acceptedText: { fontSize: 12, fontWeight: '700', color: COLORS.success },

  noBids: { alignItems: 'center', padding: 32, marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 14 },
  noBidsEmoji: { fontSize: 32, marginBottom: 8 },
  noBidsText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },

  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.success, borderRadius: 12, padding: 14,
    marginHorizontal: 16, marginBottom: 16,
  },
  completeBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  reviewCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
    marginHorizontal: 16, marginBottom: 20, elevation: 2,
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  reviewTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  reviewSub: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 14 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14 },
  reviewInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 10, fontSize: 13, color: COLORS.textPrimary,
    marginBottom: 12, minHeight: 56,
  },
  reviewSubmitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: 13,
    alignItems: 'center',
  },
  reviewSubmitText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  bidForm: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
    marginHorizontal: 16, marginBottom: 16, elevation: 2,
    borderWidth: 1, borderColor: COLORS.primary + '40',
  },
  bidFormTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  bidFormSub: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  fieldInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 11, fontSize: 14, color: COLORS.textPrimary, marginBottom: 10,
  },
  bidSubmitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: 13,
    alignItems: 'center',
  },
  bidSubmitText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  btnDisabled: { opacity: 0.5 },

  closedNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    marginHorizontal: 16, justifyContent: 'center',
  },
  closedText: { fontSize: 13, color: COLORS.textSecondary },
});
