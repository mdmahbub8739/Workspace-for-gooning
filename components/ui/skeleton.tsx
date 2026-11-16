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
import { getGlassStyle } from '@/components/ui/glass';
import { M3LinearProgress } from '@/components/ui/loading';
import { useReducedMotion } from '@/components/ui/m3-motion';
import { Radius, Spacing } from '@/constants/theme';

/**
 * Android Material You tonal shimmer placeholder block.
 * Pulses gently between Material 3 surfaceContainer tones, respecting reduced motion.
 */
export function Skeleton({ width, height = 14, radius = Radius.sm, style }: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, isDark } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(reduced ? 0.65 : 0.42);

  useEffect(() => {
    if (reduced) {
      pulse.value = 0.65;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.88, { duration: 760, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.42, { duration: 760, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse, reduced]);

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
          backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : colors.surfaceContainerHighest,
        },
        animStyle,
        style,
      ]}
    />
  );
}

/** Material You hero/account banner skeleton card. */
export function SkeletonHero({ showTopBar = true }: { showTopBar?: boolean }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ gap: Spacing.md }}>
      {showTopBar && <M3LinearProgress height={3} />}
      <View style={[styles.heroCard, getGlassStyle(colors, isDark, 'elevated', Radius.xl)]}>
        <Skeleton width={48} height={48} radius={24} />
        <View style={styles.rowBody}>
          <Skeleton width="35%" height={11} />
          <Skeleton width="58%" height={18} />
        </View>
        <Skeleton width={52} height={24} radius={Radius.full} />
      </View>
    </View>
  );
}

/** Detached Material You rounded list rows matching `Group`. */
export function SkeletonRows({ count = 4, avatar = true }: { count?: number; avatar?: boolean }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={styles.group}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.rowCard, getGlassStyle(colors, isDark, 'surface', 18)]}
        >
          {avatar && <Skeleton width={28} height={28} radius={10} />}
          <View style={styles.rowBody}>
            <Skeleton width={i % 3 === 0 ? '62%' : i % 3 === 1 ? '48%' : '55%'} height={14} />
            <Skeleton width={i % 2 === 0 ? '38%' : '44%'} height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SkeletonStats({ count = 3 }: { count?: number }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={styles.statsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.stat, getGlassStyle(colors, isDark, 'surface', Radius.lg)]}
        >
          <Skeleton width="66%" height={10} />
          <Skeleton width={38} height={26} radius={Radius.xs} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonTiles({ count = 6 }: { count?: number }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={styles.tileGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.tile, getGlassStyle(colors, isDark, 'surface', Radius.lg)]}
        >
          <Skeleton width={44} height={44} radius={16} />
          <Skeleton width="58%" height={12} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonChips({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.chipRow}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} width={i % 2 === 0 ? 78 : 64} height={34} radius={Radius.sm} />
      ))}
    </View>
  );
}

export function SkeletonHeading({ width = 110 }: { width?: number }) {
  return <Skeleton width={width} height={14} style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm, marginLeft: Spacing.xs }} />;
}

const styles = StyleSheet.create({
  group: { gap: Spacing.sm },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    minHeight: 62,
    borderRadius: 18,
  },
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
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 94,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },

  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
});
