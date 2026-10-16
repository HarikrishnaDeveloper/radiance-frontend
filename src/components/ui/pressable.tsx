import { Pressable as RNPressable, type PressableProps } from 'react-native';

import { playSound, type SoundName } from '@/lib/sounds';

type Props = PressableProps & {
  /** Sound for a press that completes something meaningful (e.g. submitting). Ordinary taps stay silent. */
  sound?: SoundName;
  ref?: React.Ref<React.ComponentRef<typeof RNPressable>>;
};

// React Native's Pressable that can play one of the app's sound effects on
// press. Silent unless `sound` is given.
export function Pressable({ sound, onPress, ...rest }: Props) {
  return (
    <RNPressable
      {...rest}
      onPress={
        onPress &&
        ((e) => {
          if (sound) playSound(sound);
          onPress(e);
        })
      }
    />
  );
}
