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
    background: string;
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
    background: string;
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
      background: '#FFF8F5',
      surfaceContainerLowest: '#FFFFFF',
      surfaceContainerLow: '#FDF2EC',
      surfaceContainer: '#F7EAE2',
      surfaceContainerHigh: '#F1E1D7',
      surfaceContainerHighest: '#EAD6CA',
      text: '#211A16',
      textSecondary: '#54453C',
      textTertiary: '#857369',
      outline: '#857369',
      outlineVariant: '#D8C3B7',
    },
    dark: {
      primary: '#D96414',
      primaryLight: '#FFB68B',
      primaryContainer: '#692C00',
      onPrimaryContainer: '#FFDBC8',
      secondary: '#E5BFB0',
      secondaryContainer: '#473429',
      onSecondaryContainer: '#FFDBC8',
      tertiary: '#D5C2ED',
      tertiaryContainer: '#4E4166',
      onTertiaryContainer: '#EDE0FF',
      background: '#15110F',
      surfaceContainerLowest: '#100D0B',
      surfaceContainerLow: '#1E1916',
      surfaceContainer: '#251F1B',
      surfaceContainerHigh: '#302823',
      surfaceContainerHighest: '#3B322C',
      text: '#F5EAE4',
      textSecondary: '#C8B5AA',
      textTertiary: '#98857B',
      outline: '#9E8B80',
      outlineVariant: '#4B3E36',
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
      background: '#F8F9FF',
      surfaceContainerLowest: '#FFFFFF',
      surfaceContainerLow: '#F1F3FC',
      surfaceContainer: '#EAEFF9',
      surfaceContainerHigh: '#E2E8F5',
      surfaceContainerHighest: '#DAE1F0',
      text: '#191B23',
      textSecondary: '#444752',
      textTertiary: '#747784',
      outline: '#747784',
      outlineVariant: '#C4C6D4',
    },
    dark: {
      primary: '#3B7BE8',
      primaryLight: '#AFC6FF',
      primaryContainer: '#00429B',
      onPrimaryContainer: '#D8E2FF',
      secondary: '#BFC6DC',
      secondaryContainer: '#323A4C',
      onSecondaryContainer: '#DBE2F9',
      tertiary: '#DDBCE0',
      tertiaryContainer: '#563D5B',
      onTertiaryContainer: '#FAD8FD',
      background: '#111318',
      surfaceContainerLowest: '#0C0E12',
      surfaceContainerLow: '#191C22',
      surfaceContainer: '#1E2129',
      surfaceContainerHigh: '#282C36',
      surfaceContainerHighest: '#333844',
      text: '#E4E6F0',
      textSecondary: '#B3B7C7',
      textTertiary: '#858999',
      outline: '#8D91A1',
      outlineVariant: '#3D424F',
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
      background: '#F5FBF6',
      surfaceContainerLowest: '#FFFFFF',
      surfaceContainerLow: '#EEF6EF',
      surfaceContainer: '#E7F0E9',
      surfaceContainerHigh: '#DFEAE2',
      surfaceContainerHighest: '#D7E4DA',
      text: '#171D19',
      textSecondary: '#3F4943',
      textTertiary: '#6F7972',
      outline: '#6F7972',
      outlineVariant: '#BFC9C2',
    },
    dark: {
      primary: '#1E8E63',
      primaryLight: '#8AD6B3',
      primaryContainer: '#005134',
      onPrimaryContainer: '#A6F2CE',
      secondary: '#B3CCBF',
      secondaryContainer: '#2B4237',
      onSecondaryContainer: '#CEE9DB',
      tertiary: '#A7CCE0',
      tertiaryContainer: '#264B5C',
      onTertiaryContainer: '#C3E8FC',
      background: '#0F1512',
      surfaceContainerLowest: '#0A0F0D',
      surfaceContainerLow: '#171E1A',
      surfaceContainer: '#1C241F',
      surfaceContainerHigh: '#262F2A',
      surfaceContainerHighest: '#303A34',
      text: '#E0E8E3',
      textSecondary: '#B0BDB6',
      textTertiary: '#829088',
      outline: '#89938C',
      outlineVariant: '#3B453F',
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
      background: '#FCF8FF',
      surfaceContainerLowest: '#FFFFFF',
      surfaceContainerLow: '#F6EFFD',
      surfaceContainer: '#EFE6FA',
      surfaceContainerHigh: '#E8DDF5',
      surfaceContainerHighest: '#E1D4F0',
      text: '#1D1B22',
      textSecondary: '#494552',
      textTertiary: '#797482',
      outline: '#797482',
      outlineVariant: '#CAC4D3',
    },
    dark: {
      primary: '#7D5BD0',
      primaryLight: '#CFBCFF',
      primaryContainer: '#4E2D9C',
      onPrimaryContainer: '#EADDFF',
      secondary: '#CCC2DC',
      secondaryContainer: '#3D364F',
      onSecondaryContainer: '#E7DEF8',
      tertiary: '#EFB8C8',
      tertiaryContainer: '#633B48',
      onTertiaryContainer: '#FFD8E4',
      background: '#141218',
      surfaceContainerLowest: '#0F0D12',
      surfaceContainerLow: '#1C1922',
      surfaceContainer: '#221E29',
      surfaceContainerHigh: '#2C2834',
      surfaceContainerHighest: '#373240',
      text: '#E7E2EE',
      textSecondary: '#B9B3C4',
      textTertiary: '#8C8698',
      outline: '#938F99',
      outlineVariant: '#443F4D',
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
      background: '#FFF8F8',
      surfaceContainerLowest: '#FFFFFF',
      surfaceContainerLow: '#FCF0F0',
      surfaceContainer: '#F7E7E8',
      surfaceContainerHigh: '#F1DFE0',
      surfaceContainerHighest: '#EBD6D8',
      text: '#22191A',
      textSecondary: '#524344',
      textTertiary: '#847374',
      outline: '#847374',
      outlineVariant: '#D6C2C3',
    },
    dark: {
      primary: '#C93A52',
      primaryLight: '#FFB3B8',
      primaryContainer: '#8D1027',
      onPrimaryContainer: '#FFDAD9',
      secondary: '#E6BDC0',
      secondaryContainer: '#4E3336',
      onSecondaryContainer: '#F7DCDF',
      tertiary: '#E3C196',
      tertiaryContainer: '#5A4321',
      onTertiaryContainer: '#FFDDB0',
      background: '#181112',
      surfaceContainerLowest: '#120D0E',
      surfaceContainerLow: '#21191A',
      surfaceContainer: '#271E20',
      surfaceContainerHigh: '#32282A',
      surfaceContainerHighest: '#3D3234',
      text: '#F2E5E6',
      textSecondary: '#C8B4B6',
      textTertiary: '#988486',
      outline: '#9F8C8E',
      outlineVariant: '#4C3D3F',
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

  return {
    // Legacy keys mapped harmoniously to Material You tonal layers
    text: s.text,
    textSecondary: s.textSecondary,
    textTertiary: s.textTertiary,
    background: s.background,
    surface: s.surfaceContainerLow,
    surfaceSecondary: s.surfaceContainerHigh,
    tint: s.primary,
    primary: s.primary,
    primaryLight: s.primaryLight,
    icon: s.textSecondary,
    border: s.outlineVariant,
    borderLight: s.surfaceContainerHighest,
    tabIconDefault: s.textSecondary,
    tabIconSelected: s.onSecondaryContainer,
    ...semantic,
    cardShadow: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(28, 22, 18, 0.08)',
    statusActive: semantic.success,
    statusPending: semantic.warning,
    statusError: semantic.error,
    statusPaused: s.textTertiary,
    overlay: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(18, 14, 12, 0.42)',
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
    inverseSurface: isDark ? '#EDE5E0' : '#2E2825',
    inverseOnSurface: isDark ? '#2B2420' : '#FAF2EE',
    inversePrimary: s.primaryLight,
    scrim: 'rgba(0, 0, 0, 0.5)',
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
