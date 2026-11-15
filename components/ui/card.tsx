import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { M3Pressable } from '@/components/ui/m3-motion';

interface CardProps {
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'filled' | 'outlined';
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Material Design 3 Card:
 * Tonal surface containers (`surfaceContainerLow` / `surfaceContainerLowest`)
 * with rounded 24dp geometry and animated press state layer when clickable.
 */
export function Card({ style, children, onPress, variant = 'default', compact }: CardProps) {
  const { colors } = useTheme();

  const isElevated = variant === 'elevated';
  const isOutlined = variant === 'outlined';
  const isFilled = variant === 'filled';

  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: isElevated
        ? colors.surfaceContainerLowest
        : isFilled
          ? colors.surfaceContainer
          : colors.surfaceContainerLow,
      borderWidth: isOutlined ? 1 : 0,
      borderColor: isOutlined ? colors.outlineVariant : 'transparent',
    },
    isElevated && {
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 2,
    },
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
