import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const DURATION = 600;

// Keep the brand on screen long enough to register, even when the session restores instantly.
const MIN_VISIBLE_MS = 900;
const EXIT_MS = 550;

// Must match the native splash (app.json expo-splash-screen imageWidth) so the handoff doesn't jump.
const SPLASH_IMAGE_WIDTH = 280;
const SPLASH_IMAGE_HEIGHT = Math.round((SPLASH_IMAGE_WIDTH * 212) / 900);

/**
 * Takes over from the native splash with an identical frame, holds until `ready`
 * (and a minimum time) and then fades out while the logo gently scales up.
 */
export function AnimatedSplashOverlay({ ready }: { ready: boolean }) {
  const [visible, setVisible] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);
  const overlayOpacity = useSharedValue(1);
  const logoScale = useSharedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !minElapsed) return;
    const easing = Easing.bezier(0.33, 0, 0.2, 1);
    logoScale.set(withTiming(1.06, { duration: EXIT_MS, easing }));
    overlayOpacity.set(
      withTiming(0, { duration: EXIT_MS, easing }, (finished) => {
        if (finished) runOnJS(setVisible)(false);
      }),
    );
  }, [ready, minElapsed, logoScale, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.get() }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.get() }] }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={ready && minElapsed ? 'none' : 'auto'}
      onLayout={() => {
        SplashScreen.hideAsync().catch(() => {});
      }}
      style={[styles.splashOverlay, overlayStyle]}>
      <Animated.View style={logoStyle}>
        <Image style={styles.splashImage} source={require('../../logo_splash.png')} contentFit="contain" />
      </Animated.View>
    </Animated.View>
  );
}


const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});


export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('../../assets/images/logo-mark.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 96,
    height: 96,
  },
  splashImage: {
    width: SPLASH_IMAGE_WIDTH,
    height: SPLASH_IMAGE_HEIGHT,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
