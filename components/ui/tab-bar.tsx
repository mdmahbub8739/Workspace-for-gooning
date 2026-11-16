import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { getGlassStyle, getTintedGlassStyle } from '@/components/ui/glass';
import { M3_EXPRESSIVE_SPRING, M3_SPRING, isReducedMotionEnabled } from '@/components/ui/m3-motion';
import { FontSize, Radius, Spacing } from '@/constants/theme';

function GlassTabItem({
  label,
  focused,
  isFeatured,
  renderIcon,
  onPress,
  onLongPress,
}: {
  label: string;
  focused: boolean;
  isFeatured?: boolean;
  renderIcon?: (opts: { focused: boolean; color: string; size: number }) => React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const focusProgress = useSharedValue(focused ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    if (isReducedMotionEnabled()) {
      focusProgress.value = focused ? 1 : 0;
      return;
    }
    focusProgress.value = withSpring(focused ? 1 : 0, M3_EXPRESSIVE_SPRING);
  }, [focused, focusProgress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: (1 + focusProgress.value * 0.06) * pressScale.value },
      { translateY: focusProgress.value * -1 },
    ],
  }));

  const activeIconColor = isFeatured
    ? (isDark ? colors.primaryLight : colors.primary)
    : colors.onSecondaryContainer;
  const activeLabelColor = colors.onSurface;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        if (!isReducedMotionEnabled()) pressScale.value = withSpring(0.92, M3_SPRING);
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, M3_SPRING);
      }}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={label}
      style={styles.item}
      hitSlop={4}
    >
      <Animated.View style={iconStyle}>
        {renderIcon?.({
          focused,
          color: focused ? activeIconColor : colors.onSurfaceVariant,
          size: 20,
        })}
      </Animated.View>
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: focused ? activeLabelColor : colors.onSurfaceVariant,
            fontWeight: focused ? '700' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Floating Frosted Glass Navigation Dock:
 * Detached pill dock with web backdrop blur, specular rim, and a fluid
 * spring-animated sliding glass capsule behind the active tab.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [innerWidth, setInnerWidth] = useState(0);

  const count = Math.max(1, state.routes.length);
  const padH = 6;
  const slotWidth = Math.max(0, (innerWidth - padH * 2) / count);
  const activeRoute = state.routes[state.index];
  const activeIsFeatured = activeRoute?.name === 'ai-chat';

  const slideX = useSharedValue(state.index * slotWidth);

  useEffect(() => {
    const target = state.index * slotWidth;
    if (isReducedMotionEnabled() || slotWidth === 0) {
      slideX.value = target;
    } else {
      slideX.value = withSpring(target, M3_EXPRESSIVE_SPRING);
    }
  }, [state.index, slotWidth, slideX]);

  const activeCapsuleStyle = useAnimatedStyle(() => ({
    width: Math.max(0, slotWidth - 4),
    transform: [{ translateX: slideX.value + 2 }],
  }));

  const capsuleTint = activeIsFeatured
    ? (isDark ? colors.primary + '38' : colors.primaryContainer + 'CC')
    : (isDark ? colors.primary + '2E' : colors.secondaryContainer + 'CC');

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outer,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View
        onLayout={(e) => setInnerWidth(e.nativeEvent.layout.width)}
        style={[
          styles.dock,
          getGlassStyle(colors, isDark, 'elevated', Radius.xl),
        ]}
      >
        {slotWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.slidingCapsule,
              getTintedGlassStyle(colors, isDark, capsuleTint, 12),
              { borderColor: activeIsFeatured ? colors.primary + '55' : colors.glassBorder },
              activeCapsuleStyle,
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <GlassTabItem
              key={route.key}
              label={label}
              focused={focused}
              isFeatured={route.name === 'ai-chat'}
              renderIcon={options.tabBarIcon}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: 6,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dock: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
    height: 58,
    paddingHorizontal: 5,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  slidingCapsule: {
    position: 'absolute',
    left: 5,
    top: 5,
    bottom: 5,
    borderRadius: Radius.full,
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    zIndex: 1,
  },
  label: {
    fontSize: FontSize.xs,
    letterSpacing: 0.15,
  },
});
