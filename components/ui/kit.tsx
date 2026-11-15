import { useState } from 'react';
import {
  ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { M3Pressable, M3Switch } from '@/components/ui/m3-motion';

/**
 * Material You building blocks shared across the application.
 */

// ─── IconCircle (M3 Tonal Squircle) ───────────────────────────────────────────

interface IconCircleProps {
  name: IconName;
  size?: number;
  /** 'neutral' (default) uses M3 secondaryContainer; state tones use M3 semantic containers. */
  tone?: 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'error';
}

export function IconCircle({ name, size = 40, tone = 'neutral' }: IconCircleProps) {
  const { colors } = useTheme();
  const palette =
    tone === 'primary' || tone === 'accent'
      ? { bg: colors.primaryContainer, fg: colors.onPrimaryContainer }
      : tone === 'success'
        ? { bg: colors.successContainer, fg: colors.onSuccessContainer }
        : tone === 'warning'
          ? { bg: colors.warningContainer, fg: colors.onWarningContainer }
          : tone === 'error'
            ? { bg: colors.errorContainer, fg: colors.onErrorContainer }
            : { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer };

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.36),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.bg,
      }}
    >
      <Icon name={name} size={Math.round(size * 0.48)} color={palette.fg} />
    </View>
  );
}

// ─── Chips (M3 Filter Chips) ─────────────────────────────────────────────────

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, onPress }: ChipProps) {
  const { colors } = useTheme();
  return (
    <M3Pressable
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.95}
      radius={Radius.sm}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.secondaryContainer : colors.surfaceContainerLow,
          borderColor: active ? 'transparent' : colors.outlineVariant,
          borderWidth: active ? 0 : 1,
        },
      ]}
    >
      {active && <Icon name="check" size={14} color={colors.onSecondaryContainer} />}
      <Text
        style={[
          styles.chipText,
          {
            color: active ? colors.onSecondaryContainer : colors.onSurfaceVariant,
            fontWeight: active ? '600' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </M3Pressable>
  );
}

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipRowProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ChipRow<T extends string>({ options, value, onChange, wrap, style }: ChipRowProps<T>) {
  if (wrap) {
    return (
      <View style={[styles.chipWrap, style]}>
        {options.map((o) => (
          <Chip key={o.value} label={o.label} active={o.value === value} onPress={() => onChange(o.value)} />
        ))}
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ flexGrow: 0, flexShrink: 0 }, style]}
      contentContainerStyle={styles.chipScroll}
    >
      {options.map((o) => (
        <Chip key={o.value} label={o.label} active={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </ScrollView>
  );
}

// ─── SearchBar (M3 Pill Search Bar) ───────────────────────────────────────────

interface SearchBarProps extends Pick<TextInputProps, 'onSubmitEditing' | 'autoFocus'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

export function SearchBar({ value, onChangeText, placeholder, style, ...rest }: SearchBarProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.search,
        {
          backgroundColor: colors.surfaceContainerHigh,
          borderColor: focused ? colors.primary : 'transparent',
          borderWidth: 1.5,
        },
        style,
      ]}
    >
      <Icon name="search" size={20} color={focused ? colors.primary : colors.onSurfaceVariant} />
      <TextInput
        style={[styles.searchInput, { color: colors.onSurface }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear">
          <Icon name="close" size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Group + rows (M3 Tonal Surface Lists) ───────────────────────────────────

export function Group({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const rows = (Array.isArray(children) ? children.flat() : [children]).filter(Boolean);
  return (
    <View style={[styles.group, { backgroundColor: colors.surfaceContainerLow }, style]}>
      {rows.map((child, i) => (
        <View
          key={i}
          style={i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.outlineVariant + '66' } : undefined}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

interface ListRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: IconName;
  iconTone?: IconCircleProps['tone'];
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  chevron?: boolean;
  mono?: boolean;
}

export function ListRow({
  title, subtitle, meta, icon, iconTone, leading, trailing, onPress, onLongPress, chevron, mono,
}: ListRowProps) {
  const { colors } = useTheme();
  const showChevron = chevron ?? (!!onPress && trailing === undefined);
  const interactive = !!(onPress || onLongPress);

  const inner = (
    <>
      {leading ?? (icon ? <IconCircle name={icon} tone={iconTone} /> : null)}
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.onSurface }]} numberOfLines={1}>{title}</Text>
        {!!subtitle && (
          <Text
            style={[styles.rowSub, { color: colors.onSurfaceVariant }, mono && styles.mono]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
        {!!meta && <Text style={[styles.rowMeta, { color: colors.textTertiary }]} numberOfLines={1}>{meta}</Text>}
      </View>
      {trailing}
      {showChevron && <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />}
    </>
  );

  if (interactive) {
    return (
      <M3Pressable onPress={onPress} onLongPress={onLongPress} scaleTo={0.985} style={styles.row}>
        {inner}
      </M3Pressable>
    );
  }

  return <View style={styles.row}>{inner}</View>;
}

interface ToggleRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconTone?: IconCircleProps['tone'];
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({ title, subtitle, icon, iconTone, value, onValueChange, disabled }: ToggleRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {icon ? <IconCircle name={icon} tone={iconTone} /> : null}
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.onSurface }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.rowSub, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>}
      </View>
      <M3Switch value={value} onValueChange={onValueChange} disabled={disabled} accessibilityLabel={title} />
    </View>
  );
}

export function ValueRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, styles.valueRow]}>
      <Text style={[styles.valueLabel, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.valueText, { color: colors.onSurface }, mono && styles.mono]} numberOfLines={2} selectable>
        {value}
      </Text>
    </View>
  );
}

// ─── Stat (M3 Tonal Metric Card) ─────────────────────────────────────────────

export function StatCard({ label, value, hint, style }: { label: string; value: string; hint?: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surfaceContainer }, style]}>
      <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.onSurface }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {!!hint && <Text style={[styles.statHint, { color: colors.textTertiary }]} numberOfLines={1}>{hint}</Text>}
    </View>
  );
}

