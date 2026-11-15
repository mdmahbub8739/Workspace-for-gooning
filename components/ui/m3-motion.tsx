import React, { useEffect } from 'react';
import {
  AccessibilityInfo,
  AccessibilityProps,
  GestureResponderEvent,
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

/** Material Design 3 spring physics — expressive yet crisp within ~180–240ms. */
export const M3_SPRING = {
  damping: 20,
  stiffness: 290,
  mass: 0.85,
} as const;

export const M3_EXPRESSIVE_SPRING = {
  damping: 16,
  stiffness: 230,
  mass: 0.9,
} as const;

export const M3_EMPHASIZED = Easing.bezier(0.2, 0, 0, 1);

let reducedMotionCached = false;
AccessibilityInfo.isReduceMotionEnabled?.().then((val) => {
  reducedMotionCached = !!val;
}).catch(() => {});

interface M3PressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Target scale when pressed. Defaults to 0.975 for tactile card/row feel. */
  scaleTo?: number;
  /** Tint color for the Material state layer overlay. */
  stateLayerColor?: string;
  /** Overflow radius matching the outer shape so the state layer clips cleanly. */
  radius?: number;
}

/**
 * Material You tactile press container: subtle compositor scale spring +
 * Material state-layer highlight overlay on press/hover.
 */
export function M3Pressable({
  children,
  style,
  scaleTo = 0.975,
  stateLayerColor,
  radius,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: M3PressableProps) {
  const { colors } = useTheme();
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
      layerOpacity.value = withTiming(0.11, { duration: 100, easing: M3_EMPHASIZED });
    }
    onPressIn?.(e);
  };

  const handleOut = (e: GestureResponderEvent) => {
    scale.value = withSpring(1, M3_SPRING);
    layerOpacity.value = withTiming(0, { duration: 180, easing: M3_EMPHASIZED });
    onPressOut?.(e);
  };

  const layerColor = stateLayerColor ?? colors.onSurface;

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handleIn}
      onPressOut={handleOut}
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
 * Staggered Material Design 3 entrance animation (Emphasized Decelerate fade + translateY).
 */
export function M3Entrance({
  children,
  index = 0,
  delayMs,
  distance = 12,
  style,
}: M3EntranceProps) {
  const opacity = useSharedValue(reducedMotionCached ? 1 : 0);
  const translateY = useSharedValue(reducedMotionCached ? 0 : distance);

  useEffect(() => {
    if (reducedMotionCached) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const wait = delayMs ?? Math.min(index * 40, 220);
    opacity.value = withDelay(wait, withTiming(1, { duration: 260, easing: M3_EMPHASIZED }));
    translateY.value = withDelay(wait, withSpring(0, M3_SPRING));
  }, [index, delayMs, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

interface M3SwitchProps extends AccessibilityProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

/**
 * Material Design 3 animated Switch:
 * 52×32 pill track, morphing thumb (16dp off -> 24dp on with check icon),
 * spring-driven horizontal travel.
 */
export function M3Switch({ value, onValueChange, disabled, ...a11y }: M3SwitchProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, M3_EXPRESSIVE_SPRING);
  }, [value, progress]);

  const thumbStyle = useAnimatedStyle(() => {
    const size = 16 + progress.value * 8; // 16 -> 24
    const translateX = 6 + progress.value * 16; // 6px inset -> 22px inset (52 - 4 - 24 - 2)
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [{ translateX }],
    };
  });

  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
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
            backgroundColor: value ? colors.primary : colors.surfaceContainerHighest,
            borderColor: value ? colors.primary : colors.outline,
          },
        ]}
      >
        <Animated.View
          style={[
            switchStyles.thumb,
            {
              backgroundColor: value ? colors.onPrimary : colors.outline,
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
    width: 52,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
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
