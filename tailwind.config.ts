import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vomero Pack Lemon — palette verrouillée
        lemon: {
          DEFAULT: "#F4D03F",
          dark:    "#D4AC0D",
          glow:    "rgba(244,208,63,0.25)",
        },
        "fuchsia-vomero": {
          DEFAULT: "#9B59B6",
          light:   "#C44AFF",
          glow:    "rgba(155,89,182,0.25)",
        },
        "orange-vomero": {
          DEFAULT: "#E67E22",
          deep:    "#C0392B",
        },
        anthracite: "#2C3E50",
        app: "#0A0A0A",
        card: "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.08)",
        primary: "#F4D03F",
        "primary-dark": "#D4AC0D",
        "orange-blood": "#E67E22",
        "fuchsia-zoom": "#9B59B6",
        "forest-dark": "#0D1F1A",
        "text-primary": "#F5F5F5",
        "text-muted": "rgba(245,245,245,0.5)",
        "glass-bg": "rgba(255,255,255,0.05)",
        "glass-border": "rgba(255,255,255,0.10)",
        success: "#27AE60",
        warning: "#F39C12",
        danger: "#E74C3C",
        info: "#3498DB",
      },
      backgroundImage: {
        "zoom-gradient": "linear-gradient(135deg, #E67E22 0%, #C0392B 40%, #9B59B6 100%)",
        "zoom-gradient-h": "linear-gradient(90deg, #E67E22 0%, #9B59B6 100%)",
        "primary-gradient": "linear-gradient(135deg, #F4D03F 0%, #E67E22 100%)",
        "dark-gradient": "linear-gradient(180deg, #0A0A0A 0%, #111111 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        "glow-yellow": "radial-gradient(ellipse at center, rgba(244,208,63,0.15) 0%, transparent 70%)",
        "glow-purple": "radial-gradient(ellipse at center, rgba(155,89,182,0.15) 0%, transparent 70%)",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Inter", "system-ui", "sans-serif"],
        display: ["-apple-system", "BlinkMacSystemFont", "Inter", "system-ui", "sans-serif"],
        mono: ["SF Mono", "Fira Code", "monospace"],
      },
      fontVariantNumeric: {
        "tabular-nums": "tabular-nums",
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "24px",
        "4xl": "32px",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "12px",
        lg: "20px",
        xl: "30px",
        "2xl": "40px",
      },
      boxShadow: {
        "glow-yellow": "0 0 30px rgba(244,208,63,0.3), 0 0 60px rgba(244,208,63,0.1)",
        "glow-orange": "0 0 30px rgba(230,126,34,0.3)",
        "glow-purple": "0 0 30px rgba(155,89,182,0.3)",
        "card-shadow": "0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset",
        "card-hover": "0 16px 48px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1) inset",
        "tab-bar": "0 -1px 0 rgba(255,255,255,0.06), 0 -8px 32px rgba(0,0,0,0.4)",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(244,208,63,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(244,208,63,0.6)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-100vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "confetti-fall": "confetti-fall 3s linear forwards",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
