/**
 * PacePulse — Design System
 * Source de vérité pour tous les tokens visuels, animations et patterns.
 * Importe ce fichier partout où tu as besoin de cohérence visuelle.
 */

import type React from "react"

// ═══════════════════════════════════════════════════════════════
// 1. PALETTE DE COULEURS
// ═══════════════════════════════════════════════════════════════

export const colors = {
  // Backgrounds
  bg: {
    base:    "#050505",
    surface: "#0A0A0A",
    card:    "rgba(255,255,255,0.04)",
    cardHover: "rgba(255,255,255,0.06)",
    overlay: "rgba(0,0,0,0.72)",
  },

  // Accents — or/gold
  gold: {
    DEFAULT: "#D4AF37",
    bright:  "#F4D03F",
    muted:   "#B8962E",
    glow:    "rgba(212,175,55,0.35)",
    tint10:  "rgba(212,175,55,0.10)",
    tint15:  "rgba(212,175,55,0.15)",
    tint25:  "rgba(212,175,55,0.25)",
  },

  // Accents — violet/purple
  purple: {
    DEFAULT: "#A855F7",
    bright:  "#C084FC",
    tint10:  "rgba(168,85,247,0.10)",
    tint20:  "rgba(168,85,247,0.20)",
  },

  // Accents — bleu/indigo
  blue: {
    DEFAULT: "#3B82F6",
    indigo:  "#6366F1",
    tint10:  "rgba(59,130,246,0.10)",
    tint20:  "rgba(59,130,246,0.20)",
  },

  // Accents — vert
  green: {
    DEFAULT: "#22C55E",
    tint10:  "rgba(34,197,94,0.10)",
    tint20:  "rgba(34,197,94,0.20)",
  },

  // Accents — orange
  orange: {
    DEFAULT: "#FF6B1A",
    tint10:  "rgba(255,107,26,0.10)",
  },

  // Accents — rouge
  red: {
    DEFAULT: "#EF4444",
    tint10:  "rgba(239,68,68,0.10)",
    tint20:  "rgba(239,68,68,0.20)",
  },

  // Texte
  text: {
    primary:   "#FAFAFA",
    secondary: "rgba(250,250,250,0.65)",
    muted:     "rgba(250,250,250,0.38)",
    subtle:    "rgba(250,250,250,0.22)",
    label:     "rgba(250,250,250,0.32)",
  },

  // Borders
  border: {
    default: "rgba(255,255,255,0.10)",
    subtle:  "rgba(255,255,255,0.06)",
    strong:  "rgba(255,255,255,0.18)",
    gold:    "rgba(212,175,55,0.28)",
  },

  // Types de courses
  runType: {
    endurance: "#3498DB",
    threshold: "#E67E22",
    interval:  "#E74C3C",
    long:      "#9B59B6",
    recovery:  "#27AE60",
  },
} as const

// ═══════════════════════════════════════════════════════════════
// 2. TYPOGRAPHIE
// ═══════════════════════════════════════════════════════════════

export const typography = {
  // Classes Tailwind réutilisables
  sectionLabel: {
    className: "text-[9px] font-bold uppercase tracking-[0.20em]",
    style: { color: colors.text.label },
  },
  sectionLabelGold: {
    className: "text-[9px] font-bold uppercase tracking-[0.22em]",
    style: { color: colors.gold.DEFAULT },
  },
  pageTitle: {
    className: "text-[26px] font-black tracking-tight",
    style: { color: colors.text.primary },
  },
  cardTitle: {
    className: "text-base font-bold",
    style: { color: colors.text.primary },
  },
  dataLarge: {
    className: "text-[32px] font-black data-mono leading-none",
    style: { color: colors.text.primary },
  },
  dataMedium: {
    className: "text-[22px] font-black data-mono leading-none",
    style: { color: colors.text.primary },
  },
  dataSmall: {
    className: "text-[14px] font-bold data-mono",
    style: { color: colors.text.primary },
  },
  body: {
    className: "text-[12px] leading-relaxed",
    style: { color: colors.text.secondary },
  },
  caption: {
    className: "text-[10px] font-semibold",
    style: { color: colors.text.muted },
  },
} as const

