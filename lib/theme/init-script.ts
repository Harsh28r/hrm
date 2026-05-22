/** Inline before React — must stay in sync with `shared/theme/theme-provider.tsx` resolution. */
export const THEME_STORAGE_KEY = "hrm_theme";

export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var p=localStorage.getItem(k)||"system";var m=window.matchMedia("(prefers-color-scheme: dark)").matches;var r=p==="dark"||(p!=="light"&&m);document.documentElement.dataset.theme=r?"dark":"light";}catch(e){document.documentElement.dataset.theme="light";}})();`;
