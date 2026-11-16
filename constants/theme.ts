import { Platform } from 'react-native';

export const CF = {
  orange: '#F6821F',
  orangeLight: '#FBAD41',
  orangeDark: '#C45100',
  blue: '#003682',
  blueLight: '#0051C3',
  navy: '#1B1B3A',
};

export type MaterialSeedId = 'tangerine' | 'cobalt' | 'emerald' | 'amethyst' | 'rose';

export interface MaterialSeedMeta {
  id: MaterialSeedId;
  label: string;
  swatch: string;
}

export const MATERIAL_SEEDS: MaterialSeedMeta[] = [
  { id: 'tangerine', label: 'Tangerine', swatch: '#D96414' },
  { id: 'cobalt', label: 'Cobalt', swatch: '#1A5FD0' },
  { id: 'emerald', label: 'Emerald', swatch: '#0F764F' },
  { id: 'amethyst', label: 'Amethyst', swatch: '#6746B6' },
  { id: 'rose', label: 'Rose', swatch: '#B3263E' },
];

export interface ThemeColors {
  // Legacy / shared keys kept for complete screen compatibility
  text: string;
  textSecondary: string;
  textTertiary: string;
  canvas: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  tint: string;
  primary: string;
  primaryLight: string;
  icon: string;
  border: string;
  borderLight: string;
  tabIconDefault: string;
  tabIconSelected: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  cardShadow: string;
  statusActive: string;
  statusPending: string;
  statusError: string;
  statusPaused: string;
  overlay: string;
  inputBg: string;
  badge: string;
  badgeText: string;

  // Glassmorphism surface tokens
  glassSurface: string;
  glassSurfaceElevated: string;
  glassSurfaceSubtle: string;
  glassBorder: string;
  glassBorderSubtle: string;
  glassHighlight: string;
  glassHeader: string;
  glassOverlay: string;

  // Material You (Material Design 3) Tonal Roles
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  errorContainer: string;
  onErrorContainer: string;
  successContainer: string;
  onSuccessContainer: string;
  warningContainer: string;
  onWarningContainer: string;
  infoContainer: string;
  onInfoContainer: string;
  scrim: string;
}

interface SeedSpec {
  light: {
    primary: string;
    primaryLight: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    secondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    tertiary: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;
    canvas: string;
    surfaceContainerLowest: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    outline: string;
    outlineVariant: string;
  };
  dark: {
    primary: string;
    primaryLight: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    secondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    tertiary: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;
    canvas: string;
    surfaceContainerLowest: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    outline: string;
    outlineVariant: string;
  };
}

