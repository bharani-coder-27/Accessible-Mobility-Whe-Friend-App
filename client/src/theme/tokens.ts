/**
 * Design tokens for the Whe Friend app.
 *
 * Every colour pairing below is chosen to clear WCAG 2.1 AA (4.5:1 for body
 * text, 3:1 for large text and UI boundaries) against the surface it is used
 * on. The high-contrast palettes push well past AAA for riders who need it.
 */

/** 4pt spacing scale. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

/**
 * Minimum interactive size. WCAG 2.5.5 asks for 44pt; Android's Material
 * guidance asks for 48dp. We take the larger of the two so a single value is
 * safe on both platforms — this matters a great deal for users operating the
 * phone with limited hand mobility.
 */
export const touchTarget = 48;

/** Base font sizes, before the user's text-scale preference is applied. */
export const fontSize = {
  caption: 12,
  footnote: 13,
  body: 15,
  bodyLg: 17,
  title: 20,
  titleLg: 24,
  display: 30,
  displayLg: 36,
} as const;

export const lineHeightRatio = 1.4;

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const duration = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

export interface Palette {
  /** Screen background. */
  bg: string;
  /** Raised card / sheet background. */
  surface: string;
  /** Recessed background, e.g. an input well or a muted row. */
  surfaceAlt: string;
  /** Pressed / hovered state for a surface. */
  surfacePressed: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  /** Text on a coloured (non-surface) background. */
  textInverse: string;
  primary: string;
  /** A darker primary that clears AA as text on `surface`. */
  primaryText: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  onSuccess: string;
  warning: string;
  warningSoft: string;
  onWarning: string;
  danger: string;
  dangerSoft: string;
  onDanger: string;
  info: string;
  infoSoft: string;
  /** Focus ring — must be visible on every background. */
  focus: string;
  /** Scrim behind modals and drawers. */
  scrim: string;
  /** Map polyline / route accent. */
  route: string;
}

export const lightPalette: Palette = {
  bg: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF0F7',
  surfacePressed: '#E2E7F1',
  border: '#D8DEEA',
  borderStrong: '#AEB8C9',
  text: '#101420',
  textMuted: '#565F73',
  textInverse: '#FFFFFF',
  primary: '#4F35D6',
  primaryText: '#4126B4',
  primarySoft: '#ECE8FF',
  onPrimary: '#FFFFFF',
  success: '#0E7C4A',
  successSoft: '#E1F5EB',
  onSuccess: '#FFFFFF',
  warning: '#8A4B00',
  warningSoft: '#FFF1DC',
  onWarning: '#FFFFFF',
  danger: '#BE2222',
  dangerSoft: '#FDE6E6',
  onDanger: '#FFFFFF',
  info: '#0B62BD',
  infoSoft: '#E3EFFC',
  focus: '#0B62BD',
  scrim: 'rgba(9, 12, 20, 0.55)',
  route: '#4F35D6',
};

export const darkPalette: Palette = {
  bg: '#0B0E14',
  surface: '#161B25',
  surfaceAlt: '#1F2631',
  surfacePressed: '#2A3341',
  border: '#2D3745',
  borderStrong: '#4A5768',
  text: '#F2F5FA',
  textMuted: '#A7B2C5',
  textInverse: '#101420',
  primary: '#9B85FF',
  primaryText: '#B4A3FF',
  primarySoft: '#241E45',
  onPrimary: '#14102E',
  success: '#4ADE9B',
  successSoft: '#10301F',
  onSuccess: '#052013',
  warning: '#F5B457',
  warningSoft: '#33240D',
  onWarning: '#241701',
  danger: '#FF8A8A',
  dangerSoft: '#3A1717',
  onDanger: '#2B0606',
  info: '#7FB8F5',
  infoSoft: '#122536',
  focus: '#7FB8F5',
  scrim: 'rgba(0, 0, 0, 0.7)',
  route: '#9B85FF',
};

/** Maximum-contrast variants for users who enable high contrast in Settings. */
export const highContrastLightPalette: Palette = {
  ...lightPalette,
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F0F0',
  surfacePressed: '#DCDCDC',
  border: '#000000',
  borderStrong: '#000000',
  text: '#000000',
  textMuted: '#2B2B2B',
  primary: '#2E17A8',
  primaryText: '#2E17A8',
  primarySoft: '#E6E1FF',
  success: '#005C33',
  warning: '#6B3800',
  danger: '#9A0000',
  info: '#00429B',
  focus: '#00429B',
  scrim: 'rgba(0, 0, 0, 0.75)',
  route: '#2E17A8',
};

export const highContrastDarkPalette: Palette = {
  ...darkPalette,
  bg: '#000000',
  surface: '#000000',
  surfaceAlt: '#141414',
  surfacePressed: '#2A2A2A',
  border: '#FFFFFF',
  borderStrong: '#FFFFFF',
  text: '#FFFFFF',
  textMuted: '#E4E4E4',
  primary: '#C9B8FF',
  primaryText: '#C9B8FF',
  primarySoft: '#1C1436',
  success: '#7BF7B6',
  warning: '#FFD08A',
  danger: '#FFACAC',
  info: '#A8D3FF',
  focus: '#FFD400',
  scrim: 'rgba(0, 0, 0, 0.85)',
  route: '#C9B8FF',
};

export type ElevationLevel = 0 | 1 | 2 | 3;

/**
 * Shadows are deliberately soft. On high contrast we drop them entirely and
 * lean on borders instead, because a blurred shadow is not a reliable
 * boundary cue for low-vision users.
 */
export const elevation = (level: ElevationLevel, isDark: boolean, flat: boolean) => {
  if (flat || level === 0) return {};

  const config = {
    1: { height: 1, radius: 3, opacity: isDark ? 0.4 : 0.06 },
    2: { height: 4, radius: 10, opacity: isDark ? 0.5 : 0.09 },
    3: { height: 10, radius: 22, opacity: isDark ? 0.6 : 0.13 },
  }[level];

  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: config.height },
    shadowOpacity: config.opacity,
    shadowRadius: config.radius,
    elevation: level * 3,
  };
};
