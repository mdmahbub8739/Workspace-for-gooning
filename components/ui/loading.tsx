import { useEffect } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { BrandMark } from '@/components/ui/brand';
import { getTintedGlassStyle } from '@/components/ui/glass';
import { M3_EMPHASIZED, M3_SPRING, useReducedMotion } from '@/components/ui/m3-motion';
import { FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Generates a closed smooth SVG path for a normalized Material 3 Expressive polar shape
 * centered at (50, 50) in a 100x100 viewBox.
 * - lobes = 0 -> smooth rounded superellipse/squircle
 * - lobes = 4 -> M3 4-leaf clover
 * - lobes = 7 -> M3 7-scallop cookie / soft-burst
 * - lobes = 5 -> M3 rounded pentagon
 */
function buildPolarShapePath(lobes: number, amplitude: number, superellipse = false): string {
  const N = 72;
  const cx = 50;
  const cy = 50;
  const baseR = 40;
  const pts: [number, number][] = [];

  for (let i = 0; i < N; i++) {
    const theta = (i / N) * Math.PI * 2;
    let r = baseR;
    if (superellipse) {
      const c = Math.abs(Math.cos(theta));
      const s = Math.abs(Math.sin(theta));
      const n = 3.2;
      r = baseR * 0.98 * Math.pow(Math.pow(c, n) + Math.pow(s, n), -1 / n);
    } else if (lobes > 0) {
      r = baseR * (1 + amplitude * Math.cos(lobes * theta));
    }
    pts.push([cx + r * Math.cos(theta), cy + r * Math.sin(theta)]);
  }

  const mid = (a: [number, number], b: [number, number]): [number, number] => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ];

  const start = mid(pts[N - 1], pts[0]);
  const parts = [`M ${start[0].toFixed(2)} ${start[1].toFixed(2)}`];
  for (let i = 0; i < N; i++) {
    const p = pts[i];
    const next = pts[(i + 1) % N];
    const m = mid(p, next);
    parts.push(`Q ${p[0].toFixed(2)} ${p[1].toFixed(2)} ${m[0].toFixed(2)} ${m[1].toFixed(2)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

const M3_SHAPES = [
  buildPolarShapePath(7, 0.14), // M3 7-scallop cookie
  buildPolarShapePath(4, 0.16), // M3 4-leaf clover
  buildPolarShapePath(0, 0, true), // M3 superellipse squircle
  buildPolarShapePath(5, 0.09), // M3 rounded pentagon
];

export interface M3LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg' | number;
  contained?: boolean;
  color?: string;
  containerColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Android Material You (Material 3 Expressive) LoadingIndicator / ContainedLoadingIndicator.
 * Smoothly rotates & morph-cycles organic Material You geometric shapes.
 */
export function M3LoadingIndicator({
  size = 'md',
  contained = false,
  color,
  containerColor,
  style,
}: M3LoadingIndicatorProps) {
  const { colors, isDark } = useTheme();
  const reduced = useReducedMotion();
  const px = size === 'sm' ? 24 : size === 'md' ? 42 : size === 'lg' ? 56 : size;

  const fg = color ?? (contained ? colors.onPrimaryContainer : colors.primary);
  const bg = containerColor ?? (isDark ? colors.primaryContainer : colors.primaryContainer);

  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const phase = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      rotation.value = 0;
      pulse.value = 1;
      phase.value = 0;
      return;
    }
    rotation.value = withRepeat(
      withTiming(360, { duration: 2600, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 650, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.92, { duration: 650, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    phase.value = withRepeat(
      withTiming(4, { duration: 2600, easing: Easing.linear }),
      -1,
      false,
    );
  }, [reduced, rotation, pulse, phase]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: pulse.value }],
  }));

  const layer0 = useAnimatedStyle(() => {
    const p = phase.value % 4;
    const dist = Math.min(Math.abs(p - 0), Math.abs(p - 4));
    const op = Math.max(0, 1 - dist * 1.15);
    return { opacity: op, transform: [{ scale: 0.9 + op * 0.1 }] };
  });
  const layer1 = useAnimatedStyle(() => {
    const p = phase.value % 4;
    const op = Math.max(0, 1 - Math.abs(p - 1) * 1.15);
    return { opacity: op, transform: [{ scale: 0.9 + op * 0.1 }] };
  });
  const layer2 = useAnimatedStyle(() => {
    const p = phase.value % 4;
    const op = Math.max(0, 1 - Math.abs(p - 2) * 1.15);
    return { opacity: op, transform: [{ scale: 0.9 + op * 0.1 }] };
  });
  const layer3 = useAnimatedStyle(() => {
    const p = phase.value % 4;
    const op = Math.max(0, 1 - Math.abs(p - 3) * 1.15);
    return { opacity: op, transform: [{ scale: 0.9 + op * 0.1 }] };
  });

  const layerStyles = [layer0, layer1, layer2, layer3];
  const glyphPx = contained ? Math.round(px * 0.62) : px;

  const glyph = (
    <Animated.View style={[{ width: glyphPx, height: glyphPx }, spinStyle]}>
      {M3_SHAPES.map((d, idx) => (
        <Animated.View key={idx} style={[StyleSheet.absoluteFill, layerStyles[idx]]}>
          <Svg width={glyphPx} height={glyphPx} viewBox="0 0 100 100">
            <Path d={d} fill={fg} />
          </Svg>
        </Animated.View>
      ))}
    </Animated.View>
  );

  if (!contained) {
    return (
      <View
        style={[{ width: px, height: px, alignItems: 'center', justifyContent: 'center' }, style]}
        accessibilityRole="progressbar"
      >
        {glyph}
      </View>
    );
  }

  return (
    <View
      accessibilityRole="progressbar"
      style={[
        {
          width: px,
          height: px,
          borderRadius: Math.round(px * 0.36),
          alignItems: 'center',
          justifyContent: 'center',
        },
        getTintedGlassStyle(colors, isDark, bg + (isDark ? 'CF' : 'EC'), 18),
        style,
      ]}
    >
      {glyph}
    </View>
  );
}

export interface M3CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress?: number; // 0..1 for determinate; omit for indeterminate Android M3 spinner
  color?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Android Material You CircularProgressIndicator with rounded stroke caps and tonal track.
 */
export function M3CircularProgress({
  size = 36,
  strokeWidth,
  progress,
  color,
  trackColor,
  style,
}: M3CircularProgressProps) {
  const { colors, isDark } = useTheme();
  const reduced = useReducedMotion();
  const sw = strokeWidth ?? Math.max(2.5, Math.round(size * 0.11));
  const r = (size - sw) / 2;
  const circumference = 2 * Math.PI * r;
  const fg = color ?? colors.primary;
  const track = trackColor ?? (isDark ? 'rgba(255,255,255,0.12)' : colors.secondaryContainer);

  const rotate = useSharedValue(0);
  const breath = useSharedValue(1);

  useEffect(() => {
    if (progress !== undefined || reduced) {
      rotate.value = 0;
      breath.value = 1;
      return;
    }
    rotate.value = withRepeat(
      withTiming(360, { duration: 1050, easing: Easing.linear }),
      -1,
      false,
    );
    breath.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 525, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.97, { duration: 525, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [progress, reduced, rotate, breath]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }, { scale: breath.value }],
  }));

  const clamped = progress !== undefined ? Math.max(0.02, Math.min(1, progress)) : 0.68;
  const dashArray = `${(circumference * clamped).toFixed(2)} ${circumference.toFixed(2)}`;

  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      accessibilityRole="progressbar"
    >
      <Animated.View style={[{ width: size, height: size }, progress === undefined ? spinStyle : undefined]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={track}
            strokeWidth={sw}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={dashArray}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Drop-in Material You replacement for React Native's ActivityIndicator.
 */
export function M3Spinner({
  size = 'small',
  color,
  style,
}: {
  size?: 'small' | 'large' | 'sm' | 'md' | 'lg' | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const px =
    size === 'small' || size === 'sm'
      ? 18
      : size === 'md'
        ? 26
        : size === 'large' || size === 'lg'
          ? 38
          : size;
  return <M3CircularProgress size={px} color={color} style={style} />;
}

export interface M3LinearProgressProps {
  progress?: number; // 0..1 for determinate; undefined for indeterminate M3 sweep
  height?: number;
  color?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Android Material You LinearProgressIndicator (capsule track + M3 stop dot / dual-phase indeterminate sweep).
 */
export function M3LinearProgress({
  progress,
  height = 4,
  color,
  trackColor,
  style,
}: M3LinearProgressProps) {
  const { colors, isDark } = useTheme();
  const reduced = useReducedMotion();
  const fg = color ?? colors.primary;
  const track = trackColor ?? (isDark ? 'rgba(255,255,255,0.12)' : colors.secondaryContainer);

  const sweepA = useSharedValue(-0.4);
  const sweepB = useSharedValue(-0.65);
  const detProgress = useSharedValue(progress ?? 0);

  useEffect(() => {
    if (progress !== undefined) {
      const target = Math.max(0, Math.min(1, progress));
      detProgress.value = reduced ? target : withSpring(target, M3_SPRING);
      return;
    }
    if (reduced) {
      sweepA.value = 0.2;
      sweepB.value = -1;
      return;
    }
    sweepA.value = -0.45;
    sweepA.value = withRepeat(
      withTiming(1.15, { duration: 1350, easing: M3_EMPHASIZED }),
      -1,
      false,
    );
    sweepB.value = -0.55;
    sweepB.value = withDelay(
      620,
      withRepeat(
        withTiming(1.2, { duration: 1350, easing: M3_EMPHASIZED }),
        -1,
        false,
      ),
    );
  }, [progress, reduced, sweepA, sweepB, detProgress]);

  const barAStyle = useAnimatedStyle(() => ({
    left: `${sweepA.value * 100}%`,
    width: '42%',
  }));

  const barBStyle = useAnimatedStyle(() => ({
    left: `${sweepB.value * 100}%`,
    width: '28%',
  }));

  const detBarStyle = useAnimatedStyle(() => ({
    width: `${Math.max(4, detProgress.value * 100)}%`,
  }));

  return (
    <View
      accessibilityRole="progressbar"
      style={[
        styles.linearTrack,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: track,
        },
        style,
      ]}
    >
      {progress !== undefined ? (
        <>
          <Animated.View
            style={[
              styles.linearFill,
              { backgroundColor: fg, borderRadius: height / 2 },
              detBarStyle,
            ]}
          />
          <View
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: height,
              height,
              borderRadius: height / 2,
              backgroundColor: fg,
              opacity: 0.75,
            }}
          />
        </>
      ) : (
        <>
          <Animated.View style={[styles.linearFill, { backgroundColor: fg, borderRadius: height / 2 }, barAStyle]} />
          <Animated.View style={[styles.linearFill, { backgroundColor: fg, borderRadius: height / 2, opacity: 0.75 }, barBStyle]} />
        </>
      )}
    </View>
  );
}

interface LoadingProps {
  message?: string;
  subtitle?: string;
  fullScreen?: boolean;
  variant?: 'expressive' | 'circular' | 'linear' | 'splash';
  showTopBar?: boolean;
}

/**
 * Full-project Android Material You Loading Screen.
 * Supports:
 * - `expressive` (default): Material 3 Expressive ContainedLoadingIndicator + top linear bar
 * - `splash`: Android 12+ adaptive icon splash + Material You capsule progress bar
 * - `circular`: Material 3 CircularProgressIndicator
 * - `linear`: Material 3 LinearProgressIndicator
 */
export function Loading({
  message,
  subtitle,
  fullScreen = true,
  variant = 'expressive',
  showTopBar = true,
}: LoadingProps) {
  const { colors, isDark } = useTheme();

  if (!fullScreen) {
    return (
      <View style={styles.inlineContainer}>
        {variant === 'linear' ? (
          <M3LinearProgress style={styles.inlineBar} />
        ) : variant === 'circular' ? (
          <M3CircularProgress size={32} />
        ) : (
          <M3LoadingIndicator size={40} contained />
        )}
        {message && <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.fullScreen, { backgroundColor: colors.background }]}>
      {showTopBar && variant !== 'splash' && variant !== 'linear' && (
        <View style={styles.topProgressWrap}>
          <M3LinearProgress height={3} />
        </View>
      )}

      {variant === 'splash' ? (
        <View style={styles.splashWrap}>
          <View
            style={[
              styles.splashTile,
              getTintedGlassStyle(colors, isDark, colors.surfaceContainerHigh, 24),
              { borderRadius: 28 },
            ]}
          >
            <BrandMark size={64} />
          </View>
          <M3LinearProgress height={5} style={styles.splashBar} />
          {message && <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>{message}</Text>}
        </View>
      ) : variant === 'linear' ? (
        <View style={styles.linearWrap}>
          {message && <Text style={[styles.linearTitle, { color: colors.onSurface }]}>{message}</Text>}
          <M3LinearProgress height={6} style={{ width: '100%' }} />
          {subtitle && <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>}
        </View>
      ) : variant === 'circular' ? (
        <View style={styles.centerCard}>
          <M3CircularProgress size={48} strokeWidth={4.5} />
          {message && <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>{message}</Text>}
          {subtitle && <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text>}
        </View>
      ) : (
        <View style={styles.centerCard}>
          <M3LoadingIndicator size={64} contained />
          {message && <Text style={[styles.message, { color: colors.onSurface }]}>{message}</Text>}
          {subtitle && <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  fullScreen: {
    flex: 1,
    position: 'relative',
  },
  inlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  inlineBar: {
    width: 160,
  },
  topProgressWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    maxWidth: 300,
  },
  splashWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  splashTile: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashBar: {
    width: 148,
  },
  linearWrap: {
    width: '100%',
    maxWidth: 260,
    alignItems: 'center',
    gap: Spacing.md,
  },
  linearTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.md,
    fontWeight: '500',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.xs,
    lineHeight: 17,
    textAlign: 'center',
  },
  linearTrack: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  linearFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});
