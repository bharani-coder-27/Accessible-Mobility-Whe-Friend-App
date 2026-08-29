import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { getFromStorage, saveToStorage } from '../utils/storage';
import {
  darkPalette,
  duration,
  elevation,
  ElevationLevel,
  fontFamily,
  fontSize,
  highContrastDarkPalette,
  highContrastLightPalette,
  lightPalette,
  lineHeightRatio,
  Palette,
  radius,
  spacing,
  touchTarget,
} from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * In-app text size preference. This sits on top of the OS font-size setting
 * rather than replacing it: some riders never open system settings, and some
 * hand the phone to a carer who needs larger text only inside this app.
 */
export type TextSize = 'default' | 'large' | 'xlarge';

const textScaleFor: Record<TextSize, number> = {
  default: 1,
  large: 1.15,
  xlarge: 1.35,
};

export interface Theme {
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  duration: typeof duration;
  fontFamily: typeof fontFamily;
  touchTarget: number;
  isDark: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  /** Font size in points, already multiplied by the user's text scale. */
  size: (key: keyof typeof fontSize) => number;
  /** Line height matched to a scaled font size. */
  leading: (key: keyof typeof fontSize) => number;
  shadow: (level: ElevationLevel) => object;
}

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  textSize: TextSize;
  setTextSize: (value: TextSize) => void;
}

const STORAGE_KEYS = {
  mode: 'theme.mode',
  highContrast: 'theme.highContrast',
  textSize: 'theme.textSize',
} as const;

const buildTheme = (
  isDark: boolean,
  highContrast: boolean,
  textSize: TextSize,
  reduceMotion: boolean
): Theme => {
  const colors = highContrast
    ? isDark
      ? highContrastDarkPalette
      : highContrastLightPalette
    : isDark
      ? darkPalette
      : lightPalette;

  const scale = textScaleFor[textSize];
  const size = (key: keyof typeof fontSize) => Math.round(fontSize[key] * scale);

  return {
    colors,
    spacing,
    radius,
    duration,
    fontFamily,
    touchTarget,
    isDark,
    highContrast,
    reduceMotion,
    size,
    leading: (key) => Math.round(size(key) * lineHeightRatio),
    shadow: (level) => elevation(level, isDark, highContrast),
  };
};

const defaultTheme = buildTheme(false, false, 'default', false);

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  mode: 'system',
  setMode: () => {},
  highContrast: false,
  setHighContrast: () => {},
  textSize: 'default',
  setTextSize: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [highContrast, setHighContrastState] = useState(false);
  const [textSize, setTextSizeState] = useState<TextSize>('default');
  const [reduceMotion, setReduceMotion] = useState(false);

  // Restore the saved preferences.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [storedMode, storedContrast, storedTextSize] = await Promise.all([
        getFromStorage<ThemeMode>(STORAGE_KEYS.mode),
        getFromStorage<string>(STORAGE_KEYS.highContrast),
        getFromStorage<TextSize>(STORAGE_KEYS.textSize),
      ]);

      if (cancelled) return;
      if (storedMode === 'system' || storedMode === 'light' || storedMode === 'dark') {
        setModeState(storedMode);
      }
      if (storedContrast !== null) setHighContrastState(storedContrast === 'true');
      if (storedTextSize === 'default' || storedTextSize === 'large' || storedTextSize === 'xlarge') {
        setTextSizeState(storedTextSize);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Honour the OS "reduce motion" switch so animations never fight a
  // vestibular sensitivity.
  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) =>
      setReduceMotion(enabled)
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    saveToStorage(STORAGE_KEYS.mode, next);
  }, []);

  const setHighContrast = useCallback((next: boolean) => {
    setHighContrastState(next);
    saveToStorage(STORAGE_KEYS.highContrast, String(next));
  }, []);

  const setTextSize = useCallback((next: TextSize) => {
    setTextSizeState(next);
    saveToStorage(STORAGE_KEYS.textSize, next);
  }, []);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: buildTheme(isDark, highContrast, textSize, reduceMotion),
      mode,
      setMode,
      highContrast,
      setHighContrast,
      textSize,
      setTextSize,
    }),
    [isDark, highContrast, textSize, reduceMotion, mode, setMode, setHighContrast, setTextSize]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/** Access the resolved theme. */
export const useTheme = () => useContext(ThemeContext).theme;

/** Access the theme preferences and their setters (for the Settings screen). */
export const useThemePreferences = () => useContext(ThemeContext);
