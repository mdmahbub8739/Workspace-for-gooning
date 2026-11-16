import React, { useEffect } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isReducedMotionEnabled } from '@/components/ui/m3-motion';

export type GlassLevel = 'subtle' | 'surface' | 'elevated' | 'header';

function webGlass(backdropFilter: string, boxShadow?: string, backgroundImage?: string): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    backdropFilter,
    WebkitBackdropFilter: backdropFilter,
    ...(boxShadow ? { boxShadow } : {}),
    ...(backgroundImage ? { backgroundImage } : {}),
  } as unknown as ViewStyle;
}

function glossySheen(isDark: boolean, strength: 'subtle' | 'surface' | 'elevated' | 'header' = 'surface'): string {
  if (isDark) {
    if (strength === 'header') {
      return 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.0) 100%)';
    }
    const top = strength === 'elevated' ? 0.09 : strength === 'subtle' ? 0.05 : 0.07;
    return `linear-gradient(155deg, rgba(255,255,255,${top}) 0%, rgba(255,255,255,0.015) 36%, rgba(255,255,255,0) 100%)`;
  }
  if (strength === 'header') {
    return 'linear-gradient(180deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.14) 100%)';
  }
  const top = strength === 'elevated' ? 0.56 : strength === 'subtle' ? 0.36 : 0.48;
  return `linear-gradient(155deg, rgba(255,255,255,${top}) 0%, rgba(255,255,255,0.14) 40%, rgba(255,255,255,0.02) 100%)`;
}

/**
 * Generates platform-adaptive 2.5D glossy frosted glass surface styles:
 * - Web: high-blur CSS backdrop-filter + diagonal glossy sheen gradient + razor-thin specular top catchlight
 * - iOS/Android: sheer translucent fill + hairline rim with brighter top edge + tight planar contact shadow
 */
export function getGlassStyle(
  colors: ThemeColors,
  isDark: boolean,
  level: GlassLevel = 'surface',
  radius?: number,
): ViewStyle {
  if (level === 'header') {
    return {
      backgroundColor: colors.glassHeader,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? colors.glassBorderSubtle : colors.glassBorder,
      ...webGlass(
        isDark ? 'blur(28px) saturate(190%)' : 'blur(28px) saturate(200%)',
        `inset 0 -1px 0 ${colors.glassBorderSubtle}`,
        glossySheen(isDark, 'header'),
      ),
    };
  }

  if (level === 'subtle') {
    return {
      backgroundColor: colors.glassSurfaceSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? colors.glassBorderSubtle : 'rgba(255, 255, 255, 0.48)',
      borderTopColor: colors.glassHighlight,
      ...(radius !== undefined ? { borderRadius: radius } : {}),
      ...webGlass(
        isDark ? 'blur(16px) saturate(170%)' : 'blur(18px) saturate(185%)',
        `inset 0 1px 0 ${colors.glassHighlight}`,
        glossySheen(isDark, 'subtle'),
      ),
    };
  }

  if (level === 'elevated') {
    return {
      backgroundColor: colors.glassSurfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.glassBorder,
      borderTopColor: colors.glassHighlight,
      ...(radius !== undefined ? { borderRadius: radius } : {}),
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.24 : 0.09,
      shadowRadius: 12,
      elevation: 3,
      ...webGlass(
        isDark ? 'blur(34px) saturate(200%)' : 'blur(32px) saturate(210%)',
        `inset 0 1px 0 ${colors.glassHighlight}, 0 6px 20px ${colors.cardShadow}, 0 1px 2px rgba(0,0,0,0.04)`,
        glossySheen(isDark, 'elevated'),
      ),
    };
  }

  // 'surface' (default 2.5D thin pane)
  return {
    backgroundColor: colors.glassSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    borderTopColor: colors.glassHighlight,
    ...(radius !== undefined ? { borderRadius: radius } : {}),
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.16 : 0.05,
    shadowRadius: 6,
    elevation: 1,
    ...webGlass(
      isDark ? 'blur(26px) saturate(185%)' : 'blur(26px) saturate(195%)',
      `inset 0 1px 0 ${colors.glassHighlight}, 0 2px 10px ${colors.cardShadow}`,
      glossySheen(isDark, 'surface'),
    ),
  };
}

