import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createCompanionTranslator } from "../i18n/companion";
import {
  appearanceDefaults,
  normalizeAppearance,
  type Appearance,
} from "./appearance";
const UiContext = createContext({
  language: appearanceDefaults.language,
  t: createCompanionTranslator("zh-CN"),
});
export function UiProvider({
  appearance,
  children,
}: {
  appearance: Appearance;
  children: ReactNode;
}) {
  const language = normalizeAppearance(appearance).language;
  const value = useMemo(
    () => ({ language, t: createCompanionTranslator(language) }),
    [language],
  );
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}
export const useUi = () => useContext(UiContext);
