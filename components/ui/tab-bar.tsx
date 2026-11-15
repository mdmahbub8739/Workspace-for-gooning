import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { M3_EXPRESSIVE_SPRING, M3_SPRING } from '@/components/ui/m3-motion';
import { FontSize } from '@/constants/theme';

function M3NavItem({
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
  const { colors } = useTheme();
  const focusProgress = useSharedValue(focused ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    focusProgress.value = withSpring(focused ? 1 : 0, M3_EXPRESSIVE_SPRING);
  }, [focused, focusProgress]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: focusProgress.value,
    transform: [{ scaleX: 0.45 + focusProgress.value * 0.55 }, { scaleY: 0.8 + focusProgress.value * 0.2 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: (focused ? 1.06 : 1) * pressScale.value },
      { translateY: focusProgress.value * -0.5 },
    ],
  }));

  const activePillBg = isFeatured ? colors.primaryContainer : colors.secondaryContainer;
  const activeIconColor = isFeatured ? colors.onPrimaryContainer : colors.onSecondaryContainer;
  const activeLabelColor = isFeatured ? colors.primary : colors.onSurface;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        pressScale.value = withSpring(0.92, M3_SPRING);
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
      <View style={styles.pillSlot}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            { backgroundColor: activePillBg },
            indicatorStyle,
          ]}
        />
        <Animated.View style={iconStyle}>
          {renderIcon?.({
            focused,
            color: focused ? activeIconColor : colors.onSurfaceVariant,
            size: 22,
          })}
        </Animated.View>
      </View>
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
 * Material Design 3 Navigation Bar:
 * Edge-to-edge tonal `surfaceContainer` bar with animated active indicator pills
 * and concise single-line labels.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surfaceContainer,
          borderTopColor: colors.outlineVariant + '55',
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.inner}>
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
            <M3NavItem
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
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 720,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    gap: 4,
  },
  pillSlot: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  label: {
    fontSize: FontSize.xs,
    letterSpacing: 0.2,
  },
});
