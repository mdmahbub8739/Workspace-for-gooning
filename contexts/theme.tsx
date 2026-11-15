import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { getMaterialColors, MATERIAL_SEEDS, MaterialSeedId, ThemeColors } from '@/constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolved: 'light' | 'dark';
  seed: MaterialSeedId;
  setSeed: (seed: MaterialSeedId) => void;
  colors: ThemeColors;
}

const DEFAULT_COLORS = getMaterialColors('tangerine', 'light');

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  setMode: () => {},
  resolved: 'light',
  seed: 'tangerine',
  setSeed: () => {},
  colors: DEFAULT_COLORS,
});

const STORAGE_KEY = 'cf_theme_mode';
const SEED_STORAGE_KEY = 'cf_material_seed';

const VALID_SEEDS = new Set<string>(MATERIAL_SEEDS.map((s) => s.id));

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const SecureStore = require('expo-secure-store');
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const SecureStore = require('expo-secure-store');
    return SecureStore.setItemAsync(key, value);
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() ?? 'light';
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [seed, setSeedState] = useState<MaterialSeedId>('tangerine');

  useEffect(() => {
    storage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    }).catch(() => {});
    storage.getItem(SEED_STORAGE_KEY).then((savedSeed) => {
      if (savedSeed && VALID_SEEDS.has(savedSeed)) {
        setSeedState(savedSeed as MaterialSeedId);
      }
    }).catch(() => {});
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    storage.setItem(STORAGE_KEY, newMode).catch(() => {});
  }, []);

  const setSeed = useCallback((newSeed: MaterialSeedId) => {
    setSeedState(newSeed);
    storage.setItem(SEED_STORAGE_KEY, newSeed).catch(() => {});
  }, []);

  const resolved = mode === 'system' ? systemScheme : mode;
  const colors = useMemo(() => getMaterialColors(seed, resolved), [seed, resolved]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolved, seed, setSeed, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
