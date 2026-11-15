import { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';

/** Material You tonal pulsing placeholder block. */
export function Skeleton({ width, height = 14, radius = Radius.sm, style }: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceContainerHigh,
        },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonRows({ count = 4, avatar = true }: { count?: number; avatar?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.row,
            i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.outlineVariant + '55' },
          ]}
        >
          {avatar && <Skeleton width={40} height={40} radius={14} />}
          <View style={styles.rowBody}>
            <Skeleton width={i % 3 === 0 ? '62%' : i % 3 === 1 ? '48%' : '55%'} height={13} />
            <Skeleton width={i % 2 === 0 ? '38%' : '44%'} height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SkeletonStats({ count = 3 }: { count?: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.statsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.stat, { backgroundColor: colors.surfaceContainer }]}
        >
          <Skeleton width={38} height={24} />
          <Skeleton width="72%" height={10} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonTiles({ count = 6 }: { count?: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.tileGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.tile, { backgroundColor: colors.surfaceContainerLow }]}
        >
          <Skeleton width={40} height={40} radius={14} />
          <Skeleton width="58%" height={12} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonHeading({ width = 110 }: { width?: number }) {
  return <Skeleton width={width} height={14} style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm, marginLeft: Spacing.xs }} />;
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, minHeight: 62 },
  rowBody: { flex: 1, gap: 7 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  stat: {
    flex: 1,
    gap: 8,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    minHeight: 76,
    justifyContent: 'center',
  },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 100,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
});