// ─── Form field (M3 Filled Input with Focus Outline) ─────────────────────────

interface FieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  mono?: boolean;
}

export function Field({ label, hint, mono, style, multiline, onFocus, onBlur, ...props }: FieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      {!!label && <Text style={[styles.fieldLabel, { color: focused ? colors.primary : colors.onSurfaceVariant }]}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.fieldInput,
          {
            backgroundColor: colors.surfaceContainerHigh,
            borderColor: focused ? colors.primary : 'transparent',
            borderWidth: 1.5,
            color: colors.onSurface,
          },
          multiline && styles.fieldMultiline,
          mono && styles.mono,
          style,
        ]}
        {...props}
      />
      {!!hint && <Text style={[styles.fieldHint, { color: colors.textTertiary }]}>{hint}</Text>}
    </View>
  );
}

export function FieldLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant, marginTop: Spacing.md }]}>{children}</Text>;
}

// ─── Feedback (M3 Semantic Container Banner) ──────────────────────────────────

export function Banner({ message, tone = 'error' }: { message: string; tone?: 'error' | 'warning' | 'info' }) {
  const { colors } = useTheme();
  const palette =
    tone === 'error'
      ? { bg: colors.errorContainer, fg: colors.onErrorContainer }
      : tone === 'warning'
        ? { bg: colors.warningContainer, fg: colors.onWarningContainer }
        : { bg: colors.infoContainer, fg: colors.onInfoContainer };

  return (
    <View style={[styles.banner, { backgroundColor: palette.bg }]}>
      <Icon name={tone === 'info' ? 'info' : tone === 'warning' ? 'warning' : 'error-circle'} size={18} color={palette.fg} />
      <Text style={[styles.bannerText, { color: palette.fg }]}>{message}</Text>
    </View>
  );
}

// ─── Fab (Material You Extended Squircle FAB) ─────────────────────────────────

export function Fab({ label, icon = 'plus', onPress }: { label: string; icon?: IconName; onPress: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <M3Pressable
      onPress={onPress}
      scaleTo={0.94}
      radius={18}
      stateLayerColor={colors.onPrimaryContainer}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.fab,
        {
          backgroundColor: colors.primaryContainer,
          bottom: insets.bottom + Spacing.lg,
          shadowColor: colors.cardShadow,
        },
      ]}
    >
      <Icon name={icon} size={20} color={colors.onPrimaryContainer} />
      <Text style={[styles.fabText, { color: colors.onPrimaryContainer }]} numberOfLines={1}>{label}</Text>
    </M3Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    height: 36,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  chipText: { fontSize: FontSize.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chipScroll: { gap: Spacing.sm, alignItems: 'center' },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
  },
  searchInput: { flex: 1, fontSize: FontSize.md },

  group: { borderRadius: Radius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    minHeight: 60,
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontSize: FontSize.md, fontWeight: '500' },
  rowSub: { fontSize: FontSize.sm, lineHeight: 18 },
  rowMeta: { fontSize: FontSize.xs },
  mono: { fontFamily: 'monospace' },
  valueRow: { justifyContent: 'space-between', minHeight: 52 },
  valueLabel: { fontSize: FontSize.sm, flexShrink: 0 },
  valueText: { fontSize: FontSize.sm, fontWeight: '600', flexShrink: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },

  stat: { flex: 1, padding: Spacing.md, borderRadius: Radius.lg, gap: 4 },
  statLabel: { fontSize: FontSize.xs, fontWeight: '500' },
  statValue: { fontSize: 24, fontWeight: '600', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  statHint: { fontSize: FontSize.xs },

  field: { marginTop: Spacing.md, gap: 6 },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '600', paddingHorizontal: 2 },
  fieldInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    fontSize: FontSize.md,
  },
  fieldMultiline: { minHeight: 92, textAlignVertical: 'top' },
  fieldHint: { fontSize: FontSize.xs, lineHeight: 16, paddingHorizontal: 2 },

  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  bannerText: { flex: 1, fontSize: FontSize.sm, lineHeight: 19, fontWeight: '500' },

  fab: {
    position: 'absolute',
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 56,
    paddingHorizontal: Spacing.xl,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
    overflow: 'hidden',
  },
  fabText: { fontSize: FontSize.md, fontWeight: '600', letterSpacing: 0.1 },
});