// ═══════════════════════════════════════════════════════════════
// 3. LIQUID GLASS — STYLES PRÉDÉFINIS
// ═══════════════════════════════════════════════════════════════

const GLASS_SHADOW_BASE = [
  "inset 3px  3px  0.5px -3.5px rgba(255,255,255,0.09)",
  "inset -3px -3px 0.5px -3.5px rgba(255,255,255,0.82)",
  "inset 1px  1px  1px   -0.5px rgba(255,255,255,0.55)",
  "inset -1px -1px 1px   -0.5px rgba(255,255,255,0.55)",
  "inset 0 0 6px 6px rgba(255,255,255,0.10)",
  "inset 0 0 2px 2px rgba(255,255,255,0.05)",
].join(",")

export const glass = {
  /** Carte standard */
  card: {
    background: colors.bg.card,
    backdropFilter: "blur(22px) saturate(180%)",
    WebkitBackdropFilter: "blur(22px) saturate(180%)",
    border: `1px solid ${colors.border.default}`,
    boxShadow: `0 2px 10px rgba(0,0,0,0.20),${GLASS_SHADOW_BASE},0 0 14px rgba(0,0,0,0.18)`,
  },

  /** Carte accentuée (gold) */
  cardGold: {
    background: colors.gold.tint10,
    backdropFilter: "blur(22px) saturate(180%)",
    WebkitBackdropFilter: "blur(22px) saturate(180%)",
    border: `1px solid ${colors.border.gold}`,
    boxShadow: `0 2px 16px rgba(212,175,55,0.12),${GLASS_SHADOW_BASE}`,
  },

  /** Surface subtile (sections) */
  surface: {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(16px) saturate(160%)",
    WebkitBackdropFilter: "blur(16px) saturate(160%)",
    border: `1px solid ${colors.border.subtle}`,
    boxShadow: `0 1px 6px rgba(0,0,0,0.14),${GLASS_SHADOW_BASE}`,
  },

  /** Pill/badge navigation */
  pill: {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(28px) saturate(200%)",
    WebkitBackdropFilter: "blur(28px) saturate(200%)",
    border: `1px solid ${colors.border.strong}`,
    boxShadow: [
      "0 4px 24px rgba(0,0,0,0.40)",
      "inset 3px  3px  0.5px -3.5px rgba(255,255,255,0.09)",
      "inset -3px -3px 0.5px -3.5px rgba(255,255,255,0.88)",
      "inset 1px  1px  1px   -0.5px rgba(255,255,255,0.60)",
      "inset -1px -1px 1px   -0.5px rgba(255,255,255,0.60)",
      "inset 0 0 8px 6px rgba(255,255,255,0.08)",
      "0 0 16px rgba(0,0,0,0.25)",
    ].join(","),
  },

  /** Modal/overlay */
  modal: {
    background: "rgba(10,10,10,0.88)",
    backdropFilter: "blur(40px) saturate(200%)",
    WebkitBackdropFilter: "blur(40px) saturate(200%)",
    border: `1px solid ${colors.border.default}`,
    boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
  },
} as const

// ═══════════════════════════════════════════════════════════════
// 4. GRADIENTS
// ═══════════════════════════════════════════════════════════════