const SEED_SPECS: Record<MaterialSeedId, SeedSpec> = {
  tangerine: {
    light: {
      primary: '#C45100',
      primaryLight: '#F6821F',
      primaryContainer: '#FFDBC8',
      onPrimaryContainer: '#3B1300',
      secondary: '#765848',
      secondaryContainer: '#F5DED1',
      onSecondaryContainer: '#2B160B',
      tertiary: '#6A5B82',
      tertiaryContainer: '#EDE0FF',
      onTertiaryContainer: '#24183B',
      canvas: '#F5F4F2',
      surfaceContainerLowest: '#FFFFFF',
      surfaceContainerLow: '#FFFFFF78',
      surfaceContainer: '#FFFFFF5C',
      surfaceContainerHigh: '#FFFFFF8F',
      surfaceContainerHighest: '#F3EFEA9E',
      text: '#14161A',
      textSecondary: '#474C56',
      textTertiary: '#737986',
      outline: '#808591',
      outlineVariant: '#D5D8E0',
    },
    dark: {
      primary: '#F6821F',
      primaryLight: '#FFA858',
      primaryContainer: '#2E1A0C',
      onPrimaryContainer: '#FFDFC8',
      secondary: '#A6ACB8',
      secondaryContainer: '#1B1E24',
      onSecondaryContainer: '#E6EAF2',
      tertiary: '#B9A7DE',
      tertiaryContainer: '#231D33',
      onTertiaryContainer: '#EDE5FF',
      canvas: '#000000',
      surfaceContainerLowest: '#08090B',
      surfaceContainerLow: '#1214188F',
      surfaceContainer: '#16181D7A',
      surfaceContainerHigh: '#1D202699',
      surfaceContainerHighest: '#262A32AD',
      text: '#F4F5F7',
      textSecondary: '#A8AEBA',
      textTertiary: '#767D8B',
      outline: '#6F7684',
      outlineVariant: '#252932',
    },
  },
  cobalt: {
    light: {
      primary: '#1A5FD0',
      primaryLight: '#4E8DF5',
      primaryContainer: '#D8E2FF',
      onPrimaryContainer: '#001A41',
      secondary: '#565E71',
      secondaryContainer: '#DBE2F9',
      onSecondaryContainer: '#141B2C',
      tertiary: '#705575',
      tertiaryContainer: '#FAD8FD',
      onTertiaryContainer: '#29132E',
      canvas: '#F1F4FA',
      surfaceContainerLowest: '#FFFFFF',
      surfaceContainerLow: '#FFFFFF78',
      surfaceContainer: '#FFFFFF5C',
      surfaceContainerHigh: '#FFFFFF8F',
      surfaceContainerHighest: '#E6ECF89E',
      text: '#13161E',
      textSecondary: '#424856',
      textTertiary: '#6F7687',
      outline: '#767C8C',
      outlineVariant: '#CFD5E3',
    },
    dark: {
      primary: '#5394FF',
      primaryLight: '#82B4FF',
      primaryContainer: '#102445',
      onPrimaryContainer: '#DCE9FF',
      secondary: '#A5B0C6',
      secondaryContainer: '#1A202B',
      onSecondaryContainer: '#E2E9F6',
      tertiary: '#C9AEE0',
      tertiaryContainer: '#291E36',
      onTertiaryContainer: '#F5E8FF',
      canvas: '#000000',
      surfaceContainerLowest: '#08090C',
      surfaceContainerLow: '#1114198F',
      surfaceContainer: '#1519207A',
      surfaceContainerHigh: '#1C212A99',
      surfaceContainerHighest: '#252B36AD',
      text: '#F2F5FA',
      textSecondary: '#A5AEBE',
      textTertiary: '#737D8F',
      outline: '#6B7486',
      outlineVariant: '#232833',
    },
  },
  emerald: {
    light: {
      primary: '#0F764F',
      primaryLight: '#289D70',
      primaryContainer: '#A6F2CE',
      onPrimaryContainer: '#002114',
      secondary: '#4C6358',
      secondaryContainer: '#CEE9DB',
      onSecondaryContainer: '#0A2016',
      tertiary: '#3F6374',
      tertiaryContainer: '#C3E8FC',
      onTertiaryContainer: '#001E2B',
      canvas: '#EFF5F2',
      surfaceContainerLowest: '#FFFFFF',
      surfaceContainerLow: '#FFFFFF78',
      surfaceContainer: '#FFFFFF5C',
      surfaceContainerHigh: '#FFFFFF8F',
      surfaceContainerHighest: '#E2EFE89E',
      text: '#131A17',
      textSecondary: '#3E4943',
      textTertiary: '#6B7770',
      outline: '#717C75',
      outlineVariant: '#CAD5CE',
    },
    dark: {
      primary: '#2FBE84',
      primaryLight: '#68DCA9',
      primaryContainer: '#0C2B1E',
      onPrimaryContainer: '#C8F7E0',
      secondary: '#9FB5AA',
      secondaryContainer: '#18221D',
      onSecondaryContainer: '#DFEDE6',
      tertiary: '#94C2DA',
      tertiaryContainer: '#192B36',
      onTertiaryContainer: '#D6EFFC',
      canvas: '#000000',
      surfaceContainerLowest: '#070A09',
      surfaceContainerLow: '#1116148F',
      surfaceContainer: '#151B187A',
      surfaceContainerHigh: '#1C242099',
      surfaceContainerHighest: '#242E29AD',
      text: '#F0F5F2',
      textSecondary: '#A3B2AA',
      textTertiary: '#728279',
      outline: '#697870',
      outlineVariant: '#222B26',
    },
  },
  amethyst: {
    light: {
      primary: '#6746B6',
      primaryLight: '#8E6EE0',
      primaryContainer: '#EADDFF',
      onPrimaryContainer: '#22005D',
      secondary: '#625B71',
      secondaryContainer: '#E7DEF8',
      onSecondaryContainer: '#1D192B',
      tertiary: '#7D5260',
      tertiaryContainer: '#FFD8E4',
      onTertiaryContainer: '#31111D',
      canvas: '#F4F1FA',
      surfaceContainerLowest: '#FFFFFF',
      surfaceContainerLow: '#FFFFFF78',
      surfaceContainer: '#FFFFFF5C',
      surfaceContainerHigh: '#FFFFFF8F',
      surfaceContainerHighest: '#EAE3F69E',
      text: '#17151F',
      textSecondary: '#464152',
      textTertiary: '#746F82',
      outline: '#7A7586',
      outlineVariant: '#D2CDE0',
    },
    dark: {
      primary: '#9D7BF2',
      primaryLight: '#BEA6FF',
      primaryContainer: '#22173D',
      onPrimaryContainer: '#EAE0FF',
      secondary: '#B0A9C2',
      secondaryContainer: '#1C1924',
      onSecondaryContainer: '#EAE5F5',
      tertiary: '#DDA8BA',
      tertiaryContainer: '#2F1D24',
      onTertiaryContainer: '#FFE0EA',
      canvas: '#000000',
      surfaceContainerLowest: '#08070B',
      surfaceContainerLow: '#1312188F',
      surfaceContainer: '#17161E7A',
      surfaceContainerHigh: '#1F1D2899',
      surfaceContainerHighest: '#282634AD',
      text: '#F2EFF8',
      textSecondary: '#ABA5BA',
      textTertiary: '#7B758A',
      outline: '#726C80',
      outlineVariant: '#272432',
    },
  },
  rose: {
    light: {
      primary: '#B3263E',
      primaryLight: '#DF4F67',
      primaryContainer: '#FFDAD9',
      onPrimaryContainer: '#40000D',
      secondary: '#765659',
      secondaryContainer: '#F7DCDF',
      onSecondaryContainer: '#2C1518',
      tertiary: '#735A36',
      tertiaryContainer: '#FFDDB0',
      onTertiaryContainer: '#271900',
      canvas: '#F9F1F3',
      surfaceContainerLowest: '#FFFFFF',
      surfaceContainerLow: '#FFFFFF78',
      surfaceContainer: '#FFFFFF5C',
      surfaceContainerHigh: '#FFFFFF8F',
      surfaceContainerHighest: '#F3E3E69E',
      text: '#1C1517',
      textSecondary: '#4E4143',
      textTertiary: '#7E6F72',
      outline: '#847477',
      outlineVariant: '#DBCACE',
    },
    dark: {
      primary: '#EC566F',
      primaryLight: '#FF8A9D',
      primaryContainer: '#33121A',
      onPrimaryContainer: '#FFE0E5',
      secondary: '#BFAAAD',
      secondaryContainer: '#21191B',
      onSecondaryContainer: '#F5E8EA',
      tertiary: '#D9B68B',
      tertiaryContainer: '#2E2316',
      onTertiaryContainer: '#FFE6C4',
      canvas: '#000000',
      surfaceContainerLowest: '#090708',
      surfaceContainerLow: '#1512148F',
      surfaceContainer: '#1A16187A',
      surfaceContainerHigh: '#221D2099',
      surfaceContainerHighest: '#2C2528AD',
      text: '#F6EFF0',
      textSecondary: '#B5A6A9',
      textTertiary: '#85777A',
      outline: '#7B6E71',
      outlineVariant: '#2B2326',
    },
  },
};

