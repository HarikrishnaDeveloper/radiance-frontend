import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { COLORS } from '@/constants/colors';
import { ThemedText } from '@/components/themed-text';
import type { StageSummary } from '@/types/api';

type Props = {
  stages: StageSummary[];
  onStagePress: (stage: StageSummary, index: number) => void;
  /** Horizontal padding already applied by the parent screen, subtracted from window width. */
  horizontalInset?: number;
};

const ROW_HEIGHT = 100;
const BASE_NODE_SIZE = 58;
const BASE_CURRENT_NODE_SIZE = 68;
const BASE_CANVAS_WIDTH = 300;
const MAX_CANVAS_WIDTH = 420;
const TOP_PADDING = 50;

export function StagePath({ stages, onStagePress, horizontalInset = 44 }: Props) {
  const { width: windowWidth } = useWindowDimensions();

  // Scales the whole layout to whatever width is actually available — narrow
  // phones shrink the nodes/spacing instead of clipping, wide phones/tablets
  // are capped so the path doesn't stretch into unusably sparse spacing.
  const canvasWidth = Math.min(Math.max(windowWidth - horizontalInset, 220), MAX_CANVAS_WIDTH);
  const scale = canvasWidth / BASE_CANVAS_WIDTH;

  const centerX = canvasWidth / 2;
  const offsetX = canvasWidth * (70 / BASE_CANVAS_WIDTH); // keep the mockup's node-offset ratio
  const nodeSize = Math.round(BASE_NODE_SIZE * Math.min(scale, 1));
  const currentNodeSize = Math.round(BASE_CURRENT_NODE_SIZE * Math.min(scale, 1));
  const rowHeight = ROW_HEIGHT * Math.min(scale, 1);

  const firstActiveIndex = stages.findIndex((s) => s.status === 'UNLOCKED' || s.status === 'IN_PROGRESS');

  function xForIndex(i: number): number {
    const slot = i % 4;
    if (slot === 1) return centerX + offsetX;
    if (slot === 3) return centerX - offsetX;
    return centerX;
  }

  const points = useMemo(
    () => stages.map((_, i) => ({ x: xForIndex(i), y: TOP_PADDING + i * rowHeight })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stages, centerX, offsetX, rowHeight]
  );

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [points]);

  const totalHeight = TOP_PADDING * 2 + Math.max(0, stages.length - 1) * rowHeight;

  return (
    <View style={{ width: canvasWidth, height: totalHeight, alignSelf: 'center' }}>
      <Svg width={canvasWidth} height={totalHeight} style={StyleSheet.absoluteFill}>
        <Path d={pathD} stroke={COLORS.grayBorder} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 14" fill="none" />
      </Svg>

      {stages.map((stage, i) => {
        const point = points[i];
        const isCurrent = i === firstActiveIndex;
        const isDone = stage.status === 'COMPLETED';
        const isLocked = stage.status === 'LOCKED';
        const size = isCurrent ? currentNodeSize : nodeSize;

        return (
          <Pressable
            key={stage.id}
            onPress={() => onStagePress(stage, i)}
            style={{
              position: 'absolute',
              left: point.x - size / 2,
              top: point.y - size / 2,
              alignItems: 'center',
              width: Math.max(size, 64),
            }}>
            <View
              style={[
                styles.node,
                { width: size, height: size, borderRadius: size / 2 },
                isDone && { backgroundColor: COLORS.purple },
                isCurrent && { backgroundColor: COLORS.gold },
                isLocked && styles.nodeLocked,
                !isDone && !isCurrent && !isLocked && { backgroundColor: COLORS.purpleSoft },
              ]}>
              {isDone && <Ionicons name="checkmark" size={Math.round(size * 0.45)} color={COLORS.white} />}
              {isCurrent && <Ionicons name="play" size={Math.round(size * 0.4)} color={COLORS.white} />}
              {isLocked && <Ionicons name="lock-closed" size={Math.round(size * 0.35)} color={COLORS.grayLight} />}
              {!isDone && !isCurrent && !isLocked && (
                <Ionicons name="ellipse" size={Math.round(size * 0.3)} color={COLORS.purple} />
              )}
            </View>
            <ThemedText
              type="small"
              themeColor={isLocked ? 'textSecondary' : 'text'}
              numberOfLines={1}
              style={styles.label}>
              {stage.title}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.navy,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  nodeLocked: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.grayBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
