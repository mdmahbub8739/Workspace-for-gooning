import { Platform, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { M3Spinner } from '@/components/ui/loading';
import { M3Pressable } from '@/components/ui/m3-motion';
import { getGlassStyle, getTintedGlassStyle } from '@/components/ui/glass';

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
  const { colors, isDark } = useTheme();

  const textMap: Record<string, string> = {
    primary: colors.onPrimary,
    tonal: colors.onSecondaryContainer,
    secondary: colors.onSecondaryContainer,
    outlined: colors.primary,
    danger: '#FFFFFF',
    ghost: colors.primary,
  };

  const sizeMap: Record<string, ViewStyle> = {
    sm: { height: 36, paddingHorizontal: 15 },
    md: { height: 44, paddingHorizontal: 20 },
    lg: { height: 50, paddingHorizontal: 24 },
  };

  const fontMap: Record<string, TextStyle> = {
    sm: { fontSize: FontSize.sm },
    md: { fontSize: FontSize.md },
    lg: { fontSize: FontSize.md },
  };

  const isDisabled = disabled || loading;

  const variantStyle: ViewStyle =
    variant === 'primary'
      ? {
          ...getTintedGlassStyle(colors, isDark, colors.primary + 'CC', 18),
          borderColor: 'rgba(255, 255, 255, 0.34)',
          ...(Platform.OS === 'web'
            ? ({
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.42), 0 2px 10px ${colors.cardShadow}`,
                backgroundImage: 'linear-gradient(160deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.04) 48%, rgba(0,0,0,0.06) 100%)',
              } as unknown as ViewStyle)
            : {}),
        }
      : variant === 'danger'
        ? {
            ...getTintedGlassStyle(colors, isDark, colors.error + 'CC', 18),
            borderColor: 'rgba(255, 255, 255, 0.30)',
            ...(Platform.OS === 'web'
              ? ({
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.36), 0 2px 10px ${colors.cardShadow}`,
                  backgroundImage: 'linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.03) 50%, rgba(0,0,0,0.05) 100%)',
                } as unknown as ViewStyle)
              : {}),
          }
        : variant === 'tonal' || variant === 'secondary'
          ? getTintedGlassStyle(colors, isDark, colors.secondaryContainer + (isDark ? '8F' : '9C'), 16)
          : variant === 'outlined'
            ? {
                ...getGlassStyle(colors, isDark, 'subtle', Radius.full),
                borderColor: colors.outline + '66',
              }
            : { backgroundColor: 'transparent' };

  return (
    <M3Pressable
      onPress={onPress}
      disabled={isDisabled}
      scaleTo={0.968}
      radius={Radius.full}
      stateLayerColor={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.onSurface}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.button,
        sizeMap[size],
        variantStyle,
        { opacity: isDisabled ? 0.45 : 1 },
        style,
      ]}
    >
      {loading ? (
        <M3Spinner size="sm" color={textMap[variant]} />
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
