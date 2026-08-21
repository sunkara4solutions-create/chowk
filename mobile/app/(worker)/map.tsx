import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { getNearbyJobs, updateWorkerLocation } from '../../lib/api';
import { COLORS, DEFAULT_REGION, SKILL_LABELS } from '../../lib/config';
import type { Job } from '../../lib/types';

export default function MapScreen() {
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setUserLoc({ lat: latitude, lng: longitude });
      setRegion({ latitude, longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 });
      updateWorkerLocation(latitude, longitude).catch(() => {});
    })();
  }, []);

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['jobs-nearby', userLoc],
    queryFn: () =>
      userLoc
        ? getNearbyJobs(userLoc.lat, userLoc.lng).then(r => r.data)
        : Promise.resolve([]),
    enabled: !!userLoc,
  });

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} showsUserLocation>
        {jobs.map(job => (
          <Marker
            key={job.job_id}
            coordinate={{ latitude: region.latitude, longitude: region.longitude }}
            title={SKILL_LABELS[job.skill as keyof typeof SKILL_LABELS] ?? job.skill}
            description={`₹${job.rate}/day · ${job.city}`}
            pinColor={COLORS.primary}
            onCalloutPress={() => router.push(`/(worker)/job/${job.job_id}`)}
          />
        ))}
      </MapView>

      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Jobs Near You ({jobs.length})</Text>
        {jobs.length === 0 ? (
          <Text style={styles.empty}>
            {userLoc ? 'No open jobs nearby right now' : 'Waiting for location...'}
          </Text>
        ) : (
          <FlatList
            data={jobs.slice(0, 8)}
            keyExtractor={j => j.job_id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 4 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.miniCard}
                onPress={() => router.push(`/(worker)/job/${item.job_id}`)}
              >
                <Text style={styles.miniSkill}>
                  {SKILL_LABELS[item.skill as keyof typeof SKILL_LABELS] ?? item.skill}
                </Text>
                <Text style={styles.miniCity}>{item.city}</Text>
                <Text style={styles.miniRate}>₹{item.rate}/day</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  empty: { fontSize: 13, color: COLORS.textSecondary, paddingBottom: 8 },
  miniCard: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    width: 130,
  },
  miniSkill: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  miniCity: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  miniRate: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
});
