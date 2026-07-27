import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import type { PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

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

  const profileIncomplete = status === 'signedIn' && !user?.name;

  if (profileIncomplete && pathname !== '/login') {
    return <Redirect href="/login" />;
  }

  if (status === 'signedIn' && !profileIncomplete && pathname === '/login') {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
