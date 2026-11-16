import { StyleSheet, View, Text } from 'react-native';
import { Icon, IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, Spacing } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  icon?: IconName;
  action?: React.ReactNode;
}

export function SectionHeader({ title, icon, action }: SectionHeaderProps) {
  const { colors, isDark } = useTheme();
  const iconColor = isDark ? colors.primaryLight : colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {icon && <Icon name={icon} size={15} color={iconColor} />}
        <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
});
