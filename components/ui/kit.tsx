import { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { M3Pressable, M3Switch } from '@/components/ui/m3-motion';
import { getGlassStyle, getTintedGlassStyle } from '@/components/ui/glass';

/**
 * Frosted glass UI building blocks shared across the application.
 */

// ─── IconCircle (Frosted Tonal Squircle) ──────────────────────────────────────

interface IconCircleProps {
  name: IconName;
  size?: number;
  tone?: 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'error';
}

export function IconCircle({ name, size = 40, tone = 'neutral' }: IconCircleProps) {
  const { colors, isDark } = useTheme();
  const palette =
    tone === 'primary' || tone === 'accent'
      ? { bg: colors.primaryContainer, fg: isDark ? colors.primaryLight : colors.primary }
      : tone === 'success'
        ? { bg: colors.successContainer, fg: colors.success }
        : tone === 'warning'
          ? { bg: colors.warningContainer, fg: colors.warning }
          : tone === 'error'
            ? { bg: colors.errorContainer, fg: colors.error }
            : { bg: colors.secondaryContainer, fg: isDark ? colors.primaryLight : colors.primary };

  // Compact list-row icon slot: clean naked accent icon with zero boxy clutter
  if (size <= 42) {
    return (
      <View
        style={{
          width: 28,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={name} size={Math.round(size * 0.52)} color={palette.fg} />
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.36),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.bg + '8F',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSubtle,
        borderTopColor: colors.glassHighlight,
      }}
    >
      <Icon name={name} size={Math.round(size * 0.46)} color={palette.fg} />
    </View>
  );
}

// ─── Chips (Frosted Glass Filter Chips) ──────────────────────────────────────

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, onPress }: ChipProps) {
  const { colors, isDark } = useTheme();
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
        active
          ? getTintedGlassStyle(colors, isDark, colors.secondaryContainer + (isDark ? '96' : 'A3'), 16)
          : getGlassStyle(colors, isDark, 'subtle', Radius.sm),
        active && { borderColor: colors.primary + '55' },
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

// ─── SearchBar (Frosted Glass Pill Search Bar) ────────────────────────────────

interface SearchBarProps extends Pick<TextInputProps, 'onSubmitEditing' | 'autoFocus'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

export function SearchBar({ value, onChangeText, placeholder, style, ...rest }: SearchBarProps) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.search,
        getGlassStyle(colors, isDark, 'surface', Radius.full),
        {
          borderColor: focused ? colors.primary : colors.glassBorder,
          borderWidth: focused ? 1 : StyleSheet.hairlineWidth,
        },
        focused &&
          Platform.OS === 'web' &&
          ({ boxShadow: `0 0 0 3px ${colors.primary}22` } as unknown as ViewStyle),
        style,
      ]}
    >
      <Icon name="search" size={20} color={focused ? colors.primary : colors.onSurfaceVariant} />
      <TextInput
        style={[
          styles.searchInput,
          { color: colors.onSurface },
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null,
        ]}
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

// ─── Group + rows (Frosted Glass Surface Lists) ───────────────────────────────

export function Group({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors, isDark } = useTheme();
  const rows = (Array.isArray(children) ? children.flat() : [children]).filter(Boolean);
  return (
    <View style={[styles.group, style]}>
      {rows.map((child, i) => (
        <View
          key={i}
          style={[styles.groupItem, getGlassStyle(colors, isDark, 'surface', 18)]}
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

// ─── Stat (Frosted Glass Metric Card) ────────────────────────────────────────

export function StatCard({ label, value, hint, style }: { label: string; value: string; hint?: string; style?: StyleProp<ViewStyle> }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.stat, getGlassStyle(colors, isDark, 'surface', Radius.lg), style]}>
      <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.onSurface }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {!!hint && <Text style={[styles.statHint, { color: colors.textTertiary }]} numberOfLines={1}>{hint}</Text>}
    </View>
  );
}

// ─── Form field (Frosted Glass Input with Focus Glow) ─────────────────────────

interface FieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  mono?: boolean;
}

export function Field({ label, hint, mono, style, multiline, onFocus, onBlur, ...props }: FieldProps) {
  const { colors, isDark } = useTheme();
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
          getGlassStyle(colors, isDark, 'subtle', Radius.md) as TextStyle,
          {
            borderColor: focused ? colors.primary : colors.glassBorder,
            borderWidth: focused ? 1 : StyleSheet.hairlineWidth,
            color: colors.onSurface,
          },
          focused &&
            Platform.OS === 'web' &&
            ({ boxShadow: `0 0 0 3px ${colors.primary}20` } as unknown as TextStyle),
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null,
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

// ─── Feedback (Translucent Frosted Semantic Banner) ───────────────────────────

export function Banner({ message, tone = 'error' }: { message: string; tone?: 'error' | 'warning' | 'info' }) {
  const { colors, isDark } = useTheme();
  const palette =
    tone === 'error'
      ? { bg: colors.errorContainer, fg: colors.onErrorContainer, rim: colors.error }
      : tone === 'warning'
        ? { bg: colors.warningContainer, fg: colors.onWarningContainer, rim: colors.warning }
        : { bg: colors.infoContainer, fg: colors.onInfoContainer, rim: colors.info };

  return (
    <View
      style={[
        styles.banner,
        getTintedGlassStyle(colors, isDark, palette.bg + '94', 16),
        { borderColor: palette.rim + '40' },
      ]}
    >
      <Icon name={tone === 'info' ? 'info' : tone === 'warning' ? 'warning' : 'error-circle'} size={18} color={palette.fg} />
      <Text style={[styles.bannerText, { color: palette.fg }]}>{message}</Text>
    </View>
  );
}

// ─── Fab (Frosted Extended Glass FAB) ─────────────────────────────────────────

export function Fab({ label, icon = 'plus', onPress }: { label: string; icon?: IconName; onPress: () => void }) {
  const { colors, isDark } = useTheme();
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
        getTintedGlassStyle(colors, isDark, colors.primaryContainer + (isDark ? '9E' : 'B2'), 24),
        {
          borderColor: colors.primary + '50',
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
    height: 34,
    paddingHorizontal: Spacing.md + 2,
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
    height: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
  },
  searchInput: { flex: 1, fontSize: FontSize.md },

  group: { gap: Spacing.sm },
  groupItem: { borderRadius: 18, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    minHeight: 56,
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
    height: 50,
    paddingHorizontal: Spacing.lg + 2,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  fabText: { fontSize: FontSize.md, fontWeight: '600', letterSpacing: 0.1 },
});