export const gradients = {
  // Backgrounds de page
  pagePurple:  "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.18) 0%, transparent 65%)",
  pageGold:    "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.15) 0%, transparent 65%)",
  pageGreen:   "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.14) 0%, transparent 65%)",
  pageBlue:    "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.16) 0%, transparent 65%)",
  pageBiColor: "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.12) 0%, rgba(59,130,246,0.10) 50%, transparent 80%)",

  // Barres de couleur
  barGold:     "linear-gradient(180deg, #D4AF37, #D4AF3744)",
  barPurple:   "linear-gradient(180deg, #A855F7, #A855F744)",
  barGreen:    "linear-gradient(180deg, #22C55E, #22C55E44)",
  barBlue:     "linear-gradient(180deg, #3B82F6, #3B82F644)",
  barRed:      "linear-gradient(180deg, #EF4444, #EF444444)",

  // Remplissages de feeling bar
  feelingBar:   (color: string) => `linear-gradient(90deg, ${color}88, ${color})`,
  feelingBarBg: "rgba(255,255,255,0.06)",

  // FAB / CTA
  fab:  "linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)",
  cta:  "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.08))",

  // Charts
  chartArea: (color: string) => `linear-gradient(180deg, ${color}40 0%, transparent 100%)`,
  chartLine: (color: string) => `linear-gradient(90deg, ${color}88, ${color})`,
} as const

// ═══════════════════════════════════════════════════════════════
// 5. OMBRES
// ═══════════════════════════════════════════════════════════════

export const shadows = {
  card:    "0 2px 10px rgba(0,0,0,0.20)",
  cardLg:  "0 8px 32px rgba(0,0,0,0.38)",
  hover:   (color: string) => `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}28`,
  glow:    (color: string) => `0 0 20px ${color}40`,
  fabGold: "0 4px 20px rgba(212,175,55,0.5), 0 0 0 1px rgba(212,175,55,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
  inner:   "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.10)",
} as const

// ═══════════════════════════════════════════════════════════════
// 6. ANIMATIONS FRAMER MOTION
// ═══════════════════════════════════════════════════════════════

export const transitions = {
  // Springs
  snappy:   { type: "spring" as const, stiffness: 420, damping: 28 },
  smooth:   { type: "spring" as const, stiffness: 280, damping: 32 },
  bouncy:   { type: "spring" as const, stiffness: 360, damping: 22 },
  slow:     { type: "spring" as const, stiffness: 180, damping: 28 },

  // Easings
  reveal:   { duration: 0.38, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
  fade:     { duration: 0.22, ease: "easeInOut" as const },
  liquid:   { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] },
  bar:      { duration: 0.9,  ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
} as const

export const variants = {
  // Entrées de listes
  listItem: (i: number) => ({
    hidden:  { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { delay: i * 0.07, ...transitions.reveal } },
    exit:    { opacity: 0, y: -8, transition: transitions.fade },
  }),

  // Carte hover
  cardHover: (color: string) => ({
    whileHover: { y: -3, boxShadow: shadows.hover(color) },
    transition: transitions.snappy,
  }),

  // Page entière
  page: {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  },

  // Accordion
  accordion: {
    hidden:  { height: 0, opacity: 0 },
    visible: { height: "auto", opacity: 1, transition: transitions.reveal },
    exit:    { height: 0, opacity: 0, transition: transitions.fade },
  },
} as const

// ═══════════════════════════════════════════════════════════════
// 7. RAYONS DE BORDURE
// ═══════════════════════════════════════════════════════════════

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  "2xl": 24,
  "3xl": 28,
  full: 9999,
} as const

// ═══════════════════════════════════════════════════════════════
// 8. ESPACEMENTS & TAILLES
// ═══════════════════════════════════════════════════════════════

export const spacing = {
  pagePadding:    16,
  cardPadding:    16,
  cardPaddingLg:  20,
  sectionGap:     20,
  itemGap:        12,
  fabSize:        52,
  tabBarHeight:   64,
  minTouchTarget: 44,
} as const

// ═══════════════════════════════════════════════════════════════
// 9. HELPERS — STYLES INLINE COMPOSÉS
// ═══════════════════════════════════════════════════════════════

/** Bouton pill primaire (or) */
export function btnPrimary(tint = colors.gold.tint10): React.CSSProperties {
  return {
    ...glass.card,
    background: tint,
    color: colors.gold.bright,
    border: `1px solid ${colors.border.gold}`,
    minHeight: spacing.minTouchTarget,
  }
}

