import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  AccessibilityProps,
  GestureResponderEvent,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';

/** Calibrated damped spring physics — crisp, mature, zero childish overshoot. */
export const M3_SPRING = {
  damping: 24,
  stiffness: 320,
  mass: 0.85,
} as const;

export const M3_EXPRESSIVE_SPRING = {
  damping: 21,
  stiffness: 255,
  mass: 0.9,
} as const;

export const M3_GLASS_SPRING = {
  damping: 26,
  stiffness: 280,
  mass: 0.95,
} as const;

export const M3_EMPHASIZED = Easing.bezier(0.2, 0, 0, 1);

let reducedMotionCached = false;
AccessibilityInfo.isReduceMotionEnabled?.().then((val) => {
  reducedMotionCached = !!val;
}).catch(() => {});

export function isReducedMotionEnabled(): boolean {
  return reducedMotionCached;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(reducedMotionCached);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((val) => {
      reducedMotionCached = !!val;
      if (mounted) setReduced(!!val);
    }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (val) => {
      reducedMotionCached = !!val;
      setReduced(!!val);
    });
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);
  return reduced;
}

interface M3PressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Target scale when pressed. Defaults to 0.978 for restrained tactile feel. */
  scaleTo?: number;
  /** Tint color for the state layer overlay. */
  stateLayerColor?: string;
  /** Overflow radius matching the outer shape so the state layer clips cleanly. */
  radius?: number;
}

/**
 * Tactile glass press container: subtle compositor scale spring +
 * frosted hover/press state-layer sheen.
 */
export function M3Pressable({
  children,
  style,
  scaleTo = 0.985,
  stateLayerColor,
  radius,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: M3PressableProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const layerOpacity = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const layerStyle = useAnimatedStyle(() => ({
    opacity: layerOpacity.value,
  }));

  const handleIn = (e: GestureResponderEvent) => {
    if (!disabled && !reducedMotionCached) {
      scale.value = withSpring(scaleTo, M3_SPRING);
      layerOpacity.value = withTiming(0.1, { duration: 100, easing: M3_EMPHASIZED });
    }
    onPressIn?.(e);
  };

  const handleOut = (e: GestureResponderEvent) => {
    scale.value = withSpring(1, M3_SPRING);
    layerOpacity.value = withTiming(0, { duration: 170, easing: M3_EMPHASIZED });
    onPressOut?.(e);
  };

  const handleHoverIn = () => {
    if (!disabled && !reducedMotionCached) {
      layerOpacity.value = withTiming(isDark ? 0.06 : 0.04, { duration: 140, easing: M3_EMPHASIZED });
    }
  };

  const handleHoverOut = () => {
    layerOpacity.value = withTiming(0, { duration: 160, easing: M3_EMPHASIZED });
  };

  const layerColor = stateLayerColor ?? (isDark ? '#FFFFFF' : colors.onSurface);

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handleIn}
      onPressOut={handleOut}
      onHoverIn={Platform.OS === 'web' ? handleHoverIn : undefined}
      onHoverOut={Platform.OS === 'web' ? handleHoverOut : undefined}
      style={Platform.OS === 'web' && !disabled ? ({ cursor: 'pointer' } as unknown as ViewStyle) : undefined}
      {...rest}
    >
      <Animated.View style={[style, animStyle]}>
        {children}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: layerColor,
              borderRadius: radius,
            },
            layerStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

interface M3EntranceProps {
  children: React.ReactNode;
  index?: number;
  delayMs?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Restrained glass entrance animation (fade + subtle 10px rise + 0.985->1 scale settle).
 */
export function M3Entrance({
  children,
  index = 0,
  delayMs,
  distance = 10,
  style,
}: M3EntranceProps) {
  const opacity = useSharedValue(reducedMotionCached ? 1 : 0);
  const translateY = useSharedValue(reducedMotionCached ? 0 : distance);
  const scale = useSharedValue(reducedMotionCached ? 1 : 0.985);

  useEffect(() => {
    if (reducedMotionCached) {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      return;
    }
    const wait = delayMs ?? Math.min(index * 32, 160);
    opacity.value = withDelay(wait, withTiming(1, { duration: 220, easing: M3_EMPHASIZED }));
    translateY.value = withDelay(wait, withSpring(0, M3_SPRING));
    scale.value = withDelay(wait, withTiming(1, { duration: 220, easing: M3_EMPHASIZED }));
  }, [index, delayMs, opacity, translateY, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

interface M3SwitchProps extends AccessibilityProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

/**
 * Frosted glass animated Switch:
 * Translucent glass off-track, luminous primary on-track, morphing thumb with spring travel.
 */
export function M3Switch({ value, onValueChange, disabled, ...a11y }: M3SwitchProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, M3_EXPRESSIVE_SPRING);
  }, [value, progress]);

  const thumbStyle = useAnimatedStyle(() => {
    const size = 16 + progress.value * 8;
    const translateX = 6 + progress.value * 16;
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [{ translateX }],
    };
  });

  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.65 + progress.value * 0.35 }],
  }));

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      style={{ minWidth: 52, minHeight: 44, justifyContent: 'center', opacity: disabled ? 0.45 : 1 }}
      {...a11y}
    >
      <View
        style={[
          switchStyles.track,
          {
            backgroundColor: value ? colors.primary : colors.glassSurfaceSubtle,
            borderColor: value ? colors.primary : colors.glassBorder,
          },
        ]}
      >
        <Animated.View
          style={[
            switchStyles.thumb,
            {
              backgroundColor: value ? colors.onPrimary : colors.onSurfaceVariant,
            },
            thumbStyle,
          ]}
        >
          <Animated.View style={[switchStyles.checkWrap, checkStyle]}>
            {value && <Icon name="check" size={14} color={colors.primary} />}
          </Animated.View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const switchStyles = StyleSheet.create({
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
  },
  thumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