export function getMaterialColors(seed: MaterialSeedId, scheme: 'light' | 'dark'): ThemeColors {
  const s = (SEED_SPECS[seed] ?? SEED_SPECS.tangerine)[scheme];
  const isDark = scheme === 'dark';

  const semantic = isDark
    ? {
        success: '#4ADE80',
        successContainer: '#123824',
        onSuccessContainer: '#A7F3C4',
        error: '#F87171',
        errorContainer: '#5C191E',
        onErrorContainer: '#FFDAD6',
        warning: '#FBBF24',
        warningContainer: '#4B3208',
        onWarningContainer: '#FFE1A6',
        info: '#60A5FA',
        infoContainer: '#14335C',
        onInfoContainer: '#D6E6FF',
      }
    : {
        success: '#147D4F',
        successContainer: '#D4F6E4',
        onSuccessContainer: '#04321E',
        error: '#BA1A1A',
        errorContainer: '#FFDAD6',
        onErrorContainer: '#410002',
        warning: '#B45309',
        warningContainer: '#FFEDD5',
        onWarningContainer: '#451A03',
        info: '#1D5FD1',
        infoContainer: '#DCE8FF',
        onInfoContainer: '#001B47',
      };

  const glass = isDark
    ? {
        glassSurface: 'rgba(18, 20, 24, 0.56)',
        glassSurfaceElevated: 'rgba(15, 17, 21, 0.72)',
        glassSurfaceSubtle: 'rgba(255, 255, 255, 0.055)',
        glassBorder: 'rgba(255, 255, 255, 0.13)',
        glassBorderSubtle: 'rgba(255, 255, 255, 0.08)',
        glassHighlight: 'rgba(255, 255, 255, 0.22)',
        glassHeader: 'rgba(4, 6, 9, 0.62)',
        glassOverlay: 'rgba(0, 0, 0, 0.52)',
      }
    : {
        glassSurface: 'rgba(255, 255, 255, 0.52)',
        glassSurfaceElevated: 'rgba(255, 255, 255, 0.72)',
        glassSurfaceSubtle: 'rgba(255, 255, 255, 0.34)',
        glassBorder: 'rgba(255, 255, 255, 0.84)',
        glassBorderSubtle: 'rgba(16, 18, 24, 0.07)',
        glassHighlight: 'rgba(255, 255, 255, 0.98)',
        glassHeader: 'rgba(248, 249, 252, 0.64)',
        glassOverlay: 'rgba(10, 12, 18, 0.34)',
      };

  return {
    // Legacy keys mapped harmoniously to translucent glass surfaces
    text: s.text,
    textSecondary: s.textSecondary,
    textTertiary: s.textTertiary,
    canvas: s.canvas,
    background: 'transparent',
    surface: s.surfaceContainerLow,
    surfaceSecondary: s.surfaceContainerHigh,
    tint: s.primary,
    primary: s.primary,
    primaryLight: s.primaryLight,
    icon: s.textSecondary,
    border: isDark ? 'rgba(255, 255, 255, 0.13)' : 'rgba(255, 255, 255, 0.78)',
    borderLight: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 18, 24, 0.07)',
    tabIconDefault: s.textSecondary,
    tabIconSelected: s.onSecondaryContainer,
    ...semantic,
    ...glass,
    cardShadow: isDark ? 'rgba(0, 0, 0, 0.32)' : 'rgba(16, 18, 28, 0.05)',
    statusActive: semantic.success,
    statusPending: semantic.warning,
    statusError: semantic.error,
    statusPaused: s.textTertiary,
    overlay: glass.glassOverlay,
    inputBg: s.surfaceContainerHigh,
    badge: s.secondaryContainer,
    badgeText: s.onSecondaryContainer,

    // Full M3 Color Roles
    onPrimary: '#FFFFFF',
    primaryContainer: s.primaryContainer,
    onPrimaryContainer: s.onPrimaryContainer,
    secondary: s.secondary,
    onSecondary: '#FFFFFF',
    secondaryContainer: s.secondaryContainer,
    onSecondaryContainer: s.onSecondaryContainer,
    tertiary: s.tertiary,
    onTertiary: '#FFFFFF',
    tertiaryContainer: s.tertiaryContainer,
    onTertiaryContainer: s.onTertiaryContainer,
    surfaceContainerLowest: s.surfaceContainerLowest,
    surfaceContainerLow: s.surfaceContainerLow,
    surfaceContainer: s.surfaceContainer,
    surfaceContainerHigh: s.surfaceContainerHigh,
    surfaceContainerHighest: s.surfaceContainerHighest,
    onSurface: s.text,
    onSurfaceVariant: s.textSecondary,
    outline: s.outline,
    outlineVariant: s.outlineVariant,
    inverseSurface: isDark ? '#E6E9F0' : '#1E2128',
    inverseOnSurface: isDark ? '#181B21' : '#F4F6FA',
    inversePrimary: s.primaryLight,
    scrim: glass.glassOverlay,
  };
}

export const Colors = {
  light: getMaterialColors('tangerine', 'light'),
  dark: getMaterialColors('tangerine', 'dark'),
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 28,
  xxl: 32,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Plus Jakarta Sans', 'Google Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Plus Jakarta Sans', 'SF Pro Rounded', sans-serif",
    mono: "'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
