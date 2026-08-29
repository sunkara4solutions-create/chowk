import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/config';

export default function WorkerLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom || 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
          color: COLORS.textPrimary,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
          headerTitle: 'Available Jobs',
        }}
      />
      <Tabs.Screen name="map" options={{ href: null }} />
      <Tabs.Screen
        name="my-jobs"
        options={{
          title: 'My Jobs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
          headerTitle: 'My Applications',
        }}
      />
      <Tabs.Screen
        name="hire"
        options={{
          title: 'Hire',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hammer-outline" size={size} color={color} />
          ),
          headerTitle: 'Hire & Post Jobs',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          headerTitle: 'My Profile',
        }}
      />
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
      <Tabs.Screen name="post-individual-job" options={{ href: null, headerTitle: 'Post a Job' }} />
      <Tabs.Screen name="individual-job/[id]" options={{ href: null, headerTitle: 'Job Details' }} />
    </Tabs>
  );
}
