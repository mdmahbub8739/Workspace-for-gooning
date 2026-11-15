import { MaterialSeedId, ThemeColors } from '@/constants/theme';
import { useThemeContext } from '@/contexts/theme';

export type { ThemeColors };

export function useTheme(): {
  colors: ThemeColors;
  isDark: boolean;
  seed: MaterialSeedId;
  setSeed: (seed: MaterialSeedId) => void;
} {
  const { resolved, colors, seed, setSeed } = useThemeContext();
  return {
    colors,
    isDark: resolved === 'dark',
    seed,
    setSeed,
  };
}
