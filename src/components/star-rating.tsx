import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

type Props = {
  count: number;
  size?: number;
  max?: number;
};

export function StarRating({ count, size = 16, max = 3 }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: max }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < count ? 'star' : 'star-outline'}
          size={size}
          color={i < count ? '#8103FB' : '#C9C9C9'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});
