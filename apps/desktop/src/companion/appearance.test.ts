import { describe, expect, it } from "vitest";
import {
  appearanceDefaults,
  normalizeAppearance,
  themeTokens,
  createAppearanceReceiver,
} from "./appearance";

function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const c = hex
      .slice(1)
      .match(/../g)!
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  };
  const [x, y] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (x + 0.05) / (y + 0.05);
}

describe("appearance compatibility and readability", () => {
  it("does not let an older native snapshot override a later live appearance event", () => {
    let displayed = appearanceDefaults;
    const receiver = createAppearanceReceiver((p) => {
      displayed = p;
    });
    const pending = receiver.checkpoint();
    receiver.event({
      language: "en",
      fontScale: 130,
      accentColor: "teal",
      backgroundStyle: "midnight",
    });
    receiver.snapshot(appearanceDefaults, pending);
    expect(displayed).toEqual({
      language: "en",
      fontScale: 130,
      accentColor: "teal",
      backgroundStyle: "midnight",
    });
  });
  it("loads absent or unsupported preferences safely without changing old fields", () => {
    expect(normalizeAppearance({})).toEqual({
      language: "zh-CN",
      fontScale: 100,
      accentColor: "purple",
      backgroundStyle: "graphite",
    });
    expect(
      normalizeAppearance({
        language: "fr",
        fontScale: 135,
        accentColor: "red",
        backgroundStyle: "white",
      }),
    ).toEqual(appearanceDefaults);
    expect(
      normalizeAppearance({
        language: "en",
        fontScale: 130,
        accentColor: "teal",
        backgroundStyle: "midnight",
      }),
    ).toEqual({
      language: "en",
      fontScale: 130,
      accentColor: "teal",
      backgroundStyle: "midnight",
    });
  });
  it("keeps text, primary buttons and focus outlines readable in all 15 combinations", () => {
    for (const accentColor of [
      "purple",
      "blue",
      "teal",
      "amber",
      "rose",
    ] as const)
      for (const backgroundStyle of [
        "graphite",
        "midnight",
        "warm-charcoal",
      ] as const) {
        const p = themeTokens({
          ...appearanceDefaults,
          accentColor,
          backgroundStyle,
        });
        for (const background of [
          p["--bg"],
          p["--panel"],
          p["--card"],
          p["--input-bg"],
        ]) {
          expect(contrast(p["--text"], background)).toBeGreaterThanOrEqual(4.5);
          expect(contrast(p["--muted"], background)).toBeGreaterThanOrEqual(
            4.5,
          );
          expect(contrast(p["--accent"], background)).toBeGreaterThanOrEqual(3);
          expect(contrast(p["--line"], background)).toBeGreaterThanOrEqual(3);
        }
        expect(
          contrast(p["--button-text"], p["--accent"]),
        ).toBeGreaterThanOrEqual(4.5);
      }
  });
});
