/**
 * Design tokens — single source of truth for all PacePulse design decisions.
 * These map 1:1 to the CSS custom properties defined in globals.css.
 * Use these in TypeScript/React code; use the CSS vars in style props.
 */

export const colors = {
  // App background
  background: "#0A0A0A",
  backgroundNavy: "#0D1B2A",

  // Surfaces (glassmorphism)
  surfaceBase: "rgba(255,255,255,0.05)",
  surfaceHover: "rgba(255,255,255,0.08)",
  surfaceActive: "rgba(255,255,255,0.12)",

  // Borders
  borderDefault: "rgba(255,255,255,0.10)",
  borderGold: "rgba(244,208,63,0.3)",
  borderPurple: "rgba(155,89,182,0.3)",

  // Brand — ZoomX pack identity
  gold: "#F4D03F",
  goldDim: "rgba(244,208,63,0.6)",
  orange: "#E67E22",
  purple: "#9B59B6",

  // Gradient (linear-gradient source → end)
  gradientStart: "#E67E22",
  gradientEnd: "#9B59B6",

  // Semantic
  success: "#27AE60",
  warning: "#F39C12",
  danger: "#E74C3C",
  info: "#3498DB",

  // Text
  textPrimary: "#F5F5F5",
  textMuted: "rgba(245,245,245,0.5)",
  textDisabled: "rgba(245,245,245,0.25)",

  // HR Zones
  zoneZ1: "#3498DB",
  zoneZ2: "#27AE60",
  zoneZ3: "#F4D03F",
  zoneZ4: "#E67E22",
  zoneZ5: "#E74C3C",

  // Run types
  typeEndurance: "#3498DB",
  typeThreshold: "#E67E22",
  typeInterval: "#E74C3C",
  typeLong: "#9B59B6",
  typeRecovery: "#27AE60",
} as const

export const typography = {
  fontSans: "-apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif",
  fontDisplay: "'Inter', system-ui, sans-serif",
  fontMono: "'SF Mono', 'Fira Code', monospace",
  fontBebas: "'Bebas Neue', sans-serif",

  // Weights
  weightLight: 300,
  weightRegular: 400,
  weightSemibold: 600,
  weightBold: 700,
  weightBlack: 900,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
} as const

export const blur = {
  glass: "blur(12px)",
  heavy: "blur(24px)",
  light: "blur(6px)",
} as const

export const shadows = {
  cardGold: "0 8px 32px rgba(244,208,63,0.15)",
  cardPurple: "0 8px 32px rgba(155,89,182,0.15)",
  glowGold: "0 0 24px rgba(244,208,63,0.4)",
  glowRed: "0 0 24px rgba(231,76,60,0.4)",
  glowGreen: "0 0 24px rgba(39,174,96,0.4)",
  tab: "0 -8px 32px rgba(0,0,0,0.4)",
} as const

export const animation = {
  // Durations (ms)
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,

  // Easings
  easeOut: [0, 0, 0.2, 1] as [number, number, number, number],
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  spring: { type: "spring" as const, damping: 26, stiffness: 280 },
  springBouncy: { type: "spring" as const, damping: 18, stiffness: 320 },
} as const

export const spacing = {
  pageX: 16,      // px horizontal padding
  pageTop: 16,    // px top padding
  gap: 16,        // standard gap between sections
  gapSm: 8,
  gapLg: 24,
} as const

// Vitality score thresholds
export const vitality = {
  excellent: 80,
  good: 60,
  moderate: 40,
  low: 20,

  colorExcellent: "#27AE60",
  colorGood: "#F4D03F",
  colorModerate: "#E67E22",
  colorLow: "#E74C3C",
} as const

// Hydration constants
export const hydration = {
  baseSweatRateMlPerHr: 500,
  tempCorrectionMlPerDegAbove15: 30,
  rehydrationFactor: 1.5,     // drink 1.5× the loss
  intensityMultiplier: {
    recovery: 1.0,
    endurance: 1.2,
    long: 1.3,
    threshold: 1.5,
    interval: 1.8,
  } as Record<string, number>,
} as const
