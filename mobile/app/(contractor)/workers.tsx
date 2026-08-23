import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { getNearbyWorkers } from '../../lib/api';
import { COLORS, SKILLS, SKILL_LABELS, DEFAULT_REGION } from '../../lib/config';
import WorkerCard from '../../components/WorkerCard';

export default function FindWorkers() {
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setUserLoc({ lat: latitude, lng: longitude });
      setRegion({ latitude, longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 });
    })();
  }, []);

  const RADIUS_KM = 50;

  const { data: workers = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['workers-nearby', userLoc, selectedSkill],
    queryFn: () =>
      userLoc
        ? getNearbyWorkers(userLoc.lat, userLoc.lng, RADIUS_KM, selectedSkill ?? undefined).then(r => r.data)
        : Promise.resolve([]),
    enabled: !!userLoc,
  });

  const mappableWorkers = workers.filter((w: any) => w.distance_km !== null && w.distance_km !== undefined);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedSkill && styles.chipActive]}
          onPress={() => setSelectedSkill(null)}
        >
          <Text style={[styles.chipText, !selectedSkill && styles.chipTextActive]}>All Skills</Text>
        </TouchableOpacity>
        {SKILLS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, selectedSkill === s && styles.chipActive]}
            onPress={() => setSelectedSkill(selectedSkill === s ? null : s)}
          >
            <Text style={[styles.chipText, selectedSkill === s && styles.chipTextActive]}>{SKILL_LABELS[s]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.toggleRow}>
        <Text style={styles.countText}>{workers.length} workers within {RADIUS_KM} km</Text>
        <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowMap(v => !v)}>
          <Text style={styles.toggleText}>{showMap ? 'List View' : 'Map View'}</Text>
        </TouchableOpacity>
      </View>

      {showMap ? (
        <MapView style={styles.map} region={region} showsUserLocation>
          {mappableWorkers.map((w: any) => (
            <Marker
              key={w.worker_id}
              coordinate={{ latitude: w.latitude, longitude: w.longitude }}
              title={w.name}
              description={`${(w.skills ?? []).map((s: string) => SKILL_LABELS[s as keyof typeof SKILL_LABELS] ?? s).join(', ')} · ${w.distance_km} km away`}
              pinColor={COLORS.secondary}
            />
          ))}
        </MapView>
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(w: any) => w.worker_id}
          renderItem={({ item }) => <WorkerCard worker={item} distanceKm={item.distance_km} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[COLORS.primary]} />}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👷</Text>
              <Text style={styles.emptyText}>
                {isLoading || !userLoc ? 'Getting your location...' : 'No workers found nearby'}
              </Text>
              {!userLoc && <Text style={styles.emptyMeta}>Please allow location access</Text>}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterScroll: { maxHeight: 52, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  countText: { fontSize: 13, color: COLORS.textSecondary },
  toggleBtn: { backgroundColor: COLORS.secondary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toggleText: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  map: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  emptyMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
});