/** Bouton pill secondaire (neutre) */
export function btnSecondary(): React.CSSProperties {
  return {
    ...glass.card,
    color: colors.text.secondary,
    minHeight: spacing.minTouchTarget,
  }
}

/** Bouton pill coloré (custom color) */
export function btnColored(color: string): React.CSSProperties {
  return {
    ...glass.card,
    background: `${color}12`,
    color,
    border: `1px solid ${color}30`,
    minHeight: spacing.minTouchTarget,
  }
}

/** Pill de filtre actif/inactif */
export function filterPill(active: boolean, color = colors.gold.bright): React.CSSProperties {
  return {
    ...glass.card,
    background: active ? `${color}15` : "rgba(255,255,255,0.05)",
    color: active ? color : colors.text.muted,
    border: active ? `1px solid ${color}35` : `1px solid ${colors.border.subtle}`,
    minHeight: 34,
  }
}

/** Carte métrique avec accent coloré */
export function metricCard(color: string): React.CSSProperties {
  return {
    ...glass.card,
    background: `${color}08`,
    border: `1px solid ${color}20`,
  }
}

// ═══════════════════════════════════════════════════════════════
// 10. TOKENS PAR TYPE DE RUN
// ═══════════════════════════════════════════════════════════════

export type RunType = "endurance" | "threshold" | "interval" | "long" | "recovery"

export const runTypeTokens: Record<RunType, { color: string; label: string; emoji: string; gradient: string }> = {
  endurance: {
    color:    "#3498DB",
    label:    "Endurance",
    emoji:    "🫀",
    gradient: "linear-gradient(135deg, rgba(52,152,219,0.15), rgba(52,152,219,0.05))",
  },
  threshold: {
    color:    "#E67E22",
    label:    "Seuil",
    emoji:    "🔥",
    gradient: "linear-gradient(135deg, rgba(230,126,34,0.15), rgba(230,126,34,0.05))",
  },
  interval: {
    color:    "#E74C3C",
    label:    "Fractionné",
    emoji:    "⚡",
    gradient: "linear-gradient(135deg, rgba(231,76,60,0.15), rgba(231,76,60,0.05))",
  },
  long: {
    color:    "#9B59B6",
    label:    "Sortie longue",
    emoji:    "🌄",
    gradient: "linear-gradient(135deg, rgba(155,89,182,0.15), rgba(155,89,182,0.05))",
  },
  recovery: {
    color:    "#27AE60",
    label:    "Récupération",
    emoji:    "🌿",
    gradient: "linear-gradient(135deg, rgba(39,174,96,0.15), rgba(39,174,96,0.05))",
  },
}

// ═══════════════════════════════════════════════════════════════
// 11. MÉTRIQUES UI — LABELS & UNITÉS
// ═══════════════════════════════════════════════════════════════

export const metrics = {
  distance:  { label: "Distance",    unit: "km",     icon: "📍" },
  pace:      { label: "Allure moy.", unit: "/km",    icon: "⏱️" },
  duration:  { label: "Durée",       unit: "",       icon: "🕐" },
  elevation: { label: "Dénivelé",    unit: "m D+",   icon: "⛰️" },
  heartRate: { label: "FC moy.",     unit: "bpm",    icon: "❤️" },
  cadence:   { label: "Cadence",     unit: "spm",    icon: "👟" },
  tss:       { label: "TSS",         unit: "",       icon: "📊" },
  feeling:   { label: "Ressenti",    unit: "/10",    icon: "💬" },
  calories:  { label: "Calories",    unit: "kcal",   icon: "🔥" },
  gap:       { label: "GAP",         unit: "/km",    icon: "📐" },
  speed:     { label: "Vitesse",     unit: "km/h",   icon: "💨" },
} as const

// ═══════════════════════════════════════════════════════════════
// 12. BREAKPOINTS RESPONSIVE
// ═══════════════════════════════════════════════════════════════

export const breakpoints = {
  mobile:  390,
  tablet:  768,
  desktop: 1280,
} as const
