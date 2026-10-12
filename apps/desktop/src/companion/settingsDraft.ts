import type { Config } from "./types";
import { normalizeAppearance, type Appearance } from "./appearance";
export function withAppearance(config: Config, appearance: Appearance): Config {
  return { ...config, ...normalizeAppearance(appearance) };
}
/** Preserve local edits while incorporating native changes such as a new dock position. */
export function mergeSettingsSnapshot(
  draft: Config,
  previous: Config,
  incoming: Config,
  appearance: Appearance,
): Config {
  const next = { ...incoming };
  const retain = <K extends keyof Config>(key: K) => {
    if (draft[key] !== previous[key]) next[key] = draft[key];
  };
  (Object.keys(incoming) as (keyof Config)[]).forEach(retain);
  return withAppearance(next, appearance);
}
