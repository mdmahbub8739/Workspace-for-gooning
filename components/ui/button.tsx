import { StyleSheet, Text, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Radius, Spacing, FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { M3Pressable } from '@/components/ui/m3-motion';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'tonal' | 'secondary' | 'outlined' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading, disabled, icon, style,
}: ButtonProps) {
  const { colors } = useTheme();

  const bgMap: Record<string, string> = {
    primary: colors.primary,
    tonal: colors.secondaryContainer,
    secondary: colors.secondaryContainer,
    outlined: 'transparent',
    danger: colors.error,
    ghost: 'transparent',
  };

  const textMap: Record<string, string> = {
    primary: colors.onPrimary,
    tonal: colors.onSecondaryContainer,
    secondary: colors.onSecondaryContainer,
    outlined: colors.primary,
    danger: '#FFFFFF',
    ghost: colors.primary,
  };

  const sizeMap: Record<string, ViewStyle> = {
    sm: { height: 38, paddingHorizontal: 16 },
    md: { height: 48, paddingHorizontal: 22 },
    lg: { height: 54, paddingHorizontal: 26 },
  };

  const fontMap: Record<string, TextStyle> = {
    sm: { fontSize: FontSize.sm },
    md: { fontSize: FontSize.md },
    lg: { fontSize: FontSize.md },
  };

  const isDisabled = disabled || loading;

  return (
    <M3Pressable
      onPress={onPress}
      disabled={isDisabled}
      scaleTo={0.965}
      radius={Radius.full}
      stateLayerColor={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.onSurface}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.button,
        sizeMap[size],
        {
          backgroundColor: bgMap[variant],
          opacity: isDisabled ? 0.45 : 1,
        },
        variant === 'outlined' && { borderWidth: 1, borderColor: colors.outline },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textMap[variant]} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, fontMap[size], { color: textMap[variant] }]} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </M3Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.15,
  },
});
