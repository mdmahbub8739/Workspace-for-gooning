import { StyleSheet, View, Text } from 'react-native';
import { Radius, FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { colors } = useTheme();

  const paletteMap: Record<string, { bg: string; fg: string; border: string }> = {
    default: { bg: colors.glassSurfaceSubtle, fg: colors.onSurfaceVariant, border: colors.glassBorderSubtle },
    primary: { bg: colors.primaryContainer + '8F', fg: colors.onPrimaryContainer, border: colors.primary + '38' },
    success: { bg: colors.successContainer + '8F', fg: colors.onSuccessContainer, border: colors.success + '38' },
    warning: { bg: colors.warningContainer + '8F', fg: colors.onWarningContainer, border: colors.warning + '38' },
    error: { bg: colors.errorContainer + '8F', fg: colors.onErrorContainer, border: colors.error + '38' },
    info: { bg: colors.infoContainer + '8F', fg: colors.onInfoContainer, border: colors.info + '38' },
  };

  const palette = paletteMap[variant] ?? paletteMap.default;

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.text, { color: palette.fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
});
