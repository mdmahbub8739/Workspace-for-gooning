import { StyleSheet, View, Text } from 'react-native';
import { Radius, FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { colors } = useTheme();

  const paletteMap: Record<string, { bg: string; fg: string }> = {
    default: { bg: colors.surfaceContainerHigh, fg: colors.onSurfaceVariant },
    primary: { bg: colors.primaryContainer, fg: colors.onPrimaryContainer },
    success: { bg: colors.successContainer, fg: colors.onSuccessContainer },
    warning: { bg: colors.warningContainer, fg: colors.onWarningContainer },
    error: { bg: colors.errorContainer, fg: colors.onErrorContainer },
    info: { bg: colors.infoContainer, fg: colors.onInfoContainer },
  };

  const palette = paletteMap[variant] ?? paletteMap.default;

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
});