/** Tinted translucent glossy glass style for active capsules, hero headers, and glass badges. */
export function getTintedGlassStyle(
  colors: ThemeColors,
  isDark: boolean,
  backgroundColor: string,
  blurPx = 22,
): ViewStyle {
  return {
    backgroundColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    borderTopColor: colors.glassHighlight,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.18 : 0.06,
    shadowRadius: 6,
    elevation: 1,
    ...webGlass(
      `blur(${blurPx}px) saturate(${isDark ? 190 : 200}%)`,
      `inset 0 1px 0 ${colors.glassHighlight}, 0 3px 12px ${colors.cardShadow}`,
      glossySheen(isDark, 'surface'),
    ),
  };
}

/** Frosted blur scrim for modals and sheets on web. */
export function getBackdropBlurStyle(blurPx = 12): ViewStyle {
  return webGlass(`blur(${blurPx}px)`);
}

interface GlassViewProps extends ViewProps {
  level?: GlassLevel;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function GlassView({
  level = 'surface',
  radius,
  style,
  children,
  ...rest
}: GlassViewProps) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[getGlassStyle(colors, isDark, level, radius), style]} {...rest}>
      {children}
    </View>
  );
}

/** Frosted translucent header backdrop for React Navigation headers. */
export function GlassHeaderBackdrop() {
  const { colors, isDark } = useTheme();
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, getGlassStyle(colors, isDark, 'header')]} />;
}

/**
 * Calm atmospheric backdrop behind every transparent screen canvas.
 * Slow sinusoidal drift keeps thin 2.5D translucent glass visibly alive without visual noise.
 */
export function AmbientGlassBackdrop() {
  const { colors, isDark } = useTheme();
  const driftA = useSharedValue(0);
  const driftB = useSharedValue(0);

  useEffect(() => {
    if (isReducedMotionEnabled()) return;
    const ease = Easing.inOut(Easing.sin);
    driftA.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 18000, easing: ease }),
        withTiming(0, { duration: 18000, easing: ease }),
      ),
      -1,
      false,
    );
    driftB.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 22000, easing: ease }),
        withTiming(0, { duration: 22000, easing: ease }),
      ),
      -1,
      false,
    );
  }, [driftA, driftB]);

  const orbAStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: driftA.value * 24 - 12 },
      { translateY: driftA.value * -18 + 9 },
      { scale: 1 + driftA.value * 0.05 },
    ],
  }));

  const orbBStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: driftB.value * -22 + 11 },
      { translateY: driftB.value * 20 - 10 },
      { scale: 1.04 - driftB.value * 0.05 },
    ],
  }));

  const orbAColor = isDark ? '#1A1F29' : colors.primaryLight;
  const orbBColor = isDark ? '#161B24' : colors.tertiary;
  const orbCColor = isDark ? colors.primary : colors.primary;

  const orbAOpacity = isDark ? 0.55 : 0.18;
  const orbBOpacity = isDark ? 0.48 : 0.14;
  const orbCOpacity = isDark ? 0.07 : 0.10;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.canvas, overflow: 'hidden' }]}>
      <Animated.View style={[styles.orbTopLeft, orbAStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 400 400">
          <Defs>
            <RadialGradient id="glassOrbPrimary" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={orbAColor} stopOpacity={orbAOpacity} />
              <Stop offset="75%" stopColor={orbAColor} stopOpacity={orbAOpacity * 0.45} />
              <Stop offset="100%" stopColor={orbAColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="200" cy="200" r="195" fill="url(#glassOrbPrimary)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.orbBottomRight, orbBStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 400 400">
          <Defs>
            <RadialGradient id="glassOrbTertiary" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={orbBColor} stopOpacity={orbBOpacity} />
              <Stop offset="75%" stopColor={orbBColor} stopOpacity={orbBOpacity * 0.4} />
              <Stop offset="100%" stopColor={orbBColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="200" cy="200" r="195" fill="url(#glassOrbTertiary)" />
        </Svg>
      </Animated.View>

      <View style={styles.orbMid}>
        <Svg width="100%" height="100%" viewBox="0 0 400 400">
          <Defs>
            <RadialGradient id="glassOrbAccent" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={orbCColor} stopOpacity={orbCOpacity} />
              <Stop offset="65%" stopColor={orbCColor} stopOpacity={orbCOpacity * 0.25} />
              <Stop offset="100%" stopColor={orbCColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="200" cy="200" r="195" fill="url(#glassOrbAccent)" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orbTopLeft: {
    position: 'absolute',
    top: '-16%',
    left: '-22%',
    width: 480,
    height: 480,
  },
  orbBottomRight: {
    position: 'absolute',
    bottom: '-18%',
    right: '-24%',
    width: 520,
    height: 520,
  },
  orbMid: {
    position: 'absolute',
    top: '28%',
    right: '12%',
    width: 360,
    height: 360,
  },
});
