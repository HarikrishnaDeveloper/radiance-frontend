import { DefaultTheme, Redirect, Stack, ThemeProvider, usePathname, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SplashContent } from '@/components/splash-content';
import { AuthProvider, useAuth } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: PropsWithChildren) {
  const { status, user } = useAuth();
  const pathname = usePathname();

  if (status === 'loading') {
    return <SplashContent />;
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

// The UI is designed for light backgrounds only (app.json userInterfaceStyle: "light").
export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
      <AuthProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthGate>
      </AuthProvider>
      <AnimatedSplashOverlay />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  errorScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#FFFFFF' },
  errorTitle: { fontSize: 18, fontWeight: '800', color: '#152B5C', textAlign: 'center' },
  errorText: { fontSize: 14, color: '#6E7488', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  errorBtn: { marginTop: 22, backgroundColor: '#7B2FBE', paddingVertical: 13, paddingHorizontal: 30, borderRadius: 2 },
  errorBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
