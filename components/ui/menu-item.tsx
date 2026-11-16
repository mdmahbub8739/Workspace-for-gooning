import { StyleSheet, View, Text } from 'react-native';
import { Icon, IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, Spacing } from '@/constants/theme';
import { M3Pressable } from '@/components/ui/m3-motion';

interface MenuItemProps {
  icon: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
}

export function MenuItem({ icon, title, subtitle, onPress, trailing, danger }: MenuItemProps) {
  const { colors, isDark } = useTheme();
  const showArrow = trailing === undefined && !!onPress;
  const iconColor = danger ? colors.error : (isDark ? colors.primaryLight : colors.primary);

  const content = (
    <>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: danger ? colors.error : colors.onSurface }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing !== null && trailing !== undefined && trailing}
      {showArrow && <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />}
    </>
  );

  if (onPress) {
    return (
      <M3Pressable
        onPress={onPress}
        scaleTo={0.985}
        style={styles.container}
      >
        {content}
      </M3Pressable>
    );
  }

  return (
    <View style={styles.container}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: FontSize.sm,
  },
});
