import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { postJob } from '../../lib/api';
import { COLORS, SKILLS, SKILL_LABELS, SKILL_EMOJIS, AP_CITIES } from '../../lib/config';

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '12:00',
];

function formatTimeLabel(t: string) {
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

const DATE_PRESETS = [
  { label: 'Today', offset: 0 },
  { label: 'Tomorrow', offset: 1 },
  { label: 'In 2 days', offset: 2 },
  { label: 'In 3 days', offset: 3 },
];

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function PostJob() {
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

  const [skill, setSkill] = useState('');
  const [count, setCount] = useState(1);
  const [dateStr, setDateStr] = useState(offsetDate(1));
  const [rate, setRate] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [startTime, setStartTime] = useState('');

  const [cityModal, setCityModal] = useState(false);

  const isReady = skill && count > 0 && dateStr && parseInt(rate) > 0 && location && city;

  const mutation = useMutation({
    mutationFn: () => postJob({
      skill,
      required_count: count,
      job_date: dateStr,
      rate: parseInt(rate),
      location,
      city,
      start_time: startTime || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contractor-jobs'] });
      Alert.alert('Job Posted!', 'Matching workers will be notified.', [
        { text: 'OK', onPress: () => router.push('/(contractor)') },
      ]);
    },
    onError: (e: any) => {
      Alert.alert('Error', e.response?.data?.detail || e.message || 'Failed to post job');
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Skill */}
      <Text style={styles.sectionLabel}>Skill Required *</Text>
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.chipScroll} contentContainerStyle={styles.chipRow}
      >
        {SKILLS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, skill === s && styles.chipActive]}
            onPress={() => setSkill(s)}
          >
            <Text style={styles.chipEmoji}>{SKILL_EMOJIS[s]}</Text>
            <Text style={[styles.chipText, skill === s && styles.chipTextActive]}>
              {SKILL_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Number of workers */}
      <Text style={styles.label}>Number of Workers *</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => setCount(c => Math.max(1, c - 1))}
        >
          <Ionicons name="remove" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepperVal}>{count}</Text>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => setCount(c => Math.min(50, c + 1))}
        >
          <Ionicons name="add" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Date */}
      <Text style={styles.label}>Date *</Text>
      <View style={styles.chipRowInline}>
        {DATE_PRESETS.map(p => {
          const d = offsetDate(p.offset);
          return (
            <TouchableOpacity
              key={p.label}
              style={[styles.datePill, dateStr === d && styles.datePillActive]}
              onPress={() => setDateStr(d)}
            >
              <Text style={[styles.datePillText, dateStr === d && styles.datePillTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.selectedDate}>
        <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
        <Text style={styles.selectedDateText}>{formatDateLabel(dateStr)}</Text>
      </View>

      {/* Rate */}
      <Text style={styles.label}>Daily Rate (₹) *</Text>
      <View style={styles.inputRow}>
        <Text style={styles.inputPrefix}>₹</Text>
        <TextInput
          style={styles.inputInline}
          placeholder="e.g. 800"
          value={rate}
          onChangeText={setRate}
          keyboardType="numeric"
          placeholderTextColor={COLORS.textSecondary}
        />
        <Text style={styles.inputSuffix}>/day</Text>
      </View>

      {/* City */}
      <Text style={styles.label}>City *</Text>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setCityModal(true)}>
        <Ionicons name="location-outline" size={16} color={city ? COLORS.primary : COLORS.textSecondary} />
        <Text style={[styles.pickerBtnText, !city && styles.pickerPlaceholder]}>
          {city || 'Select city'}
        </Text>
        <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {/* Site location */}
      <Text style={styles.label}>Site Address / Landmark *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Near Kanaka Durga Temple, Vijayawada"
        value={location}
        onChangeText={setLocation}
        placeholderTextColor={COLORS.textSecondary}
        multiline
        numberOfLines={2}
      />

      {/* Start time */}
      <Text style={styles.label}>Start Time (optional)</Text>
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.chipScroll} contentContainerStyle={styles.chipRow}
      >
        {TIME_SLOTS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.timePill, startTime === t && styles.timePillActive]}
            onPress={() => setStartTime(startTime === t ? '' : t)}
          >
            <Text style={[styles.timePillText, startTime === t && styles.timePillTextActive]}>
              {formatTimeLabel(t)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Preview */}
      {isReady && (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewLine}>
            {SKILL_EMOJIS[skill as keyof typeof SKILL_EMOJIS]} {count} {SKILL_LABELS[skill as keyof typeof SKILL_LABELS]} in {city}
          </Text>
          <Text style={styles.previewLine}>
            {formatDateLabel(dateStr)} · ₹{rate}/day{startTime ? ` · From ${formatTimeLabel(startTime)}` : ''}
          </Text>
          <Text style={styles.previewLine}>{location}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, (!isReady || mutation.isPending) && styles.submitBtnDisabled]}
        onPress={() => isReady && mutation.mutate()}
        disabled={!isReady || mutation.isPending}
      >
        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
        <Text style={styles.submitText}>{mutation.isPending ? 'Posting...' : 'Post Job'}</Text>
      </TouchableOpacity>

      {/* City Picker Modal */}
      <Modal visible={cityModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCityModal(false)} />
        <View style={[styles.modalSheet, { paddingBottom: 16 + insets.bottom }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select City</Text>
          <ScrollView>
            {AP_CITIES.map(c => (
              <TouchableOpacity
                key={c}
                style={styles.cityOption}
                onPress={() => { setCity(c); setCityModal(false); }}
              >
                <Text style={[styles.cityOptionText, city === c && styles.cityOptionActive]}>{c}</Text>
                {city === c && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginTop: 20 },
  chipScroll: { marginBottom: 4 },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'flex-start', overflow: 'hidden' },
  stepperBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  stepperVal: { minWidth: 56, textAlign: 'center', fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  chipRowInline: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  datePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  datePillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  datePillText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  datePillTextActive: { color: '#fff' },
  selectedDate: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  selectedDateText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', height: 48 },
  inputPrefix: { paddingLeft: 14, fontSize: 16, color: COLORS.textSecondary },
  inputInline: { flex: 1, paddingHorizontal: 8, fontSize: 16, color: COLORS.textPrimary },
  inputSuffix: { paddingRight: 14, fontSize: 13, color: COLORS.textSecondary },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
  pickerBtnText: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  pickerPlaceholder: { color: COLORS.textSecondary, fontWeight: '400' },
  input: { backgroundColor: COLORS.card, borderRadius: 10, padding: 14, fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, textAlignVertical: 'top' },
  timePill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  timePillActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  timePillText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  timePillTextActive: { color: '#fff' },
  preview: { backgroundColor: '#FEF0E8', borderRadius: 12, padding: 14, marginTop: 24, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  previewTitle: { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewLine: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 3 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, marginTop: 24 },
  submitBtnDisabled: { backgroundColor: '#f0c4a8' },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  cityOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cityOptionText: { fontSize: 15, color: COLORS.textPrimary },
  cityOptionActive: { color: COLORS.primary, fontWeight: '700' },
});
