import { StyleSheet, View, Text } from 'react-native';
import { Icon, IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { M3Entrance } from '@/components/ui/m3-motion';
import { FontSize, Spacing } from '@/constants/theme';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
}

export function EmptyState({ icon = 'info', title, message }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <M3Entrance style={styles.container}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: colors.secondaryContainer + 'D8',
            borderWidth: 1,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        <Icon name={icon} size={28} color={colors.onSecondaryContainer} />
      </View>
      <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>{message}</Text>}
    </M3Entrance>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.xs,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
});
