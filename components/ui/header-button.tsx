import { StyleSheet } from 'react-native';
import { Icon, IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { M3Pressable } from '@/components/ui/m3-motion';

interface HeaderButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
}

/** Material Design 3 tonal filled IconButton for screen headers. */
export function HeaderButton({ icon, label, onPress }: HeaderButtonProps) {
  const { colors } = useTheme();

  return (
    <M3Pressable
      onPress={onPress}
      scaleTo={0.92}
      radius={20}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.button, { backgroundColor: colors.surfaceContainerHigh }]}
    >
      <Icon name={icon} size={19} color={colors.onSurface} />
    </M3Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
