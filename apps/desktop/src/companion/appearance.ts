export type Language = "zh-CN" | "en";
export type FontScale = 90 | 100 | 110 | 120 | 130;
export type AccentColor = "purple" | "blue" | "teal" | "amber" | "rose";
export type BackgroundStyle = "graphite" | "midnight" | "warm-charcoal";
export interface Appearance {
  language: Language;
  fontScale: FontScale;
  accentColor: AccentColor;
  backgroundStyle: BackgroundStyle;
}
export const appearanceDefaults: Appearance = {
  language: "zh-CN",
  fontScale: 100,
  accentColor: "purple",
  backgroundStyle: "graphite",
};
export const fontScales: readonly FontScale[] = [90, 100, 110, 120, 130];
export const accentColors: readonly AccentColor[] = [
  "purple",
  "blue",
  "teal",
  "amber",
  "rose",
];
export const backgroundStyles: readonly BackgroundStyle[] = [
  "graphite",
  "midnight",
  "warm-charcoal",
];
export function normalizeAppearance(value: object): Appearance {
  const p = value as Partial<Appearance>;
  return {
    language: p.language === "en" ? "en" : "zh-CN",
    fontScale: fontScales.includes(p.fontScale!) ? p.fontScale! : 100,
    accentColor: accentColors.includes(p.accentColor!)
      ? p.accentColor!
      : "purple",
    backgroundStyle: backgroundStyles.includes(p.backgroundStyle!)
      ? p.backgroundStyle!
      : "graphite",
  };
}
const accents: Record<AccentColor, string> = {
  purple: "#b99af2",
  blue: "#8fb7ff",
  teal: "#72d4bd",
  amber: "#f2c16f",
  rose: "#f19cbb",
};
const backgrounds: Record<BackgroundStyle, Record<string, string>> = {
  graphite: {
    "--bg": "#1b1b1d",
    "--panel": "#252527",
    "--card": "#2c2c2f",
    "--input-bg": "#2b2b2e",
    "--workspace-bg": "#121213",
  },
  midnight: {
    "--bg": "#141c2b",
    "--panel": "#1c2838",
    "--card": "#253246",
    "--input-bg": "#202d40",
    "--workspace-bg": "#0e1520",
  },
  "warm-charcoal": {
    "--bg": "#1f1b19",
    "--panel": "#272323",
    "--card": "#34302d",
    "--input-bg": "#302a26",
    "--workspace-bg": "#151210",
  },
};
export function themeTokens(value: Appearance): Record<string, string> {
  const p = normalizeAppearance(value);
  return {
    ...backgrounds[p.backgroundStyle],
    "--text": "#f0eee8",
    "--muted": "#b0adb8",
    "--accent": accents[p.accentColor],
    "--button-text": "#15121b",
    "--line": "#85828d",
    "--success": "#91d4b4",
    "--warning": "#f2c16f",
    "--danger": "#f3b2a0",
  };
}
export function applyAppearance(value: Appearance) {
  const p = normalizeAppearance(value);
  const root = document.documentElement;
  root.lang = p.language;
  root.style.fontSize = `${(14 * p.fontScale) / 100}px`;
  root.style.setProperty("--font-scale", String(p.fontScale / 100));
  root.style.setProperty(
    "--font-ui",
    p.language === "zh-CN"
      ? '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans CJK SC", "Segoe UI", sans-serif'
      : '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", "Arial", "PingFang SC", "Microsoft YaHei UI", sans-serif',
  );
  for (const [key, color] of Object.entries(themeTokens(p)))
    root.style.setProperty(key, color);
}

/** Newer live UI events win over an earlier asynchronous native-store read. */
export function createAppearanceReceiver(onChange: (p: Appearance) => void) {
  let revision = 0;
  return {
    checkpoint: () => revision,
    event: (value: object) => {
      revision++;
      onChange(normalizeAppearance(value));
    },
    snapshot: (value: object, checkpoint: number) => {
      if (revision === checkpoint) onChange(normalizeAppearance(value));
    },
  };
}
