import { withAppearance, mergeSettingsSnapshot } from "./settingsDraft";
import { useEffect, useState, useRef } from "react";
import { Check, KeyRound, Pin, ShieldCheck, Palette } from "lucide-react";
import type { Config, Snapshot } from "./types";
import { displayError } from "./types";
import { useUi } from "./UiContext";
import {
  accentColors,
  backgroundStyles,
  fontScales,
  appearanceDefaults,
  normalizeAppearance,
  type Appearance,
} from "./appearance";
import type { TranslationKey } from "../i18n/companion";

export function ModelSettings({
  snapshot,
  page,
  onSave,
  onPreview,
  appearance = snapshot.data.config,
}: {
  snapshot: Snapshot;
  page: "models" | "settings";
  onSave: (config: Config, key: string, remoteKey: string) => Promise<void>;
  onPreview?: (appearance: Appearance) => void;
  appearance?: Appearance;
}) {
  const { t, language } = useUi();
  const [config, setConfig] = useState(
    withAppearance(snapshot.data.config, appearance),
  );
  const [key, setKey] = useState("");
  const [remoteKey, setRemoteKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const previousSnapshot = useRef(snapshot.data.config);
  useEffect(() => {
    const previous = previousSnapshot.current;
    previousSnapshot.current = snapshot.data.config;
    setConfig((draft) =>
      mergeSettingsSnapshot(draft, previous, snapshot.data.config, appearance),
    );
  }, [snapshot.data.config]);
  useEffect(
    () => setConfig((current) => withAppearance(current, appearance)),
    [
      appearance.language,
      appearance.fontScale,
      appearance.accentColor,
      appearance.backgroundStyle,
    ],
  );
  const field = <K extends keyof Config>(name: K, value: Config[K]) => {
    setSaved(false);
    setSaveError(null);
    if (name === "provider" || name === "baseUrl") setKey("");
    setConfig((c) => ({ ...c, [name]: value }));
  };
  const endpoint = (value: string) => {
    try {
      return new URL(value).href.replace(/\/+$/, "");
    } catch {
      return null;
    }
  };
  const localEndpoint = (() => {
    try {
      const host = new URL(config.baseUrl).hostname;
      return host.replace(/\.+$/, "") === "localhost" || host === "[::1]"
        || /^127\.\d+\.\d+\.\d+$/.test(host)
        || /^\[::ffff:7f[0-9a-f]{2}:[0-9a-f]{1,4}\]$/.test(host);
    } catch {
      return false;
    }
  })();
  const keyAvailable = snapshot.keyPresent && !localEndpoint
    && config.provider.trim().toLowerCase() === snapshot.data.config.provider.trim().toLowerCase()
    && endpoint(config.baseUrl) !== null
    && endpoint(config.baseUrl) === endpoint(snapshot.data.config.baseUrl);
  const appearanceField = <K extends keyof Appearance>(
    name: K,
    value: Appearance[K],
  ) => {
    const next = { ...config, [name]: value };
    setSaved(false);
    setSaveError(null);
    setConfig(next);
    onPreview?.(normalizeAppearance(next));
  };
  const save = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      await onSave(config, key, remoteKey);
      setKey("");
      setRemoteKey("");
      setSaved(true);
    } catch (e) {
      setSaveError(e);
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };
  const scaleKeys: Record<number, TranslationKey> = {
    90: "font.small",
    100: "font.default",
    110: "font.comfortable",
    120: "font.large",
    130: "font.extraLarge",
  };
  return (
    <div className="settings-view">
      <div className="eyebrow">{t("settingsKicker")}</div>
      <h1>{t(page === "models" ? "modelsTitle" : "settingsTitle")}</h1>
      <p className="muted">{t("settingsIntro")}</p>
      {page === "settings" && (
        <section className="settings-section appearance-section">
          <h2>
            <Palette size={17} />
            {t("appearanceTitle")}
          </h2>
          <label>
            {t("language")}
            <select
              value={config.language}
              disabled={saving}
              onChange={(e) =>
                appearanceField(
                  "language",
                  e.target.value as Appearance["language"],
                )
              }
            >
              <option value="zh-CN">{t("language.zh-CN")}</option>
              <option value="en">{t("language.en")}</option>
            </select>
          </label>
          <label>
            {t("fontSize")}
            <select
              value={config.fontScale}
              disabled={saving}
              onChange={(e) =>
                appearanceField(
                  "fontScale",
                  Number(e.target.value) as Appearance["fontScale"],
                )
              }
            >
              {fontScales.map((scale) => (
                <option key={scale} value={scale}>
                  {scale}% — {t(scaleKeys[scale])}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("accentColor")}
            <select
              value={config.accentColor}
              disabled={saving}
              onChange={(e) =>
                appearanceField(
                  "accentColor",
                  e.target.value as Appearance["accentColor"],
                )
              }
            >
              {accentColors.map((color) => (
                <option key={color} value={color}>
                  {t(`accent.${color}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("backgroundStyle")}
            <select
              value={config.backgroundStyle}
              disabled={saving}
              onChange={(e) =>
                appearanceField(
                  "backgroundStyle",
                  e.target.value as Appearance["backgroundStyle"],
                )
              }
            >
              {backgroundStyles.map((style) => (
                <option key={style} value={style}>
                  {t(`background.${style}`)}
                </option>
              ))}
            </select>
          </label>
          <div className="appearance-preview" aria-label={t("preview")}>
            <span className="eyebrow">
              {t("preview")} · {config.fontScale}%
            </span>
            <h3>OrdiBot</h3>
            <p>{t("previewText")}</p>
            <span className="preview-message">{t("welcomeTitle")}</span>
            <button type="button" className="primary" disabled>
              {t("sendMessage")}
            </button>
          </div>
          <button
            className="outline"
            disabled={saving}
            onClick={() => {
              const next = { ...config, ...appearanceDefaults };
              setConfig(next);
              setSaved(false);
              setSaveError(null);
              onPreview?.(normalizeAppearance(next));
            }}
          >
            {t("resetDefaults")}
          </button>
          <p className="muted">{t("previewHint")}</p>
        </section>
      )}
      <section className="settings-section">
        <h2>
          <KeyRound size={16} />
          {t("chatApi")}
        </h2>
        <label>
          {t("provider")}
          <input
            value={config.provider}
            disabled={saving}
            onChange={(e) => field("provider", e.target.value)}
          />
        </label>
        <label>
          {t("baseUrl")}
          <input
            value={config.baseUrl}
            spellCheck={false}
            disabled={saving}
            onChange={(e) => field("baseUrl", e.target.value)}
            placeholder="https://api.openai.com/v1"
          />
        </label>
        <label>
          {t("modelId")}
          <input
            value={config.model}
            spellCheck={false}
            disabled={saving}
            onChange={(e) => field("model", e.target.value)}
            placeholder={t("modelPlaceholder")}
          />
        </label>
        <label>
          {t("apiKey")}{" "}
          <span className="muted">
            {t(keyAvailable ? "keyStored" : "notConfigured")}
          </span>
          <input
            type="password"
            autoComplete="off"
            value={key}
            disabled={saving || localEndpoint}
            onChange={(e) => {
              setSaved(false);
              setKey(e.target.value);
            }}
            placeholder={t("localKey")}
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={config.vision}
            disabled={saving}
            onChange={(e) => field("vision", e.target.checked)}
          />
          {t("vision")}
        </label>
        <label>
          {t("outputLength")}
          <input
            type="number"
            min={256}
            max={8192}
            step={256}
            value={config.outputLength}
            disabled={saving}
            onChange={(e) => field("outputLength", Number(e.target.value))}
          />
        </label>
        <label>
          {t("modelParameters")}
          <select value={config.modelParameters ?? "standard"} disabled={saving}
            onChange={e=>field("modelParameters",e.target.value as Config["modelParameters"])}>
            <option value="standard">{t("parameters.standard")}</option>
            <option value="completion">{t("parameters.completion")}</option>
            <option value="no-temperature">{t("parameters.noTemperature")}</option>
          </select>
        </label>
        <p className="muted">{t("credentialBindingHint")}</p>
      </section>
      <section className="settings-section">
        <h2>
          <ShieldCheck size={16} />
          {t("remoteHosted")}
        </h2>
        <p className="muted">{t("remoteInfo")}</p>
        <p className="muted">
          {t("connectionStatus", {
            status: t(
              snapshot.remoteKeyPresent ? "keyUnverified" : "notConfigured",
            ),
          })}
        </p>
        <label>
          {t("agentModelId")}
          <input
            value={config.remoteModel}
            disabled={saving}
            onChange={(e) => field("remoteModel", e.target.value)}
          />
        </label>
        <label>
          {t("remoteKey")}{" "}
          <span className="muted">
            {t(snapshot.remoteKeyPresent ? "keyStored" : "notConfigured")}
          </span>
          <input
            type="password"
            autoComplete="off"
            value={remoteKey}
            disabled={saving}
            onChange={(e) => {
              setSaved(false);
              setRemoteKey(e.target.value);
            }}
            placeholder={t("remoteKeyHelp")}
          />
        </label>
      </section>
      <section className="settings-section">
        <h2>{t("answerWindow")}</h2>
        <label>
          {t("answerStyle")}
          <select
            value={config.style}
            disabled={saving}
            onChange={(e) => field("style", e.target.value as Config["style"])}
          >
            <option value="concise">{t("style.concise")}</option>
            <option value="normal">{t("style.normal")}</option>
            <option value="detailed">{t("style.detailed")}</option>
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={config.alwaysOnTop}
            disabled={saving}
            onChange={(e) => field("alwaysOnTop", e.target.checked)}
          />
          <Pin size={14} />
          {t("alwaysOnTop")}
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={config.contextReminders}
            disabled={saving}
            onChange={(e) => field("contextReminders", e.target.checked)}
          />
          {t("contextReminders")}
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={config.browsersEditorsOnly}
            disabled={saving}
            onChange={(e) => field("browsersEditorsOnly", e.target.checked)}
          />
          {t("browsersEditorsOnly")}
        </label>
        <label>
          {t("petPosition")}
          <select
            value={config.edgeSide}
            disabled={saving}
            onChange={(e) =>
              field("edgeSide", e.target.value as Config["edgeSide"])
            }
          >
            <option value="left">{t("leftEdge")}</option>
            <option value="right">{t("rightEdge")}</option>
          </select>
        </label>
        <label>
          {t("verticalPosition", {
            count: Math.round(config.edgeVertical * 100),
          })}
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(config.edgeVertical * 100)}
            disabled={saving}
            onChange={(e) =>
              field("edgeVertical", Number(e.target.value) / 100)
            }
          />
        </label>
        <p className="muted">{t("reminderPrivacy")}</p>
        <p className="muted">
          {t(
            snapshot.shortcutAvailable
              ? "shortcutAvailable"
              : "shortcutUnavailable",
          )}{" "}
          {t("trayHelp")}
        </p>
      </section>
      <div className="settings-save-bar">
        {saveError != null && (
          <p role="alert" className="task-error">
            {displayError(saveError, language)}
          </p>
        )}
        <button
          className="primary save-button"
          disabled={saving}
          onClick={() => void save()}
        >
          {saved ? (
            <>
              <Check size={15} />
              {t("saved")}
            </>
          ) : (
            t(saving ? "saving" : "saveSettings")
          )}
        </button>
      </div>
      <p className="privacy-note">{t("privacyNote")}</p>
    </div>
  );
}
