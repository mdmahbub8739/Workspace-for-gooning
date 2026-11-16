import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { M3Pressable } from '@/components/ui/m3-motion';
import { getGlassStyle } from '@/components/ui/glass';

interface CardProps {
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'filled' | 'outlined';
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Frosted Glass Card:
 * Translucent glass surfaces (`surface` / `elevated` / `subtle`) with specular
 * 1px rims, backdrop blur on web, and tactile press feedback when interactive.
 */
export function Card({ style, children, onPress, variant = 'default', compact }: CardProps) {
  const { colors, isDark } = useTheme();

  const level =
    variant === 'elevated'
      ? 'elevated'
      : variant === 'outlined'
        ? 'subtle'
        : 'surface';

  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    getGlassStyle(colors, isDark, level, Radius.lg),
    variant === 'outlined' && { borderColor: colors.glassBorder },
    variant === 'filled' && { backgroundColor: colors.glassSurfaceElevated },
    compact && styles.compact,
    style,
  ];

  if (onPress) {
    return (
      <M3Pressable onPress={onPress} scaleTo={0.98} radius={Radius.lg} style={cardStyle}>
        {children}
      </M3Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  compact: {
    padding: Spacing.md,
  },
});
