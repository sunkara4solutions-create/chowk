import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/auth';
import { setAuthRedirect } from '../lib/api';

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
