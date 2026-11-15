import { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, Text } from 'react-native';
import { Radius, Spacing, FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, onFocus, onBlur, ...props }: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: error ? colors.error : focused ? colors.primary : colors.onSurfaceVariant },
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.textTertiary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            backgroundColor: colors.surfaceContainerHigh,
            color: colors.onSurface,
            borderColor: error ? colors.error : focused ? colors.primary : 'transparent',
            borderWidth: 1.5,
          },
          style,
        ]}
        {...props}
      />
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: '600', paddingHorizontal: 2 },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    fontSize: FontSize.md,
  },
  error: { fontSize: FontSize.xs, marginTop: 2, paddingHorizontal: 2, fontWeight: '500' },
});
