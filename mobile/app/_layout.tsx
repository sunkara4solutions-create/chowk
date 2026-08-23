import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/auth';
import { setAuthRedirect, registerDeviceToken } from '../lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function _registerPushToken(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Chowk Jobs',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    const { status } = await Notifications.getPermissionsAsync();
    const finalStatus = status !== 'granted'
      ? (await Notifications.requestPermissionsAsync()).status
      : status;
    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerDeviceToken(pushToken, Platform.OS as 'android' | 'ios');
  } catch {
    // silently ignore — push is non-critical
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function RootLayoutNav() {
  const { initialize, isLoading, token, role } = useAuthStore();

  useEffect(() => {
    setAuthRedirect(() => {
      router.replace('/(auth)/phone');
    });
    initialize();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!token) {
      router.replace('/(auth)/phone');
    } else if (role === 'new') {
      router.replace('/(setup)/role');
    } else if (role === 'worker') {
      router.replace('/(worker)');
    } else if (role === 'contractor') {
      router.replace('/(contractor)');
    }
  }, [isLoading, token, role]);

  useEffect(() => {
    if (token && role && role !== 'new') {
      _registerPushToken();
    }
  }, [token, role]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(setup)" options={{ headerShown: false }} />
        <Stack.Screen name="(worker)" options={{ headerShown: false }} />
        <Stack.Screen name="(contractor)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
