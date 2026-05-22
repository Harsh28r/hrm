import { createTheme } from "@mui/material/styles";
import { brandTokens } from "./tokens";

const fontStack = 'var(--font-app-sans), ui-sans-serif, system-ui, sans-serif';

const shared = {
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: fontStack,
    h1: {
      fontWeight: 700,
      letterSpacing: "-0.03em",
      lineHeight: 1.15,
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.025em",
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.25,
    },
    h4: { fontWeight: 600, letterSpacing: "-0.015em" },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, letterSpacing: "-0.01em" },
    subtitle2: { fontWeight: 600, letterSpacing: "0.01em", fontSize: "0.8125rem" },
    body1: { letterSpacing: "-0.011em", lineHeight: 1.6 },
    body2: { letterSpacing: "-0.006em", lineHeight: 1.55 },
    button: {
      fontWeight: 600,
      letterSpacing: "0.02em",
      textTransform: "none" as const,
    },
    caption: { letterSpacing: "0.01em" },
    overline: { letterSpacing: "0.08em", fontWeight: 600 },
  },
  transitions: {
    duration: {
      shortest: 120,
      shorter: 160,
      short: 200,
      standard: 240,
    },
    easing: {
      easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: fontStack,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 18,
          transition:
            "background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
          "&:active": { transform: "scale(0.98)" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: "hover",
      },
    },
  },
} as const;

export function createAppTheme(mode: "light" | "dark") {
  const isDark = mode === "dark";
  return createTheme({
    ...shared,
    palette: {
      mode,
      primary: {
        main: brandTokens.primary,
        dark: brandTokens.primaryDark,
      },
      secondary: {
        main: brandTokens.secondary,
        light: brandTokens.secondaryLight,
      },
      error: {
        main: brandTokens.accent,
      },
      background: {
        default: isDark ? "#0c0f14" : brandTokens.background,
        paper: isDark ? "#141c26" : brandTokens.surface,
      },
      text: {
        primary: isDark ? "#e8eef5" : brandTokens.text,
        secondary: isDark ? "#94a3b8" : brandTokens.textMuted,
      },
      divider: isDark ? "#2a3444" : brandTokens.border,
    },
  });
}

/** Static default for tests / Storybook; app shell uses `createAppTheme` from `AppThemeProvider`. */
export const muiTheme = createAppTheme("light");
