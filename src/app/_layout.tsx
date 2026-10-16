import { DefaultTheme, Redirect, Stack, ThemeProvider, usePathname, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DialogHost } from '@/components/ui/dialog';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { Pressable } from '@/components/ui/pressable';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: PropsWithChildren) {
  const { status, user } = useAuth();
  const pathname = usePathname();

  if (status === 'loading') {
    // SplashOverlay covers this until the session is restored.
    return <View style={styles.loadingScreen} />;
  }

  if (status === 'signedOut' && pathname !== '/login') {
    return <Redirect href="/login" />;
  }

  const profileIncomplete = status === 'signedIn' && !user?.profileCompleted;

  if (profileIncomplete && pathname !== '/profile-setup') {
    return <Redirect href="/profile-setup" />;
  }

  if (status === 'signedIn' && !profileIncomplete && (pathname === '/login' || pathname === '/profile-setup')) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}

// Shown instead of a blank/red screen if any screen throws while rendering.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorScreen}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>
        {__DEV__ ? error.message : 'An unexpected error occurred. Please try again.'}
      </Text>
      <Pressable onPress={retry} style={styles.errorBtn} accessibilityRole="button">
        <Text style={styles.errorBtnText}>Try again</Text>
      </Pressable>
    </View>
  );
}

function SplashOverlay() {
  const { status } = useAuth();
  return <AnimatedSplashOverlay ready={status !== 'loading'} />;
}

// The UI is designed for light backgrounds only (app.json userInterfaceStyle: "light").
export default function RootLayout() {
  return (
    // Root for gesture-handler gestures (e.g. the Practice subject carousel).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar style="dark" />
        <AuthProvider>
          <AuthGate>
            <Stack screenOptions={{ headerShown: false }} />
          </AuthGate>
          <DialogHost />
          <SplashOverlay />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: '#FFFFFF' },
  errorScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#FFFFFF' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111111', textAlign: 'center' },
  errorText: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  errorBtn: { marginTop: 22, backgroundColor: '#8103FB', paddingVertical: 13, paddingHorizontal: 30, borderRadius: 8 },
  errorBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
