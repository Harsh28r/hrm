/** Static brand hues; neutrals for UI come from CSS variables in `app/globals.css` (`:root` / `html[data-theme="dark"]`). */
export const brandTokens = {
  primary: "#007076",
  primaryDark: "#00393D",
  secondary: "#003399",
  secondaryLight: "#0052CC",
  accent: "#E63535",
  background: "#EEF2F6",
  surface: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#475569",
  border: "#E2E8F0",
};

export type BrandTokens = typeof brandTokens;
